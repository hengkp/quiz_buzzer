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
            this.emit('local:timer_ended');
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
                console.log('🔄 Buzzers cleared - progress character reset to white');
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
                console.log('🔄 Admin reset - progress character reset to white');
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
                console.log('🔄 Card status reset received');
            }
            this.emit('local:card_status_reset', data);
        });
        
        // Challenge mode events
        this.socket.on('challenge_activated', (data) => {
            if (data.teamId && window.gameState) {
                window.gameState.set('currentChallenge', data.teamId);
                console.log(`⚡ Challenge mode activated for Team ${data.teamId}`);
            }
            this.emit('local:challenge_activated', data);
        });
        
        this.socket.on('challenge_reset', () => {
            if (window.gameState) {
                window.gameState.set('currentChallenge', 0);
                console.log('🔄 Challenge mode reset');
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
                
                console.log(`😈 Devil attack: Team ${data.attackingTeam} attacked Team ${data.targetTeam}`);
            }
            this.emit('local:devil_attack', data);
        });
        
        // Angel card events
        this.socket.on('angel_activated', (data) => {
            if (data.teamId && window.gameState) {
                window.gameState.update(`actionCards.${data.teamId}.angel`, true);
                console.log(`😇 Angel card activated for Team ${data.teamId}`);
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
                console.log('🔄 All action cards reset for new question set');
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
                console.log('🔄 Game state synchronized from server');
            }
            this.emit('local:game_state_sync', data);
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
    
    resetTimer() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('reset_timer', { value: 15 });
            console.log('⏹️ Reset timer to 15 seconds sent');
        } else {
            console.warn('⚠️ Socket not connected - cannot reset timer');
        }
    }
    
    setTimer(value) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('set_timer', { value: value });
            console.log(`⏱️ Set timer to ${value} seconds sent`);
        } else {
            console.warn('⚠️ Socket not connected - cannot set timer');
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
}

// Export singleton instance
window.socketManager = new SocketManager();
console.log('✅ Enhanced socket manager ready'); 