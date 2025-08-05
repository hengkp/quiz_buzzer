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
    }
    
    // Setup core socket event handlers
    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
        });
        
        this.socket.on('connect_error', () => {
            this.reconnectAttempts++;
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            }
        });
        
        // Game state synchronization
        this.socket.on('progress_update', (data) => {
            
            if (data.setNumber && data.questionNumber) {
                const isMainPage = !window.location.pathname.includes('console');
                
                if (isMainPage) {
                    // Main page: Handle character animation
                    const hasCharacterController = !!window.characterController;
                    const shouldAnimate = !!data.animateRun;
                    
                    
                    if (hasCharacterController && shouldAnimate) {
                        window.characterController.moveToQuestion(data.setNumber, data.questionNumber);
                    } else {
                        window.gameState?.moveToQuestion(data.setNumber, data.questionNumber);
                    }
                } else {
                    // Console page: Only update local game state, no animation needed
                    window.gameState?.moveToQuestion(data.setNumber, data.questionNumber);
                }
                
                this.emit('local:progress_update', data);
            }
        });


        
        this.socket.on('timer_update', (data) => {
            window.gameState?.set('timerValue', data.value);
            window.gameState?.set('timerRunning', data.running);
            window.gameState?.updateTimerDisplay();
            this.emit('local:timer_update', data);
        });
        
        this.socket.on('timer_ended', () => {
            // Handle timer reaching zero
            if (window.gameState) {
                window.gameState.set('timerRunning', false);
                window.gameState.set('timerValue', 0);
                window.gameState.triggerEmergencyMeeting();
            }
        });
        
        // Arduino connection status
        this.socket.on('arduino_status', (data) => {
            this.emit('local:arduino_status', data);
            
            // Update global Arduino connection state
            window.arduinoConnected = data.connected;
            
            // Trigger custom event for UI updates
            const event = new CustomEvent('arduinoStatusChanged', { detail: data });
            document.dispatchEvent(event);
        });
        
        this.emit('local:timer_ended');
        
        this.socket.on('score_update', (data) => {
            window.gameState?.update(`teams.${data.teamId}.score`, data.score);
            this.emit('local:score_update', data);
        });
        
        this.socket.on('buzzer_pressed', (data) => {
            // Update game state currentTeam when buzzer is pressed
            if (data.teamId && window.gameState) {
                window.gameState.set('currentTeam', data.teamId);
            }
            
            // Show buzzing modal using buzzing system
            if (window.buzzingSystem) {
                window.buzzingSystem.showBuzzing(data.teamId);
            }
            
            this.emit('local:buzzer_pressed', data);
        });
        
        this.socket.on('clear_buzzers', () => {
            // Reset currentTeam and currentChallenge when buzzers are cleared
            if (window.gameState) {
                window.gameState.set('currentTeam', 0);
                window.gameState.set('currentChallenge', 0);
            }
            
            // Clear buzzing system
            if (window.buzzingSystem) {
                window.buzzingSystem.clearAll();
            }
            
            this.emit('local:clear_buzzers');
        });
        
        this.socket.on('admin_reset', () => {
            // Reset currentTeam and currentChallenge on admin reset
            if (window.gameState) {
                window.gameState.set('currentTeam', 0);
                window.gameState.set('currentChallenge', 0);
            }
            window.gameState?.reset();
            
            // Clear buzzing system
            if (window.buzzingSystem) {
                window.buzzingSystem.clearAll();
            }
            
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
            }
            this.emit('local:card_status_reset', data);
        });
        
        // Challenge mode events
        this.socket.on('challenge_activated', (data) => {
            if (data.teamId && window.gameState) {
                window.gameState.set('currentChallenge', data.teamId);
            }
            this.emit('local:challenge_activated', data);
        });
        
        this.socket.on('challenge_reset', () => {
            if (window.gameState) {
                window.gameState.set('currentChallenge', 0);
            }
            this.emit('local:challenge_reset');
        });
        
        // Devil card attack events
        this.socket.on('devil_attack', (data) => {
            if (data.attackingTeam && data.targetTeam && window.gameState) {
                // Update attacked team state
                window.gameState.set('attackedTeam', data.targetTeam);
                
                // Activate devil card for attacking team
                window.gameState.update(`actionCards.${data.attackingTeam}.devil`, true);
                
            }
            this.emit('local:devil_attack', data);
        });
        
        // Angel card events
        this.socket.on('angel_activated', (data) => {
            if (data.teamId && window.gameState) {
                window.gameState.update(`actionCards.${data.teamId}.angel`, true);
            }
            this.emit('local:angel_activated', data);
        });
        
        // Action card reset (for new question sets)
        this.socket.on('action_cards_reset', (data) => {
            if (window.gameState) {
                // Reset all action cards for all teams
                Object.keys(window.gameState.get('teams')).forEach(teamId => {
                    window.gameState.update(`actionCards.${teamId}.angel`, false);
                    window.gameState.update(`actionCards.${teamId}.devil`, false);
                    window.gameState.update(`actionCards.${teamId}.cross`, false);
                });
            }
            this.emit('local:action_cards_reset', data);
        });
        
        this.socket.on('log_update', (data) => {
            // Forward log updates to local handlers
            this.emit('local:log_update', data);
        });
        
        this.socket.on('buzzer_data', (data) => {
            // Forward buzzer data to local handlers
            this.emit('local:buzzer_data', data);
        });
        
        // Enhanced game state synchronization
        this.socket.on('game_state_sync', (data) => {
            if (data && window.gameState) {
                // Sync entire game state from server
                Object.keys(data).forEach(key => {
                    if (key === 'teams') {
                        Object.keys(data.teams).forEach(teamId => {
                            Object.keys(data.teams[teamId]).forEach(prop => {
                                window.gameState.update(`teams.${teamId}.${prop}`, data.teams[teamId][prop]);
                            });
                        });
                    } else if (key === 'actionCards') {
                        Object.keys(data.actionCards).forEach(teamId => {
                            Object.keys(data.actionCards[teamId]).forEach(cardType => {
                                window.gameState.update(`actionCards.${teamId}.${cardType}`, data.actionCards[teamId][cardType]);
                            });
                        });
                    } else {
                        window.gameState.set(key, data[key]);
                    }
                });
            }
            this.emit('local:game_state_sync', data);
        });

        // Game state update listener
        this.socket.on('game_state_update', (data) => {
            if (window.gameState && data.path && data.value !== undefined) {
                window.gameState.update(data.path, data.value);
            }
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
        }
    }
    
    // Simulate buzzer press for testing
    simulateBuzzer(teamId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('simulate_buzzer', { teamId: teamId });
        } else {
        }
    }
    
    // Reset buzzers
    resetBuzzers() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('reset_buzzers');
        } else {
        }
    }
    
    // Admin reset
    adminReset() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('admin_reset');
        } else {
        }
    }
    
    // Timer controls
    startTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('start_timer');
        } else {
        }
    }
    
    pauseTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('pause_timer');
        } else {
        }
    }
    
    stopTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('stop_timer');
        } else {
        }
    }
    
    resetTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('reset_timer', { value: 15 });
        } else {
        }
    }
    
    setTimer(value) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('set_timer', { value: value });
        } else {
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
    
    // New methods for enhanced functionality
    
    // Activate challenge mode
    activateChallenge(teamId) {
        this.send('challenge_activated', { teamId });
    }
    
    // Reset challenge mode
    resetChallenge() {
        this.send('challenge_reset');
    }
    
    // Devil card attack
    devilAttack(attackingTeam, targetTeam) {
        this.send('devil_attack', { attackingTeam, targetTeam });
    }
    
    // Activate angel card
    activateAngel(teamId) {
        this.send('angel_activated', { teamId });
    }
    
    // Reset action cards (for new question set)
    resetActionCards() {
        this.send('action_cards_reset');
    }
    
    // Sync entire game state to server
    syncGameState() {
        if (window.gameState) {
            const state = window.gameState.get();
            this.send('game_state_sync', state);
        }
    }
    
    // Request game state from server
    requestGameState() {
        this.send('request_game_state');
    }
    
    // Send score change with animation trigger
    sendScoreChange(teamId, scoreChange, reason = 'manual') {
        const data = {
            teamId,
            scoreChange,
            reason,
            timestamp: Date.now()
        };
        this.send('score_change', data);
    }
    
    // Send action card usage
    sendActionCardUsage(teamId, cardType, targetTeam = null) {
        const data = {
            teamId,
            cardType,
            targetTeam,
            timestamp: Date.now()
        };
        this.send('action_card_usage', data);
    }
    
    // Arduino connection methods
    connectArduino(port = null, baudrate = 9600) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('connect_arduino', { port, baudrate });
        } else {
        }
    }
    
    disconnectArduino() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('disconnect_arduino');
        } else {
        }
    }
    
    getArduinoStatus() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('get_arduino_status');
        } else {
        }
    }
}

// Export singleton instance
window.socketManager = new SocketManager();
