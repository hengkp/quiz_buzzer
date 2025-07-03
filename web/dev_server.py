#!/usr/bin/env python3
"""
Development server for testing the Quiz Buzzer System UI
Simulates the Arduino buzzer hardware for testing purposes
"""

import os
import time
import random
import threading
from flask import Flask, render_template_string, request, jsonify
from flask_socketio import SocketIO, emit
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-buzzer-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Game state
game_state = {
    'connected': False,
    'winner': None,
    'teams': ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6'],
    'last_buzz_time': None
}

@app.route('/')
def index():
    """Serve the main buzzer HTML file"""
    try:
        with open('buzzer.html', 'r') as f:
            html_content = f.read()
        
        # Modify the HTML to connect to our WebSocket instead of Serial
        modified_html = html_content.replace(
            'await navigator.serial.requestPort()',
            'connectToDevServer()'
        )
        
        # Inject our WebSocket client code
        websocket_code = """
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script>
      let socket;
      let devServerConnected = false;
      
      function connectToDevServer() {
        socket = io();
        
        socket.on('connect', function() {
          devServerConnected = true;
          isConnected = true;
          statusDot.className = 'status-dot connected';
          connectionModal.classList.remove('visible');
          console.log('Connected to dev server');
        });
        
        socket.on('disconnect', function() {
          devServerConnected = false;
          isConnected = false;
          statusDot.className = 'status-dot';
          console.log('Disconnected from dev server');
        });
        
        socket.on('buzzer_data', function(data) {
          console.log('Received from dev server:', data);
          handleSerialData(data);
        });
        
        return Promise.resolve(); // Simulate successful connection
      }
      
      // Override the serial writer
      const originalSendReset = sendReset;
      async function sendReset() {
        if (!devServerConnected) {
          alert('Dev server not connected');
          return;
        }
        
        try {
          socket.emit('reset_buzzers');
          console.log('Reset sent to dev server');
        } catch (error) {
          console.error('Reset error:', error);
        }
      }
      
      // Replace the original sendReset function
      window.sendReset = sendReset;
    </script>
    """
        
        # Insert the WebSocket code before the closing body tag
        modified_html = modified_html.replace('</body>', websocket_code + '</body>')
        
        return modified_html
    except FileNotFoundError:
        return """
        <h1>Error: buzzer.html not found</h1>
        <p>Make sure you're running this from the web directory where buzzer.html is located.</p>
        """

@app.route('/admin')
def admin():
    """Admin interface for testing buzzer events"""
    admin_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Buzzer System - Admin Test Panel</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f7;
            }
            .panel {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }
            h1, h2 { color: #1d1d1f; }
            .buzzer-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .buzzer-btn {
                padding: 15px 20px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white;
            }
            .buzzer-btn:hover { transform: scale(1.05); }
            .buzzer-btn:active { transform: scale(0.95); }
            .team1 { background: #ff3b30; }
            .team2 { background: #007aff; }
            .team3 { background: #30d158; }
            .team4 { background: #ff9500; }
            .team5 { background: #af52de; }
            .team6 { background: #ff2d92; }
            .control-btn {
                background: #8e8e93;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                margin: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            }
            .control-btn:hover { background: #6d6d70; }
            .status { 
                padding: 10px;
                border-radius: 6px;
                margin: 10px 0;
                font-weight: 500;
            }
            .connected { background: #d1f2eb; color: #00875a; }
            .disconnected { background: #ffeae6; color: #c9372c; }
            .log {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 15px;
                max-height: 300px;
                overflow-y: auto;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 12px;
            }
            code {
                background: #f0f0f0;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 13px;
                color: #007aff;
            }
        </style>
    </head>
    <body>
        <h1>🏆 Buzzer System - Admin Test Panel</h1>
        
        <div class="panel">
            <h2>Connection Status</h2>
            <div id="status" class="status disconnected">
                No clients connected
            </div>
        </div>
        
        <div class="panel">
            <h2>Simulate Buzzer Presses</h2>
            <p>Click any team button to simulate that team pressing their buzzer first:</p>
            <p style="font-size: 14px; color: #8e8e93; margin-bottom: 15px;">
                💡 <strong>Tip:</strong> Use keyboard keys <code>1-6</code> in the main UI to simulate buzzer presses, 
                and <code>R</code> to reset (works in dev mode, real hardware mode, and standalone mode)!
            </p>
            <div class="buzzer-grid">
                <button class="buzzer-btn team1" onclick="simulateBuzzer(1)">Team 1 Buzzer</button>
                <button class="buzzer-btn team2" onclick="simulateBuzzer(2)">Team 2 Buzzer</button>
                <button class="buzzer-btn team3" onclick="simulateBuzzer(3)">Team 3 Buzzer</button>
                <button class="buzzer-btn team4" onclick="simulateBuzzer(4)">Team 4 Buzzer</button>
                <button class="buzzer-btn team5" onclick="simulateBuzzer(5)">Team 5 Buzzer</button>
                <button class="buzzer-btn team6" onclick="simulateBuzzer(6)">Team 6 Buzzer</button>
            </div>
        </div>
        
        <div class="panel">
            <h2>Controls</h2>
            <button class="control-btn" onclick="resetSystem()">Reset System</button>
            <button class="control-btn" onclick="randomBuzzer()">Random Buzzer</button>
            <button class="control-btn" onclick="clearLog()">Clear Log</button>
        </div>
        
        <div class="panel">
            <h2>Event Log</h2>
            <div id="log" class="log">Server started...\n</div>
        </div>
        
        <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
        <script>
            const socket = io();
            const statusEl = document.getElementById('status');
            const logEl = document.getElementById('log');
            
            socket.on('connect', function() {
                updateStatus('Connected to server');
                addLog('Admin panel connected');
            });
            
            socket.on('disconnect', function() {
                updateStatus('Disconnected from server');
                addLog('Admin panel disconnected');
            });
            
            socket.on('status_update', function(data) {
                updateStatus(data.message);
                addLog(data.message);
            });
            
            socket.on('event_log', function(data) {
                addLog(data.message);
            });
            
            function updateStatus(message) {
                statusEl.textContent = message;
                statusEl.className = message.includes('connected') ? 'status connected' : 'status disconnected';
            }
            
            function addLog(message) {
                const timestamp = new Date().toLocaleTimeString();
                logEl.textContent += `[${timestamp}] ${message}\n`;
                logEl.scrollTop = logEl.scrollHeight;
            }
            
            function simulateBuzzer(teamNum) {
                socket.emit('simulate_buzzer', {team: teamNum});
                addLog(`Simulated Team ${teamNum} buzzer press`);
            }
            
            function resetSystem() {
                socket.emit('admin_reset');
                addLog('Admin reset triggered');
            }
            
            function randomBuzzer() {
                const randomTeam = Math.floor(Math.random() * 6) + 1;
                simulateBuzzer(randomTeam);
            }
            
            function clearLog() {
                logEl.textContent = 'Log cleared...\n';
            }
        </script>
    </body>
    </html>
    """
    return admin_html

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f'Client connected: {request.sid}')
    game_state['connected'] = True
    emit('status_update', {'message': f'Client {request.sid[:8]} connected'}, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f'Client disconnected: {request.sid}')
    emit('status_update', {'message': f'Client {request.sid[:8]} disconnected'}, broadcast=True)

@socketio.on('reset_buzzers')
def handle_reset():
    """Handle reset command from client"""
    logger.info('Reset command received from client')
    game_state['winner'] = None
    game_state['last_buzz_time'] = None
    
    # Send reset to all clients
    socketio.emit('buzzer_data', 'RESET')
    socketio.emit('event_log', {'message': 'System reset by client'})

@socketio.on('simulate_buzzer')
def handle_simulate_buzzer(data):
    """Handle buzzer simulation from admin panel"""
    team_num = data.get('team', 1)
    
    if game_state['winner'] is None:  # Only if no winner yet
        game_state['winner'] = team_num
        game_state['last_buzz_time'] = time.time()
        
        # Send winner to all clients
        message = f'WINNER:{team_num}'
        socketio.emit('buzzer_data', message)
        
        logger.info(f'Team {team_num} buzzed in!')
        socketio.emit('event_log', {'message': f'Team {team_num} wins!'})
    else:
        logger.info(f'Team {team_num} buzzed but Team {game_state["winner"]} already won')
        socketio.emit('event_log', {'message': f'Team {team_num} buzzed (too late, Team {game_state["winner"]} already won)'})

@socketio.on('admin_reset')
def handle_admin_reset():
    """Handle reset from admin panel"""
    logger.info('Admin reset triggered')
    game_state['winner'] = None
    game_state['last_buzz_time'] = None
    
    # Send reset to all clients
    socketio.emit('buzzer_data', 'RESET')
    socketio.emit('event_log', {'message': 'System reset by admin'})

def auto_buzzer_simulation():
    """Background thread for automatic random buzzer events (optional)"""
    while True:
        time.sleep(random.randint(10, 30))  # Random delay between 10-30 seconds
        
        if game_state['winner'] is None and random.random() < 0.3:  # 30% chance
            team_num = random.randint(1, 6)
            logger.info(f'Auto-simulation: Team {team_num} buzzer')
            
            game_state['winner'] = team_num
            game_state['last_buzz_time'] = time.time()
            
            message = f'WINNER:{team_num}'
            socketio.emit('buzzer_data', message)
            socketio.emit('event_log', {'message': f'Auto-sim: Team {team_num} wins!'})

def main():
    """Main function to run the development server"""
    print("🏆 Quiz Buzzer Development Server")
    print("=" * 50)
    print("📱 Main UI: http://localhost:8000")
    print("🔧 Admin Panel: http://localhost:8000/admin")
    print("=" * 50)
    print("Features:")
    print("• Simulates Arduino buzzer hardware")
    print("• WebSocket connection instead of Serial")
    print("• Admin panel for testing buzzer events")
    print("• Real-time event logging")
    print("=" * 50)
    
    # Uncomment the next line if you want automatic random buzzer events
    # threading.Thread(target=auto_buzzer_simulation, daemon=True).start()
    
    # Run the server
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=8000, 
        debug=True,
        allow_unsafe_werkzeug=True
    )

if __name__ == '__main__':
    main() 