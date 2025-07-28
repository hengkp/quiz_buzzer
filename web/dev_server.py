#!/usr/bin/env python
"""
Optimized Development Server for Quiz Buzzer System
Supports both HTTP (localhost) and HTTPS (secure) modes with real Arduino communication
"""

import os
import time
import threading
import ssl
import argparse
import queue
from flask import Flask, render_template_string, request, jsonify
from flask_socketio import SocketIO, emit
import logging
import re # Added for partial message reconstruction

# Try to import serial for Arduino communication
try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False
    print("⚠️  pySerial not installed. Install with: pip install pyserial")
    print("   Arduino communication will be simulated only.")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = 'buzzer-dev-key'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Serial communication class for optimized Arduino handling
class ArduinoSerial:
    def __init__(self):
        self.serial_port = None
        self.is_connected = False
        self.read_thread = None
        self.write_queue = queue.Queue()
        self.stop_threads = False
        
    def find_arduino_port(self):
        """Automatically find Arduino port"""
        if not SERIAL_AVAILABLE:
            return None
            
        ports = serial.tools.list_ports.comports()
        for port in ports:
            # Look for common Arduino identifiers
            if any(keyword in (port.description or '').lower() for keyword in 
                   ['arduino', 'ch340', 'cp210', 'ftdi', 'usb serial']):
                return port.device
        
        # If no Arduino found, return the first available port
        if ports:
            return ports[0].device
        return None
    
    def connect(self, port=None, baudrate=9600):
        """Connect to Arduino with optimized settings"""
        if not SERIAL_AVAILABLE:
            logger.warning("Serial not available - using simulation mode")
            return False
            
        try:
            if port is None:
                port = self.find_arduino_port()
                
            if port is None:
                logger.error("No serial ports found")
                return False
                
            logger.info(f"Connecting to Arduino on {port} at {baudrate} baud...")
            
            self.serial_port = serial.Serial(
                port=port,
                baudrate=baudrate,
                timeout=0.1,  # Non-blocking read
                write_timeout=0.1,  # Non-blocking write
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE
            )
            
            # Wait for Arduino to initialize
            time.sleep(2)
            
            # Clear any initial data
            self.serial_port.reset_input_buffer()
            self.serial_port.reset_output_buffer()
            
            self.is_connected = True
            self.stop_threads = False
            
            # Start background threads
            self.start_threads()
            
            logger.info(f"✅ Connected to Arduino on {port}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Arduino: {e}")
            return False
    
    def start_threads(self):
        """Start background read and write threads"""
        self.read_thread = threading.Thread(target=self._read_loop, daemon=True)
        self.read_thread.start()
        
        self.write_thread = threading.Thread(target=self._write_loop, daemon=True)
        self.write_thread.start()
    
    def _read_loop(self):
        """Optimized non-blocking read loop with message validation and disconnect detection"""
        buffer = ""
        consecutive_errors = 0
        max_errors = 5  # Max consecutive errors before assuming disconnect
        
        while self.is_connected and not self.stop_threads:
            try:
                if self.serial_port and self.serial_port.in_waiting > 0:
                    data = self.serial_port.read(self.serial_port.in_waiting).decode('utf-8', errors='ignore')
                    buffer += data
                    consecutive_errors = 0  # Reset error count on successful read
                    
                    # Process complete lines with validation
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        if line:
                            # Validate message before processing
                            if self._validate_message(line):
                                self._handle_arduino_message(line)
                            else:
                                logger.warning(f"Invalid/corrupted message ignored: {line}")
                
                time.sleep(0.01)  # Small delay to prevent CPU spinning
                
            except Exception as e:
                consecutive_errors += 1
                
                # Check for device disconnection errors
                if "Device not configured" in str(e) or "Errno 6" in str(e):
                    logger.error(f"Arduino device disconnected: {e}")
                    self._handle_disconnection()
                    break
                elif consecutive_errors >= max_errors:
                    logger.error(f"Too many consecutive read errors ({consecutive_errors}), assuming device disconnect")
                    self._handle_disconnection()
                    break
                else:
                    logger.error(f"Read error ({consecutive_errors}/{max_errors}): {e}")
                    time.sleep(0.5)  # Longer delay after errors

    def _validate_message(self, message):
        """Validate Arduino message format and integrity"""
        if not message or len(message) == 0:
            return False
            
        # Check for obvious corruption (mixed messages)
        if message.count(':') > 2:  # Too many colons suggests concatenation
            logger.warning(f"Message has too many colons (concatenated?): {message}")
            return False
            
        # Check for incomplete messages
        if message.endswith(':') or message.startswith(':'):
            logger.warning(f"Message appears incomplete: {message}")
            return False
            
        # Validate known message types
        if message == "READY" or message == "RESET":
            return True
            
        if message.startswith("WINNER:"):
            parts = message.split(':')
            if len(parts) == 2:
                try:
                    team = int(parts[1])
                    return 1 <= team <= 6  # Valid team numbers
                except ValueError:
                    return False
            return False
            
        if message.startswith("TIMING:"):
            parts = message.split(':')
            if len(parts) == 3:
                # Format: TIMING:T1:123 or TIMING:T2:456
                if parts[1] in ['T1', 'T2']:
                    try:
                        int(parts[2])  # Validate timing number
                        return True
                    except ValueError:
                        return False
            return False
            
        # Check for partial WINNER messages (common corruption)
        if "WINNER" in message and not message.startswith("WINNER:"):
            logger.warning(f"Partial WINNER message detected: {message}")
            # Try to extract valid WINNER:X from corrupted message
            winner_match = re.search(r'WINNER:([1-6])', message)
            if winner_match:
                logger.info(f"Extracted valid WINNER message from corruption: WINNER:{winner_match.group(1)}")
                # Replace the corrupted message with the clean one
                clean_message = f"WINNER:{winner_match.group(1)}"
                # Process the clean message directly
                self._handle_arduino_message(clean_message)
            return False  # Don't process the original corrupted message
            
        # Check for partial READY messages
        if "READY" in message and message != "READY":
            logger.warning(f"Partial READY message detected: {message}")
            # If it contains READY, treat it as a valid READY
            self._handle_arduino_message("READY")
            return False  # Don't process the original
            
        # Reject messages that are too long (likely concatenated)
        if len(message) > 50:
            logger.warning(f"Message too long (likely concatenated): {message[:50]}...")
            return False
            
        # Reject messages with non-printable characters
        if not all(ord(c) >= 32 or c in '\r\n\t' for c in message):
            logger.warning(f"Message contains non-printable characters: {repr(message)}")
            return False
            
        # Log unknown but potentially valid messages
        logger.info(f"Unknown message format (may be valid): {message}")
        return True
    
    def _handle_disconnection(self):
        """Handle Arduino disconnection gracefully"""
        logger.warning("🔌 Arduino disconnected - cleaning up connection...")
        
        # Mark as disconnected to stop loops
        self.is_connected = False
        
        # Clean up serial port
        if self.serial_port:
            try:
                self.serial_port.close()
            except:
                pass  # Ignore errors during cleanup
            self.serial_port = None
        
        # Update game state
        global game_state
        game_state['arduino_connected'] = False
        
        # Notify clients
        socketio.emit('arduino_status', {'connected': False, 'message': 'Arduino disconnected'})
        socketio.emit('log', {'message': 'Arduino disconnected - running in simulation mode'})
        
        logger.info("✅ Arduino disconnect handled - server continuing in simulation mode")

    def _write_loop(self):
        """Non-blocking write loop with queue and disconnect detection"""
        consecutive_errors = 0
        max_errors = 3  # Fewer retries for write errors
        
        while self.is_connected and not self.stop_threads:
            try:
                # Wait for data to write (with timeout)
                data = self.write_queue.get(timeout=0.1)
                
                if self.serial_port and self.is_connected:
                    self.serial_port.write(data.encode('utf-8'))
                    self.serial_port.flush()
                    consecutive_errors = 0  # Reset on successful write
                    
                self.write_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                consecutive_errors += 1
                
                # Check for device disconnection errors
                if "Device not configured" in str(e) or "Errno 6" in str(e):
                    logger.error(f"Arduino device disconnected during write: {e}")
                    self._handle_disconnection()
                    break
                elif consecutive_errors >= max_errors:
                    logger.error(f"Too many consecutive write errors ({consecutive_errors}), assuming device disconnect")
                    self._handle_disconnection()
                    break
                else:
                    logger.error(f"Write error ({consecutive_errors}/{max_errors}): {e}")
                    time.sleep(0.5)
    
    def _handle_arduino_message(self, message):
        """Handle incoming Arduino messages with improved validation"""
        logger.info(f"Arduino: {message}")
        
        # Broadcast to all connected clients
        socketio.emit('buzzer_data', message)
        
        # Update game state based on message type
        if message.startswith('WINNER:'):
            try:
                team = int(message.split(':')[1])
                if game_state['winner'] is None and 1 <= team <= 6:
                    game_state['winner'] = team
                    logger.info(f"🏆 Team {team} wins!")
                    
                    # Emit buzzer press event for Among Us interface
                    socketio.emit('buzzer_pressed', {'teamId': team})
                    add_log(f"Team {team} win the buzz")
                else:
                    if team < 1 or team > 6:
                        logger.warning(f"Invalid team number: {team}")
                    else:
                        logger.warning(f"Team {team} winner ignored - Team {game_state['winner']} already won")
                        add_log(f"Team {team} buzzed (too late)")
            except (ValueError, IndexError):
                logger.warning(f"Invalid winner message format: {message}")
        elif message.startswith('TIMING:'):
            # Handle timing messages (T1:123 or T2:456)
            try:
                parts = message.split(':')
                if len(parts) == 3:
                    team_part = parts[1]  # T1 or T2
                    timing = parts[2]     # microsecond difference
                    logger.info(f"⏱️ Timing data - {team_part}: {timing} microseconds")
            except (ValueError, IndexError):
                logger.warning(f"Invalid timing message format: {message}")
        elif message in ['RESET', 'READY']:
            game_state['winner'] = None
            logger.info(f"🔄 Game reset: {message}")
            socketio.emit('clear_buzzers')
        else:
            logger.info(f"ℹ️ Other message: {message}")
    
    def write(self, data):
        """Queue data for writing to Arduino"""
        if self.is_connected:
            self.write_queue.put(data)
        else:
            logger.warning(f"Arduino not connected, cannot send: {data.strip()}")
    
    def disconnect(self):
        """Disconnect from Arduino"""
        logger.info("Disconnecting from Arduino...")
        
        self.stop_threads = True
        self.is_connected = False
        
        # Clear write queue
        try:
            while not self.write_queue.empty():
                self.write_queue.get_nowait()
                self.write_queue.task_done()
        except:
            pass
        
        # Wait for threads to finish
        if hasattr(self, 'read_thread') and self.read_thread and self.read_thread.is_alive():
            self.read_thread.join(timeout=1)
            
        if hasattr(self, 'write_thread') and self.write_thread and self.write_thread.is_alive():
            self.write_thread.join(timeout=1)
        
        # Close serial port
        if self.serial_port:
            try:
                self.serial_port.close()
            except Exception as e:
                logger.error(f"Error closing serial port: {e}")
            self.serial_port = None
            
        logger.info("✅ Arduino disconnected cleanly")

# Initialize Arduino communication
arduino = ArduinoSerial()

# Enhanced game state for Among Us Quiz Bowl
game_state = {
    'winner': None,
    'connected_clients': 0,
    'arduino_connected': False,
    'teams': {
        1: {'name': 'Team 1', 'score': 0, 'color': 'red', 'cards': {'angel': False, 'devil': False, 'cross': False, 'angelUsed': False, 'devilUsed': False}, 'rank': 0},
        2: {'name': 'Team 2', 'score': 0, 'color': 'blue', 'cards': {'angel': False, 'devil': False, 'cross': False, 'angelUsed': False, 'devilUsed': False}, 'rank': 0},
        3: {'name': 'Team 3', 'score': 0, 'color': 'lime', 'cards': {'angel': False, 'devil': False, 'cross': False, 'angelUsed': False, 'devilUsed': False}, 'rank': 0},
        4: {'name': 'Team 4', 'score': 0, 'color': 'orange', 'cards': {'angel': False, 'devil': False, 'cross': False, 'angelUsed': False, 'devilUsed': False}, 'rank': 0},
        5: {'name': 'Team 5', 'score': 0, 'color': 'purple', 'cards': {'angel': False, 'devil': False, 'cross': False, 'angelUsed': False, 'devilUsed': False}, 'rank': 0},
        6: {'name': 'Team 6', 'score': 0, 'color': 'cyan', 'cards': {'angel': False, 'devil': False, 'cross': False, 'angelUsed': False, 'devilUsed': False}, 'rank': 0}
    },
    'timer': {
        'value': 15,
        'running': False,
        'default': 15
    },
    'question_set': {
        'current': 1,
        'subject': 'general',
        'title': '',
        'sub_question': 0
    },
    'challenge_2x': False,
    'logs': []
}

def create_self_signed_cert(cert_path="ssl/server.crt", key_path="ssl/server.key"):
    """Create a self-signed certificate for HTTPS development"""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        
        logger.info(f"🔧 Generating self-signed certificate: {cert_path}, {key_path}")
        
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # Create certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"Quiz Buzzer Dev"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, u"Development"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(u"localhost"),
                x509.DNSName(u"127.0.0.1"),
                x509.IPAddress(u"127.0.0.1"),
                x509.IPAddress(u"::1"),  # IPv6 localhost
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # Create directory if it doesn't exist
        cert_dir = os.path.dirname(cert_path)
        if cert_dir and not os.path.exists(cert_dir):
            os.makedirs(cert_dir, exist_ok=True)
        
        key_dir = os.path.dirname(key_path)
        if key_dir and not os.path.exists(key_dir):
            os.makedirs(key_dir, exist_ok=True)
        
        # Write certificate and private key
        with open(cert_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        with open(key_path, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Set appropriate permissions
        os.chmod(cert_path, 0o644)  # Readable by all
        os.chmod(key_path, 0o600)   # Readable only by owner
        
        logger.info(f"✅ Self-signed certificate created successfully")
        logger.info(f"   Certificate: {cert_path}")
        logger.info(f"   Private key: {key_path}")
        logger.info(f"   Valid for: 365 days")
        
        return cert_path, key_path
        
    except ImportError:
        logger.error("❌ cryptography package not installed. Install with: pip install cryptography")
        return None, None
    except Exception as e:
        logger.error(f"❌ Failed to create certificate: {e}")
        return None, None

def verify_or_create_certs(cert_path, key_path):
    """Verify certificate files exist, create them if they don't"""
    cert_exists = os.path.exists(cert_path) and os.path.isfile(cert_path)
    key_exists = os.path.exists(key_path) and os.path.isfile(key_path)
    
    if cert_exists and key_exists:
        logger.info(f"✅ Using existing certificate files:")
        logger.info(f"   Certificate: {cert_path}")
        logger.info(f"   Private key: {key_path}")
        return cert_path, key_path
    
    if cert_exists and not key_exists:
        logger.warning(f"⚠️  Certificate exists but private key missing: {key_path}")
    elif not cert_exists and key_exists:
        logger.warning(f"⚠️  Private key exists but certificate missing: {cert_path}")
    else:
        logger.info(f"📋 Certificate files not found, will generate them")
    
    # Generate new certificates
    return create_self_signed_cert(cert_path, key_path)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve static assets (MP3, images, etc.)"""
    from flask import send_from_directory
    try:
        return send_from_directory('assets', filename)
    except FileNotFoundError:
        return "File not found", 404

@app.route('/')
def index():
    """Serve the unified Among Us interface"""
    try:
        with open('among_us.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>Error: among_us.html not found</h1>", 404

@app.route('/console')
def console():
    """Serve the console window interface"""
    try:
        with open('console.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>Error: console.html not found</h1>", 404





@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    game_state['connected_clients'] += 1
    logger.info(f'Client connected. Total: {game_state["connected_clients"]}')
    emit('log', {'message': f'Client connected'}, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    game_state['connected_clients'] = max(0, game_state['connected_clients'] - 1)
    logger.info(f'Client disconnected. Total: {game_state["connected_clients"]}')

@socketio.on('connect_arduino')
def handle_connect_arduino(data):
    """Handle Arduino connection request"""
    port = data.get('port') if data else None
    baudrate = data.get('baudrate', 9600) if data else 9600
    
    if arduino.connect(port, baudrate):
        game_state['arduino_connected'] = True
        socketio.emit('arduino_status', {'connected': True, 'message': 'Arduino connected'})
        socketio.emit('log', {'message': 'Arduino connected successfully'})
    else:
        game_state['arduino_connected'] = False
        socketio.emit('arduino_status', {'connected': False, 'message': 'Arduino connection failed'})
        socketio.emit('log', {'message': 'Arduino connection failed'})

@socketio.on('disconnect_arduino')
def handle_disconnect_arduino():
    """Handle Arduino disconnection request"""
    arduino.disconnect()
    game_state['arduino_connected'] = False
    socketio.emit('arduino_status', {'connected': False, 'message': 'Arduino disconnected'})
    socketio.emit('log', {'message': 'Arduino disconnected'})

@socketio.on('reset_buzzers')
def handle_reset(data=None):
    """Handle reset command - send to Arduino if connected"""
    logger.info('Reset command received')
    
    if arduino.is_connected:
        # Send reset to real Arduino
        arduino.write('RESET\n')
        socketio.emit('log', {'message': 'Reset sent to Arduino'})
    else:
        # Simulate reset if no Arduino
        game_state['winner'] = None
        socketio.emit('buzzer_data', 'READY')
        socketio.emit('log', {'message': 'System reset (simulated)'})

@socketio.on('simulate_buzzer')
def handle_simulate_buzzer(data):
    """Handle buzzer simulation for teams 1-6"""
    team_id = data.get('teamId', data.get('team', 1))
    
    # Reset winner if it's been cleared
    if game_state['winner'] is not None:
        game_state['winner'] = None
    
    # Set new winner
    game_state['winner'] = team_id
    
    # Broadcast to all clients
    socketio.emit('buzzer_pressed', {'teamId': team_id})
    add_log(f"Team {team_id} simulated buzz-in")
    
    logger.info(f"✅ Simulated Team {team_id} buzzed in successfully")

@socketio.on('admin_reset')
def handle_admin_reset():
    """Handle admin reset - FIXED: Now clears card status"""
    logger.info('Admin reset - clearing all game state including cards')
    
    # FIXED: Reset all team card states
    for team_id in game_state['teams']:
        game_state['teams'][team_id]['cards'] = {
            'angel': False, 
            'devil': False, 
            'cross': False, 
            'angelUsed': False, 
            'devilUsed': False
        }
        logger.info(f'Cleared card status for Team {team_id}')
    
    # Clear challenge state
    game_state['challenge_2x'] = False
    game_state['winner'] = None
    
    # Broadcast card updates to all clients
    socketio.emit('card_status_reset', {
        'teams': game_state['teams'],
        'challenge_2x': game_state['challenge_2x']
    })
    
    if arduino.is_connected:
        # Send reset to real Arduino
        arduino.write('RESET\n')
        socketio.emit('log', {'message': 'Admin reset sent to Arduino - Cards cleared'})
    else:
        # Simulate reset
        socketio.emit('buzzer_data', 'READY')
        socketio.emit('log', {'message': 'Admin reset (simulated) - Cards cleared'})
    
    logger.info('✅ Admin reset completed with card status clearing')

@socketio.on('get_serial_ports')
def handle_get_serial_ports():
    """Get available serial ports"""
    ports = []
    if SERIAL_AVAILABLE:
        try:
            import serial.tools.list_ports
            for port in serial.tools.list_ports.comports():
                ports.append({
                    'device': port.device,
                    'description': port.description or 'Unknown',
                    'hwid': port.hwid or ''
                })
        except Exception as e:
            logger.error(f"Error listing ports: {e}")
    
    socketio.emit('serial_ports', {'ports': ports, 'available': SERIAL_AVAILABLE})

# Among Us Quiz Bowl Event Handlers

@socketio.on('refresh_ports')
def handle_refresh_ports():
    """Refresh and send available serial ports"""
    handle_get_serial_ports()
    emit('ports_refreshed', {'ports': []})

@socketio.on('team_update')
def handle_team_update(data):
    """Handle team information updates"""
    team_id = data.get('teamId')
    updates = data.get('updates', {})
    
    if team_id in game_state['teams']:
        game_state['teams'][team_id].update(updates)
        
        # Broadcast update to all clients
        socketio.emit('team_update', {
            'teamId': team_id,
            'updates': updates
        })
        
        # Log the update
        if 'name' in updates:
            add_log(f"Team {team_id} name changed to '{updates['name']}'")
        if 'color' in updates:
            add_log(f"Team {team_id} color changed to {updates['color']}")

@socketio.on('score_update')
def handle_score_update(data):
    """Handle score updates with sound effects"""
    team_id = data.get('teamId')
    score = data.get('score')
    adjustment = data.get('adjustment', 0)
    correct = data.get('correct', adjustment > 0)
    reset = data.get('reset', False)
    
    if team_id in game_state['teams']:
        game_state['teams'][team_id]['score'] = score
        
        # Broadcast score update
        socketio.emit('score_update', {
            'teamId': team_id,
            'score': score,
            'adjustment': adjustment,
            'correct': correct,
            'reset': reset
        })
        
        # Log the score change
        if reset:
            add_log(f"Team {team_id} score reset to 0")
        else:
            action = "correct" if correct else "incorrect"
            challenge_text = " (2x Challenge)" if game_state['challenge_2x'] and adjustment != 0 else ""
            add_log(f"Team {team_id} answered {action} and got {'+' if adjustment > 0 else ''}{adjustment}{challenge_text}")

@socketio.on('set_timer')
def handle_set_timer(data):
    """Set timer value"""
    value = data.get('value', 15)
    game_state['timer']['value'] = value
    game_state['timer']['default'] = value
    
    socketio.emit('timer_update', {
        'value': value,
        'running': game_state['timer']['running']
    })
    
    add_log(f"Timer set to {format_time(value)}")

@socketio.on('start_timer')
def handle_start_timer():
    """Start the timer"""
    game_state['timer']['running'] = True
    
    socketio.emit('timer_update', {
        'value': game_state['timer']['value'],
        'running': True
    })
    
    add_log("Timer started")

@socketio.on('pause_timer')
def handle_pause_timer():
    """Pause the timer"""
    game_state['timer']['running'] = False
    
    socketio.emit('timer_update', {
        'value': game_state['timer']['value'],
        'running': False
    })
    
    add_log("Timer paused")

@socketio.on('stop_timer')
def handle_stop_timer():
    """Stop the timer"""
    game_state['timer']['running'] = False
    
    socketio.emit('timer_update', {
        'value': game_state['timer']['value'],
        'running': False
    })
    
    add_log("Timer stopped")

@socketio.on('reset_timer')
def handle_reset_timer(data):
    """Reset timer to default or specified value"""
    value = data.get('value', game_state['timer']['default'])
    game_state['timer']['value'] = value
    game_state['timer']['running'] = False
    
    socketio.emit('timer_update', {
        'value': value,
        'running': False
    })
    
    add_log("Timer reset")

@socketio.on('timer_ended')
def handle_timer_ended():
    """Handle timer reaching zero"""
    game_state['timer']['running'] = False
    add_log("Timer ended")

@socketio.on('question_set_update')
def handle_question_set_update(data):
    """Update question set information"""
    set_number = data.get('setNumber', 1)
    subject = data.get('subject', 'general')
    title = data.get('title', '')
    sub_question = data.get('subQuestion', 0)
    
    game_state['question_set'].update({
        'current': set_number,
        'subject': subject,
        'title': title,
        'sub_question': sub_question
    })
    
    socketio.emit('question_set_update', {
        'setNumber': set_number,
        'subject': subject,
        'title': title,
        'subQuestion': sub_question
    })

@socketio.on('start_question_set')
def handle_start_question_set(data):
    """Start a new question set"""
    set_number = data.get('setNumber', 1)
    subject = data.get('subject', 'general')
    
    game_state['question_set'].update({
        'current': set_number,
        'subject': subject,
        'sub_question': 0
    })
    
    socketio.emit('question_set_update', {
        'setNumber': set_number,
        'subject': subject,
        'subQuestion': 0
    })
    
    add_log(f"Started Question Set {set_number}")

@socketio.on('reset_question_set')
def handle_reset_question_set():
    """Reset question set to beginning"""
    game_state['question_set']['sub_question'] = 0
    
    socketio.emit('question_set_update', {
        'setNumber': game_state['question_set']['current'],
        'subject': game_state['question_set']['subject'],
        'subQuestion': 0
    })
    
    add_log("Question set reset")

@socketio.on('action_card_used')
def handle_action_card_used(data):
    """Handle action card usage"""
    team_id = data.get('teamId')
    card_type = data.get('cardType')
    used = data.get('used', True)
    
    if team_id in game_state['teams'] and card_type in ['angel', 'devil', 'cross']:
        game_state['teams'][team_id]['cards'][card_type] = used
        
        socketio.emit('action_card_used', {
            'teamId': team_id,
            'cardType': card_type,
            'used': used
        })
        
        action = "used" if used else "reset"
        add_log(f"Team {team_id} {card_type} card {action}")

@socketio.on('card_update')
def handle_card_update(data):
    """Handle card status updates for real-time synchronization"""
    team_id = data.get('teamId')
    card_type = data.get('cardType')
    active = data.get('active', False)
    used = data.get('used', False)
    
    if team_id in game_state['teams']:
        if card_type == 'angel':
            if used:
                game_state['teams'][team_id]['cards']['angelUsed'] = True
                game_state['teams'][team_id]['cards']['angel'] = False
            else:
                game_state['teams'][team_id]['cards']['angel'] = active
        elif card_type == 'devil':
            if used:
                game_state['teams'][team_id]['cards']['devilUsed'] = True
        elif card_type == 'cross':
            game_state['teams'][team_id]['cards']['cross'] = active
        
        # Broadcast to all clients
        socketio.emit('card_update', {
            'teamId': team_id,
            'cardType': card_type,
            'active': active,
            'used': used
        })
        
        action_text = "used" if used else ("activated" if active else "deactivated")
        add_log(f"Team {team_id} {card_type} card {action_text}")

@socketio.on('devil_attack')
def handle_devil_attack(data):
    """Handle devil attack between teams"""
    attacker_id = data.get('attackerId')
    target_id = data.get('targetId')
    new_score = data.get('newScore')
    
    if attacker_id in game_state['teams'] and target_id in game_state['teams']:
        # Mark devil as used for attacker
        game_state['teams'][attacker_id]['cards']['devilUsed'] = True
        
        # Update target score
        game_state['teams'][target_id]['score'] = new_score
        
        # Activate cross protection for target
        game_state['teams'][target_id]['cards']['cross'] = True
        
        # Broadcast devil attack to all clients
        socketio.emit('devil_attack', {
            'attackerId': attacker_id,
            'targetId': target_id,
            'newScore': new_score
        })
        
        # Broadcast card updates
        socketio.emit('card_update', {
            'teamId': attacker_id,
            'cardType': 'devil',
            'used': True
        })
        
        socketio.emit('card_update', {
            'teamId': target_id,
            'cardType': 'cross',
            'active': True
        })
        
        # Broadcast score update
        socketio.emit('score_update', {
            'teamId': target_id,
            'score': new_score,
            'adjustment': -1,
            'correct': False
        })
        
        add_log(f"Team {attacker_id} devil attacked Team {target_id} (-1 point, cross activated)")

@socketio.on('resolve_devil_challenge')
def handle_resolve_devil_challenge(data):
    """Handle devil challenge resolution"""
    target_team_id = data.get('targetTeamId')
    answered_correctly = data.get('answeredCorrectly', False)
    
    if target_team_id in game_state['teams']:
        # Broadcast to all clients to resolve the challenge
        socketio.emit('resolve_devil_challenge', {
            'targetTeamId': target_team_id,
            'answeredCorrectly': answered_correctly
        })
        
        result = "correctly" if answered_correctly else "incorrectly"
        add_log(f"Team {target_team_id} answered {result} to devil challenge")
        
        logger.info(f"✅ Devil challenge resolved: Team {target_team_id} answered {result}")

@socketio.on('challenge_update')
def handle_challenge_update(data):
    """Handle 2x challenge toggle"""
    enabled = data.get('enabled', False)
    game_state['challenge_2x'] = enabled
    
    socketio.emit('challenge_update', {'enabled': enabled})
    
    add_log(f"2x Challenge {'enabled' if enabled else 'disabled'}")

@socketio.on('clear_buzzers')
def handle_clear_buzzers():
    """Clear all buzzers"""
    game_state['winner'] = None
    
    if arduino.is_connected:
        arduino.write('RESET\n')
    
    socketio.emit('clear_buzzers')
    add_log("All buzzers cleared")

@socketio.on('buzzer_pressed')
def handle_buzzer_pressed(data):
    """Handle buzzer press from Arduino or simulation"""
    team_id = data.get('teamId')
    
    # Reset winner if it's been cleared
    if game_state['winner'] is not None:
        game_state['winner'] = None
    
    # Set new winner
    game_state['winner'] = team_id
    
    # Broadcast to all clients
    socketio.emit('buzzer_pressed', {'teamId': team_id})
    add_log(f"Team {team_id} buzzed in!")
    
    logger.info(f"✅ Team {team_id} buzzed in successfully")

@socketio.on('progress_update')
def handle_progress_update(data):
    """Handle progress bar updates"""
    set_number = data.get('setNumber', 1)
    question_number = data.get('questionNumber', 1)
    title = data.get('title', '')
    subject = data.get('subject', 'general')
    progress_percentage = data.get('progressPercentage', 0)
    animate_run = data.get('animateRun', False)
    
    # Update game state
    game_state['question_set'].update({
        'current': set_number,
        'question_number': question_number,
        'title': title,
        'subject': subject,
        'progress': progress_percentage
    })
    
    # Broadcast to all clients
    socketio.emit('progress_update', {
        'setNumber': set_number,
        'questionNumber': question_number,
        'title': title,
        'subject': subject,
        'progressPercentage': progress_percentage,
        'animateRun': animate_run
    })

@socketio.on('character_update')
def handle_character_update(data):
    """Handle character position and animation updates"""
    set_number = data.get('setNumber')
    question_number = data.get('questionNumber')
    animate_run = data.get('animateRun', False)
    team_id = data.get('teamId')
    color = data.get('color')
    
    # Handle character position updates (from console navigation)
    if set_number is not None and question_number is not None:
        # Broadcast to all clients for character movement
        socketio.emit('character_update', {
            'setNumber': set_number,
            'questionNumber': question_number,
            'animateRun': animate_run
        })
        add_log(f"Character update: Set {set_number}, Question {question_number}")
        logger.info(f"✅ Character update broadcast: Set {set_number}, Question {question_number}")
    
    # Handle character color updates (from team selection)
    elif team_id is not None and color is not None:
        if team_id in game_state['teams']:
            game_state['teams'][team_id]['color'] = color
            
            # Broadcast to all clients
            socketio.emit('character_update', {
                'teamId': team_id,
                'color': color
            })

@socketio.on('test_buzzer')
def handle_test_buzzer(data):
    """Handle test buzzer press from keyboard shortcuts"""
    team_id = data.get('teamId')
    
    # Reset winner if it's been cleared
    if game_state['winner'] is not None:
        game_state['winner'] = None
    
    # Set new winner
    game_state['winner'] = team_id
    
    # Broadcast to all clients
    socketio.emit('buzzer_pressed', {'teamId': team_id})
    add_log(f"Team {team_id} test buzz-in")
    
    logger.info(f"✅ Test Team {team_id} buzzed in successfully")

@socketio.on('scoring_action')
def handle_scoring_action(data):
    """Handle scoring actions from console that should trigger animations on main page"""
    team_id = data.get('teamId')
    is_positive = data.get('isPositive', True)
    action = data.get('action', 'correct')
    
    # Broadcast to all clients to trigger animations
    socketio.emit('scoring_action', {
        'teamId': team_id,
        'isPositive': is_positive,
        'action': action
    })
    
    add_log(f"Scoring action: Team {team_id} {action}")
    logger.info(f"✅ Scoring action broadcast: Team {team_id} {action}")

@socketio.on('angel_card_action')
def handle_angel_card_action(data):
    """Handle angel card actions from console"""
    team_id = data.get('teamId')
    action = data.get('action', 'toggle')
    
    # Broadcast to all clients
    socketio.emit('angel_card_action', {
        'teamId': team_id,
        'action': action
    })
    
    add_log(f"Angel card action: Team {team_id} {action}")
    logger.info(f"✅ Angel card action broadcast: Team {team_id} {action}")

@socketio.on('devil_card_action')
def handle_devil_card_action(data):
    """Handle devil card actions from console"""
    team_id = data.get('teamId')
    action = data.get('action', 'toggle')
    
    # Broadcast to all clients
    socketio.emit('devil_card_action', {
        'teamId': team_id,
        'action': action
    })
    
    add_log(f"Devil card action: Team {team_id} {action}")
    logger.info(f"✅ Devil card action broadcast: Team {team_id} {action}")

@socketio.on('challenge_mode_action')
def handle_challenge_mode_action(data):
    """Handle challenge mode actions from console"""
    enabled = data.get('enabled', False)
    team_id = data.get('teamId')
    action = data.get('action', 'toggle')
    
    # Broadcast to all clients
    socketio.emit('challenge_mode_action', {
        'enabled': enabled,
        'teamId': team_id,
        'action': action
    })
    
    add_log(f"Challenge mode action: Team {team_id} {action} (enabled: {enabled})")
    logger.info(f"✅ Challenge mode action broadcast: Team {team_id} {action}")

@socketio.on('navigation_action')
def handle_navigation_action(data):
    """Handle navigation actions from console"""
    direction = data.get('direction', 'next')
    from_set = data.get('fromSet', 1)
    from_question = data.get('fromQuestion', 1)
    to_set = data.get('toSet', 1)
    to_question = data.get('toQuestion', 1)
    
    # Broadcast to all clients
    socketio.emit('navigation_action', {
        'direction': direction,
        'fromSet': from_set,
        'fromQuestion': from_question,
        'toSet': to_set,
        'toQuestion': to_question
    })
    
    add_log(f"Navigation action: {direction} from Set {from_set} Q{from_question} to Set {to_set} Q{to_question}")
    logger.info(f"✅ Navigation action broadcast: {direction}")

@socketio.on('buzzer_reset_action')
def handle_buzzer_reset_action(data):
    """Handle buzzer reset actions from console"""
    action = data.get('action', 'clear_all')
    reason = data.get('reason', 'manual_reset')
    
    # Broadcast to all clients
    socketio.emit('buzzer_reset_action', {
        'action': action,
        'reason': reason
    })
    
    add_log(f"Buzzer reset action: {action} ({reason})")
    logger.info(f"✅ Buzzer reset action broadcast: {action}")

# Simplified console-to-main page communication events
@socketio.on('angel_card_toggle')
def handle_angel_card_toggle(data):
    """Handle angel card toggle from console"""
    team_id = data.get('teamId')
    socketio.emit('angel_card_toggle', {'teamId': team_id})
    add_log(f"Angel card toggle: Team {team_id}")
    logger.info(f"✅ Angel card toggle broadcast: Team {team_id}")

@socketio.on('devil_card_toggle')
def handle_devil_card_toggle(data):
    """Handle devil card toggle from console"""
    team_id = data.get('teamId')
    socketio.emit('devil_card_toggle', {'teamId': team_id})
    add_log(f"Devil card toggle: Team {team_id}")
    logger.info(f"✅ Devil card toggle broadcast: Team {team_id}")

@socketio.on('challenge_mode_toggle')
def handle_challenge_mode_toggle(data):
    """Handle challenge mode toggle from console"""
    team_id = data.get('teamId')
    socketio.emit('challenge_mode_toggle', {'teamId': team_id})
    add_log(f"Challenge mode toggle: Team {team_id}")
    logger.info(f"✅ Challenge mode toggle broadcast: Team {team_id}")

@socketio.on('navigation_previous')
def handle_navigation_previous():
    """Handle navigation previous from console"""
    socketio.emit('navigation_previous')
    add_log("Navigation: Previous question")
    logger.info("✅ Navigation previous broadcast")

@socketio.on('navigation_next')
def handle_navigation_next():
    """Handle navigation next from console"""
    socketio.emit('navigation_next')
    add_log("Navigation: Next question")
    logger.info("✅ Navigation next broadcast")

@socketio.on('scoring_correct')
def handle_scoring_correct(data):
    """Handle scoring correct from console"""
    team_id = data.get('teamId')
    socketio.emit('scoring_correct', {'teamId': team_id})
    add_log(f"Scoring correct: Team {team_id}")
    logger.info(f"✅ Scoring correct broadcast: Team {team_id}")

@socketio.on('scoring_incorrect')
def handle_scoring_incorrect(data):
    """Handle scoring incorrect from console"""
    team_id = data.get('teamId')
    socketio.emit('scoring_incorrect', {'teamId': team_id})
    add_log(f"Scoring incorrect: Team {team_id}")
    logger.info(f"✅ Scoring incorrect broadcast: Team {team_id}")

@socketio.on('game_state_update')
def handle_game_state_update(data):
    """Handle game state updates from console"""
    path = data.get('path')
    value = data.get('value')
    
    if path and value is not None:
        # Update game state
        keys = path.split('.')
        current = game_state
        
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        current[keys[-1]] = value
        
        # Broadcast to all clients
        socketio.emit('game_state_update', {
            'path': path,
            'value': value
        })
        
        add_log(f"Game state updated: {path} = {value}")
        logger.info(f"✅ Game state update broadcast: {path} = {value}")

def add_log(message, type='info'):
    """Add entry to game logs"""
    import datetime
    
    log_entry = {
        'timestamp': datetime.datetime.now().isoformat(),
        'message': message,
        'type': type
    }
    
    game_state['logs'].append(log_entry)
    
    # Keep only last 100 log entries
    if len(game_state['logs']) > 100:
        game_state['logs'] = game_state['logs'][-100:]
    
    # Broadcast to all clients
    socketio.emit('log_update', log_entry)

def format_time(seconds):
    """Format seconds into MM:SS format"""
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins}:{secs:02d}"

# Timer background thread
def timer_thread():
    """Background thread to handle timer countdown"""
    while True:
        time.sleep(1)
        if game_state['timer']['running'] and game_state['timer']['value'] > 0:
            game_state['timer']['value'] -= 1
            
            # Broadcast timer update
            socketio.emit('timer_update', {
                'value': game_state['timer']['value'],
                'running': game_state['timer']['running']
            })
            
            # Check if timer reached zero
            if game_state['timer']['value'] == 0:
                game_state['timer']['running'] = False
                socketio.emit('timer_ended')
                add_log("Timer ended")

# Start timer thread
timer_bg_thread = threading.Thread(target=timer_thread, daemon=True)
timer_bg_thread.start()

def main():
    """Run the development server with HTTP or HTTPS support"""
    parser = argparse.ArgumentParser(description='Quiz Buzzer Development Server')
    parser.add_argument('--https', action='store_true', help='Enable HTTPS with self-signed certificate')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to (default: 8000)')
    parser.add_argument('--cert', default='ssl/server.crt', help='Path to SSL certificate file (default: ssl/server.crt)')
    parser.add_argument('--key', default='ssl/server.key', help='Path to SSL private key file (default: ssl/server.key)')
    parser.add_argument('--arduino-port', help='Arduino serial port (auto-detect if not specified)')
    parser.add_argument('--arduino-baud', type=int, default=9600, help='Arduino baud rate (default: 9600)')
    parser.add_argument('--no-arduino', action='store_true', help='Disable Arduino auto-connection')
    
    args = parser.parse_args()
    
    ssl_context = None
    protocol = "HTTP"
    
    if args.https:
        # Use provided certificate paths (create if missing)
        cert_path, key_path = verify_or_create_certs(args.cert, args.key)
        if cert_path and key_path:
            try:
                ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                ssl_context.load_cert_chain(cert_path, key_path)
                protocol = "HTTPS (SSL/TLS)"
            except Exception as e:
                logger.error(f"❌ Failed to load certificate: {e}")
                logger.info("💡 Try regenerating certificates or check file permissions")
                return
        else:
            logger.error("❌ Failed to create or find certificate files!")
            return
    
    print("=" * 70)
    print(f"🏆 Quiz Buzzer Development Server (6 Teams) - {protocol}")
    print("=" * 70)
    
    if ssl_context:
        print(f"🔒 Main UI:     https://{args.host}:{args.port}")
        print(f"📁 Certificate: {args.cert}")
        print(f"🔑 Private Key: {args.key}")
        if "Self-Signed" in protocol or not os.path.exists(args.cert):
            print("⚠️  Note: Self-signed certificate will show browser security warning")
            print("   Click 'Advanced' → 'Proceed to localhost (unsafe)' to continue")
    else:
        print(f"📱 Main UI:     http://{args.host}:{args.port}")
    
    print("=" * 70)
    print("✅ Updated for your ESP32 board GPIO pins:")
    print("   Buttons: D4, D5, D13, D14, D21, D22")
    print("   LEDs:    D18, D19, D23, D25, D26, D27")
    print("=" * 70)
    
    # Try to connect to Arduino if not disabled
    if not args.no_arduino and SERIAL_AVAILABLE:
        print("🔌 Attempting to connect to Arduino...")
        if arduino.connect(args.arduino_port, args.arduino_baud):
            print(f"✅ Arduino connected on {arduino.serial_port.port} at {args.arduino_baud} baud")
            game_state['arduino_connected'] = True
        else:
            print("⚠️  Arduino not found - running in simulation mode")
            print("   Check your Arduino connection and try again")
    elif args.no_arduino:
        print("🚫 Arduino auto-connection disabled")
    else:
        print("⚠️  pySerial not available - running in simulation mode only")
        print("   Install with: pip install pyserial")
    
    print("=" * 70)
    
    try:
        if ssl_context:
            # For HTTPS, use Flask-SocketIO's SSL support
            socketio.run(
                app, 
                host=args.host, 
                port=args.port, 
                debug=False, 
                ssl_context=(args.cert, args.key),
                allow_unsafe_werkzeug=True
            )
        else:
            # For HTTP, no SSL parameters needed
            socketio.run(
                app, 
                host=args.host, 
                port=args.port, 
                debug=False, 
                allow_unsafe_werkzeug=True
            )
    except Exception as e:
        logger.error(f"❌ Server failed to start: {e}")
        if ssl_context:
            logger.info("💡 Try running without --https flag for HTTP mode")
            logger.info("💡 Check certificate files exist and have correct permissions")

if __name__ == '__main__':
    main() 