// Firebase Socket Manager - Replaces Socket.IO for GitHub Pages
// This file provides Socket.IO-like interface using Firebase Realtime Database

class FirebaseSocketManager {
    constructor() {
        this.firebaseManager = window.firebaseManager;
        this.listeners = {};
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.init();
    }

    init() {
        // Listen for Firebase connection status
        this.firebaseManager.on('connection_status', (data) => {
            this.connected = data.connected;
            
            if (this.connected) {
                this.reconnectAttempts = 0;
                this.emit('connect');
            } else {
                this.emit('disconnect');
                this.attemptReconnect();
            }
        });

        // Set up Firebase listeners for different event types
        this.setupFirebaseListeners();
    }

    setupFirebaseListeners() {
        // Listen for buzzer events
        this.firebaseManager.listenToFirebase('buzzer_events', (data) => {
            if (data.type === 'buzzer_pressed') {
                this.emit('buzzer_pressed', { teamId: data.teamId });
            }
        });

        // Listen for timer events
        this.firebaseManager.listenToFirebase('timer_events', (data) => {
            if (data.type === 'timer_update') {
                this.emit('timer_update', data.data);
            } else if (data.type === 'timer_ended') {
                this.emit('timer_ended');
            }
        });

        // Listen for score events
        this.firebaseManager.listenToFirebase('score_events', (data) => {
            if (data.type === 'score_update') {
                this.emit('score_update', {
                    teamId: data.teamId,
                    score: data.score,
                    adjustment: data.adjustment,
                    correct: data.correct
                });
            }
        });

        // Listen for card events
        this.firebaseManager.listenToFirebase('card_events', (data) => {
            if (data.type === 'card_update') {
                this.emit('card_update', {
                    teamId: data.teamId,
                    cardType: data.cardType,
                    active: data.active,
                    used: data.used
                });
            }
        });

        // Listen for game events
        this.firebaseManager.listenToFirebase('game_events', (data) => {
            if (data.type === 'reset_buzzers') {
                this.emit('clear_buzzers');
            }
        });

        // Listen for Arduino data
        this.firebaseManager.listenToFirebase('arduino_data', (data) => {
            this.emit('buzzer_data', data.message);
        });

        // Listen for Arduino status
        this.firebaseManager.listenToFirebase('arduino_status', (data) => {
            this.emit('arduino_status', {
                connected: data.connected,
                message: data.message
            });
        });

        // Listen for logs
        this.firebaseManager.listenToFirebase('logs', (data) => {
            this.emit('log', {
                message: data.message,
                type: data.type
            });
        });

        // Listen for game state updates
        this.firebaseManager.listenToFirebase('game_state', (data) => {
            this.emit('game_state_update', data);
        });
    }

    // Socket.IO style event emission
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    // Socket.IO style event listening
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Socket.IO style event removal
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    // Send events to Firebase (Socket.IO emit style)
    emitToServer(event, data) {
        if (!this.connected) {
            console.warn('Firebase not connected, cannot send event:', event);
            return;
        }

        switch (event) {
            case 'reset_buzzers':
                this.firebaseManager.emitToFirebase('arduino_commands', {
                    type: 'reset_buzzers',
                    timestamp: Date.now()
                });
                break;

            case 'simulate_buzzer':
                this.firebaseManager.sendBuzzerData(data.teamId);
                break;

            case 'score_update':
                this.firebaseManager.sendScoreUpdate(
                    data.teamId, 
                    data.score, 
                    data.adjustment, 
                    data.correct
                );
                break;

            case 'timer_update':
                this.firebaseManager.sendTimerUpdate(data);
                break;

            case 'card_update':
                this.firebaseManager.sendCardUpdate(
                    data.teamId,
                    data.cardType,
                    data.active,
                    data.used
                );
                break;

            case 'team_update':
                this.firebaseManager.updateGameState(`teams/${data.teamId}`, data.updates);
                break;

            case 'set_timer':
                this.firebaseManager.updateGameState('timer/value', data.value);
                break;

            case 'start_timer':
                this.firebaseManager.updateGameState('timer/running', true);
                break;

            case 'pause_timer':
                this.firebaseManager.updateGameState('timer/running', false);
                break;

            case 'stop_timer':
                this.firebaseManager.updateGameState('timer/running', false);
                break;

            case 'reset_timer':
                this.firebaseManager.updateGameState('timer/value', data.value || 15);
                this.firebaseManager.updateGameState('timer/running', false);
                break;

            case 'question_set_update':
                this.firebaseManager.updateGameState('question_set', {
                    current: data.setNumber,
                    subject: data.subject,
                    title: data.title,
                    sub_question: data.subQuestion
                });
                break;

            case 'challenge_update':
                this.firebaseManager.updateGameState('challenge_2x', data.enabled);
                break;

            case 'admin_reset':
                // Reset all game state
                this.firebaseManager.updateGameState('winner', null);
                this.firebaseManager.updateGameState('challenge_2x', false);
                // Reset all team cards
                for (let i = 1; i <= 6; i++) {
                    this.firebaseManager.updateGameState(`teams/${i}/cards`, {
                        angel: false,
                        devil: false,
                        cross: false,
                        angelUsed: false,
                        devilUsed: false
                    });
                }
                break;

            case 'connect_arduino':
                this.firebaseManager.emitToFirebase('arduino_connection', {
                    action: 'connect',
                    port: data.port,
                    baudRate: data.baudrate || 9600,
                    timestamp: Date.now()
                });
                break;

            case 'disconnect_arduino':
                this.firebaseManager.emitToFirebase('arduino_connection', {
                    action: 'disconnect',
                    timestamp: Date.now()
                });
                break;

            case 'get_arduino_status':
                // Arduino status is already being listened to
                break;

            case 'get_server_state':
                this.firebaseManager.getGameState().then(state => {
                    this.emit('server_state_response', state);
                });
                break;

            default:
                // Send generic event
                this.firebaseManager.emitToFirebase('custom_events', {
                    type: event,
                    data: data,
                    timestamp: Date.now()
                });
                break;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                // Firebase will automatically attempt to reconnect
                // We just need to wait for the connection status
            }, 2000 * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    disconnect() {
        this.firebaseManager.cleanup();
        this.listeners = {};
        this.connected = false;
    }

    // Get connection status
    get connected() {
        return this.connected;
    }
}

// Create global socket manager instance
const socket = new FirebaseSocketManager();

// Export for use in other files
window.socket = socket; 