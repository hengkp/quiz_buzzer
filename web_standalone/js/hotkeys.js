/**
 * Unified Hotkeys Management
 * Handles keyboard input and hotkey bindings for both main and console pages
 */

class HotkeysManager {
    constructor() {
        this.bindings = new Map();
        this.isEnabled = true;
        this.isListening = false;
        this.pageType = this.detectPageType();
        this.initialized = false;
    }
    
    // Detect which page we're on
    detectPageType() {
        if (window.location.pathname.includes('console.html') || document.title.includes('Console')) {
            return 'console';
        }
        return 'main';
    }
    
    // Initialize hotkeys system
    init() {
        if (this.initialized) {
            return true;
        }
        
        this.setupDefaultBindings();
        this.startListening();
        this.initialized = true;
        return true;
    }
    
    // Setup default key bindings
    setupDefaultBindings() {
        // Team buzzer hotkeys (1-6) - simulate buzz-in with modal, sound and color change
        for (let i = 1; i <= 6; i++) {
            this.bind(i.toString(), (event) => {
                event.preventDefault();
                this.handleTeamBuzzer(i);
            }, `Team ${i} buzz-in`);
        }
        
        // Navigation hotkeys - different behavior per page
        this.bind('ArrowLeft', (event) => {
            event.preventDefault();
            this.handleNavigation('previous');
        }, 'Previous question');
        
        this.bind('ArrowRight', (event) => {
            event.preventDefault();
            this.handleNavigation('next');
        }, 'Next question');
        
        // Scoring hotkeys - when there's a buzzer team
        this.bind('ArrowUp', (event) => {
            event.preventDefault();
            this.handleScoring(true); // Plus score
        }, 'Add score to buzzing team');
        
        this.bind('ArrowDown', (event) => {
            event.preventDefault();
            this.handleScoring(false); // Minus score
        }, 'Subtract score from buzzing team');
        
        // Control hotkeys
        this.bind('r', (event) => {
            event.preventDefault();
            this.handleResetBuzzers();
        }, 'Reset buzzers');
        
        this.bind('q', (event) => {
            event.preventDefault();
            this.handleGameReset();
        }, 'Reset game state');
        
        this.bind('/', (event) => {
            event.preventDefault();
            this.handleOpenConsole();
        }, 'Open console window');
        
        // Help hotkey - always available
        this.bind('h', (event) => {
            event.preventDefault();
            this.toggleHelpDialog();
        }, 'Toggle help dialog');
        
        // Action card hotkeys - only when there's a buzzer team
        this.bind('z', (event) => {
            event.preventDefault();
            this.handleAngelCard();
        }, 'Activate/Deactivate angel card');
        
        this.bind('x', (event) => {
            event.preventDefault();
            this.handleDevilCard();
        }, 'Activate/Deactivate devil card with attack selection');
        
        this.bind('c', (event) => {
            event.preventDefault();
            this.handleCancelDevilAttack();
        }, 'Activate/Deactivate Challenge Mode');
        
        this.bind('Enter', (event) => {
            event.preventDefault();
            this.handleConfirmDevilAttack();
        }, 'Confirm Devil Attack');
        
        // Timer hotkeys - different behavior per page
        this.bind('i', (event) => {
            event.preventDefault();
            this.handleTimerToggle();
        }, 'Start timer');
        
        this.bind('o', (event) => {
            event.preventDefault();
            this.handleStopTimer();
        }, 'Stop timer');

        this.bind('p', (event) => {
            event.preventDefault();
            this.handleResetTimer();
        }, 'Reset timer to 15 seconds');
        
        // Timer adjustment hotkeys
        this.bind('[', (event) => {
            event.preventDefault();
            this.handleDecreaseTimer();
        }, 'Decrease timer by 1 second');
        
        this.bind(']', (event) => {
            event.preventDefault();
            this.handleIncreaseTimer();
        }, 'Increase timer by 1 second');
        
        // Fullscreen hotkey - works for both pages
        this.bind('f', (event) => {
            event.preventDefault();
            this.handleFullscreen();
        }, 'Toggle fullscreen');
        
        // Volume control hotkeys - works for both pages
        this.bind('-', (event) => {
            event.preventDefault();
            this.handleVolumeDecrease();
        }, 'Decrease volume');
        
        this.bind('=', (event) => {
            event.preventDefault();
            this.handleVolumeIncrease();
        }, 'Increase volume');
        
        this.bind('m', (event) => {
            event.preventDefault();
            this.handleMusicToggle();
        }, 'Toggle background music');
        
        this.bind('a', (event) => {
            event.preventDefault();
            this.handleArduinoToggle();
        }, 'Toggle Arduino connection');
        
        // Modal toggle hotkeys - main page only
        if (this.pageType === 'main') {
            this.bind('t', (event) => {
                event.preventDefault();
                this.handleToggleTeamsModal();
            }, 'Toggle teams modal');
            
            this.bind('s', (event) => {
                event.preventDefault();
                this.handleToggleQuestionsModal();
            }, 'Toggle question sets modal');
            
            this.bind('u', (event) => {
                event.preventDefault();
                this.handleToggleUploadModal();
            }, 'Toggle upload/download modal');
            
            this.bind('l', (event) => {
                event.preventDefault();
                this.handleToggleLogsModal();
            }, 'Toggle logs modal');
        }
        
        // Console-specific hotkeys
        if (this.pageType === 'console') {
            this.bind('g', (event) => {
                event.preventDefault();
                this.switchTab('game');
            }, 'Switch to game tab');
            
            this.bind('l', (event) => {
                event.preventDefault();
                this.switchTab('log');
            }, 'Switch to log tab');
        }
        
        // Test emergency meeting (temporary for debugging)
        this.bind('e', (event) => {
            event.preventDefault();
            this.testEmergencyMeeting();
        }, 'Test emergency meeting');
        
        // Development hotkeys (only in debug mode)
        if (this.isDebugMode()) {
            this.bind('Escape', () => {
                this.toggleHelpDialog();
            }, 'Toggle help');
        }
    }
    
    // Handle team buzzer simulation
    handleTeamBuzzer(teamId) {
        if (this.pageType === 'console') {
            // Console page behavior - trigger local UI update if function exists
            if (typeof window.simulateTeamBuzz === 'function') {
                window.simulateTeamBuzz(teamId);
            }
        } else {
            // Main page behavior - simulate buzz-in with all effects
            this.simulateTeamBuzzIn(teamId);
        }
    }
    
    // Simulate team buzz-in with modal, sound, and color change
    async simulateTeamBuzzIn(teamId) {
        if (!teamId || teamId < 1 || teamId > 6) {
            return;
        }
        
        
        // Update game state FIRST (this will trigger character color change via subscription)
        if (window.gameState) {
            window.gameState.set('currentTeam', teamId);
            
            // Verify the update
            const currentTeam = window.gameState.get('currentTeam');
        } else {
        }
        
        // Show buzzing modal using buzzing system
        if (window.buzzingSystem) {
            window.buzzingSystem.showBuzzing(teamId);
        } else {
        }
        
        // Send simulation to Arduino via server
        if (window.arduinoController && window.arduinoController.connectionMode === 'socketio') {
            if (window.arduinoController.socketManager) {
                window.arduinoController.socketManager.emit('simulate_buzzer', { teamId: teamId });
            }
        }
    }
    
    // Handle scoring with animations
    handleScoring(isPositive) {
        
        const state = window.gameState?.get();
        if (!state) {
            return;
        }
        
        // Require a buzzing team for both positive and negative scoring
        if (!state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            return;
        }
        
        const teamId = state.currentTeam;
        const team = state.teams[teamId];
        
        if (!team) {
            return;
        }
        
        const currentQuestion = state.currentQuestion || 1;
        const isChallenge = state.currentChallenge === teamId;
        const hasAngel = state.angelTeam === teamId; // Check if this team has angel protection active
        const isVictimTeam = state.victimTeam === teamId;
        const attackTeam = state.attackTeam;
        
        
        // Show answer animation first (correct/incorrect)
        this.showAnswerAnimation(isPositive);
        
        // Handle positive scoring (arrow up)
        if (isPositive) {
            // Check if this is a victim team answering correctly
            if (isVictimTeam && attackTeam) {
                // Reset attack tracking parameters immediately (keep currentTeam)
                if (window.gameState) {
                    window.gameState.set('attackTeam', 0);
                    window.gameState.set('victimTeam', 0);
                }
            }
            
            let scoreChange = 0;
            
            const effectiveChallenge = isChallenge || (hasAngel && currentQuestion > 1);
            if (effectiveChallenge) {
                scoreChange = 2; // Challenge mode: +2 for correct
            } else if (currentQuestion === 1) {
                scoreChange = 1; // Q1: +1 for correct
            } else {
                scoreChange = 1; // Q2-Q4: +1 for correct
            }
            
            // Delay score update until after answer animation (3 seconds)
            setTimeout(() => {
                // Update score
                const newScore = Math.max(0, team.score + scoreChange);
                if (window.gameState) {
                    window.gameState.update(`teams.${teamId}.score`, newScore);
                }
                
                // Show coin animation after score update
                setTimeout(() => {
                    this.showScoreAnimation(scoreChange);
                }, 500); // Small delay after score update
                
            }, 2500); // Wait for answer animation to complete
            
            // Handle smart navigation based on question and chances
            setTimeout(() => {
                // If this was a victim correct answer, remove cross indicator on main character
                if (isVictimTeam) {
                    this.removeCrossProtection(teamId);
                }
                this.handleSmartNavigationAfterCorrect(currentQuestion, state);
            }, 3000); // Wait for coin animation to complete
            
            return;
        }
        
        // Handle negative scoring (arrow down)
        if (!isPositive) {
            // Debug logging for devil attack
            console.log(`🔍 Devil Attack Debug: isVictimTeam=${isVictimTeam}, attackTeam=${attackTeam}, teamId=${teamId}`);
            console.log(`🔍 State values: victimTeam=${state.victimTeam}, attackTeam=${state.attackTeam}`);
            
            // Check if this is a victim team answering incorrectly
            if (isVictimTeam && attackTeam) {
                console.log(`🎯 Devil attack triggered! Victim: ${teamId}, Attacker: ${attackTeam}`);
                this.handleDevilAttackVictim(teamId, attackTeam);
                return;
            }
            
            // Q1 Logic
            if (currentQuestion === 1) {
                // Q1: Challenge cannot apply, only angel protection
                if (hasAngel) {
                    // Angel protection: no penalty, animate shield
                    this.handleAngelProtection(teamId);
                } else {
                    // Normal Q1 incorrect: -1 penalty
                    this.handleNormalQ1Incorrect(teamId);
                }
            } else {
                // Q2-Q4 Logic
                if (hasAngel && isChallenge) {
                    // Both angel and challenge: no penalty, animate shield
                    this.handleAngelProtection(teamId);
                } else if (hasAngel && !isChallenge) {
                    // Angel only: no penalty, animate shield
                    this.handleAngelProtection(teamId);
                } else if (!hasAngel && isChallenge) {
                    // Challenge only: has penalty, animate coin_minus
                    this.handleChallengeOnlyIncorrect(teamId);
                } else {
                    // No angel, no challenge: no penalty, no animation
                    this.handleNoProtectionIncorrect(teamId);
                }
            }
        }

        // DO NOT reset attackTeam for attacking team - it should remain permanently used
        // The devil card should stay used until game reset
    }
    
    // Helper functions for different scoring scenarios
    
    // Handle angel protection (no penalty, animate shield)
    handleAngelProtection(teamId) {
        const state = window.gameState?.get();
        if (!state) return;
        
        // Mark angel card as permanently used
        if (window.gameState) {
            window.gameState.update(`actionCards.${teamId}.angel`, false);
            window.gameState.set('angelTeam', 0);
        }
        
        // Update main character icon
        const angelIcon = document.getElementById('mainCharacterAngel');
        if (angelIcon) {
            angelIcon.classList.remove('active');
        }
        
        // Show shield animation after answer animation
        setTimeout(() => {
            this.showProtectionAnimation('Protected');
        }, 2000);
        
        // Sync with server (not needed in standalone)
        
        // Trigger auto-navigation
        this.handleAutoNavigationAfterIncorrect();
    }
    
    // Handle devil attack victim (attacker gets +2, victim gets -1 unless protected by angel)
    handleDevilAttackVictim(victimTeamId, attackTeamId) {
        console.log(`🚀 handleDevilAttackVictim called with victimTeamId=${victimTeamId}, attackTeamId=${attackTeamId}`);
        const state = window.gameState?.get();
        if (!state) {
            console.log(`❌ No game state available`);
            return;
        }
        
        // Check if victim team has angel protection
        const hasAngel = state.angelTeam === victimTeamId;
        
        // If victim has angel protection, mark it as used immediately
        if (hasAngel && window.gameState) {
            window.gameState.update(`actionCards.${victimTeamId}.angel`, false);
            window.gameState.set('angelTeam', 0);
            
            // Update main character icon
            const angelIcon = document.getElementById('mainCharacterAngel');
            if (angelIcon) {
                angelIcon.classList.remove('active');
            }
        }
        
        // Ensure cross protection is active for victim team
        this.activateCrossProtection(victimTeamId);
        
        // Gray out both victim and attack team for Q1 chances
        const currentQuestion = state.currentQuestion || 1;
        const currentSet = state.currentSet || 1;
        
        if (currentQuestion === 1) {
            console.log(`🎯 Q1 detected - graying out teams`);
            // Gray out victim team
            this.grayOutTeam(victimTeamId);
            this.trackQ1Failure(victimTeamId, currentSet);
            console.log(`🎯 Victim team ${victimTeamId} grayed out`);
            
            // Gray out attack team
            this.grayOutTeam(attackTeamId);
            this.trackQ1Failure(attackTeamId, currentSet);
            console.log(`🎯 Attack team ${attackTeamId} grayed out`);
            
            // Update team displays immediately after graying out
            if (window.gameState) {
                window.gameState.updateTeamDisplays();
                console.log(`✅ Team displays updated after graying out`);
            }
        }
        
        // Delay score updates until after answer animation (3 seconds)
        setTimeout(() => {
            console.log(`⏰ Score update timeout triggered`);
            if (attackTeamId) {
                // Give +2 points to the attacking team (always happens regardless of angel protection)
                const attackerNewScore = (state.teams[attackTeamId].score || 0) + 2;
                console.log(`💰 Updating attacker team ${attackTeamId} score from ${state.teams[attackTeamId].score || 0} to ${attackerNewScore}`);
                if (window.gameState) {
                    window.gameState.update(`teams.${attackTeamId}.score`, attackerNewScore);
                    // Update team displays immediately after score change
                    window.gameState.updateTeamDisplays();
                    console.log(`✅ Attacker score updated and team displays refreshed`);
                }
            }
            
            // Apply -1 penalty to victim team only if not protected by angel
            if (!hasAngel) {
                const victimNewScore = Math.max(0, (state.teams[victimTeamId].score || 0) - 1);
                if (window.gameState) {
                    window.gameState.update(`teams.${victimTeamId}.score`, victimNewScore);
                    // Update team displays immediately after score change
                    window.gameState.updateTeamDisplays();
                }
                
                // Show coin_minus animation after score update
                setTimeout(() => {
                    this.showScoreAnimation(-1);
                }, 500); // Small delay after score update
            } else {
                // If victim has angel protection, show protection animation instead
                setTimeout(() => {
                    this.showProtectionAnimation('Protected');
                }, 500); // Small delay after score update
            }
            
        }, 2500); // Wait for answer animation to complete
        
        // Reset attack tracking parameters
        if (window.gameState) {
            window.gameState.set('attackTeam', 0);
            window.gameState.set('victimTeam', 0);
        }
        
        // Trigger auto-navigation after coin animation (additional 2.5 seconds)
        setTimeout(() => {
            // Remove cross icon on main character after victim has answered
            this.removeCrossProtection(victimTeamId);
            if (window.gameState) {
                window.gameState.updateTeamDisplays();
            }
            this.handleAutoNavigationAfterIncorrect();
        }, 2500); // 0.5s (score delay) + 2s (coin animation)
    }
    
    // Handle normal Q1 incorrect (-1 penalty)
    handleNormalQ1Incorrect(teamId) {
        const state = window.gameState?.get();
        if (!state) return;
        
        // Gray out team for Q1 chances
        const currentQuestion = state.currentQuestion || 1;
        const currentSet = state.currentSet || 1;
        
        if (currentQuestion === 1) {
            this.grayOutTeam(teamId);
            this.trackQ1Failure(teamId, currentSet);
        }
        
        // Permanently disable angel card if it was active
        if (state.angelTeam === teamId) {
            if (window.gameState) {
                window.gameState.update(`actionCards.${teamId}.angel`, false);
                window.gameState.set('angelTeam', 0);
                
                // Update main character icon
                const angelIcon = document.getElementById('mainCharacterAngel');
                if (angelIcon) {
                    angelIcon.classList.remove('active');
                }
            }
        }
        
        // Reset buzzer
        if (window.gameState) {
            window.gameState.set('currentTeam', 0);
            window.gameState.set('angelTeam', 0);
            window.gameState.set('attackTeam', 0);
            window.gameState.set('victimTeam', 0);
            window.gameState.set('currentChallenge', 0);
        }
        
        // Delay score update until after answer animation (3 seconds)
        setTimeout(() => {
            // Apply -1 penalty
            const newScore = Math.max(0, state.teams[teamId].score - 1);
            if (window.gameState) {
                window.gameState.update(`teams.${teamId}.score`, newScore);
            }
            
            // Show coin_minus animation after score update
            setTimeout(() => {
                this.showScoreAnimation(-1);
            }, 500); // Small delay after score update
            
        }, 2500); // Wait for answer animation to complete
        
        // Trigger auto-navigation after coin animation (additional 2.5 seconds)
        setTimeout(() => {
            // Ensure cross protection remains visible after victim answers
            if (window.gameState) {
                window.gameState.updateTeamDisplays();
                
                // Debug: Check cross protection status for all teams
                const state = window.gameState.get();
                for (let teamId = 1; teamId <= 6; teamId++) {
                    const crossStatus = state.actionCards[teamId].cross;
                    if (crossStatus) {
                    }
                }
            }
            this.handleAutoNavigationAfterIncorrect();
        }, 2500); // 0.5s (score delay) + 2s (coin animation)
    }
    
    // Handle challenge only incorrect (has penalty, animate coin_minus)
    handleChallengeOnlyIncorrect(teamId) {
        const state = window.gameState?.get();
        if (!state) return;
        
        // Gray out team for Q1 chances
        const currentQuestion = state.currentQuestion || 1;
        const currentSet = state.currentSet || 1;
        
        if (currentQuestion === 1) {
            this.grayOutTeam(teamId);
            this.trackQ1Failure(teamId, currentSet);
        }
        
        // Permanently disable angel card if it was active
        if (state.angelTeam === teamId) {
            if (window.gameState) {
                window.gameState.update(`actionCards.${teamId}.angel`, false);
                window.gameState.set('angelTeam', 0);
                
                // Update main character icon
                const angelIcon = document.getElementById('mainCharacterAngel');
                if (angelIcon) {
                    angelIcon.classList.remove('active');
                }
            }
        }
        
        // Reset buzzer
        if (window.gameState) {
            window.gameState.set('currentTeam', 0);
            window.gameState.set('angelTeam', 0);
            window.gameState.set('attackTeam', 0);
            window.gameState.set('victimTeam', 0);
            window.gameState.set('currentChallenge', 0);
        }
        
        // Delay score update until after answer animation (3 seconds)
        setTimeout(() => {
            // Apply -1 penalty
            const newScore = Math.max(0, state.teams[teamId].score - 1);
            if (window.gameState) {
                window.gameState.update(`teams.${teamId}.score`, newScore);
            }
            
            // Show coin_minus animation after score update
            setTimeout(() => {
                this.showScoreAnimation(-1);
            }, 500); // Small delay after score update
            
        }, 2500); // Wait for answer animation to complete
        
        // Trigger auto-navigation after coin animation (additional 2.5 seconds)
        setTimeout(() => {
            // Ensure cross protection remains visible after victim answers
            if (window.gameState) {
                window.gameState.updateTeamDisplays();
                
                // Debug: Check cross protection status for all teams
                const state = window.gameState.get();
                for (let teamId = 1; teamId <= 6; teamId++) {
                    const crossStatus = state.actionCards[teamId].cross;
                    if (crossStatus) {
                    }
                }
            }
            this.handleAutoNavigationAfterIncorrect();
        }, 2500); // 0.5s (score delay) + 2s (coin animation)
    }
    
    // Handle no protection incorrect (penalty for Q1, no penalty for Q2-Q4)
    handleNoProtectionIncorrect(teamId) {
        const state = window.gameState?.get();
        if (!state) return;
        
        const currentQuestion = state.currentQuestion || 1;
        const currentSet = state.currentSet || 1;
        
        // Gray out team for Q1 chances
        if (currentQuestion === 1) {
            this.grayOutTeam(teamId);
            this.trackQ1Failure(teamId, currentSet);
        }
        
        // Permanently disable angel card if it was active
        if (state.angelTeam === teamId) {
            if (window.gameState) {
                window.gameState.update(`actionCards.${teamId}.angel`, false);
                window.gameState.set('angelTeam', 0);
                
                // Update main character icon
                const angelIcon = document.getElementById('mainCharacterAngel');
                if (angelIcon) {
                    angelIcon.classList.remove('active');
                }
            }
        }
        
        // Reset buzzer
        if (window.gameState) {
            window.gameState.set('currentTeam', 0);
            window.gameState.set('angelTeam', 0);
            window.gameState.set('attackTeam', 0);
            window.gameState.set('victimTeam', 0);
            window.gameState.set('currentChallenge', 0);
        }
        
        // Apply penalty only for Q1
        if (currentQuestion === 1) {
            // Delay score update until after answer animation (3 seconds)
            setTimeout(() => {
                // Apply -1 penalty for Q1
                const newScore = Math.max(0, state.teams[teamId].score - 1);
                if (window.gameState) {
                    window.gameState.update(`teams.${teamId}.score`, newScore);
                }
                
                // Show coin_minus animation after score update
                setTimeout(() => {
                    this.showScoreAnimation(-1);
                }, 500); // Small delay after score update
                
            }, 2500); // Wait for answer animation to complete
            
            // Trigger auto-navigation after coin animation (additional 2.5 seconds)
            setTimeout(() => {
                // Ensure cross protection remains visible after victim answers
                if (window.gameState) {
                    window.gameState.updateTeamDisplays();
                }
                this.handleAutoNavigationAfterIncorrect();
            }, 2500); // 0.5s (score delay) + 2s (coin animation)
        } else {
            // Q2-Q4: No penalty, no animation
            // Ensure cross protection remains visible after victim answers
            if (window.gameState) {
                window.gameState.updateTeamDisplays();
            }
            // Just trigger auto-navigation immediately
            this.handleAutoNavigationAfterIncorrect();
        }
    }
    
    // Handle auto-navigation after incorrect answer (arrow down)
    handleAutoNavigationAfterIncorrect() {
        const state = window.gameState?.get();
        if (!state) return;
        
        const currentSet = state.currentSet || 1;
        const currentQuestion = state.currentQuestion || 1;
        const currentTeam = state.currentTeam; // Store currentTeam BEFORE resetting buzzers
        
        // Reset buzzers first
        this.handleResetBuzzers();
        
        // Determine next position based on current question
        if (currentQuestion === 1) {
            // Special case for Q1: Allow 3 attempts before moving to next set
            const attemptsKey = `q1Attempts_${currentSet}`;
            const attempts = state[attemptsKey] || 0;
            
            // Gray out the current team that failed (using stored value)
            if (currentTeam && currentTeam >= 1 && currentTeam <= 6) {
                this.grayOutTeam(currentTeam);
                this.trackQ1Failure(currentTeam, currentSet);
            }
            
            if (attempts < 2) { // Allow 2 more attempts (total 3)
                // Stay on same question, increment attempts
                if (window.gameState) {
                    window.gameState.set(attemptsKey, attempts + 1);
                }
                
                // Update chance display
                this.updateChanceDisplay(currentSet, attempts + 1);
                
            } else {
                // Move to next set Q1
                const nextSet = Math.min(currentSet + 1, state.config.totalSets);
                
                // Ensure character controller is initialized before moving
                if (window.characterController && !window.characterController.initialized) {
                    window.characterController.init();
                }
                
                // Force update game state to current position before moving
                if (window.gameState) {
                    window.gameState.set('currentSet', currentSet);
                    window.gameState.set('currentQuestion', 1);
                }
                
                // Small delay to ensure buzzer reset is complete before animation
                setTimeout(() => {
                    if (window.characterController) {
                        if (window.addLog) {
                            addLog(`Moving from Q1 (Set ${currentSet}) to Q1 (Set ${nextSet}) after Q1 incorrect`, 'info');
                        }
                        const success = window.characterController.moveToQuestion(nextSet, 1);
                        if (!success && window.addLog) {
                            addLog('Character animation failed for Q1→Q1 transition', 'warning');
                        }
                    }
                }, 100); // Small delay to ensure state is stable
                
                if (window.gameState) {
                    window.gameState.set(attemptsKey, 0); // Reset attempts for next set
                }
                
                // Clear failed teams tracking and reset graying for next set
                this.clearQ1FailedTeams(currentSet);
                this.resetTeamGraying();
                
                // Hide chance display for next set (will show when needed)
                this.hideChanceDisplay();
                
            }
        } else {
            // For Q2-Q4: Move to next set Q1 immediately
            const nextSet = Math.min(currentSet + 1, state.config.totalSets);
            
            // Ensure character controller is initialized before moving
            if (window.characterController && !window.characterController.initialized) {
                window.characterController.init();
            }
            
            // Force update game state to current position before moving
            if (window.gameState) {
                window.gameState.set('currentSet', currentSet);
                window.gameState.set('currentQuestion', currentQuestion);
            }
            
            // Small delay to ensure buzzer reset is complete before animation
            setTimeout(() => {
                if (window.characterController) {
                    if (window.addLog) {
                        addLog(`Moving from Q${currentQuestion} (Set ${currentSet}) to Q1 (Set ${nextSet}) after incorrect`, 'info');
                    }
                    const success = window.characterController.moveToQuestion(nextSet, 1);
                    if (!success && window.addLog) {
                        addLog(`Character animation failed for Q${currentQuestion}→Q1 transition`, 'warning');
                    }
                }
            }, 100); // Small delay to ensure state is stable
            
            // Clear failed teams tracking and reset graying for next set
            this.clearQ1FailedTeams(currentSet);
            this.resetTeamGraying();
            
            // Hide chance display for non-Q1 questions
            this.hideChanceDisplay();

            // Explicitly reset challenge state (in case not handled by handleResetBuzzers)
            if (window.gameState) {
                window.gameState.set('currentChallenge', 0);
            }
            const challengeIcon = document.getElementById('mainCharacterChallenge');
            if (challengeIcon) {
                challengeIcon.classList.remove('active');
            }
            
        }
    }
    
    // Handle smart navigation after correct answer
    handleSmartNavigationAfterCorrect(currentQuestion, state) {
        const currentSet = state.currentSet || 1;
        
        if (currentQuestion === 1) {
            // Q1 correct: Move to Q2 on same set (no buzzer reset)
            if (window.characterController) {
                if (!window.characterController.initialized) {
                    window.characterController.init();
                }
                window.characterController.moveToQuestion(currentSet, 2);
            }
            
        } else if (currentQuestion === 2) {
            // Q2 correct: Move to Q3 on same set
            if (window.characterController) {
                if (!window.characterController.initialized) {
                    window.characterController.init();
                }
                window.characterController.moveToQuestion(currentSet, 3);
            }
            
        } else if (currentQuestion === 3) {
            // Q3 correct: Move to Q4 on same set
            if (window.characterController) {
                if (!window.characterController.initialized) {
                    window.characterController.init();
                }
                window.characterController.moveToQuestion(currentSet, 4);
            }
            
        } else if (currentQuestion === 4) {
            // Q4 correct: Reset buzzer and move to Q1 next set
            const nextSet = Math.min(currentSet + 1, state.config.totalSets);
            
            // Reset buzzer state first
            this.handleResetBuzzers();
            
            // Ensure character controller is initialized before moving
            if (window.characterController && !window.characterController.initialized) {
                window.characterController.init();
            }
            
            // Force update game state to current position before moving
            if (window.gameState) {
                window.gameState.set('currentSet', currentSet);
                window.gameState.set('currentQuestion', 4);
            }
            
            // Small delay to ensure buzzer reset is complete before animation
            setTimeout(() => {
                // Then move to next set Q1 with animation
                if (window.characterController) {
                    if (window.addLog) {
                        addLog(`Moving from Q4 (Set ${currentSet}) to Q1 (Set ${nextSet})`, 'info');
                    }
                    const success = window.characterController.moveToQuestion(nextSet, 1);
                    if (!success && window.addLog) {
                        addLog('Character animation failed for Q4→Q1 transition', 'warning');
                    }
                }
            }, 100); // Small delay to ensure state is stable
            
            // Clear failed teams tracking and reset graying for next set
            this.clearQ1FailedTeams(currentSet);
            this.resetTeamGraying();
            
            // Don't hide chance display - Q1 always shows it
        }
    }
    
    // Update chance display for Q1 attempts
    updateChanceDisplay(setNumber, attemptNumber) {
        const chanceElement = document.getElementById('chanceQuestion');
        if (chanceElement) {
            const remainingChances = 3 - attemptNumber;
            if (remainingChances > 0) {
                chanceElement.textContent = remainingChances === 1 ? '(last chance)' : `(${remainingChances} chances left)`;
                chanceElement.style.display = 'block';
            } else {
                chanceElement.style.display = 'none';
            }
        }
    }
    
    // Hide chance display
    hideChanceDisplay() {
        const chanceElement = document.getElementById('chanceQuestion');
        if (chanceElement) {
            chanceElement.style.display = 'none';
        }
    }
    
    // Set chance display to default
    setChanceDisplayToDefault() {
        const chanceElement = document.getElementById('chanceQuestion');
        if (chanceElement) {
            chanceElement.textContent = '(3/3 chances)';
            chanceElement.style.display = 'block';
        }
    }
    
    // Gray out team character for Q1 failure
    grayOutTeam(teamId) {
        const teamCharacter = document.getElementById(`teamCharacter${teamId}`);
        if (teamCharacter) {
            teamCharacter.style.setProperty('opacity', '0.3', 'important');
            teamCharacter.style.setProperty('filter', 'grayscale(100%)', 'important');
        }
    }
    
    // Reset all team character graying
    resetTeamGraying() {
        for (let teamId = 1; teamId <= 6; teamId++) {
            const teamCharacter = document.getElementById(`teamCharacter${teamId}`);
            if (teamCharacter) {
                teamCharacter.style.setProperty('opacity', '1', 'important');
                teamCharacter.style.setProperty('filter', 'none', 'important');
            }
        }
    }
    
    // Track failed teams for current Q1
    trackQ1Failure(teamId, setNumber) {
        const failedTeamsKey = `q1FailedTeams_${setNumber}`;
        const state = window.gameState?.get();
        if (!state) return;
        
        let failedTeams = state[failedTeamsKey] || [];
        if (!failedTeams.includes(teamId)) {
            failedTeams.push(teamId);
            if (window.gameState) {
                window.gameState.set(failedTeamsKey, failedTeams);
            }
        }
    }
    
    // Get failed teams for current Q1
    getQ1FailedTeams(setNumber) {
        const state = window.gameState?.get();
        if (!state) return [];
        
        const failedTeamsKey = `q1FailedTeams_${setNumber}`;
        return state[failedTeamsKey] || [];
    }
    
    // Clear failed teams tracking
    clearQ1FailedTeams(setNumber) {
        const failedTeamsKey = `q1FailedTeams_${setNumber}`;
        if (window.gameState) {
            window.gameState.set(failedTeamsKey, []);
        }
    }

    // Show answer animation modal (correct/incorrect)
    async showAnswerAnimation(isCorrect) {
        
        const modal = document.getElementById('answerModal');
        const animationContainer = modal.querySelector('.answer-modal-content');
        
        if (!modal || !animationContainer) {
            return;
        }
        
        // Set the appropriate animation
        const animationSrc = isCorrect ? 
            'assets/animations/answer_correct.json' : 
            'assets/animations/answer_incorrect.json';
        
        
        // Show modal first
        modal.classList.add('active');
        
        // Remove existing animation element
        const existingAnimation = animationContainer.querySelector('lottie-player');
        if (existingAnimation) {
            existingAnimation.remove();
        }
        
        // Create new animation element
        const newAnimation = document.createElement('lottie-player');
        newAnimation.id = 'answerAnimation';
        newAnimation.src = animationSrc;
        newAnimation.background = 'transparent';
        newAnimation.speed = 1;
        newAnimation.loop = false;
        newAnimation.autoplay = true;
        
        // Add to container
        animationContainer.appendChild(newAnimation);
        
        // Force play the animation
        setTimeout(() => {
            if (newAnimation.play) {
                newAnimation.play();
            }
        }, 200);
        
        // Play sound
        const audioSrc = isCorrect ? 
            'assets/audio/correct-duolingo.mp3' : 
            'assets/audio/incorrect-duolingo.mp3';
        const audio = new Audio(audioSrc);
        audio.volume = 1;
        audio.play().catch(() => {
        });
        
        // Hide modal after 2 seconds
        setTimeout(() => {
            modal.classList.remove('active');
        }, 2500);
    }
    
    
    // Show score animation using coin assets
    async showScoreAnimation(scoreChange) {
        
        const scoreAnimation = document.getElementById('scoreAnimation');
        
        if (!scoreAnimation) {
            return;
        }
        
        const animationSrc = scoreChange > 0 ?
            'assets/animations/coin_plus.json' :
            'assets/animations/coin_minus.json';
        
        
        // Show the animation using the class
        scoreAnimation.classList.add('active');
        
        // Simple approach: just load and play the animation
        scoreAnimation.src = animationSrc;
        scoreAnimation.load(animationSrc);
        
        // Check if element is visible
        setTimeout(() => {
            const isVisible = scoreAnimation.classList.contains('active');
            const computedStyle = window.getComputedStyle(scoreAnimation);
        }, 50);
        
        // Hide after 2 seconds
        setTimeout(() => {
            scoreAnimation.classList.remove('active');
        }, 2500);
    }
    
    // Handle angel card toggle
    handleAngelCard() {
        console.log('🔔 Angel card hotkey pressed');
        const state = window.gameState?.get();
        if (!state || !state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            console.log('❌ No current team or invalid team ID');
            return;
        }
        
        const teamId = state.currentTeam;
        console.log(`🎯 Team ${teamId} angel card requested`);
        
        // Check if angel card is available (true in actionCards)
        if (!state.actionCards[teamId].angel) {
            console.log('❌ Angel card not available for this team');
            return;
        }
        
        const angelIcon = document.getElementById('mainCharacterAngel');
        const challengeIcon = document.getElementById('mainCharacterChallenge');
        const currentlyActive = state.angelTeam === teamId;
        const currentQuestion = state.currentQuestion || 1;
        
        console.log(`🔍 Angel icon found: ${!!angelIcon}, Currently active: ${currentlyActive}`);
        
        // Toggle angel team (temporary activation)
        const newAngelTeam = currentlyActive ? 0 : teamId;
        
        if (window.gameState) {
            window.gameState.set('angelTeam', newAngelTeam);
        }
        
        // Update main character icon
        if (angelIcon) {
            angelIcon.classList.toggle('active', newAngelTeam > 0);
            console.log(`✅ Angel icon ${newAngelTeam > 0 ? 'activated' : 'deactivated'}`);
        } else {
            console.log('❌ Angel icon element not found');
        }
        
        // Couple angel with challenge for Q2–Q4; decouple when turning off
        if (newAngelTeam > 0 && currentQuestion > 1) {
            if (window.gameState) window.gameState.set('currentChallenge', teamId);
            if (challengeIcon) challengeIcon.classList.add('active');
        } else if (newAngelTeam === 0) {
            if (window.gameState && state.currentChallenge === teamId) {
                window.gameState.set('currentChallenge', 0);
            }
            if (challengeIcon) challengeIcon.classList.remove('active');
        }
        
        // Sync with server (not needed in standalone)
        
    }
    
    // Handle devil card toggle (open/close attack modal)
    handleDevilCard() {
        console.log('🔔 Devil card hotkey pressed');
        const state = window.gameState?.get();
        if (!state || !state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            console.log('❌ No current team or invalid team ID');
            return;
        }
        
        const teamId = state.currentTeam;
        console.log(`🎯 Team ${teamId} devil card requested`);
        
        // Check if devil card is available (true in actionCards)
        if (!state.actionCards[teamId].devil) {
            console.log('❌ Devil card not available for this team');
            return;
        }
        
        const devilIcon = document.getElementById('mainCharacterDevil');
        console.log(`🔍 Devil icon found: ${!!devilIcon}`);
        
        const modal = document.getElementById('devilAttackModal');
        const isModalOpen = modal && modal.classList.contains('active');
        
        if (isModalOpen) {
            // Close modal if already open
            console.log('🔒 Closing devil attack modal');
            this.closeDevilAttackModal(teamId);
        } else {
            // Open modal
            console.log('🔓 Opening devil attack modal');
            this.openDevilAttackModal(teamId);
        }
    }
    
    // Open devil attack modal
    openDevilAttackModal(teamId) {
        const devilIcon = document.getElementById('mainCharacterDevil');
        
        // Update game state (temporary activation)
        if (window.gameState) {
            window.gameState.set('attackTeam', teamId);
        }
        
        // Update main character devil icon
        if (devilIcon) {
            devilIcon.classList.add('active');
        }
        
        // Show modal
        this.showDevilAttackModal(teamId);
        
    }
    
    // Close devil attack modal
    closeDevilAttackModal(teamId, keepAttackTeam = false) {
        const modal = document.getElementById('devilAttackModal');
        if (modal) {
            modal.classList.remove('active');
            modal.dataset.attackingTeam = null;
            modal.dataset.targetTeam = null;
        }
        
        // Reset attack team parameter only if not keeping it
        if (window.gameState && !keepAttackTeam) {
            window.gameState.set('attackTeam', 0);
        }
        
        // Update main character devil icon
        const devilIcon = document.getElementById('mainCharacterDevil');
        if (devilIcon) {
            devilIcon.classList.remove('active');
        }
        
    }
    
    // Handle 'enter' key - Confirm devil attack if modal is open
    handleConfirmDevilAttack() {
        const modal = document.getElementById('devilAttackModal');
        const isModalOpen = modal && modal.classList.contains('active');
        
        if (isModalOpen) {
            // Check if target is selected
            const targetTeamId = modal.dataset.targetTeam;
            if (targetTeamId) {
                this.confirmDevilAttack();
            } else {
            }
        }
    }
    
    // Handle 'c' key - Cancel devil attack or activate challenge mode
    handleCancelDevilAttack() {
        const modal = document.getElementById('devilAttackModal');
        const isModalOpen = modal && modal.classList.contains('active');
        
        if (isModalOpen) {
            // Close devil attack modal using the toggle mechanism
            const attackingTeamId = parseInt(modal.dataset.attackingTeam);
            if (attackingTeamId) {
                this.closeDevilAttackModal(attackingTeamId);
            }
        } else {
            // No modal open, proceed with challenge mode
            this.handleChallengeMode();
        }
    }
    

    
    // Apply angel card effect (protection against score decrease)
    applyAngelEffect(teamId) {
        
        // Show protection animation
        this.showProtectionAnimation('Protection Active');
        
        // Apply effect (not needed in standalone)
    }
    
    // Remove angel card effect (no longer protected)
    removeAngelEffect(teamId) {
        
        // Remove effect (not needed in standalone)
    }
    
    // Helper function to show protection animations
    async showProtectionAnimation(text) {
        
        const scoreAnimation = document.getElementById('scoreAnimation');
        
        if (!scoreAnimation) {
            return;
        }
        
        // Show the animation using the class
        scoreAnimation.classList.add('active');
        scoreAnimation.classList.add('bigger');
        
        // Simple approach: just load and play the animation
        scoreAnimation.src = 'assets/animations/coin_shield.json';
        scoreAnimation.load('assets/animations/coin_shield.json');
        
        // Check if element is visible
        setTimeout(() => {
            const isVisible = scoreAnimation.classList.contains('active');
            const computedStyle = window.getComputedStyle(scoreAnimation);
        }, 50);
        
        // Play the animation
        setTimeout(() => {
            if (scoreAnimation.play) {
                scoreAnimation.play();
            }
        }, 100);
        
        // Hide after 2 seconds
        setTimeout(() => {
            scoreAnimation.classList.remove('active');
            scoreAnimation.classList.remove('bigger');
        }, 2500);
    }
    
    // Show devil attack selection modal
    showDevilAttackModal(attackingTeamId) {
        const modal = document.getElementById('devilAttackModal');
        if (!modal) {
            return;
        }
        
        // Get current game state for filtering
        const state = window.gameState?.get();
        
        // Clear previous selections and filter available targets
        modal.querySelectorAll('.attack-team-option').forEach(option => {
            const targetTeamId = parseInt(option.getAttribute('data-team-id'));
            
            option.classList.remove('selected');
            
            // Check if this team can be attacked
            const canAttack = this.canAttackTeam(attackingTeamId, targetTeamId, state);
            
            // Debug logging for cross protection status
            if (state?.actionCards?.[targetTeamId]?.cross) {
            }
            
            if (canAttack) {
                option.style.display = 'block';
                option.style.opacity = '1';
                option.style.pointerEvents = 'auto';
                option.style.filter = 'none';
            } else {
                option.style.display = 'block';
                option.style.opacity = '0.3';
                option.style.pointerEvents = 'none';
                option.style.filter = 'grayscale(100%)';
            }
        });
        
        // Reset confirm button
        const confirmBtn = modal.querySelector('.attack-confirm-btn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
        
        // Show modal
        modal.classList.add('active');
        
        // Store attacking team for confirmation
        modal.dataset.attackingTeam = attackingTeamId;
        modal.dataset.targetTeam = null;
    }
    
    // Check if a team can attack another team
    canAttackTeam(attackingTeamId, targetTeamId, state) {
        // Can't attack own team
        if (attackingTeamId === targetTeamId) {
            return false;
        }
        
        // Can't attack teams with cross protection
        if (state?.actionCards?.[targetTeamId]?.cross) {
            return false;
        }
        
        // Can't attack if there's already an active attack in progress
        if (state?.attackTeam && state?.victimTeam) {
            return false;
        }
        
        return true;
    }
    
    // Cancel devil attack modal (simple close)
    cancelDevilAttack() {
        const modal = document.getElementById('devilAttackModal');
        if (modal) {
            modal.classList.remove('active');
            modal.dataset.attackingTeam = null;
            modal.dataset.targetTeam = null;
        }
    }
    
    // Select attack target team
    selectAttackTarget(targetTeamId) {
        const modal = document.getElementById('devilAttackModal');
        if (!modal) return;
        
        const attackingTeamId = parseInt(modal.dataset.attackingTeam);
        
        // Don't allow attacking self
        if (targetTeamId === attackingTeamId) {
            return;
        }
        
        // Check if target team has cross protection
        const state = window.gameState?.get();
        if (state?.actionCards?.[targetTeamId]?.cross) {
            return;
        }
        
        // Check if there's already an active attack in progress
        if (state?.attackTeam && state?.victimTeam) {
            return;
        }
        
        // Clear previous selections
        modal.querySelectorAll('.attack-team-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select the clicked team
        const selectedOption = modal.querySelector(`[data-team-id="${targetTeamId}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Enable confirm button
        const confirmBtn = modal.querySelector('.attack-confirm-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
        
        // Store target team
        modal.dataset.targetTeam = targetTeamId;
        
    }
    
    // Confirm devil attack
    confirmDevilAttack() {
        const modal = document.getElementById('devilAttackModal');
        if (!modal) return;
        
        const attackingTeamId = parseInt(modal.dataset.attackingTeam);
        const targetTeamId = parseInt(modal.dataset.targetTeam);
        
        if (!attackingTeamId || !targetTeamId) {
            return;
        }
        
        
        // Set attack tracking parameters in game state
        if (window.gameState) {
            window.gameState.set('attackTeam', attackingTeamId);
            window.gameState.set('victimTeam', targetTeamId);
        }
        
        // Permanently disable devil card for attacking team
        if (window.gameState) {
            window.gameState.update(`actionCards.${attackingTeamId}.devil`, false);
            
            // Update team displays to show devil card as inactive (gray)
            window.gameState.updateTeamDisplays();
        }
        
        // Activate cross protection for victim team
        if (window.gameState) {
            window.gameState.update(`actionCards.${targetTeamId}.cross`, true);
            
            // Update team displays to show cross card as active (colorful)
            window.gameState.updateTeamDisplays();
        }
        
        // Update main character devil icon
        const devilIcon = document.getElementById('mainCharacterDevil');
        if (devilIcon) {
            devilIcon.classList.add('active');
        }
        
        // Close modal but keep attack team active
        this.closeDevilAttackModal(attackingTeamId, true);
        
        // Execute attack animation
        this.executeAttackAnimation(attackingTeamId, targetTeamId);
        
    }
    
    // Execute the complex attack animation sequence
    async executeAttackAnimation(attackingTeamId, targetTeamId) {
        
        try {
            // Get team colors
            const attackingTeam = window.gameState?.get()?.teams?.[attackingTeamId];
            const victimTeam = window.gameState?.get()?.teams?.[targetTeamId];
            const attackingColor = attackingTeam?.color || 'white';
            const victimColor = victimTeam?.color || 'white';
            
            // Step 1: Show both characters side by side
            await this.showDualCharacterAnimation(attackingTeamId, targetTeamId, attackingColor, victimColor);
            
            // Step 2: Change current character to victim's team color (but keep devil card inactive)
            await this.changeCurrentCharacterToVictimColor(victimColor);
            
            // Step 3: Set current team to victim team
            if (window.gameState) {
                window.gameState.set('currentTeam', targetTeamId);
                window.gameState.set('attackedTeam', targetTeamId);
            }
            
        } catch (error) {
        }
    }
    
    // Show both attacker and victim characters side by side
    async showDualCharacterAnimation(attackingTeamId, targetTeamId, attackingColor, victimColor) {
        const progressCharacter = document.getElementById('progressCharacter');
        const victimCharacter = document.getElementById('victimCharacter');
        
        if (!progressCharacter || !victimCharacter) {
            return;
        }
        
        
        try {
            // Step 1: Show victim character (left side)
            await this.setupVictimCharacter(victimColor);
            
            // Step 2: Setup attacker character (right side) with beats_with_fist
            await this.setupAttackerCharacter(attackingColor);
            
            // Step 3: Start the stationary kill sound effect with a small delay to ensure animation is visible
            setTimeout(() => {
                this.playStationaryKillSound();
            }, 200); // Small delay to ensure animation is loaded and visible
            
            // Step 4: Play both animations simultaneously for 3 seconds
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 4: Hide victim character
            victimCharacter.classList.remove('active');
            
        } catch (error) {
        }
    }
    
    // Setup victim character on the left
    async setupVictimCharacter(victimColor) {
        const victimCharacter = document.getElementById('victimCharacter');
        if (!victimCharacter) return;
        
        
        try {
            // Load fears animation with victim color
            const response = await fetch('assets/animations/among_us_fears.json');
            const animationData = await response.json();
            
            const colorObject = victimColor === 'white' 
                ? ProgressWhite.getWhiteTeamColors() 
                : ProgressWhite.teamColors[victimColor] || ProgressWhite.getWhiteTeamColors();
            
            const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, colorObject);
            
            // Load animation
            const blob = new Blob([JSON.stringify(modifiedAnimationData)], { type: 'application/json' });
            const blobUrl = URL.createObjectURL(blob);
            
            victimCharacter.src = blobUrl;
            victimCharacter.classList.add('active');
            await new Promise((resolve) => {
                victimCharacter.addEventListener('ready', resolve, { once: true });
                victimCharacter.load(blobUrl);
            });
            
            URL.revokeObjectURL(blobUrl);
            
        } catch (error) {
        }
    }
    
    // Setup attacker character on the right
    async setupAttackerCharacter(attackingColor) {
        const progressCharacter = document.getElementById('progressCharacter');
        if (!progressCharacter) return;
        
        
        try {
            // Load beats_with_fist animation with attacker color
            const response = await fetch('assets/animations/among_us_beats_with_fist.json');
            const animationData = await response.json();
            
            const colorObject = attackingColor === 'white' 
                ? ProgressWhite.getWhiteTeamColors() 
                : ProgressWhite.teamColors[attackingColor] || ProgressWhite.getWhiteTeamColors();
            
            const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, colorObject);
            
            // Load animation
            const blob = new Blob([JSON.stringify(modifiedAnimationData)], { type: 'application/json' });
            const blobUrl = URL.createObjectURL(blob);
            
            progressCharacter.src = blobUrl;
            await new Promise((resolve) => {
                progressCharacter.addEventListener('ready', resolve, { once: true });
                progressCharacter.load(blobUrl);
            });
            
            URL.revokeObjectURL(blobUrl);
            
        } catch (error) {
        }
    }
    
    // Note: Removed playVictimReactionAnimation and hideVictimCharacter functions
    // as they are now replaced by the dual character animation system
    
    // Change current character to victim's color
    async changeCurrentCharacterToVictimColor(victimColor) {
        const progressCharacter = document.getElementById('progressCharacter');
        if (!progressCharacter) return;
        
        try {
            // Return to idle animation with victim color
            const response = await fetch('assets/animations/among_us_idle.json');
            const animationData = await response.json();
            
            const colorObject = victimColor === 'white' 
                ? ProgressWhite.getWhiteTeamColors() 
                : ProgressWhite.teamColors[victimColor] || ProgressWhite.getWhiteTeamColors();
            
            const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, colorObject);
            
            const blob = new Blob([JSON.stringify(modifiedAnimationData)], { type: 'application/json' });
            const blobUrl = URL.createObjectURL(blob);
            
            progressCharacter.src = blobUrl;
            await new Promise((resolve) => {
                progressCharacter.addEventListener('ready', resolve, { once: true });
                progressCharacter.load(blobUrl);
            });
            
            URL.revokeObjectURL(blobUrl);
            
            // Remove devil card active state since this is now the victim character
            const devilIcon = document.getElementById('mainCharacterDevil');
            if (devilIcon) {
                devilIcon.classList.remove('active');
            }

            //Display the cross protection icon
            const crossIcon = document.getElementById('mainCharacterCross');
            if (crossIcon) {
            // Ensure the icon is visible and active (in case a prior reset hid it)
            crossIcon.style.display = 'block';
            crossIcon.classList.add('active');
            }
            
        } catch (error) {
        }
    }
    
    // Activate cross protection for victim team
    activateCrossProtection(victimTeamId) {
        
        // Update game state
        if (window.gameState) {
            window.gameState.update(`actionCards.${victimTeamId}.cross`, true);
        }
        
        // Verify the update worked
        const updatedState = window.gameState.get();
        const crossStatus = updatedState.actionCards[victimTeamId].cross;
        
        // Force update team displays to ensure cross protection is shown
        if (window.gameState) {
            window.gameState.updateTeamDisplays();
        }
        
        // Sync with server (not needed in standalone)
        
    }
    
    // Remove cross protection for victim team
    removeCrossProtection(victimTeamId) {
        
        // Remove cross action from main character
        const crossIcon = document.getElementById('mainCharacterCross');
        if (crossIcon) {
            crossIcon.classList.remove('active');
        }
        
        // Force update team displays to ensure cross protection is removed
        if (window.gameState) {
            window.gameState.updateTeamDisplays();
        }
        
        // Sync with server (not needed in standalone)
        
        // Clear attacked team status
        if (window.gameState) {
            window.gameState.set('attackedTeam', 0);
        }
        
    }
    
    // Play stationary kill sound effect three times
    playStationaryKillSound() {
        
        const soundFile = 'assets/audio/stationary-kill-among-us.mp3';
        let playCount = 0;
        const maxPlays = 3;
        
        const playSound = () => {
            if (playCount >= maxPlays) {
                return;
            }
            
            // Create a new audio instance for each play to avoid conflicts
            const soundInstance = new Audio(soundFile);
            soundInstance.volume = 1;
            
            // Try to play immediately
            const playPromise = soundInstance.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playCount++;
                    
                    // Play next sound after current one finishes
                    soundInstance.addEventListener('ended', () => {
                        // Small delay between sounds
                        setTimeout(() => {
                            playSound();
                        }, 30); // Reduced delay for better timing
                    });
                    
                }).catch((error) => {
                    playCount++;
                    // Try to continue with next sound even if current one failed
                    setTimeout(() => {
                        playSound();
                    }, 300); // Reduced retry delay
                });
            } else {
                // Fallback for older browsers
                playCount++;
                setTimeout(() => {
                    playSound();
                }, 300);
            }
        };
        
        // Start playing the sound sequence immediately
        playSound();
    }
    
    // Handle challenge mode activation/deactivation (toggle)
    // Note: Challenge mode only updates main character action, not team action cards
    handleChallengeMode() {
        console.log('🔔 Challenge mode hotkey pressed');
        const state = window.gameState?.get();
        if (!state || !state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            console.log('❌ No current team or invalid team ID');
            return;
        }
        
        const teamId = state.currentTeam;
        console.log(`🎯 Team ${teamId} challenge mode requested`);
        
        // Check current challenge state
        const isCurrentlyActive = state.currentChallenge === teamId;
        console.log(`🔍 Challenge currently active: ${isCurrentlyActive}`);
        
        const challengeIcon = document.getElementById('mainCharacterChallenge');
        console.log(`🔍 Challenge icon found: ${!!challengeIcon}`);
        
        if (isCurrentlyActive) {
            // Deactivate challenge mode
            console.log('🔒 Deactivating challenge mode');
            if (window.gameState) {
                window.gameState.set('currentChallenge', 0);
            }
            
            // Deactivate visual challenge icon
            if (challengeIcon) {
                challengeIcon.classList.remove('active');
                console.log('✅ Challenge icon deactivated');
            } else {
                console.log('❌ Challenge icon element not found');
            }
            
            // Sync with server (not needed in standalone)
        } else {
            // Activate challenge mode
            console.log('🔓 Activating challenge mode');
            if (window.gameState) {
                window.gameState.set('currentChallenge', teamId);
            }
            
            // Activate visual challenge icon
            if (challengeIcon) {
                challengeIcon.classList.add('active');
                console.log('✅ Challenge icon activated');
            } else {
                console.log('❌ Challenge icon element not found');
            }
            
            // Sync with server (not needed in standalone)
        }
    }
    
    // Handle navigation for both pages
    handleNavigation(direction) {
        if (this.pageType === 'console') {
            this.navigateQuestion(direction);
        } else {
            // Main page navigation - work with game state directly
            this.navigateMainPage(direction);
        }
    }
    
    // Main page navigation logic
    navigateMainPage(direction) {
        
        // Get current state from game state or fallback to DOM
        let currentSet = 1;
        let currentQuestion = 1;
        
        if (window.gameState) {
            const state = window.gameState.get();
            currentSet = state.currentSet;
            currentQuestion = state.currentQuestion;
        } else {
            // Fallback: try to get from DOM elements
            const currentBlock = document.querySelector('.question-block.current');
            if (currentBlock) {
                const blockId = currentBlock.id;
                const match = blockId.match(/q(\d+)-main/);
                if (match) {
                    const questionNumber = parseInt(match[1]);
                    currentSet = Math.ceil(questionNumber / 4);
                    currentQuestion = ((questionNumber - 1) % 4) + 1;
                }
            }
        }
        
        let newSet = currentSet;
        let newQuestion = currentQuestion;
        
        if (direction === 'next') {
            if (currentQuestion < 4) {
                // Move to next question within current set (next planet)
                newQuestion = currentQuestion + 1;
            } else if (currentSet < 10) {
                // Move to next set, starting with question 1 (first planet)
                newSet = currentSet + 1;
                newQuestion = 1;
            }
        } else if (direction === 'previous') {
            if (currentQuestion > 1) {
                // Move to previous question within current set (previous planet)
                newQuestion = currentQuestion - 1;
            } else if (currentSet > 1) {
                // Move to previous set, ending with question 4 (last planet)
                newSet = currentSet - 1;
                newQuestion = 4;
            }
        }
        
        
        // Update character position (let character controller handle game state update)
        if (window.characterController) {
            window.characterController.moveToQuestion(newSet, newQuestion);
        } else {
        }
        
        // Update UI elements directly if game state is not available
        if (!window.gameState) {
            this.updateMainPageUI(newSet, newQuestion);
        }
    }
    
    // Update main page UI directly (fallback when game state is not available)
    updateMainPageUI(setNumber, questionNumber) {
        // Update question blocks
        for (let set = 1; set <= 10; set++) {
            const block = document.getElementById(`q${set}-main`);
            if (block) {
                block.classList.remove('current', 'completed');
                
                // Mark as current if this is the current set (from Q1 to Q4)
                if (set === setNumber) {
                    block.classList.add('current');
                } 
                // Mark as completed for all previous sets
                else if (set < setNumber) {
                    block.classList.add('completed');
                }
                // For future sets, no special styling (default state)
            }
        }
        
        // Update planet blocks
        const planets = ['earth', 'moon', 'venus', 'jupiter'];
        planets.forEach((planet, index) => {
            const planetElement = document.getElementById(planet);
            if (planetElement) {
                planetElement.classList.remove('current', 'completed');
                
                const planetQuestion = index + 1; // 1=earth, 2=moon, 3=venus, 4=jupiter
                
                if (planetQuestion === questionNumber) {
                    // Current planet for this question
                    planetElement.classList.add('current');
                } else if (planetQuestion < questionNumber) {
                    // Completed planets in this set
                    planetElement.classList.add('completed');
                }
                // Planets after current question remain default (no class)
            }
        });
        
        // Update question set display
        const questionSetElement = document.getElementById('currentQuestionSet');
        if (questionSetElement) {
            questionSetElement.textContent = `Question Set ${setNumber}`;
        }
        
        // Update the question block number to show current set
        const questionBlockNumber = document.getElementById('questionBlockNumber');
        if (questionBlockNumber) {
            questionBlockNumber.textContent = setNumber;
        }
    }
    
    // Console-specific navigation logic
    navigateQuestion(direction) {
        const currentSet = parseInt(document.getElementById('currentSet')?.textContent || '1');
        const currentQuestion = parseInt(document.getElementById('currentQuestion')?.textContent || '1');
        
        let newSet = currentSet;
        let newQuestion = currentQuestion;
        
        if (direction === 'next') {
            if (currentQuestion < 4) {
                newQuestion++;
            } else if (currentSet < 10) {
                newSet++;
                newQuestion = 1;
            }
        } else if (direction === 'previous') {
            if (currentQuestion > 1) {
                newQuestion--;
            } else if (currentSet > 1) {
                newSet--;
                newQuestion = 4;
            }
        }
        
        this.updateProgress(newSet, newQuestion);
    }
    
    // Update progress for console
    updateProgress(setNumber, questionNumber) {
        // Update progress (not needed in standalone)
        
        // Update local UI
        if (document.getElementById('currentSet')) {
            document.getElementById('currentSet').textContent = setNumber;
        }
        if (document.getElementById('currentQuestion')) {
            document.getElementById('currentQuestion').textContent = questionNumber;
        }
    }
    
    // Reset buzzers ('r' key)
    handleResetBuzzers() {
        
        // Send RESET command to Arduino via server
        if (window.arduinoController && window.arduinoController.connectionMode === 'socketio') {
            if (window.arduinoController.socketManager) {
                window.arduinoController.socketManager.emit('reset_buzzers');
            }
        }
        
        // Reset game state
        if (window.gameState) {
            window.gameState.set('currentTeam', 0);
            window.gameState.set('currentChallenge', 0);
            window.gameState.set('angelTeam', 0);
            // Reset attack tracking parameters
            window.gameState.set('attackTeam', 0);
            window.gameState.set('victimTeam', 0);
        }
        
        // Clear main character action icons
        const angelIcon = document.getElementById('mainCharacterAngel');
        const devilIcon = document.getElementById('mainCharacterDevil');
        const challengeIcon = document.getElementById('mainCharacterChallenge');
        const crossIcon = document.getElementById('mainCharacterCross');
        
        if (angelIcon) angelIcon.classList.remove('active');
        if (devilIcon) devilIcon.classList.remove('active');
        if (challengeIcon) challengeIcon.classList.remove('active');
        if (crossIcon) crossIcon.classList.remove('active');
        
        // Reset character to white using character controller
        if (window.characterController) {
            window.characterController.updateProgressCharacterColor(0);
        }
        
        // Clear any buzzing modal
        if (window.buzzingSystem) {
            window.buzzingSystem.clearAll();
        }
        
        // Reset temporary action card states but preserve permanently used cards
        if (window.gameState) {
            const state = window.gameState.get();
            for (let teamId = 1; teamId <= 6; teamId++) {
                // Reset temporary states but preserve permanent usage
                // Note: In new structure, angel and devil are true when available, false when used
                // We don't reset them here as they should remain permanently disabled if used
                // DO NOT reset cross protection - it should remain until game reset
                // window.gameState.update(`actionCards.${teamId}.cross`, false);
            }
        }
        
        // Ensure cross protection remains visible after buzzer reset
        if (window.gameState) {
            window.gameState.updateTeamDisplays();
            
            // Debug: Check cross protection status for all teams
            const state = window.gameState.get();
            for (let teamId = 1; teamId <= 6; teamId++) {
                const crossStatus = state.actionCards[teamId].cross;
                if (crossStatus) {
                }
            }
        }
        
    }
    
    // Handle game state reset (comprehensive reset)
    handleGameReset() {
        // Use the comprehensive reset function directly from gameState
        if (window.gameState) {
            window.gameState.reset();
        }
    }
    
    handleOpenConsole() {
        if (typeof openConsoleWindow === 'function') {
            openConsoleWindow();
        } else {
            // Fallback: open console in new window
            const consoleUrl = 'console.html';
            const features = 'width=1920,height=1080,scrollbars=yes,resizable=yes';
            window.open(consoleUrl, 'QuizBowlConsole', features);
        }
    }
    
    // Handle timer toggle for both pages
    handleTimerToggle() {
        if (this.pageType === 'console') {
            const isRunning = document.querySelector('.timer-running');
            
            if (isRunning) {
                this.handlePauseTimer();
            } else {
                this.startTimer();
            }
        } else {
            // Main page: Update local game state and UI immediately
            if (window.gameState) {
                const currentRunning = window.gameState.get('timerRunning');
                window.gameState.set('timerRunning', !currentRunning);
                window.gameState.updateTimerDisplay();
            }
        }
    }
    
    // Start timer
    startTimer() {
        // Start timer (not needed in standalone)
        
        // Update UI
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.add('timer-running');
        }
    }
    
    // Handle pause timer for both pages
    handlePauseTimer() {
        if (this.pageType === 'console') {
            // Pause timer (not needed in standalone)
            
            // Update UI
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-running');
            }
        } else {
            // Main page: Stop timer and reset to remembered value
            if (window.gameState) {
                window.gameState.stopTimerAndReset();
            }
        }
    }
    
    // Handle stop timer for both pages
    handleStopTimer() {
        if (this.pageType === 'console') {
            // Stop timer (not needed in standalone)
            
            // Update UI
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-running');
                timerDisplay.textContent = '0:15';
            }
        } else {
            // Main page: Stop timer and reset to remembered value
            if (window.gameState) {
                window.gameState.stopTimerAndReset();
            }
        }
    }
    
    // Handle reset timer for both pages
    handleResetTimer() {
        if (this.pageType === 'console') {
            // Reset timer (not needed in standalone)
            
            // Update UI
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-running');
                timerDisplay.textContent = '0:15';
            }
        } else {
            // Main page: Reset timer to default (15 seconds)
            if (window.gameState) {
                window.gameState.resetTimerToDefault();
            }
        }
    }
    
    // Test emergency meeting function
    testEmergencyMeeting() {
        if (window.gameState) {
            window.gameState.set('timerValue', 0);
            window.gameState.set('timerRunning', false);
            window.gameState.triggerEmergencyMeeting();
        }
    }
    
    // Handle decrease timer by 1 second
    handleDecreaseTimer() {
        if (this.pageType === 'console') {
            // Console page: Get current timer value from display
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                const currentText = timerDisplay.textContent;
                const [minutes, seconds] = currentText.split(':').map(Number);
                const totalSeconds = minutes * 60 + seconds;
                const newSeconds = Math.max(0, totalSeconds - 1); // Don't go below 0
                
                // Update display
                const newMinutes = Math.floor(newSeconds / 60);
                const newSecondsRemainder = newSeconds % 60;
                timerDisplay.textContent = `${newMinutes}:${newSecondsRemainder.toString().padStart(2, '0')}`;
                
                // Send to server (not needed in standalone)
            }
        } else {
            // Main page: Update local game state and remember the value
            if (window.gameState) {
                const currentValue = window.gameState.get('timerValue');
                const newValue = Math.max(0, currentValue - 1); // Don't go below 0
                window.gameState.updateTimerValue(newValue);
            }
        }
    }
    
    // Handle increase timer by 1 second
    handleIncreaseTimer() {
        if (this.pageType === 'console') {
            // Console page: Get current timer value from display
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                const currentText = timerDisplay.textContent;
                const [minutes, seconds] = currentText.split(':').map(Number);
                const totalSeconds = minutes * 60 + seconds;
                const newSeconds = totalSeconds + 1;
                
                // Update display
                const newMinutes = Math.floor(newSeconds / 60);
                const newSecondsRemainder = newSeconds % 60;
                timerDisplay.textContent = `${newMinutes}:${newSecondsRemainder.toString().padStart(2, '0')}`;
                
                // Send to server (not needed in standalone)
            }
        } else {
            // Main page: Update local game state and remember the value
            if (window.gameState) {
                const currentValue = window.gameState.get('timerValue');
                const newValue = currentValue + 1;
                window.gameState.updateTimerValue(newValue);
            }
        }
    }

    // Handle fullscreen toggle for both pages
    handleFullscreen() {
        if (typeof window.toggleFullscreen === 'function') {
            window.toggleFullscreen();
        } else {
            // Fallback fullscreen implementation
            const elem = document.documentElement;
            
            if (!document.fullscreenElement && !document.webkitFullscreenElement && 
                !document.mozFullScreenElement && !document.msFullscreenElement) {
                
                // Enter fullscreen
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                }
                
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    }
    
    // Handle volume decrease
    handleVolumeDecrease() {
        if (window.volumeController) {
            window.volumeController.decreaseVolume();
        }
    }
    
    // Handle volume increase
    handleVolumeIncrease() {
        if (window.volumeController) {
            window.volumeController.increaseVolume();
        }
    }
    
    // Handle music toggle
    handleMusicToggle() {
        if (window.volumeController) {
            window.volumeController.togglePlayback();
        }
    }
    
    handleArduinoToggle() {
        if (window.arduinoController) {
            window.arduinoController.toggleConnection();
        }
    }
    
    // Modal toggle handlers
    handleToggleTeamsModal() {
        const modal = document.getElementById('teamsModal');
        if (modal) {
            if (modal.classList.contains('active')) {
                window.closeTeamsModal();
            } else {
                window.openTeamsModal();
            }
        }
    }
    
    handleToggleQuestionsModal() {
        const modal = document.getElementById('questionsModal');
        if (modal) {
            if (modal.classList.contains('active')) {
                window.closeQuestionsModal();
            } else {
                window.openQuestionsModal();
            }
        }
    }
    
    handleToggleUploadModal() {
        const modal = document.getElementById('uploadModal');
        if (modal) {
            if (modal.classList.contains('active')) {
                window.closeUploadModal();
            } else {
                window.openUploadModal();
            }
        }
    }
    
    handleToggleLogsModal() {
        const modal = document.getElementById('logsModal');
        if (modal) {
            if (modal.classList.contains('active')) {
                window.closeLogsModal();
            } else {
                window.openLogsModal();
            }
        }
    }
    
    // Console-specific tab switching
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabName + 'Tab');
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab) {
            targetTab.classList.add('active');
        }
        if (targetButton) {
            targetButton.classList.add('active');
        }
    }
    
    // Bind key to action
    bind(key, callback, description = '') {
        const normalizedKey = this.normalizeKey(key);
        
        if (!this.bindings.has(normalizedKey)) {
            this.bindings.set(normalizedKey, []);
        }
        
        this.bindings.get(normalizedKey).push({
            callback,
            description,
            timestamp: Date.now()
        });
    }
    
    // Unbind key
    unbind(key) {
        const normalizedKey = this.normalizeKey(key);
        this.bindings.delete(normalizedKey);
    }
    
    // Start listening for keyboard events
    startListening() {
        if (this.isListening) return;
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        this.isListening = true;
    }
    
    // Stop listening for keyboard events
    stopListening() {
        if (!this.isListening) return;
        
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        this.isListening = false;
    }
    
    // Handle keydown events
    handleKeyDown(event) {
        if (!this.isEnabled || this.shouldIgnoreEvent(event)) {
            return;
        }
        
        const normalizedKey = this.normalizeKey(event.key);
        const handlers = this.bindings.get(normalizedKey);
        
        if (handlers && handlers.length > 0) {
            // Execute all handlers for this key
            handlers.forEach(handler => {
                try {
                    handler.callback(event);
                } catch (error) {
                    // Silently handle errors
                }
            });
        }
    }
    
    // Handle keyup events (for future use)
    handleKeyUp(event) {
        // Placeholder for keyup handling
    }
    
    // Normalize key strings
    normalizeKey(key) {
        // Handle special cases
        const keyMap = {
            ' ': 'space',
            'Spacebar': 'space',
            'Left': 'arrowleft',
            'Right': 'arrowright',
            'Up': 'arrowup',
            'Down': 'arrowdown',
            'Esc': 'escape'
        };
        
        const mapped = keyMap[key] || key;
        return mapped.toLowerCase();
    }
    
    // Check if event should be ignored
    shouldIgnoreEvent(event) {
        const target = event.target;
        const tagName = target.tagName.toLowerCase();
        
        // Ignore if user is typing in input fields
        if (tagName === 'input' || tagName === 'textarea' || target.contentEditable === 'true') {
            return true;
        }
        
        // Ignore if any modifier keys are pressed (except for specific combinations)
        if (event.ctrlKey || event.altKey || event.metaKey) {
            return true;
        }
        
        return false;
    }
    
    // Enable/disable hotkeys
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
    
    // Check if debug mode is enabled
    isDebugMode() {
        return window.location.hostname === 'localhost' || 
               window.location.search.includes('debug=1') ||
               localStorage.getItem('debug') === 'true';
    }
    
    // Show help dialog with all available hotkeys
    showHelpDialog() {
        const helpContent = this.generateHelpContent();
        
        // Create or update help modal
        let modal = document.getElementById('hotkeys-help-modal');
        if (!modal) {
            modal = this.createHelpModal();
            document.body.appendChild(modal);
        }
        
        const contentElement = modal.querySelector('.help-content');
        if (contentElement) {
            contentElement.innerHTML = helpContent;
        }
        
        modal.style.display = 'flex';
        
        // Close on click outside or escape
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        // Temporarily disable hotkeys while modal is open
        this.setEnabled(false);
        setTimeout(() => this.setEnabled(true), 100);
    }
    
    // Toggle help dialog (show/hide)
    toggleHelpDialog() {
        let modal = document.getElementById('hotkeys-help-modal');
        
        if (!modal) {
            this.showHelpDialog();
            return;
        }
        
        const isVisible = modal.style.display === 'flex';
        
        if (isVisible) {
            modal.style.display = 'none';
        } else {
            this.showHelpDialog();
        }
    }
    
    // Generate help content
    generateHelpContent() {
        const categories = {
            'Team Controls': ['1', '2', '3', '4', '5', '6'],
            'Navigation': ['arrowleft', 'arrowright'],
            'Scoring': ['arrowup', 'arrowdown'],
            'Game Controls': ['r', 'q', '/'],
            'Action Cards': ['z', 'x', 'c', 'enter'],
            'Display Controls': ['f', 'h'],
            'Timer Controls': ['i', 'o', 'p', '[', ']'],
            'Music Controls': ['-', '=', 'm']
        };
        
        // Add page-specific categories
        if (this.pageType === 'console') {
            categories['Console Tabs'] = ['g', 'l'];
        } else if (this.pageType === 'main') {
            categories['Modal Controls'] = ['t', 's', 'u', 'l'];
        }
        
        let html = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                    font-size: 28px;
                    font-weight: 600;
                ">🎮 Hotkeys Guide</h2>
                <p style="
                    margin: 0;
                    color: #6c757d;
                    font-size: 16px;
                ">${this.pageType.toUpperCase()} Page</p>
            </div>
        `;
        
        // Convert categories to array for three-column layout
        const categoryEntries = Object.entries(categories);
        const itemsPerColumn = Math.ceil(categoryEntries.length / 3);
        
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">';
        
        // Create three columns
        for (let col = 0; col < 3; col++) {
            html += '<div style="display: flex; flex-direction: column; gap: 20px;">';
            
            const startIndex = col * itemsPerColumn;
            const endIndex = Math.min((col + 1) * itemsPerColumn, categoryEntries.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const [category, keys] = categoryEntries[i];
                
                html += `
                    <div style="
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        border-left: 4px solid #667eea;
                    ">
                        <h3 style="
                            margin: 0 0 15px 0;
                            color: #2c3e50;
                            font-size: 16px;
                            font-weight: 600;
                        ">${category}</h3>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                `;
                
                keys.forEach(key => {
                    const handlers = this.bindings.get(key);
                    if (handlers && handlers.length > 0) {
                        const description = handlers[0].description;
                        const displayKey = this.getDisplayKey(key);
                        html += `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 8px 12px;
                                background: white;
                                border-radius: 8px;
                                border: 1px solid #e9ecef;
                            ">
                                <span style="
                                    color: #495057;
                                    font-size: 13px;
                                    flex: 1;
                                    margin-right: 10px;
                                ">${description}</span>
                                <kbd style="
                                    background: #667eea;
                                    color: #000;
                                    border: none;
                                    border-radius: 6px;
                                    padding: 4px 8px;
                                    font-size: 11px;
                                    font-weight: 600;
                                    font-family: monospace;
                                    min-width: 20px;
                                    text-align: center;
                                    flex-shrink: 0;
                                ">${displayKey}</kbd>
                            </div>
                        `;
                    }
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        
        return html;
    }
    
    // Get display-friendly key name
    getDisplayKey(key) {
        const displayMap = {
            'space': 'Space',
            'arrowleft': '←',
            'arrowright': '→',
            'arrowup': '↑',
            'arrowdown': '↓',
            '/': '/',
            'escape': 'Esc',
            'enter': 'Enter',
            'tab': 'Tab',
            'backspace': '⌫',
            'delete': 'Del'
        };
        
        return displayMap[key] || key.toUpperCase();
    }
    
    // Create help modal
    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'hotkeys-help-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 0;
                border-radius: 20px;
                max-width: 95vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <div style="
                    background: white;
                    margin: 3px;
                    border-radius: 17px;
                    padding: 40px;
                    max-height: calc(90vh - 6px);
                    overflow-y: auto;
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #f8f9fa;
                        border: none;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        color: #6c757d;
                        transition: all 0.2s ease;
                    " onclick="this.closest('#hotkeys-help-modal').style.display='none'">
                        ×
                    </div>
                    
                    <div class="help-content" style="margin-top: 10px;"></div>
                    
                    <div style="
                        margin-top: 25px;
                        padding-top: 20px;
                        border-top: 1px solid #e9ecef;
                        text-align: center;
                        color: #6c757d;
                        font-size: 14px;
                    ">
                        Press <kbd style="
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            border-radius: 4px;
                            padding: 2px 6px;
                            font-size: 12px;
                            font-family: monospace;
                        ">H</kbd> to toggle help • Click outside to close
                    </div>
                </div>
            </div>
        `;
        
        // Add animation when modal is shown
        setTimeout(() => {
            const modalContent = modal.querySelector('div');
            if (modalContent) {
                modalContent.style.transform = 'scale(1)';
            }
        }, 10);
        
        return modal;
    }
    
    // Get all current bindings
    getBindings() {
        const result = {};
        this.bindings.forEach((handlers, key) => {
            result[key] = handlers.map(h => h.description).join(', ');
        });
        return result;
    }
}

// Initialize the unified hotkeys system
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.hotkeysManager = new HotkeysManager();
        window.hotkeysManager.init();
        
        // Backward compatibility for console
        window.consoleHotkeys = window.hotkeysManager;
        
        // Make devil attack functions globally available for HTML onclick handlers
        window.cancelDevilAttack = () => window.hotkeysManager.cancelDevilAttack();
        window.selectAttackTarget = (targetTeamId) => window.hotkeysManager.selectAttackTarget(targetTeamId);
        window.confirmDevilAttack = () => window.hotkeysManager.confirmDevilAttack();
    });
} else {
    window.hotkeysManager = new HotkeysManager();
    window.hotkeysManager.init();
    
    // Backward compatibility for console
    window.consoleHotkeys = window.hotkeysManager;
    
    // Make devil attack functions globally available for HTML onclick handlers
    window.cancelDevilAttack = () => window.hotkeysManager.cancelDevilAttack();
    window.selectAttackTarget = (targetTeamId) => window.hotkeysManager.selectAttackTarget(targetTeamId);
    window.confirmDevilAttack = () => window.hotkeysManager.confirmDevilAttack();
}