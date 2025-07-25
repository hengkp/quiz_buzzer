/**
 * Game State Management System
 * Centralized state management for Quiz Bowl application
 */

class GameState {
    constructor() {
        this.state = {
            currentSet: 1,
            currentQuestion: 1,
            currentTeam: 0,
            attackedTeam: 0,
            isAnimating: false,
            timerValue: 0,
            timerRunning: false,
            
            teams: {
                1: { score: 0, name: 'Team A', color: 'red' },
                2: { score: 0, name: 'Team B', color: 'blue' },
                3: { score: 0, name: 'Team C', color: 'lime' },
                4: { score: 0, name: 'Team D', color: 'orange' },
                5: { score: 0, name: 'Team E', color: 'pink' },
                6: { score: 0, name: 'Team F', color: 'yellow' }
            },
            
            actionCards: {
                1: { angel: false, devil: false, cross: false, challenge: false },
                2: { angel: false, devil: false, cross: false, challenge: false },
                3: { angel: false, devil: false, cross: false, challenge: false },
                4: { angel: false, devil: false, cross: false, challenge: false },
                5: { angel: false, devil: false, cross: false, challenge: false },
                6: { angel: false, devil: false, cross: false, challenge: false }
            },
            
            config: {
                totalSets: 10,
                questionsPerSet: 4,
                regularSets: 8,
                timerDuration: 15,
                
                // Character positioning configuration
                characterPositions: {
                    1: 34, // Q1 position (Earth)
                    2: 45, // Q2 position (Moon)
                    3: 55, // Q3 position (Venus)
                    4: 66  // Q4 position (Jupiter)
                },
                
                // Animation configuration
                animations: {
                    runSrc: 'assets/animations/among_us_run.json',
                    idleSrc: 'assets/animations/among_us_idle.json',
                    movementDuration: 1200, // milliseconds
                    animationTimeout: 2000   // milliseconds
                },
                
                // Character size configuration
                characterSize: {
                    width: 'clamp(100px, 15vw, 150px)',
                    height: 'clamp(100px, 15vw, 150px)'
                }
            }
        };
        
        this.listeners = new Map();
        this.initializeUI();
    }
    
    // Initialize UI elements
    initializeUI() {
        // Initialize planet blocks
        this.updatePlanetBlocks();
        
        // Initialize team displays
        this.updateTeamDisplays();
        
        // Initialize timer display
        this.updateTimerDisplay();
        
        // Initialize question set display
        this.updateQuestionSetDisplay();
        
        // Apply character size from configuration
        this.applyCharacterSize();
        
        // Initialize team characters with their team colors
        this.initializeTeamCharacters();
    }
    
    // Initialize team characters with their team colors
    initializeTeamCharacters() {
        if (window.ProgressWhite?.initializeTeamColors) {
            // Use the new function to initialize team colors
            window.ProgressWhite.initializeTeamColors();
        } else {
            // Fallback: apply team colors manually
            const teamColorMap = {
                1: 'red',     // Team A
                2: 'blue',    // Team B
                3: 'lime',    // Team C
                4: 'orange',  // Team D
                5: 'pink',    // Team E
                6: 'yellow'   // Team F
            };
            
            Object.keys(this.state.teams).forEach(teamId => {
                const characterElement = document.getElementById(`teamCharacter${teamId}`);
                const teamColor = teamColorMap[teamId];
                
                if (characterElement && teamColor && window.ProgressWhite?.applyTeamColor) {
                    window.ProgressWhite.applyTeamColor(characterElement, teamColor);
                }
            });
        }
    }
    
    // Get current state
    get(key) {
        return key ? this.state[key] : this.state;
    }
    
    // Update state and notify listeners
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notify(key, value, oldValue);
    }
    
    // Update nested state
    update(path, value) {
        const keys = path.split('.');
        let current = this.state;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        this.notify(path, value, oldValue);
    }
    
    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        return () => this.listeners.get(key).delete(callback);
    }
    
    // Notify listeners
    notify(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(newValue, oldValue);
            });
        }
    }
    
    // Progress management
    moveToQuestion(setNumber, questionNumber) {
        if (this.state.isAnimating || 
            setNumber < 1 || setNumber > this.state.config.totalSets ||
            questionNumber < 1 || questionNumber > this.state.config.questionsPerSet) {
            return false;
        }
        
        this.set('currentSet', setNumber);
        this.set('currentQuestion', questionNumber);
        
        // Update UI elements
        this.updatePlanetBlocks();
        this.updateQuestionSetDisplay();
        
        return true;
    }
    
    // Update planet blocks display
    updatePlanetBlocks() {
        const { currentSet, currentQuestion, config } = this.state;
        const planets = ['earth', 'moon', 'venus', 'jupiter'];
        
        planets.forEach((planet, index) => {
            const planetElement = document.getElementById(planet);
            if (planetElement) {
                planetElement.classList.remove('current', 'completed');
                
                const planetQuestion = index + 1; // 1=earth, 2=moon, 3=venus, 4=jupiter
                
                if (planetQuestion === currentQuestion) {
                    // Current planet for this question
                    planetElement.classList.add('current');
                } else if (planetQuestion < currentQuestion) {
                    // Completed planets in this set
                    planetElement.classList.add('completed');
                }
                // Planets after current question remain default (no class)
            }
        });
    }
    
    // Update team displays
    updateTeamDisplays() {
        Object.keys(this.state.teams).forEach(teamId => {
            const team = this.state.teams[teamId];
            
            // Update team name
            const nameElement = document.getElementById(`teamName${teamId}`);
            if (nameElement) {
                nameElement.textContent = team.name;
            }
            
            // Update team score
            const scoreElement = document.getElementById(`teamScore${teamId}`);
            if (scoreElement) {
                scoreElement.textContent = team.score;
            }
            
            // Update action cards
            const actionCards = this.state.actionCards[teamId];
            if (actionCards) {
                // Angel card
                const angelElement = document.getElementById(`teamAngel${teamId}`);
                if (angelElement) {
                    angelElement.classList.toggle('active', actionCards.angel);
                }
                
                // Devil card
                const devilElement = document.getElementById(`teamDevil${teamId}`);
                if (devilElement) {
                    devilElement.classList.toggle('active', actionCards.devil);
                }
                
                // Cross card
                const crossElement = document.getElementById(`teamCross${teamId}`);
                if (crossElement) {
                    crossElement.classList.toggle('active', actionCards.cross);
                }
            }
        });
    }
    
    // Update timer display
    updateTimerDisplay() {
        const timerElement = document.getElementById('timerDisplay');
        if (timerElement) {
            const minutes = Math.floor(this.state.timerValue / 60);
            const seconds = this.state.timerValue % 60;
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Add running animation class
            timerElement.classList.toggle('timer-running', this.state.timerRunning);
        }
    }
    
    // Update question set display
    updateQuestionSetDisplay() {
        const setElement = document.getElementById('currentQuestionSet');
        if (setElement) {
            setElement.textContent = `Question Set ${this.state.currentSet}`;
        }
        
        // Update the question block number to show current set
        const questionBlockNumber = document.getElementById('questionBlockNumber');
        if (questionBlockNumber) {
            questionBlockNumber.textContent = this.state.currentSet;
        }
    }
    
    // Calculate character position based on game state configuration
    getCharacterPosition(setNumber, questionNumber) {
        const { characterPositions } = this.state.config;
        
        // Get the position for the specific question number
        const position = characterPositions[questionNumber];
        
        if (position !== undefined) {
            return position;
        }
        
        // Fallback calculation if question number is out of range
        console.warn(`Question number ${questionNumber} out of range, using fallback calculation`);
        const totalQuestions = this.state.config.totalSets * this.state.config.questionsPerSet;
        const currentPosition = ((setNumber - 1) * this.state.config.questionsPerSet) + questionNumber;
        const progressPercent = (currentPosition / totalQuestions) * 100;
        return Math.max(15, Math.min(85, progressPercent));
    }
    
    // Get current character position
    getCurrentCharacterPosition() {
        return this.getCharacterPosition(this.state.currentSet, this.state.currentQuestion);
    }
    
    // Update team score
    updateTeamScore(teamId, points) {
        if (this.state.teams[teamId]) {
            this.state.teams[teamId].score += points;
            this.updateTeamDisplays();
        }
    }
    
    // Toggle action card
    toggleActionCard(teamId, cardType) {
        if (this.state.actionCards[teamId]) {
            this.state.actionCards[teamId][cardType] = !this.state.actionCards[teamId][cardType];
            this.updateTeamDisplays();
        }
    }
    
    // Set timer
    setTimer(value, running = false) {
        this.set('timerValue', value);
        this.set('timerRunning', running);
        this.updateTimerDisplay();
    }
    
    // Reset game
    reset() {
        this.set('currentSet', 1);
        this.set('currentQuestion', 1);
        this.set('isAnimating', false);
        this.set('timerValue', 0);
        this.set('timerRunning', false);
        
        // Reset team scores
        Object.keys(this.state.teams).forEach(teamId => {
            this.state.teams[teamId].score = 0;
        });
        
        // Reset action cards
        Object.keys(this.state.actionCards).forEach(teamId => {
            this.update(`actionCards.${teamId}`, {
                angel: false, devil: false, cross: false, challenge: false
            });
        });
        
        // Update all UI elements
        this.updatePlanetBlocks();
        this.updateTeamDisplays();
        this.updateTimerDisplay();
        this.updateQuestionSetDisplay();
    }

    // Change progress character to team color
    setProgressCharacterTeam(teamId) {
        const team = this.state.teams[teamId];
        if (team && window.ProgressWhite?.applyProgressTeamColor) {
            window.ProgressWhite.applyProgressTeamColor(team.color);
            console.log(`🎨 Progress character changed to ${team.color} (Team ${team.name})`);
        }
    }
    
    // Reset progress character to white
    resetProgressCharacter() {
        if (window.ProgressWhite?.setProgressCharacterToWhite) {
            window.ProgressWhite.setProgressCharacterToWhite();
            console.log('🎨 Progress character reset to white');
        }
    }

    // Apply character size from configuration
    applyCharacterSize() {
        const characterSize = this.state.config.characterSize;
        const style = document.createElement('style');
        style.id = 'game-state-character-size';
        style.textContent = `
            .character-container-main .main-character,
            .main-character,
            lottie-player.main-character {
                width: ${characterSize.width} !important;
                height: ${characterSize.height} !important;
            }
        `;
        
        // Remove existing style if present
        const existingStyle = document.getElementById('game-state-character-size');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }
}

// Export singleton instance
window.gameState = new GameState();
console.log('✅ Game state initialized'); 