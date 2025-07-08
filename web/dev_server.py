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

app = Flask(__name__)
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
        """Optimized non-blocking read loop with message validation"""
        buffer = ""
        while self.is_connected and not self.stop_threads:
            try:
                if self.serial_port and self.serial_port.in_waiting > 0:
                    data = self.serial_port.read(self.serial_port.in_waiting).decode('utf-8', errors='ignore')
                    buffer += data
                    
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
                logger.error(f"Read error: {e}")
                time.sleep(0.1)

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
    
    def _write_loop(self):
        """Non-blocking write loop with queue"""
        while self.is_connected and not self.stop_threads:
            try:
                # Wait for data to write (with timeout)
                data = self.write_queue.get(timeout=0.1)
                
                if self.serial_port and self.is_connected:
                    self.serial_port.write(data.encode('utf-8'))
                    self.serial_port.flush()
                    
                self.write_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Write error: {e}")
                time.sleep(0.1)
    
    def _handle_arduino_message(self, message):
        """Handle incoming Arduino messages with improved validation"""
        logger.info(f"Arduino: {message}")
        
        # Broadcast to all connected clients
        socketio.emit('buzzer_data', message)
        
        # Update game state based on message type
        if message.startswith('WINNER:'):
            try:
                team = int(message.split(':')[1])
                if game_state['winner'] is None:
                    game_state['winner'] = team
                    logger.info(f"🏆 Team {team} wins!")
                else:
                    logger.warning(f"Team {team} winner ignored - Team {game_state['winner']} already won")
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
        self.stop_threads = True
        self.is_connected = False
        
        if self.serial_port:
            try:
                self.serial_port.close()
            except:
                pass
            self.serial_port = None
            
        logger.info("Arduino disconnected")

# Initialize Arduino communication
arduino = ArduinoSerial()

# Enhanced game state
game_state = {
    'winner': None,
    'connected_clients': 0,
    'arduino_connected': False
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

@app.route('/')
def index():
    """Serve the buzzer HTML with WebSocket integration"""
    try:
        with open('buzzer.html', 'r') as f:
            html_content = f.read()
        
        # Inject WebSocket client code
        websocket_code = """
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script>
      let socket;
      
      function connectToDevServer() {
        // Use the current protocol (HTTP or HTTPS)
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const socketUrl = `${protocol}//${window.location.host}`;
        
        socket = io(socketUrl);
        
        socket.on('connect', function() {
          isConnected = true;
          statusDot.className = 'status-dot connected';
          connectionModal.classList.remove('visible');
          console.log('Connected to dev server via', protocol);
        });
        
        socket.on('disconnect', function() {
          isConnected = false;
          statusDot.className = 'status-dot';
          console.log('Disconnected from dev server');
          
          // Clear any connection state to ensure clean reconnect
          if (typeof socket !== 'undefined') {
            socket = null;
          }
        });
        
        socket.on('buzzer_data', function(data) {
          console.log('Received from dev server:', data);
          handleSerialData(data);
        });
        
        return Promise.resolve();
      }
      
      // Override functions for dev server
      window.sendReset = async function() {
        if (socket && socket.connected) {
          socket.emit('reset_buzzers');
          console.log('Reset sent to dev server');
        } else {
          resetDisplay();
        }
      };
      
      window.connectSerial = async function() {
        console.log('🔄 Dev server reconnect requested - refreshing page for clean connection...');
        window.location.reload();
        return Promise.resolve();
      };
      
      // Auto-connect when page loads
      window.addEventListener('load', function() {
        const isHttps = window.location.protocol === 'https:';
        console.log(`Dev server mode (${isHttps ? 'HTTPS' : 'HTTP'}) - auto-connecting...`);
        connectToDevServer();
      });
    </script>
    """
        
        # Insert before closing body tag
        modified_html = html_content.replace('</body>', websocket_code + '</body>')
        return modified_html
        
    except FileNotFoundError:
        return "<h1>Error: buzzer.html not found</h1>"

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
def handle_reset():
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
    team = data.get('team', 1)
    
    if arduino.is_connected:
        # If Arduino is connected, simulate by sending winner message
        if game_state['winner'] is None:
            game_state['winner'] = team
            message = f'WINNER:{team}'
            socketio.emit('buzzer_data', message)
            logger.info(f'Simulated Team {team} wins!')
            socketio.emit('log', {'message': f'Simulated Team {team} wins!'})
        else:
            logger.info(f'Simulated Team {team} buzzed (too late)')
            socketio.emit('log', {'message': f'Simulated Team {team} buzzed (too late)'})
    else:
        # Pure simulation mode
        if game_state['winner'] is None:
            game_state['winner'] = team
            message = f'WINNER:{team}'
            socketio.emit('buzzer_data', message)
            logger.info(f'Team {team} wins!')
            socketio.emit('log', {'message': f'Team {team} wins!'})
        else:
            logger.info(f'Team {team} buzzed (too late)')
            socketio.emit('log', {'message': f'Team {team} buzzed (too late)'})

@socketio.on('admin_reset')
def handle_admin_reset():
    """Handle admin reset"""
    logger.info('Admin reset')
    
    if arduino.is_connected:
        # Send reset to real Arduino
        arduino.write('RESET\n')
        socketio.emit('log', {'message': 'Admin reset sent to Arduino'})
    else:
        # Simulate reset
        game_state['winner'] = None
        socketio.emit('buzzer_data', 'READY')
        socketio.emit('log', {'message': 'Admin reset (simulated)'})

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