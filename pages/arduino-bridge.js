// Arduino Bridge for Quiz Buzzer GitHub Pages
// This Node.js script bridges Arduino communication with Firebase

const SerialPort = require('serialport');
const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK configuration
const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://quiz-buzzer-xxxxx-default-rtdb.firebaseio.com"
});

const db = admin.database();

class ArduinoBridge {
    constructor() {
        this.serialPort = null;
        this.isConnected = false;
        this.port = null;
        this.baudRate = 9600;
        
        // Firebase listeners
        this.firebaseListeners = {};
        
        this.init();
    }

    async init() {
        console.log('🔌 Arduino Bridge starting...');
        
        // Set up Firebase listeners
        this.setupFirebaseListeners();
        
        // Try to connect to Arduino
        await this.connectToArduino();
        
        // Set up periodic connection check
        setInterval(() => {
            if (!this.isConnected) {
                console.log('🔄 Attempting to reconnect to Arduino...');
                this.connectToArduino();
            }
        }, 10000);
    }

    setupFirebaseListeners() {
        // Listen for buzzer reset commands
        db.ref('arduino_commands').on('child_added', (snapshot) => {
            const command = snapshot.val();
            if (command && command.type === 'reset_buzzers') {
                this.sendToArduino('RESET\n');
                console.log('📤 Sent RESET to Arduino');
            }
        });

        // Listen for connection requests
        db.ref('arduino_connection').on('child_added', (snapshot) => {
            const request = snapshot.val();
            if (request && request.action === 'connect') {
                this.connectToArduino(request.port, request.baudRate);
            } else if (request && request.action === 'disconnect') {
                this.disconnect();
            }
        });

        // Clean up old commands (keep only last 10)
        this.cleanupOldCommands();
    }

    async connectToArduino(port = null, baudRate = 9600) {
        try {
            // Find Arduino port if not specified
            if (!port) {
                port = await this.findArduinoPort();
            }

            if (!port) {
                console.log('⚠️ No Arduino port found');
                this.updateStatus(false, 'No Arduino port found');
                return false;
            }

            // Close existing connection
            if (this.serialPort) {
                this.serialPort.close();
            }

            // Create new connection
            this.serialPort = new SerialPort.SerialPort({
                path: port,
                baudRate: baudRate,
                autoOpen: false
            });

            this.serialPort.on('open', () => {
                console.log(`✅ Connected to Arduino on ${port} at ${baudRate} baud`);
                this.isConnected = true;
                this.port = port;
                this.baudRate = baudRate;
                this.updateStatus(true, `Connected to ${port}`);
                
                // Clear any initial data
                this.serialPort.flush();
            });

            this.serialPort.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    console.log(`📥 Arduino: ${message}`);
                    this.handleArduinoMessage(message);
                }
            });

            this.serialPort.on('error', (error) => {
                console.error(`❌ Arduino error: ${error.message}`);
                this.isConnected = false;
                this.updateStatus(false, `Error: ${error.message}`);
            });

            this.serialPort.on('close', () => {
                console.log('🔌 Arduino connection closed');
                this.isConnected = false;
                this.updateStatus(false, 'Connection closed');
            });

            // Open the port
            await this.serialPort.open();
            return true;

        } catch (error) {
            console.error(`❌ Failed to connect to Arduino: ${error.message}`);
            this.updateStatus(false, `Connection failed: ${error.message}`);
            return false;
        }
    }

    async findArduinoPort() {
        try {
            const ports = await SerialPort.list();
            for (const port of ports) {
                if (port.manufacturer && 
                    (port.manufacturer.includes('Arduino') || 
                     port.manufacturer.includes('CH340') ||
                     port.manufacturer.includes('CP210'))) {
                    return port.path;
                }
            }
            
            // If no Arduino found, return first available port
            if (ports.length > 0) {
                console.log(`⚠️ No Arduino found, using first available port: ${ports[0].path}`);
                return ports[0].path;
            }
            
            return null;
        } catch (error) {
            console.error('Error finding Arduino port:', error);
            return null;
        }
    }

    sendToArduino(data) {
        if (this.serialPort && this.isConnected) {
            this.serialPort.write(data, (error) => {
                if (error) {
                    console.error(`❌ Error sending to Arduino: ${error.message}`);
                } else {
                    console.log(`📤 Sent to Arduino: ${data.trim()}`);
                }
            });
        } else {
            console.warn('⚠️ Arduino not connected, cannot send data');
        }
    }

    handleArduinoMessage(message) {
        // Send to Firebase for all clients
        db.ref('arduino_data').push({
            message: message,
            timestamp: Date.now()
        });

        // Handle specific message types
        if (message.startsWith('WINNER:')) {
            const teamId = parseInt(message.split(':')[1]);
            if (teamId >= 1 && teamId <= 6) {
                db.ref('buzzer_events').push({
                    type: 'buzzer_pressed',
                    teamId: teamId,
                    timestamp: Date.now(),
                    source: 'arduino'
                });
            }
        } else if (message === 'RESET' || message === 'READY') {
            db.ref('game_events').push({
                type: 'reset_buzzers',
                timestamp: Date.now(),
                source: 'arduino'
            });
        }
    }

    updateStatus(connected, message) {
        db.ref('arduino_status').set({
            connected: connected,
            message: message,
            port: this.port,
            baudRate: this.baudRate,
            timestamp: Date.now()
        });
    }

    disconnect() {
        if (this.serialPort) {
            this.serialPort.close();
        }
        this.isConnected = false;
        this.updateStatus(false, 'Disconnected');
    }

    cleanupOldCommands() {
        // Clean up old commands every 5 minutes
        setInterval(async () => {
            try {
                const commandsRef = db.ref('arduino_commands');
                const snapshot = await commandsRef.once('value');
                const commands = snapshot.val();
                
                if (commands) {
                    const commandKeys = Object.keys(commands);
                    if (commandKeys.length > 10) {
                        // Keep only the 10 most recent commands
                        const keysToDelete = commandKeys.slice(0, commandKeys.length - 10);
                        const updates = {};
                        keysToDelete.forEach(key => {
                            updates[`arduino_commands/${key}`] = null;
                        });
                        await db.ref().update(updates);
                    }
                }
            } catch (error) {
                console.error('Error cleaning up commands:', error);
            }
        }, 300000); // 5 minutes
    }
}

// Start the bridge
const bridge = new ArduinoBridge();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Arduino Bridge...');
    bridge.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Arduino Bridge...');
    bridge.disconnect();
    process.exit(0);
});

module.exports = ArduinoBridge; 