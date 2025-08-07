/**
 * Character Controller
 * Manages character movement, positioning, and animations with proper alignment
 */

class CharacterController {
    constructor() {
        this.character = null;
        this.characterPlayer = null;
        this.isAnimating = false;
        this.animationTimeout = null;
        this.initialized = false;
        this.preventPositionUpdate = false; // Flag to prevent position updates during animation
    }
    
    // Initialize character controller
    init() {
        if (this.initialized) {
            return true;
        }
        
        // Skip initialization on console page
        if (window.location.pathname.includes('console')) {
            return false;
        }
        
        this.character = document.querySelector('.character-container-main');
        this.characterPlayer = document.getElementById('progressCharacter');
        
        if (!this.character || !this.characterPlayer) {
            return false;
        }
        
        // Subscribe to game state changes
        if (window.gameState) {
            window.gameState.subscribe('currentSet', () => this.updatePosition());
            window.gameState.subscribe('currentQuestion', () => this.updatePosition());
            window.gameState.subscribe('currentTeam', async (teamId) => {
                
                // Ensure ProgressWhite is available before updating character color
                if (window.ProgressWhite) {
                    await this.updateProgressCharacterColor(teamId);
                } else {
                    setTimeout(async () => {
                        if (window.ProgressWhite) {
                            await this.updateProgressCharacterColor(teamId);
                        } else {
                        }
                    }, 500);
                }
            });
        } else {
        }
        
        // Set initial position only if game state is ready
        if (window.gameState) {
            // Wait a bit for game state to be fully initialized
            setTimeout(() => {
                this.updatePosition();
            }, 100);
        } else {
            // Fallback: set to default position without movement
            this.character.style.left = '34%';
        }
        
        
        this.initialized = true;
        return true;
    }
    
    // Move character to specific question
    moveToQuestion(setNumber, questionNumber) {
        
        // Check if character player is available
        if (!this.characterPlayer) {
            return false;
        }
        
        // Check if we're already animating
        if (this.isAnimating) {
            return false;
        }
        
        // 1. Call for movement - calculate target position and direction
        const targetPosition = this.calculateCharacterPosition(setNumber, questionNumber);
        
        // FIX: Calculate direction based on question numbers, not current position
        // Get current question and set from game state BEFORE updating it
        let currentQuestion = 1;
        let currentSet = 1;
        if (window.gameState) {
            const state = window.gameState.get();
            currentQuestion = state.currentQuestion;
            currentSet = state.currentSet;
        }
        
        // Check if we're already at the target question AND set
        if (currentQuestion === questionNumber && currentSet === setNumber) {
            return false;
        }
        
        // Determine direction based on circular planet layout and visual logic
        let isForward = false;
        
        // Special cases for circular transitions (beautiful transitions)
        if (currentSet !== setNumber) {
            // Moving between different sets
            if (currentQuestion === 4 && questionNumber === 1 && setNumber === currentSet + 1) {
                // Q4 → Q1 of next set: go backward (shorter visual path)
                isForward = false;
            } else if (currentQuestion === 1 && questionNumber === 4 && setNumber === currentSet - 1) {
                // Q1 → Q4 of previous set: go forward (shorter visual path)
                isForward = true;
            } else if (questionNumber === 1 && setNumber === currentSet + 1) {
                // Q2/Q3 → Q1 of next set: go backward (shorter visual path, like Q4→Q1)
                isForward = false;
            } else {
                // Regular set transitions
                isForward = setNumber > currentSet;
            }
        } else {
            // Same set, check question number
            isForward = questionNumber > currentQuestion;
        }
        
        const direction = isForward ? 'forward' : 'backward';
        
        // Set animation flags BEFORE updating game state to prevent position updates
        this.isAnimating = true;
        this.preventPositionUpdate = true; // Prevent game state from updating position
        
        // 2. Check backward or forward and update game-state
        if (window.gameState) {
            const success = window.gameState.moveToQuestion(setNumber, questionNumber);
            if (!success) {
                this.preventPositionUpdate = false; // Clear flag on failure
                this.isAnimating = false;
                return false;
            }
        }
        
        // Set game state animation flag after successful update
        if (window.gameState) {
            window.gameState.set('isAnimating', true);
        }
        
        // 3. Use the main character animation for movement
        if (window.ProgressWhite?.mainCharacterAnimation) {
            window.ProgressWhite.mainCharacterAnimation.playRunAnimation(direction, targetPosition)
                .then(() => {
                    // Animation completed
                    this.isAnimating = false;
                    this.preventPositionUpdate = false;
                    if (window.gameState) {
                        window.gameState.set('isAnimating', false);
                    }
                })
                .catch((error) => {
                    this.isAnimating = false;
                    this.preventPositionUpdate = false;
                    if (window.gameState) {
                        window.gameState.set('isAnimating', false);
                    }
                });

        } else {
            this.isAnimating = false;
            this.preventPositionUpdate = false;
            return false;
        }
        
        // Sync with server
        
        return true;
    }
    
    // Calculate character position based on game state
    calculateCharacterPosition(setNumber, questionNumber) {
        if (window.gameState) {
            return window.gameState.getCharacterPosition(setNumber, questionNumber);
        }
        
        // Fallback if game state is not available
        const questionPositions = {
            1: 34, // Q1 position
            2: 45, // Q2 position  
            3: 55, // Q3 position
            4: 66  // Q4 position
        };
        
        const position = questionPositions[questionNumber];
        return position !== undefined ? position : 34;
    }
    
    // Update character position based on current game state
    updatePosition() {
        if (!this.character || this.isAnimating || this.preventPositionUpdate) return;
        
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
        
        const newPosition = this.calculateCharacterPosition(currentSet, currentQuestion);
        const currentPosition = parseFloat(this.character.style.left) || 34;
        
        // Only update if position actually needs to change
        if (Math.abs(newPosition - currentPosition) > 0.1) {
            this.character.style.left = `${newPosition}%`;
        } else {
        }
    }
    
    // Start run animation (for other uses, not movement)
    startRunAnimation(direction = 'forward') {
        if (!this.characterPlayer) {
            return;
        }
        
        // Get animation configuration from game state
        const animations = window.gameState?.get('config')?.animations || {
            runSrc: 'assets/animations/among_us_run.json',
            idleSrc: 'assets/animations/among_us_idle.json',
            movementDuration: 1200,
            animationTimeout: 2000
        };
        
        const runSrc = animations.runSrc;
        const idleSrc = animations.idleSrc;
        const movementDuration = animations.movementDuration;
        
        // Get current team state to determine color
        let currentTeam = 0;
        if (window.gameState) {
            const state = window.gameState.get();
            currentTeam = state.currentTeam || 0;
        }
        
        // Get the main character element (not the container)
        const mainCharacter = document.querySelector('.main-character');
        if (!mainCharacter) {
            return;
        }
        
        // Set direction - combine scaleX (flipping) with translateY (bounce animation)
        const scaleX = direction === 'forward' ? 1 : -1;
        mainCharacter.style.transform = `scaleX(${scaleX}) translateY(var(--bounce-y, 0px))`;
        
        // Load and play run animation
        this.characterPlayer.src = runSrc;
        this.characterPlayer.load(runSrc);
        this.characterPlayer.classList.add('running');
        
        this.characterPlayer.addEventListener('load', async () => {
            // Apply color
            if (currentTeam === 0) {
                if (window.ProgressWhite?.applyCharacterColor) {
                    await window.ProgressWhite.applyCharacterColor('progressCharacter', 'white');
                } else {
                    window.ProgressWhite?.setProgressCharacterToWhite();
                }
            } else {
                const team = window.gameState?.get()?.teams?.[currentTeam];
                if (team && team.color && window.ProgressWhite?.applyCharacterColor) {
                    await window.ProgressWhite.applyCharacterColor('progressCharacter', team.color);
                } else {
                    if (window.ProgressWhite?.applyCharacterColor) {
                        await window.ProgressWhite.applyCharacterColor('progressCharacter', 'white');
                    } else {
                        window.ProgressWhite?.setProgressCharacterToWhite();
                    }
                }
            }
            
            // Play animation
            this.characterPlayer.play();
            
            // Return to idle after duration
            setTimeout(() => {
                this.characterPlayer.src = idleSrc;
                this.characterPlayer.load(idleSrc);
                this.characterPlayer.classList.remove('running');
                
                this.characterPlayer.addEventListener('load', async () => {
                    if (currentTeam === 0) {
                        if (window.ProgressWhite?.applyCharacterColor) {
                            await window.ProgressWhite.applyCharacterColor('progressCharacter', 'white');
                        } else {
                            this.applyWhiteColor();
                        }
                    } else {
                        const team = window.gameState?.get()?.teams?.[currentTeam];
                        if (team && team.color && window.ProgressWhite?.applyCharacterColor) {
                            await window.ProgressWhite.applyCharacterColor('progressCharacter', team.color);
                        } else {
                            if (window.ProgressWhite?.applyCharacterColor) {
                                await window.ProgressWhite.applyCharacterColor('progressCharacter', 'white');
                            } else {
                                this.applyWhiteColor();
                            }
                        }
                    }
                    
                    this.characterPlayer.play();
                }, { once: true });
            }, movementDuration);
        }, { once: true });
    }
    
    // Apply white color to character
    applyWhiteColor(delay = 0) {
        setTimeout(() => {
            // Check if we should apply white or team color based on current state
            let currentTeam = 0;
            if (window.gameState) {
                const state = window.gameState.get();
                currentTeam = state.currentTeam || 0;
            }
            
            if (currentTeam === 0) {
                // No team buzzing - apply white color
                if (window.ProgressWhite?.setProgressCharacterToWhite) {
                    window.ProgressWhite.setProgressCharacterToWhite()
                        .then(success => {
                            if (!success && window.ProgressWhite?.setProgressCharacterToWhite) {
                                window.ProgressWhite.setProgressCharacterToWhite();
                            }
                        })
                        .catch(() => {
                            if (window.ProgressWhite?.setProgressCharacterToWhite) {
                                window.ProgressWhite.setProgressCharacterToWhite();
                            }
                        });
                }
            } else {
                // Team is buzzing - apply team color
                this.updateProgressCharacterColor(currentTeam);
            }
        }, delay);
    }
    
    // Update progress character color based on current team
    async updateProgressCharacterColor(teamId) {
        
        // Check if progress character element exists and is ready
        const progressCharacter = document.getElementById('progressCharacter');
        if (!progressCharacter) {
            return;
        }
        
        if (!progressCharacter.load) {
            setTimeout(() => this.updateProgressCharacterColor(teamId), 500);
            return;
        }
        
        if (!teamId || teamId < 1 || teamId > 6) {
            // Invalid team ID - set to white using unified function
            try {
                const progressCharacter = document.getElementById('progressCharacter');
                if (progressCharacter) {
                    // Small delay to ensure element is ready
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Use unified function for white color
                    if (window.ProgressWhite && window.ProgressWhite.applyCharacterColor) {
                        const success = await window.ProgressWhite.applyCharacterColor('progressCharacter', 'white');
                    } else {
                        // Fallback: direct load() method
                        if (progressCharacter.load) {
                            progressCharacter.load('assets/animations/among_us_idle.json');
                        }
                    }
                } else {
                }
            } catch (error) {
            }
            return;
        }
        
        const team = window.gameState?.get()?.teams?.[teamId];
        
        if (team && team.color && window.ProgressWhite?.applyCharacterColor) {
            try {
                
                // Add a small delay to ensure any previous animations have completed
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const result = await window.ProgressWhite.applyCharacterColor('progressCharacter', team.color);

            } catch (error) {
                // Fallback to white on error
                try {
                    if (window.ProgressWhite?.setProgressCharacterToWhite) {
                        await window.ProgressWhite.setProgressCharacterToWhite();
                    }
                } catch (fallbackError) {
                }
            }
        } else {
            
            // Fallback to white if team color not available
            try {
                if (window.ProgressWhite?.applyCharacterColor) {
                    await window.ProgressWhite.applyCharacterColor('progressCharacter', 'white');
                } else if (window.ProgressWhite?.setProgressCharacterToWhite) {
                    await window.ProgressWhite.setProgressCharacterToWhite();
                }
            } catch (error) {
            }
        }
    }
    
    // Navigation methods
    moveForward() {
        let currentSet = 1;
        let currentQuestion = 1;
        
        if (window.gameState) {
            const state = window.gameState.get();
            currentSet = state.currentSet;
            currentQuestion = state.currentQuestion;
        }
        
        let newSet = currentSet;
        let newQuestion = currentQuestion;
        
        if (currentQuestion < 4) {
            newQuestion = currentQuestion + 1;
        } else if (currentSet < 10) {
            newSet = currentSet + 1;
            newQuestion = 1;
        }
        
        return this.moveToQuestion(newSet, newQuestion);
    }
    
    moveBackward() {
        let currentSet = 1;
        let currentQuestion = 1;
        
        if (window.gameState) {
            const state = window.gameState.get();
            currentSet = state.currentSet;
            currentQuestion = state.currentQuestion;
        }
        
        let newSet = currentSet;
        let newQuestion = currentQuestion;
        
        if (currentQuestion > 1) {
            newQuestion = currentQuestion - 1;
        } else if (currentSet > 1) {
            newSet = currentSet - 1;
            newQuestion = 4;
        }
        
        return this.moveToQuestion(newSet, newQuestion);
    }
    
    // Reset character to start
    reset() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        
        this.isAnimating = false;
        this.preventPositionUpdate = false; // Clear flag on reset
        
        // Reset the main character transform to normal
        const mainCharacter = document.querySelector('.main-character');
        if (mainCharacter) {
            mainCharacter.style.transform = 'scaleX(1) translateY(0)';
        }
        
        // Reset position
        this.updatePosition();
    }
    
    // Cleanup
    destroy() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
    }
    
    // Force position recalculation (for responsive updates)
    recalculatePosition() {
        setTimeout(() => {
            this.updatePosition();
        }, 100);
    }
}

// Export singleton instance
window.characterController = new CharacterController();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.characterController.init();
    });
} else {
    // DOM is already loaded
    window.characterController.init();
}