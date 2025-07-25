/**
 * Socket.IO Connection Manager
 * Handles all real-time communication between main page and console
 */

class SocketManager {
    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    // Initialize socket connection
    init() {
        if (typeof io === 'undefined') {
            console.error('❌ Socket.IO not loaded');
            return;
        }
        
        this.socket = io();
        this.setupEventHandlers();
        window.socket = this.socket; // For backward compatibility
        console.log('🔗 Socket manager initialized');
    }
    
    // Setup core socket event handlers
    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('🔗 Connected');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('❌ Disconnected');
        });
        
        this.socket.on('connect_error', () => {
            this.reconnectAttempts++;
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            }
        });
        
        // Game state synchronization
        this.socket.on('progress_update', (data) => {
            if (data.setNumber && data.questionNumber) {
                window.gameState?.moveToQuestion(data.setNumber, data.questionNumber);
                this.emit('local:progress_update', data);
            }
        });
        
        this.socket.on('timer_update', (data) => {
            window.gameState?.set('timerValue', data.value);
            window.gameState?.set('timerRunning', data.running);
            this.emit('local:timer_update', data);
        });
        
        this.socket.on('score_update', (data) => {
            window.gameState?.update(`teams.${data.teamId}.score`, data.score);
            this.emit('local:score_update', data);
        });
        
        this.socket.on('buzzer_pressed', (data) => {
            // Update game state currentTeam when buzzer is pressed
            if (data.teamId && window.gameState) {
                window.gameState.set('currentTeam', data.teamId);
                console.log(`🔔 Team ${data.teamId} buzzed - progress character color updated`);
            }
            this.emit('local:buzzer_pressed', data);
        });
        
        this.socket.on('clear_buzzers', () => {
            // Reset currentTeam to 0 when buzzers are cleared
            if (window.gameState) {
                window.gameState.set('currentTeam', 0);
                console.log('🔄 Buzzers cleared - progress character reset to white');
            }
            this.emit('local:clear_buzzers');
        });
        
        this.socket.on('admin_reset', () => {
            // Reset currentTeam to 0 on admin reset
            if (window.gameState) {
                window.gameState.set('currentTeam', 0);
                console.log('🔄 Admin reset - progress character reset to white');
            }
            window.gameState?.reset();
            this.emit('local:admin_reset');
        });
        
        this.socket.on('card_update', (data) => {
            if (data.teamId && data.cardType !== undefined && data.status !== undefined) {
                window.gameState?.update(`actionCards.${data.teamId}.${data.cardType}`, data.status);
                this.emit('local:card_update', data);
            }
        });
        
        this.socket.on('card_status_reset', (data) => {
            if (data.teams && window.gameState) {
                // Reset all team action cards
                Object.keys(data.teams).forEach(teamId => {
                    const team = data.teams[teamId];
                    if (team.cards) {
                        Object.keys(team.cards).forEach(cardType => {
                            window.gameState.update(`actionCards.${teamId}.${cardType}`, team.cards[cardType]);
                        });
                    }
                });
                console.log('🔄 Card status reset received');
            }
            this.emit('local:card_status_reset', data);
        });
        
        this.socket.on('log_update', (data) => {
            // Forward log updates to local handlers
            this.emit('local:log_update', data);
        });
        
        this.socket.on('buzzer_data', (data) => {
            // Forward buzzer data to local handlers
            this.emit('local:buzzer_data', data);
        });
    }
    
    // Subscribe to socket events
    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, new Set());
        }
        this.eventHandlers.get(eventName).add(handler);
        
        return () => this.eventHandlers.get(eventName).delete(handler);
    }
    
    // Emit local events
    emit(eventName, data) {
        if (this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ Event handler error (${eventName}):`, error);
                }
            });
        }
    }
    
    // Send events to server
    send(eventName, data) {
        if (this.isConnected && this.socket) {
            this.socket.emit(eventName, data);
        } else {
            console.warn('⚠️ Socket not connected, cannot send:', eventName);
        }
    }
    
    // Simulate buzzer press for testing
    simulateBuzzer(teamId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('simulate_buzzer', { teamId: teamId });
            console.log(`🔔 Simulated buzzer press for Team ${teamId}`);
        } else {
            console.warn('⚠️ Socket not connected - cannot simulate buzzer');
        }
    }
    
    // Reset buzzers
    resetBuzzers() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('reset_buzzers');
            console.log('🔄 Reset buzzers sent');
        } else {
            console.warn('⚠️ Socket not connected - cannot reset buzzers');
        }
    }
    
    // Admin reset
    adminReset() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('admin_reset');
            console.log('🔄 Admin reset sent');
        } else {
            console.warn('⚠️ Socket not connected - cannot admin reset');
        }
    }
    
    // Timer controls
    startTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('start_timer');
            console.log('⏱️ Start timer sent');
        } else {
            console.warn('⚠️ Socket not connected - cannot start timer');
        }
    }
    
    pauseTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('pause_timer');
            console.log('⏸️ Pause timer sent');
        } else {
            console.warn('⚠️ Socket not connected - cannot pause timer');
        }
    }
    
    stopTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('stop_timer');
            console.log('⏹️ Stop timer sent');
        } else {
            console.warn('⚠️ Socket not connected - cannot stop timer');
        }
    }
    
    updateProgress(setNumber, questionNumber) {
        this.send('progress_update', { setNumber, questionNumber });
    }
    
    updateScore(teamId, score) {
        this.send('score_update', { teamId, score });
    }
    
    updateCard(teamId, cardType, status) {
        this.send('card_update', { teamId, cardType, status });
    }
}

// Export singleton instance
window.socketManager = new SocketManager();
console.log('✅ Socket manager ready'); 