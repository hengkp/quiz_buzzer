/**
 * Game State Management System
 * Centralized state management for Quiz Bowl application with local storage persistence
 */

class GameState {
    constructor() {
        this.state = {
            currentSet: 1,
            currentQuestion: 1,
            currentTeam: 0,
            currentChallenge: 0,
            angelTeam: 0,
            attackTeam: 0,
            victimTeam: 0,
            isAnimating: false,
            timerValue: 15, // Default to 15 seconds
            timerRunning: false,
            emergencyMeetingActive: false,
            
            // Question sets with titles and themes
            questionSets: {
                1: { title: 'General Knowledge', theme: 'brainstorm' },
                2: { title: 'Science & Technology', theme: 'brainstorm' },
                3: { title: 'History & Geography', theme: 'brainstorm' },
                4: { title: 'Arts & Literature', theme: 'brainstorm' },
                5: { title: 'Sports & Entertainment', theme: 'brainstorm' },
                6: { title: 'Mathematics', theme: 'brainstorm' },
                7: { title: 'Current Events', theme: 'brainstorm' },
                8: { title: 'Mystery & Logic', theme: 'brainstorm' }
            },
            
            teams: {
                1: { score: 0, name: 'Team A', color: 'red' },
                2: { score: 0, name: 'Team B', color: 'blue' },
                3: { score: 0, name: 'Team C', color: 'lime' },
                4: { score: 0, name: 'Team D', color: 'orange' },
                5: { score: 0, name: 'Team E', color: 'pink' },
                6: { score: 0, name: 'Team F', color: 'yellow' }
            },
            
            actionCards: {
                1: { angel: true, devil: true, cross: false },
                2: { angel: true, devil: true, cross: false },
                3: { angel: true, devil: true, cross: false },
                4: { angel: true, devil: true, cross: false },
                5: { angel: true, devil: true, cross: false },
                6: { angel: true, devil: true, cross: false }
            },
            
            rankings: {
                1: { rank: 'badge', position: 0 },
                2: { rank: 'badge', position: 0 },
                3: { rank: 'badge', position: 0 },
                4: { rank: 'badge', position: 0 },
                5: { rank: 'badge', position: 0 },
                6: { rank: 'badge', position: 0 }
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
        this.storageKey = 'quiz_buzzer_game_state';
        
        // Load state from local storage on initialization
        this.loadFromStorage();
        
        this.initializeUI();
    }
    
    // Load game state from local storage
    loadFromStorage() {
        try {
            const storedState = localStorage.getItem(this.storageKey);
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                // Merge stored state with default state, preserving structure
                this.state = this.mergeState(this.state, parsedState);
            }
        } catch (error) {
            // If there's an error loading from storage, use default state
            this.saveToStorage();
        }
    }
    
    // Save game state to local storage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            // Silently handle storage errors
        }
    }
    
    // Merge stored state with default state to handle missing properties
    mergeState(defaultState, storedState) {
        const merged = { ...defaultState };
        
        // Merge top-level properties
        Object.keys(storedState).forEach(key => {
            if (key === 'teams' || key === 'actionCards' || key === 'rankings' || key === 'questionSets' || key === 'config') {
                // For nested objects, merge recursively
                merged[key] = { ...defaultState[key], ...storedState[key] };
            } else {
                // For simple properties, use stored value
                merged[key] = storedState[key];
            }
        });
        
        return merged;
    }
    
    // Clear local storage (for reset functionality)
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            // Silently handle storage errors
        }
    }
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            // Silently handle storage errors
        }
    }
    
    // Merge stored state with default state to handle missing properties
    mergeState(defaultState, storedState) {
        const merged = { ...defaultState };
        
        // Merge top-level properties
        Object.keys(storedState).forEach(key => {
            if (key === 'teams' || key === 'actionCards' || key === 'rankings' || key === 'questionSets' || key === 'config') {
                // For nested objects, merge recursively
                merged[key] = { ...defaultState[key], ...storedState[key] };
            } else {
                // For simple properties, use stored value
                merged[key] = storedState[key];
            }
        });
        
        return merged;
    }
    
    // Clear local storage (for reset functionality)
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            // Silently handle storage errors
        }
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
        
        // Set up automatic UI updates for team changes
        this.setupTeamUIUpdates();
    }
    
    // Set up automatic UI updates when team data changes
    setupTeamUIUpdates() {
        // Subscribe to team changes
        for (let teamId = 1; teamId <= 6; teamId++) {
            // Subscribe to team score changes
            this.subscribe(`teams.${teamId}.score`, () => {
                this.updateTeamDisplays();
                this.saveToStorage();
            });
            
            // Subscribe to team name changes
            this.subscribe(`teams.${teamId}.name`, () => {
                this.updateTeamDisplays();
                this.saveToStorage();
            });
            
            // Subscribe to team color changes
            this.subscribe(`teams.${teamId}.color`, () => {
                this.updateTeamDisplays();
                this.initializeTeamCharacters();
                this.saveToStorage();
            });
            
            // Subscribe to action card changes
            this.subscribe(`actionCards.${teamId}.angel`, () => {
                this.updateTeamDisplays();
                this.saveToStorage();
            });
            
            this.subscribe(`actionCards.${teamId}.devil`, () => {
                this.updateTeamDisplays();
                this.saveToStorage();
            });
            
            this.subscribe(`actionCards.${teamId}.cross`, () => {
                this.updateTeamDisplays();
                this.saveToStorage();
            });
        }
        
        // Subscribe to timer changes
        this.subscribe('timerValue', () => {
            this.updateTimerDisplay();
            this.saveToStorage();
        });
        
        this.subscribe('timerRunning', () => {
            this.updateTimerDisplay();
            this.saveToStorage();
        });
        
        // Subscribe to question set changes
        for (let setNumber = 1; setNumber <= 8; setNumber++) {
            this.subscribe(`questionSets.${setNumber}.title`, () => {
                this.updateQuestionSetDisplay();
                this.saveToStorage();
            });
            
            this.subscribe(`questionSets.${setNumber}.theme`, () => {
                this.updateQuestionSetDisplay();
                this.saveToStorage();
            });
            
            this.subscribe(`questionSets.${setNumber}.icon`, () => {
                this.updateQuestionSetDisplay();
                this.saveToStorage();
            });
        }
        
    }
    
    // Initialize team characters with their team colors
    initializeTeamCharacters() {
        if (window.ProgressWhite?.initializeTeamColors) {
            // Use the new function to initialize team colors
            window.ProgressWhite.initializeTeamColors();
        } else {
            // Fallback: apply team colors manually
            Object.keys(this.state.teams).forEach(teamId => {
                const characterElement = document.getElementById(`teamCharacter${teamId}`);
                const teamColor = window.ProgressWhite?.getTeamColor ? 
                    window.ProgressWhite.getTeamColor(parseInt(teamId)) : 
                    this.state.teams[teamId]?.color;
                
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
        this.saveToStorage();
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
        this.saveToStorage();
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
        
        // Handle chance display for Q1
        if (questionNumber === 1) {
            this.updateChanceDisplayForQ1(setNumber);
            // Restore team graying for Q1
            this.restoreQ1TeamGraying(setNumber);
        } else {
            this.hideChanceDisplay();
        }
        
        // Play run animation if character controller is available and we're on the main page
        if (window.characterController && window.characterController.startRunAnimation && !window.location.pathname.includes('console')) {
            // Determine direction based on movement
            const currentPosition = this.getCurrentCharacterPosition();
            const newPosition = this.getCharacterPosition(setNumber, questionNumber);
            const direction = newPosition > currentPosition ? 'forward' : 'backward';
            
            // Start run animation
            window.characterController.startRunAnimation(direction);
        }
        
        return true;
    }
    
    // Get question set information
    getQuestionSetInfo(setNumber) {
        return this.state.questionSets[setNumber] || { title: `Question Set ${setNumber}`, theme: 'general', icon: '❓' };
    }
    
    // Get current question set information
    getCurrentQuestionSetInfo() {
        return this.getQuestionSetInfo(this.state.currentSet);
    }
    
    // Update chance display when moving to Q1
    updateChanceDisplayForQ1(setNumber) {
        const chanceElement = document.getElementById('chanceQuestion');
        if (chanceElement) {
            const attemptsKey = `q1Attempts_${setNumber}`;
            const attempts = this.state[attemptsKey] || 0;
            
            // Always show chances for Q1, even on first attempt
            const remainingChances = 3 - attempts;
            if (remainingChances > 0) {
                chanceElement.textContent = remainingChances === 1 ? '(last chance)' : `(chance: ${remainingChances}/3)`;
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
    
    // Restore team graying for Q1
    restoreQ1TeamGraying(setNumber) {
        const failedTeamsKey = `q1FailedTeams_${setNumber}`;
        const failedTeams = this.state[failedTeamsKey] || [];
        
        // Reset all teams first
        for (let teamId = 1; teamId <= 6; teamId++) {
            const teamCharacter = document.getElementById(`teamCharacter${teamId}`);
            if (teamCharacter) {
                teamCharacter.style.setProperty('opacity', '1', 'important');
                teamCharacter.style.setProperty('filter', 'none', 'important');
            }
        }
        
        // Gray out failed teams
        failedTeams.forEach(teamId => {
            const teamCharacter = document.getElementById(`teamCharacter${teamId}`);
            if (teamCharacter) {
                teamCharacter.style.setProperty('opacity', '0.3', 'important');
                teamCharacter.style.setProperty('filter', 'grayscale(100%)', 'important');
            }
        });
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
    
    // Calculate and update team rankings
    updateRankings() {
        
        // Get all teams with scores
        const teamsWithScores = Object.keys(this.state.teams).map(teamId => ({
            teamId: parseInt(teamId),
            score: this.state.teams[teamId].score
        }));
        
        // Sort teams by score (highest first)
        teamsWithScores.sort((a, b) => b.score - a.score);
        
        // Reset all rankings
        Object.keys(this.state.rankings).forEach(teamId => {
            this.state.rankings[teamId] = { rank: 'badge', position: 0 };
        });
        
        // Assign rankings with tie handling
        let currentRank = 1;
        let teamsAtCurrentRank = 0;
        let lastScore = null;
        
        for (let i = 0; i < teamsWithScores.length; i++) {
            const team = teamsWithScores[i];
            
            // Check if this is a new score (different from previous)
            if (lastScore !== null && team.score < lastScore) {
                // Move to next rank, accounting for ties
                currentRank += teamsAtCurrentRank;
                teamsAtCurrentRank = 0;
            }
            
            // Only assign ranks 1, 2, 3 - rest stay as 'badge'
            if (currentRank <= 3) {
                const rankNames = { 1: '1st', 2: '2nd', 3: '3rd' };
                this.state.rankings[team.teamId] = {
                    rank: rankNames[currentRank],
                    position: currentRank
                        };
            } else {
                this.state.rankings[team.teamId] = {
                    rank: 'badge',
                    position: 0
                };
            }
            
            teamsAtCurrentRank++;
            lastScore = team.score;
        }
        
        // Update UI rankings
        this.updateRankingDisplays();
    }
    
    // Update ranking displays on team cards
    updateRankingDisplays() {
        Object.keys(this.state.rankings).forEach(teamId => {
            const ranking = this.state.rankings[teamId];
            const rankingElement = document.getElementById(`teamRanking${teamId}`);
            
            if (rankingElement) {
                // Update ranking image based on rank
                const rankImages = {
                    '1st': 'assets/rankings/ranking-1st.png',
                    '2nd': 'assets/rankings/ranking-2nd.png',
                    '3rd': 'assets/rankings/ranking-3rd.png',
                    'badge': 'assets/rankings/ranking-badge.png'
                };
                
                rankingElement.src = rankImages[ranking.rank];
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
                const oldScore = parseInt(scoreElement.textContent) || 0;
                const newScore = team.score;
                
                // Check if score changed
                if (oldScore !== newScore) {
                    // Add updating class to trigger glow animation
                    scoreElement.classList.add('updating');
                    
                    // Remove updating class after animation completes (3 seconds)
                    setTimeout(() => {
                        if (scoreElement) {
                            scoreElement.classList.remove('updating');
                        }
                    }, 3000);
                }
                
                scoreElement.textContent = newScore;
            }
            
            // Update action cards
            const actionCards = this.state.actionCards[teamId];
            if (actionCards) {
                // Angel card: true=active (colorful), false=inactive (gray)
                const angelElement = document.getElementById(`teamAngel${teamId}`);
                if (angelElement) {
                    angelElement.classList.toggle('active', actionCards.angel);
                }
                
                // Devil card: true=active (colorful), false=inactive (gray) 
                const devilElement = document.getElementById(`teamDevil${teamId}`);
                if (devilElement) {
                    devilElement.classList.toggle('active', actionCards.devil);
                }
                
                // Cross card: false=inactive (gray), true=active (colorful)
                const crossElement = document.getElementById(`teamCross${teamId}`);
                if (crossElement) {
                    crossElement.classList.toggle('active', actionCards.cross);
                }
            }
        });
        
        // Update rankings whenever team displays are updated
        this.updateRankings();
    }
    
    // Update timer display
    updateTimerDisplay() {
        const timerElement = document.getElementById('timerDisplay');
        if (timerElement) {
            const minutes = Math.floor(this.state.timerValue / 60);
            const seconds = this.state.timerValue % 60;
            const displayText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            timerElement.textContent = displayText;
            
            // Add running animation class
            timerElement.classList.toggle('timer-running', this.state.timerRunning);
            
            // Check if timer reached zero and trigger emergency meeting
            if (this.state.timerValue === 0 && this.state.timerRunning) {
                this.set('timerRunning', false);
                this.triggerEmergencyMeeting();
            }
        }
    }
    
    // Trigger emergency meeting when timer reaches zero
    triggerEmergencyMeeting() {
        // Prevent multiple emergency meetings
        if (this.state.emergencyMeetingActive) {
            return;
        }
        
        // Set emergency meeting state
        this.state.emergencyMeetingActive = true;
        
        const timerElement = document.getElementById('timerDisplay');
        if (!timerElement) {
            return;
        }
        
        // Play emergency meeting sound
        this.playEmergencyMeetingSound();
        
        // Start emergency meeting animation
        this.startEmergencyMeetingAnimation(timerElement);
    }
    
    // Play emergency meeting sound
    playEmergencyMeetingSound() {
        try {
            const audio = new Audio('assets/audio/emergency-meeting-among-us.mp3');
            audio.volume = 1;
            audio.play().catch((error) => {
                // Silently handle audio errors
            });
        } catch (error) {
            // Silently handle audio errors
        }
    }
    
    // Start emergency meeting animation with red text and glowing effect
    startEmergencyMeetingAnimation(timerElement) {
        // Set text to red and 0:00
        timerElement.textContent = '0:00';
        timerElement.style.color = '#ff0000';
        timerElement.style.textShadow = '0 0 10px #ff0000';
        
        // Add emergency meeting class for CSS animations
        timerElement.classList.add('emergency-meeting');
        
        // Create glowing animation sequence
        let glowCount = 0;
        const maxGlows = 3;
        
        const glowAnimation = () => {
            if (glowCount >= maxGlows) {
                // Animation complete, reset to normal state
                this.resetEmergencyMeetingState(timerElement);
                return;
            }
            
            // Big glow
            timerElement.style.transform = 'scale(1.2)';
            timerElement.style.textShadow = '0 0 20px #ff0000, 0 0 30px #ff0000';
            
            setTimeout(() => {
                // Small glow
                timerElement.style.transform = 'scale(0.8)';
                timerElement.style.textShadow = '0 0 5px #ff0000';
                
                setTimeout(() => {
                    // Normal size
                    timerElement.style.transform = 'scale(1)';
                    timerElement.style.textShadow = '0 0 10px #ff0000';
                    
                    glowCount++;
                    setTimeout(glowAnimation, 500); // Wait 500ms before next glow cycle
                }, 200);
            }, 300);
        };
        
        // Start the animation
        setTimeout(glowAnimation, 100);
    }
    
    // Reset emergency meeting state
    resetEmergencyMeetingState(timerElement) {
        timerElement.style.color = '';
        timerElement.style.textShadow = '';
        timerElement.style.transform = '';
        timerElement.classList.remove('emergency-meeting');
        
        // Reset emergency meeting state
        this.state.emergencyMeetingActive = false;
        
        // Update timer display to show current state
        this.updateTimerDisplay();
    }
    
    // Update question set display
    updateQuestionSetDisplay() {
        const setElement = document.getElementById('currentQuestionSet');
        const subjectElement = document.getElementById('subjectIcon');
        if (setElement) {
            const currentSetData = this.state.questionSets[this.state.currentSet];
            if (currentSetData) {
                setElement.textContent = `${currentSetData.title}`;
                // Update the subject icon using the theme
                const iconFile = `assets/themes/${currentSetData.theme}.png`;
                if (subjectElement) {
                    subjectElement.src = iconFile;
                    subjectElement.style.display = 'inline-block';
                }
            } else {
                setElement.textContent = `Question Set ${this.state.currentSet}`;
                if (subjectElement) {
                    subjectElement.textContent = `❓`;
                    subjectElement.style.display = 'inline-block';
                }
            }
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
            this.saveToStorage();
        }
    }
    
    // Toggle action card
    toggleActionCard(teamId, cardType) {
        if (this.state.actionCards[teamId]) {
            this.state.actionCards[teamId][cardType] = !this.state.actionCards[teamId][cardType];
            this.updateTeamDisplays();
            this.saveToStorage();
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
        this.set('currentTeam', 0); // Reset current team
        this.set('currentChallenge', 0); // Reset current challenge
        this.set('angelTeam', 0); // Reset angel team
        this.set('attackTeam', 0); // Reset attack team
        this.set('victimTeam', 0); // Reset victim team
        this.set('isAnimating', false);
        this.set('timerValue', 15); // Reset to 15 seconds
        this.set('timerRunning', false);
        this.set('emergencyMeetingActive', false);
        
        // Reset team scores
        Object.keys(this.state.teams).forEach(teamId => {
            this.state.teams[teamId].score = 0;
        });
        
        // Reset action cards to initial state (all ready to use)
        Object.keys(this.state.actionCards).forEach(teamId => {
            this.update(`actionCards.${teamId}`, {
                angel: true, 
                devil: true, 
                cross: false
            });
        });
        
        // Update all UI elements
        this.updatePlanetBlocks();
        this.updateTeamDisplays();
        this.updateTimerDisplay();
        this.updateQuestionSetDisplay();
        
        // Save to storage after reset
        this.saveToStorage();
    }

    // Change progress character to team color
    setProgressCharacterTeam(teamId) {
        const team = this.state.teams[teamId];
        if (team && window.ProgressWhite?.applyProgressTeamColor) {
                window.ProgressWhite.applyProgressTeamColor(team.color);
        }
    }
    
    // Reset progress character to white
    resetProgressCharacter() {
        if (window.ProgressWhite?.setProgressCharacterToWhite) {
            window.ProgressWhite.setProgressCharacterToWhite();
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
    
    // Reset action cards for new game (complete reset including permanent usage)
    resetActionCards() {
        for (let teamId = 1; teamId <= 6; teamId++) {
            this.state.actionCards[teamId] = { 
                angel: true, 
                devil: true, 
                cross: false 
            };
            
            // Reset visual state of team action cards
            const teamAngelElement = document.getElementById(`teamAngel${teamId}`);
            const teamDevilElement = document.getElementById(`teamDevil${teamId}`);
            const teamCrossElement = document.getElementById(`teamCross${teamId}`);
            
            if (teamAngelElement) {
                teamAngelElement.classList.add('active'); // angel=true → active
                teamAngelElement.classList.remove('used');
            }
            if (teamDevilElement) {
                teamDevilElement.classList.add('active'); // devil=true → active
                teamDevilElement.classList.remove('used');
            }
            if (teamCrossElement) {
                teamCrossElement.classList.remove('active'); // cross=false → inactive
                teamCrossElement.classList.remove('used');
            }
        }
        
        // Reset main character action indicators
        const mainCharacterAngel = document.getElementById('mainCharacterAngel');
        const mainCharacterDevil = document.getElementById('mainCharacterDevil');
        const mainCharacterCross = document.getElementById('mainCharacterCross');
        
        if (mainCharacterAngel) mainCharacterAngel.classList.remove('active');
        if (mainCharacterDevil) mainCharacterDevil.classList.remove('active');
        if (mainCharacterCross) mainCharacterCross.classList.remove('active');
        
        // Reset action team parameters
        this.set('angelTeam', 0);
        this.set('attackTeam', 0);
        this.set('victimTeam', 0);
        
        // Update team displays to ensure consistency
        this.updateTeamDisplays();
        
        this.saveToStorage();
    }
    
    // Reset entire game state
    resetGame() {
        // Reset scores
        for (let teamId = 1; teamId <= 6; teamId++) {
            this.state.teams[teamId].score = 0;
        }
        
        // Reset game progress
        this.state.currentSet = 1;
        this.state.currentQuestion = 1;
        this.state.currentTeam = 0;
        this.state.currentChallenge = 0;
        this.state.angelTeam = 0;
        this.state.attackTeam = 0;
        this.state.victimTeam = 0;
        this.state.timerValue = 0;
        this.state.timerRunning = false;
        
        // Reset action cards
        this.resetActionCards();
        
        // Update all UI elements
        this.initializeUI();
        
        // Save to storage after reset
        this.saveToStorage();
    }
}

// Export singleton instance
window.gameState = new GameState();