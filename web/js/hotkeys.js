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
            console.log('⚠️ Hotkeys manager already initialized');
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
        
        // Console-specific hotkeys
        if (this.pageType === 'console') {
            this.bind('t', (event) => {
                event.preventDefault();
                this.switchTab('timer');
            }, 'Switch to timer tab');
            
            this.bind('g', (event) => {
                event.preventDefault();
                this.switchTab('game');
            }, 'Switch to game tab');
            
            this.bind('h', (event) => {
                event.preventDefault();
                this.switchTab('hardware');
            }, 'Switch to hardware tab');
        }
        
        // Test emergency meeting (temporary for debugging)
        this.bind('e', (event) => {
            event.preventDefault();
            this.testEmergencyMeeting();
        }, 'Test emergency meeting');
        
        // Development hotkeys (only in debug mode)
        if (this.isDebugMode()) {
            this.bind('Escape', () => {
                this.showHelpDialog();
            }, 'Show help');
            
            // Use different key for help on console to avoid conflict with hardware tab
            const helpKey = this.pageType === 'console' ? 'F1' : 'h';
            this.bind(helpKey, () => {
                this.showHelpDialog();
            }, 'Show help');
        }
    }
    
    // Handle team buzzer simulation
    handleTeamBuzzer(teamId) {
        if (this.pageType === 'console') {
            // Console page behavior
            if (window.socket && window.socket.connected) {
                window.socket.emit('simulate_buzzer', { teamId: teamId });
            }
            
            // Also trigger local UI update if function exists
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
            console.warn('⚠️ Invalid team ID for buzz-in:', teamId);
            return;
        }
        
        console.log(`🔔 HotkeysManager: Simulating buzz-in for Team ${teamId}`);
        
        // Update game state FIRST (this will trigger character color change via subscription)
        if (window.gameState) {
            console.log(`🎯 HotkeysManager: Setting currentTeam to ${teamId} in game state`);
            window.gameState.set('currentTeam', teamId);
            
            // Verify the update
            const currentTeam = window.gameState.get('currentTeam');
            console.log(`🎯 HotkeysManager: Game state currentTeam is now: ${currentTeam}`);
        } else {
            console.error('❌ HotkeysManager: window.gameState not available');
        }
        
        // Show buzzing modal using buzzing system
        if (window.buzzingSystem) {
            window.buzzingSystem.showBuzzing(teamId);
        } else {
            console.error('❌ HotkeysManager: window.buzzingSystem not available');
        }
        
        // Sync with server
        if (window.socketManager) {
            window.socketManager.send('buzzer_pressed', { teamId: teamId });
        }
    }
    
    // Handle scoring with animations
    handleScoring(isPositive) {
        console.log(`🎯 handleScoring called with isPositive: ${isPositive}`);
        
        const state = window.gameState?.get();
        if (!state) {
            console.warn('⚠️ No game state available');
            return;
        }
        
        // Require a buzzing team for both positive and negative scoring
        if (!state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            console.warn('⚠️ No team currently buzzing - cannot assign score');
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
        
        console.log(`🎯 Scoring Debug - Team: ${teamId}, Q: ${currentQuestion}, Angel: ${hasAngel}, Challenge: ${isChallenge}, Victim: ${isVictimTeam}, AttackTeam: ${attackTeam}`);
        
        // Show answer animation first (correct/incorrect)
        console.log(`🎬 About to call showAnswerAnimation with isPositive: ${isPositive}`);
        this.showAnswerAnimation(isPositive);
        
        // Handle positive scoring (arrow up)
        if (isPositive) {
            // Check if this is a victim team answering correctly
            if (isVictimTeam && attackTeam) {
                console.log(`🎯 Victim team ${teamId} answered correctly - resetting attack tracking`);
                
                // Reset attack tracking parameters immediately
                if (window.gameState) {
                    window.gameState.set('attackTeam', 0);
                    window.gameState.set('victimTeam', 0);
                    console.log('✅ Attack tracking parameters reset (victim answered correctly)');
                }
            }
            
            let scoreChange = 0;
            
            if (isChallenge) {
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
            
            // Handle Q1 success - reset team graying
            if (currentQuestion === 1) {
                const currentSet = state.currentSet || 1;
                this.clearQ1FailedTeams(currentSet);
                this.resetTeamGraying();
            }
            
            return;
        }
        
        // Handle negative scoring (arrow down)
        if (!isPositive) {
            // Check if this is a victim team answering incorrectly
            if (isVictimTeam && attackTeam) {
                console.log(`🎯 Victim team ${teamId} answered incorrectly - handling devil attack consequences`);
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

        // DO NOT reset devilUsed for attacking team - it should remain permanently used
        // The devil card should stay used until game reset
    }
    
    // Helper functions for different scoring scenarios
    
    // Handle angel protection (no penalty, animate shield)
    handleAngelProtection(teamId) {
        const state = window.gameState?.get();
        if (!state) return;
        
        // Mark angel card as permanently used
        if (window.gameState) {
            window.gameState.update(`actionCards.${teamId}.angelUsed`, true);
            window.gameState.update(`actionCards.${teamId}.angel`, false);
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
        
        // Sync with server
        if (window.socketManager) {
            window.socketManager.send('angel_protection_used', { 
                teamId, 
                protectedFrom: -1,
                angelUsed: true
            });
        }
        
        // Trigger auto-navigation
        this.handleAutoNavigationAfterIncorrect();
    }
    
    // Handle devil attack victim (attacker gets +2, victim gets -1)
    handleDevilAttackVictim(victimTeamId, attackTeamId) {
        const state = window.gameState?.get();
        if (!state) return;
        
        console.log(`🎯 Handling devil attack consequences: Victim ${victimTeamId}, Attacker ${attackTeamId}`);
        
        // Delay score updates until after answer animation (3 seconds)
        setTimeout(() => {
            if (attackTeamId) {
                // Give +2 points to the attacking team
                const attackerNewScore = (state.teams[attackTeamId].score || 0) + 2;
                if (window.gameState) {
                    window.gameState.update(`teams.${attackTeamId}.score`, attackerNewScore);
                    console.log(`✅ Attacker Team ${attackTeamId} gets +2 points (new score: ${attackerNewScore})`);
                }
            }
            
            // Apply -1 penalty to victim team
            const victimNewScore = Math.max(0, (state.teams[victimTeamId].score || 0) - 1);
            if (window.gameState) {
                window.gameState.update(`teams.${victimTeamId}.score`, victimNewScore);
                console.log(`✅ Victim Team ${victimTeamId} gets -1 penalty (new score: ${victimNewScore})`);
            }
            
            // Show coin_minus animation after score update
            setTimeout(() => {
                this.showScoreAnimation(-1);
            }, 500); // Small delay after score update
            
        }, 2500); // Wait for answer animation to complete
        
        // Reset attack tracking parameters
        if (window.gameState) {
            window.gameState.set('attackTeam', 0);
            window.gameState.set('victimTeam', 0);
            console.log('✅ Attack tracking parameters reset');
        }
        
        // Trigger auto-navigation after coin animation (additional 2.5 seconds)
        setTimeout(() => {
            // Ensure cross protection remains visible after victim answers
            if (window.gameState) {
                window.gameState.updateTeamDisplays();
                console.log('✅ Team displays updated to maintain cross protection visibility');
                
                // Debug: Check cross protection status for all teams
                const state = window.gameState.get();
                for (let teamId = 1; teamId <= 6; teamId++) {
                    const crossStatus = state.actionCards[teamId].cross;
                    if (crossStatus) {
                        console.log(`🛡️ Team ${teamId} cross protection is ACTIVE after victim answer`);
                    }
                }
            }
            this.handleAutoNavigationAfterIncorrect();
        }, 2500); // 0.5s (score delay) + 2s (coin animation)
    }
    
    // Handle normal Q1 incorrect (-1 penalty)
    handleNormalQ1Incorrect(teamId) {
        const state = window.gameState?.get();
        if (!state) return;
        
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
            console.log(`❌ Angel card permanently disabled for Team ${teamId} due to incorrect answer`);
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
                console.log('✅ Team displays updated to maintain cross protection visibility');
                
                // Debug: Check cross protection status for all teams
                const state = window.gameState.get();
                for (let teamId = 1; teamId <= 6; teamId++) {
                    const crossStatus = state.actionCards[teamId].cross;
                    if (crossStatus) {
                        console.log(`🛡️ Team ${teamId} cross protection is ACTIVE after victim answer`);
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
            console.log(`❌ Angel card permanently disabled for Team ${teamId} due to incorrect answer`);
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
                console.log('✅ Team displays updated to maintain cross protection visibility');
                
                // Debug: Check cross protection status for all teams
                const state = window.gameState.get();
                for (let teamId = 1; teamId <= 6; teamId++) {
                    const crossStatus = state.actionCards[teamId].cross;
                    if (crossStatus) {
                        console.log(`🛡️ Team ${teamId} cross protection is ACTIVE after victim answer`);
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
            console.log(`❌ Angel card permanently disabled for Team ${teamId} due to incorrect answer`);
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
                    console.log('✅ Team displays updated to maintain cross protection visibility');
                }
                this.handleAutoNavigationAfterIncorrect();
            }, 2500); // 0.5s (score delay) + 2s (coin animation)
        } else {
            // Q2-Q4: No penalty, no animation
            // Ensure cross protection remains visible after victim answers
            if (window.gameState) {
                window.gameState.updateTeamDisplays();
                console.log('✅ Team displays updated to maintain cross protection visibility');
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
                if (window.gameState) {
                    window.gameState.moveToQuestion(nextSet, 1);
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
            if (window.gameState) {
                window.gameState.moveToQuestion(nextSet, 1);
            }
            
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
        console.log(`🎬 showAnswerAnimation called with isCorrect: ${isCorrect}`);
        
        const modal = document.getElementById('answerModal');
        const animationContainer = modal.querySelector('.answer-modal-content');
        
        if (!modal || !animationContainer) {
            console.warn('⚠️ Answer modal elements not found');
            return;
        }
        
        // Set the appropriate animation
        const animationSrc = isCorrect ? 
            'assets/animations/answer_correct.json' : 
            'assets/animations/answer_incorrect.json';
        
        console.log(`🎬 Loading answer animation: ${animationSrc} (isCorrect: ${isCorrect})`);
        
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
                console.log(`✅ Answer animation playing: ${animationSrc} (new element)`);
            }
        }, 200);
        
        // Play sound
        const audioSrc = isCorrect ? 
            'assets/audio/correct-duolingo.mp3' : 
            'assets/audio/incorrect-duolingo.mp3';
        const audio = new Audio(audioSrc);
        audio.volume = 1;
        audio.play().catch(() => {
            console.warn('⚠️ Could not play answer sound');
        });
        
        // Hide modal after 2 seconds
        setTimeout(() => {
            modal.classList.remove('active');
        }, 2500);
    }
    
    
    // Show score animation using coin assets
    async showScoreAnimation(scoreChange) {
        console.log(`🪙 Showing score animation for change: ${scoreChange}`);
        
        const scoreAnimation = document.getElementById('scoreAnimation');
        
        if (!scoreAnimation) {
            console.warn('⚠️ Score animation element not found');
            return;
        }
        
        const animationSrc = scoreChange > 0 ?
            'assets/animations/coin_plus.json' :
            'assets/animations/coin_minus.json';
        
        console.log(`🪙 Loading coin animation: ${animationSrc}`);
        
        // Show the animation using the class
        scoreAnimation.classList.add('active');
        console.log('🪙 Added active class to score animation');
        
        // Simple approach: just load and play the animation
        scoreAnimation.src = animationSrc;
        scoreAnimation.load(animationSrc);
        
        // Check if element is visible
        setTimeout(() => {
            const isVisible = scoreAnimation.classList.contains('active');
            const computedStyle = window.getComputedStyle(scoreAnimation);
            console.log(`🪙 Animation visibility check - Active class: ${isVisible}, Display: ${computedStyle.display}, Visibility: ${computedStyle.visibility}`);
        }, 50);
        
        // Hide after 2 seconds
        setTimeout(() => {
            scoreAnimation.classList.remove('active');
            console.log('🪙 Removed active class from score animation');
        }, 2500);
    }
    
    // Handle angel card toggle
    handleAngelCard() {
        const state = window.gameState?.get();
        if (!state || !state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            console.warn('⚠️ No team currently buzzing - cannot use angel card');
            return;
        }
        
        const teamId = state.currentTeam;
        
        // Check if angel card is available (true in actionCards)
        if (!state.actionCards[teamId].angel) {
            console.warn(`⚠️ Angel card for Team ${teamId} is not available`);
            return;
        }
        
        const angelIcon = document.getElementById('mainCharacterAngel');
        const currentlyActive = state.angelTeam === teamId;
        
        // Toggle angel team (temporary activation)
        const newAngelTeam = currentlyActive ? 0 : teamId;
        
        if (window.gameState) {
            window.gameState.set('angelTeam', newAngelTeam);
        }
        
        // Update main character icon
        if (angelIcon) {
            angelIcon.classList.toggle('active', newAngelTeam > 0);
        }
        
        // Apply or remove angel effect (no animation for toggle)
        if (newAngelTeam > 0) {
            // Just send socket update, no animation
            if (window.socketManager) {
                window.socketManager.send('angel_protection_applied', { 
                    teamId,
                    effect: 'protection against score decrease'
                });
            }
        } else {
            // Just send socket update, no animation
            if (window.socketManager) {
                window.socketManager.send('angel_protection_removed', { 
                    teamId,
                    effect: 'no longer protected from score decrease'
                });
            }
        }
        
        // Sync with server
        if (window.socketManager) {
            window.socketManager.send('angel_activated', { teamId, activated: newAngelTeam > 0 });
        }
        
    }
    
    // Handle devil card toggle (open/close attack modal)
    handleDevilCard() {
        const state = window.gameState?.get();
        if (!state || !state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            console.warn('⚠️ No team currently buzzing - cannot use devil card');
            return;
        }
        
        const teamId = state.currentTeam;
        
        // Check if devil card is available (true in actionCards)
        if (!state.actionCards[teamId].devil) {
            console.log(`🚫 Devil card for Team ${teamId} is not available - cannot activate`);
            return;
        }
        
        console.log(`👿 Attempting to use devil card for Team ${teamId} (devil: ${state.actionCards[teamId].devil})`);
        
        const modal = document.getElementById('devilAttackModal');
        const isModalOpen = modal && modal.classList.contains('active');
        
        if (isModalOpen) {
            // Close modal if already open
            this.closeDevilAttackModal(teamId);
        } else {
            // Open modal
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
    closeDevilAttackModal(teamId) {
        const modal = document.getElementById('devilAttackModal');
        if (modal) {
            modal.classList.remove('active');
            modal.dataset.attackingTeam = null;
            modal.dataset.targetTeam = null;
        }
        
        // Reset attack team parameter
        if (window.gameState) {
            window.gameState.set('attackTeam', 0);
        }
        
        // Update main character devil icon
        const devilIcon = document.getElementById('mainCharacterDevil');
        if (devilIcon) {
            devilIcon.classList.remove('active');
        }
        
        console.log(`👿 Devil attack modal closed for Team ${teamId}`);
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
                console.warn('⚠️ Please select a target team first');
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
        
        // Send socket update
        if (window.socketManager) {
            window.socketManager.send('angel_protection_applied', { 
                teamId,
                effect: 'protection against score decrease'
            });
        }
    }
    
    // Remove angel card effect (no longer protected)
    removeAngelEffect(teamId) {
        
        // Send socket update
        if (window.socketManager) {
            window.socketManager.send('angel_protection_removed', { 
                teamId,
                effect: 'no longer protected from score decrease'
            });
        }
    }
    
    // Helper function to show protection animations
    async showProtectionAnimation(text) {
        console.log('🛡️ Showing protection animation for angel card');
        
        const scoreAnimation = document.getElementById('scoreAnimation');
        
        if (!scoreAnimation) {
            console.warn('⚠️ Score animation element not found');
            return;
        }
        
        // Show the animation using the class
        scoreAnimation.classList.add('active');
        scoreAnimation.classList.add('bigger');
        console.log('🛡️ Added active class to score animation');
        
        // Simple approach: just load and play the animation
        scoreAnimation.src = 'assets/animations/coin_shield.json';
        scoreAnimation.load('assets/animations/coin_shield.json');
        
        // Check if element is visible
        setTimeout(() => {
            const isVisible = scoreAnimation.classList.contains('active');
            const computedStyle = window.getComputedStyle(scoreAnimation);
            console.log(`🛡️ Animation visibility check - Active class: ${isVisible}, Display: ${computedStyle.display}, Visibility: ${computedStyle.visibility}`);
        }, 50);
        
        // Play the animation
        setTimeout(() => {
            if (scoreAnimation.play) {
                scoreAnimation.play();
                console.log('✅ Protection animation playing: coin_shield.json');
            }
        }, 100);
        
        // Hide after 2 seconds
        setTimeout(() => {
            scoreAnimation.classList.remove('active');
            scoreAnimation.classList.remove('bigger');
            console.log('🛡️ Removed active class from score animation');
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
                console.log(`🛡️ Team ${targetTeamId} has cross protection - cannot be attacked`);
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
            console.warn(`⚠️ Cannot attack Team ${targetTeamId} - they have cross protection`);
            return;
        }
        
        // Check if there's already an active attack in progress
        if (state?.attackTeam && state?.victimTeam) {
            console.warn(`⚠️ Cannot attack Team ${targetTeamId} - there's already an active attack in progress`);
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
            console.warn('⚠️ Missing attacking team or target team');
            return;
        }
        
        console.log(`🎯 Devil attack confirmed: Team ${attackingTeamId} attacking Team ${targetTeamId}`);
        
        // Set attack tracking parameters in game state
        if (window.gameState) {
            window.gameState.set('attackTeam', attackingTeamId);
            window.gameState.set('victimTeam', targetTeamId);
            console.log(`✅ Attack tracking set: attackTeam=${attackingTeamId}, victimTeam=${targetTeamId}`);
        }
        
        // Permanently disable devil card for attacking team
        if (window.gameState) {
            window.gameState.update(`actionCards.${attackingTeamId}.devil`, false);
            console.log(`✅ Devil card permanently disabled for Team ${attackingTeamId}`);
            
            // Update team displays to show devil card as inactive (gray)
            window.gameState.updateTeamDisplays();
        }
        
        // Activate cross protection for victim team
        if (window.gameState) {
            window.gameState.update(`actionCards.${targetTeamId}.cross`, true);
            console.log(`✅ Cross protection activated for Team ${targetTeamId}`);
            
            // Update team displays to show cross card as active (colorful)
            window.gameState.updateTeamDisplays();
        }
        
        // Update main character devil icon
        const devilIcon = document.getElementById('mainCharacterDevil');
        if (devilIcon) {
            devilIcon.classList.add('active');
        }
        
        // Close modal
        this.closeDevilAttackModal(attackingTeamId);
        
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
            console.error('❌ Error in attack animation:', error);
        }
    }
    
    // Show both attacker and victim characters side by side
    async showDualCharacterAnimation(attackingTeamId, targetTeamId, attackingColor, victimColor) {
        const progressCharacter = document.getElementById('progressCharacter');
        const victimCharacter = document.getElementById('victimCharacter');
        
        if (!progressCharacter || !victimCharacter) {
            console.warn('⚠️ Character elements not found for dual animation');
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
            console.error('❌ Error in dual character animation:', error);
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
            console.error('❌ Error setting up victim character:', error);
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
            console.error('❌ Error setting up attacker character:', error);
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
                crossIcon.classList.add('active');
            }
            
        } catch (error) {
            console.error('❌ Error changing current character color:', error);
        }
    }
    
    // Activate cross protection for victim team
    activateCrossProtection(victimTeamId) {
        console.log(`🛡️ Activating cross protection for Team ${victimTeamId}`);
        
        // Update game state
        if (window.gameState) {
            window.gameState.update(`actionCards.${victimTeamId}.cross`, true);
            console.log(`✅ Game state updated: actionCards.${victimTeamId}.cross = true`);
        }
        
        // Verify the update worked
        const updatedState = window.gameState.get();
        const crossStatus = updatedState.actionCards[victimTeamId].cross;
        console.log(`🔍 Verification: Team ${victimTeamId} cross status is now: ${crossStatus}`);
        
        // Force update team displays to ensure cross protection is shown
        if (window.gameState) {
            window.gameState.updateTeamDisplays();
            console.log('✅ Team displays updated via game state');
        }
        
        // Sync with server using existing card_update event
        if (window.socketManager) {
            window.socketManager.send('card_update', { 
                teamId: victimTeamId,
                cardType: 'cross',
                active: true
            });
            console.log('✅ Cross protection synced with server via card_update');
        }
        
        console.log(`🛡️ Cross protection activation complete for Team ${victimTeamId}`);
    }
    
    // Remove cross protection for victim team
    removeCrossProtection(victimTeamId) {
        console.log(`🛡️ Removing cross protection for Team ${victimTeamId}`);
        
        // Update game state
        if (window.gameState) {
            window.gameState.update(`actionCards.${victimTeamId}.cross`, false);
            console.log(`✅ Game state updated: actionCards.${victimTeamId}.cross = false`);
        }
        
        // Remove cross action from main character
        const crossIcon = document.getElementById('mainCharacterCross');
        if (crossIcon) {
            crossIcon.classList.remove('active');
            console.log('✅ Main character cross icon deactivated');
        }
        
        // Force update team displays to ensure cross protection is removed
        if (window.gameState) {
            window.gameState.updateTeamDisplays();
            console.log('✅ Team displays updated via game state');
        }
        
        // Sync with server using existing card_update event
        if (window.socketManager) {
            window.socketManager.send('card_update', { 
                teamId: victimTeamId,
                cardType: 'cross',
                active: false
            });
            console.log('✅ Cross protection removal synced with server via card_update');
        }
        
        // Clear attacked team status
        if (window.gameState) {
            window.gameState.set('attackedTeam', 0);
            console.log('✅ Attacked team status cleared');
        }
        
        console.log(`🛡️ Cross protection removal complete for Team ${victimTeamId}`);
    }
    
    // Play stationary kill sound effect three times
    playStationaryKillSound() {
        console.log('🔊 Playing stationary kill sound effect three times');
        
        const soundFile = 'assets/audio/stationary-kill-among-us.mp3';
        let playCount = 0;
        const maxPlays = 3;
        
        const playSound = () => {
            if (playCount >= maxPlays) {
                console.log('✅ Stationary kill sound effect completed (3 plays)');
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
                    console.log(`🔊 Stationary kill sound ${playCount}/${maxPlays} played`);
                    
                    // Play next sound after current one finishes
                    soundInstance.addEventListener('ended', () => {
                        // Small delay between sounds
                        setTimeout(() => {
                            playSound();
                        }, 30); // Reduced delay for better timing
                    });
                    
                }).catch((error) => {
                    console.warn('⚠️ Could not play stationary kill sound:', error);
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
        const state = window.gameState?.get();
        if (!state || !state.currentTeam || state.currentTeam < 1 || state.currentTeam > 6) {
            console.warn('⚠️ No team currently buzzing - cannot toggle challenge mode');
            return;
        }
        
        const teamId = state.currentTeam;
        
        // Check current challenge state
        const isCurrentlyActive = state.currentChallenge === teamId;
        
        if (isCurrentlyActive) {
            // Deactivate challenge mode
            if (window.gameState) {
                window.gameState.set('currentChallenge', 0);
            }
            
            // Deactivate visual challenge icon
            const challengeIcon = document.getElementById('mainCharacterChallenge');
            if (challengeIcon) {
                challengeIcon.classList.remove('active');
            }
            
            // Sync with server
            if (window.socketManager) {
                window.socketManager.send('challenge_reset', { teamId: teamId });
            }
            
        } else {
            // Activate challenge mode
            if (window.gameState) {
                window.gameState.set('currentChallenge', teamId);
            }
            
            // Activate visual challenge icon
            const challengeIcon = document.getElementById('mainCharacterChallenge');
            if (challengeIcon) {
                challengeIcon.classList.add('active');
            }
            
            // Sync with server
            if (window.socketManager) {
                window.socketManager.send('challenge_activated', { teamId: teamId });
            }
            
            console.log(`⚡ Challenge mode activated for Team ${teamId} (+2/-1 scoring)`);
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
        console.log(`🎯 HotkeysManager: navigateMainPage called with direction: ${direction}`);
        
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
        
        console.log(`🎯 HotkeysManager: Moving from set ${currentSet} question ${currentQuestion} to set ${newSet} question ${newQuestion}`);
        
        // Update character position (let character controller handle game state update)
        if (window.characterController) {
            window.characterController.moveToQuestion(newSet, newQuestion);
        } else {
            console.error('❌ HotkeysManager: characterController not available');
        }
        
        // Update UI elements directly if game state is not available
        if (!window.gameState) {
            this.updateMainPageUI(newSet, newQuestion);
        }
        
        // Sync with server if socket manager is available
        if (window.socketManager) {
            window.socketManager.updateProgress(newSet, newQuestion);
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
        if (window.socket && window.socket.connected) {
            window.socket.emit('progress_update', { 
                setNumber: setNumber, 
                questionNumber: questionNumber,
                title: window.gameState?.state?.questionSets[setNumber]?.title || '',
                subject: window.gameState?.state?.questionSets[setNumber]?.theme || 'general',
                animateRun: true
            });
        }
        
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
        console.log('🔄 HotkeysManager: Resetting buzzers...');
        
        // Send RESET command to Arduino via server
        if (window.socketManager) {
            window.socketManager.resetBuzzers();
            console.log('✅ RESET command sent to Arduino via server');
        } else {
            console.log('⚠️ No Arduino communication available');
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
            console.log('✅ Team displays updated after buzzer reset to maintain cross protection visibility');
            
            // Debug: Check cross protection status for all teams
            const state = window.gameState.get();
            for (let teamId = 1; teamId <= 6; teamId++) {
                const crossStatus = state.actionCards[teamId].cross;
                if (crossStatus) {
                    console.log(`🛡️ Team ${teamId} cross protection is ACTIVE after buzzer reset`);
                }
            }
        }
        
        console.log('✅ Buzzers reset, action card states preserved, visuals updated');
    }
    
    // Handle game state reset (resets everything including team action cards)
    handleGameReset() {
        console.log('🔄 handleGameReset called - FULL RESET');
        
        // Reset entire game state (this should reset all team action cards)
        if (window.gameState) {
            window.gameState.reset();
            // Ensure attack tracking parameters are reset
            window.gameState.set('angelTeam', 0);
            window.gameState.set('attackTeam', 0);
            window.gameState.set('victimTeam', 0);
            console.log('✅ Game state reset completed (including team action cards and attack tracking)');
        } else {
            console.warn('⚠️ GameState not available for reset');
        }
        
        // Clear all action card icons on main character
        document.querySelectorAll('.character-action-icon').forEach(icon => {
            icon.classList.remove('active');
        });
        console.log('✅ Main character action card icons cleared');
        
        // Reset character to white directly
        const progressCharacter = document.getElementById('progressCharacter');
        if (progressCharacter) {
            progressCharacter.src = 'assets/animations/among_us_idle.json';
            console.log('✅ Character reset to white (direct)');
        } else {
            console.warn('⚠️ progressCharacter element not found');
        }
        
        // Reset all gray team characters back to default state
        this.resetTeamGraying();
        console.log('✅ All team characters reset from gray to default state');
        
        // Clear all Q1 failure tracking states for all sets
        if (window.gameState) {
            for (let setNumber = 1; setNumber <= 10; setNumber++) {
                this.clearQ1FailedTeams(setNumber);
                const attemptsKey = `q1Attempts_${setNumber}`;
                window.gameState.set(attemptsKey, 0);
            }
            console.log('✅ All Q1 failure tracking states cleared');
        }
        
        // Hide chance display
        this.hideChanceDisplay();
        console.log('✅ Chance display hidden');
        
        // Clear buzzing modal
        if (window.buzzingSystem) {
            window.buzzingSystem.clearAll();
            console.log('✅ Buzzing system cleared');
        } else {
            console.warn('⚠️ BuzzingSystem not available');
        }
        
        // Force update team displays to show reset action cards
        if (window.gameState) {
            window.gameState.updateTeamDisplays();
            console.log('✅ Team displays updated to show reset action cards');
        }
        
        // Sync with server for full game reset
        if (window.socketManager) {
            window.socketManager.send('admin_reset', {});
            console.log('✅ Full game reset synced with server');
        }
        
        console.log('🔄 FULL game reset completed - everything back to default');
    }
    
    // Handle timer toggle for both pages
    handleTimerToggle() {
        console.log('⏱️ Timer toggle triggered');
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
                console.log(`⏱️ Timer running: ${!currentRunning}`);
            }
            window.socketManager?.startTimer();
        }
    }
    
    // Start timer
    startTimer() {
        if (window.socket && window.socket.connected) {
            window.socket.emit('start_timer');
        }
        
        // Update UI
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.add('timer-running');
        }
    }
    
    // Handle pause timer for both pages
    handlePauseTimer() {
        if (this.pageType === 'console') {
            if (window.socket && window.socket.connected) {
                window.socket.emit('pause_timer');
            }
            
            // Update UI
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-running');
            }
        } else {
            // Main page: Update local game state and UI immediately
            if (window.gameState) {
                window.gameState.set('timerRunning', false);
                window.gameState.updateTimerDisplay();
            }
            window.socketManager?.pauseTimer();
        }
    }
    
    // Handle stop timer for both pages
    handleStopTimer() {
        console.log('⏹️ Timer stop triggered');
        if (this.pageType === 'console') {
            if (window.socket && window.socket.connected) {
                window.socket.emit('stop_timer');
            }
            
            // Update UI
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-running');
                timerDisplay.textContent = '0:15';
            }
        } else {
            // Main page: Update local game state and UI immediately
            if (window.gameState) {
                window.gameState.set('timerRunning', false);
                window.gameState.set('timerValue', 15);
                window.gameState.updateTimerDisplay();
                console.log('⏹️ Timer stopped and reset to 15 seconds');
            }
            window.socketManager?.stopTimer();
        }
    }
    
    // Handle reset timer for both pages
    handleResetTimer() {
        console.log('🔄 Timer reset triggered');
        if (this.pageType === 'console') {
            if (window.socket && window.socket.connected) {
                window.socket.emit('reset_timer', { value: 15 });
            }
            
            // Update UI
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-running');
                timerDisplay.textContent = '0:15';
            }
        } else {
            // Main page: Update local game state and UI immediately
            if (window.gameState) {
                window.gameState.set('timerRunning', false);
                window.gameState.set('timerValue', 15);
                window.gameState.updateTimerDisplay();
                console.log('🔄 Timer reset to 15 seconds');
            }
            window.socketManager?.resetTimer();
        }
    }
    
    // Test emergency meeting function
    testEmergencyMeeting() {
        console.log('🧪 Testing emergency meeting...');
        if (window.gameState) {
            window.gameState.set('timerValue', 0);
            window.gameState.set('timerRunning', false);
            window.gameState.triggerEmergencyMeeting();
        }
    }
    
    // Handle decrease timer by 1 second
    handleDecreaseTimer() {
        console.log('⏱️ Decreasing timer by 1 second');
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
                
                // Send to server
                if (window.socketManager) {
                    window.socketManager.setTimer(newSeconds);
                }
            }
        } else {
            // Main page: Update local game state
            if (window.gameState) {
                const currentValue = window.gameState.get('timerValue');
                const newValue = Math.max(0, currentValue - 1); // Don't go below 0
                window.gameState.set('timerValue', newValue);
                window.gameState.updateTimerDisplay();
                console.log(`⏱️ Timer decreased to ${newValue} seconds`);
            }
            
            // Sync with server
            if (window.socketManager) {
                const newValue = window.gameState?.get('timerValue') || 0;
                window.socketManager.setTimer(newValue);
            }
        }
    }
    
    // Handle increase timer by 1 second
    handleIncreaseTimer() {
        console.log('⏱️ Increasing timer by 1 second');
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
                
                // Send to server
                if (window.socketManager) {
                    window.socketManager.setTimer(newSeconds);
                }
            }
        } else {
            // Main page: Update local game state
            if (window.gameState) {
                const currentValue = window.gameState.get('timerValue');
                const newValue = currentValue + 1;
                window.gameState.set('timerValue', newValue);
                window.gameState.updateTimerDisplay();
                console.log(`⏱️ Timer increased to ${newValue} seconds`);
            }
            
            // Sync with server
            if (window.socketManager) {
                const newValue = window.gameState?.get('timerValue') || 0;
                window.socketManager.setTimer(newValue);
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
    
    // Generate help content
    generateHelpContent() {
        const categories = {
            'Team Controls': ['1', '2', '3', '4', '5', '6'],
            'Navigation': ['arrowleft', 'arrowright'],
            'Game Controls': ['r', 'q'],
            'Timer Controls': ['i', 'o', 'p', '[', ']'],
            'Display Controls': ['f']
        };
        
        // Add console-specific categories
        if (this.pageType === 'console') {
            categories['Console Tabs'] = ['t', 'g', 'h'];
        }
        
        let html = `<h3>Available Hotkeys (${this.pageType.toUpperCase()} Page)</h3>`;
        
        Object.entries(categories).forEach(([category, keys]) => {
            html += `<div class="help-category"><h4>${category}</h4><ul>`;
            
            keys.forEach(key => {
                const handlers = this.bindings.get(key);
                if (handlers && handlers.length > 0) {
                    const description = handlers[0].description;
                    const displayKey = this.getDisplayKey(key);
                    html += `<li><kbd>${displayKey}</kbd> - ${description}</li>`;
                }
            });
            
            html += '</ul></div>';
        });
        
        return html;
    }
    
    // Get display-friendly key name
    getDisplayKey(key) {
        const displayMap = {
            'space': 'Space',
            'arrowleft': '←',
            'arrowright': '→',
            'arrowup': '↑',
            'arrowdown': '↓'
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
            background: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; max-height: 80vh; overflow-y: auto;">
                <div class="help-content"></div>
                <button onclick="this.closest('#hotkeys-help-modal').style.display='none'" 
                        style="margin-top: 20px; padding: 8px 16px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
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