// Firebase Configuration for Quiz Buzzer GitHub Pages
// This replaces the Flask Socket.IO server with Firebase Realtime Database

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "quiz-buzzer-xxxxx.firebaseapp.com",
    databaseURL: "https://quiz-buzzer-xxxxx-default-rtdb.firebaseio.com",
    projectId: "quiz-buzzer-xxxxx",
    storageBucket: "quiz-buzzer-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const db = firebase.database();

// Firebase Realtime Database Manager
class FirebaseManager {
    constructor() {
        this.db = db;
        this.listeners = {};
        this.connected = false;
        this.connectionCheckInterval = null;
        
        // Initialize connection monitoring
        this.initConnectionMonitoring();
    }

    initConnectionMonitoring() {
        // Monitor connection status
        const connectedRef = this.db.ref(".info/connected");
        connectedRef.on("value", (snap) => {
            this.connected = snap.val();
            console.log("Firebase connection status:", this.connected ? "Connected" : "Disconnected");
            
            // Emit connection status to all listeners
            this.emit('connection_status', { connected: this.connected });
        });

        // Set up periodic connection check
        this.connectionCheckInterval = setInterval(() => {
            if (!this.connected) {
                console.warn("Firebase connection lost, attempting to reconnect...");
                this.emit('connection_status', { connected: false });
            }
        }, 5000);
    }

    // Emit events to all registered listeners
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

    // Register event listeners (Socket.IO style)
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Remove event listeners
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    // Send data to Firebase (Socket.IO emit style)
    emitToFirebase(path, data) {
        if (!this.connected) {
            console.warn("Firebase not connected, cannot send data");
            return;
        }

        const timestamp = Date.now();
        const messageData = {
            ...data,
            timestamp: timestamp,
            sender: 'client'
        };

        // Push to Firebase with timestamp as key
        this.db.ref(path).push(messageData)
            .then(() => {
                console.log(`Data sent to Firebase: ${path}`, data);
            })
            .catch((error) => {
                console.error(`Error sending data to Firebase: ${path}`, error);
            });
    }

    // Listen to Firebase path (Socket.IO on style)
    listenToFirebase(path, callback) {
        const ref = this.db.ref(path);
        
        ref.on('child_added', (snapshot) => {
            const data = snapshot.val();
            if (data && data.sender !== 'client') { // Only process server messages
                callback(data);
            }
        });

        // Store reference for cleanup
        if (!this.listeners[`firebase_${path}`]) {
            this.listeners[`firebase_${path}`] = [];
        }
        this.listeners[`firebase_${path}`].push({ ref, callback });
    }

    // Clean up Firebase listeners
    cleanup() {
        // Clear connection check interval
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }

        // Remove all Firebase listeners
        Object.keys(this.listeners).forEach(key => {
            if (key.startsWith('firebase_')) {
                this.listeners[key].forEach(({ ref }) => {
                    ref.off();
                });
            }
        });

        // Clear all listeners
        this.listeners = {};
    }

    // Game state management
    updateGameState(path, value) {
        const updates = {};
        updates[`game_state/${path}`] = value;
        
        return this.db.ref().update(updates)
            .then(() => {
                console.log(`Game state updated: ${path} = ${value}`);
            })
            .catch((error) => {
                console.error(`Error updating game state: ${path}`, error);
            });
    }

    // Get current game state
    getGameState() {
        return this.db.ref('game_state').once('value')
            .then((snapshot) => {
                return snapshot.val() || {};
            })
            .catch((error) => {
                console.error("Error getting game state:", error);
                return {};
            });
    }

    // Send buzzer data
    sendBuzzerData(teamId) {
        this.emitToFirebase('buzzer_events', {
            type: 'buzzer_pressed',
            teamId: teamId,
            timestamp: Date.now()
        });
    }

    // Send timer update
    sendTimerUpdate(timerData) {
        this.emitToFirebase('timer_events', {
            type: 'timer_update',
            data: timerData,
            timestamp: Date.now()
        });
    }

    // Send score update
    sendScoreUpdate(teamId, score, adjustment, correct) {
        this.emitToFirebase('score_events', {
            type: 'score_update',
            teamId: teamId,
            score: score,
            adjustment: adjustment,
            correct: correct,
            timestamp: Date.now()
        });
    }

    // Send card update
    sendCardUpdate(teamId, cardType, active, used) {
        this.emitToFirebase('card_events', {
            type: 'card_update',
            teamId: teamId,
            cardType: cardType,
            active: active,
            used: used,
            timestamp: Date.now()
        });
    }

    // Send log message
    sendLog(message, type = 'info') {
        this.emitToFirebase('logs', {
            message: message,
            type: type,
            timestamp: Date.now()
        });
    }
}

// Create global Firebase manager instance
const firebaseManager = new FirebaseManager();

// Export for use in other files
window.firebaseManager = firebaseManager; 