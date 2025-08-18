/**
 * Game State Management System
 * Centralized state management for Quiz Bowl application
 */

class GameState {
    constructor() {
        this.defaultState = {
            currentSet: 1,
            currentQuestion: 1,
            currentTeam: 0,
            currentChallenge: 0,
            angelTeam: 0,
            attackTeam: 0,
            victimTeam: 0,
            isAnimating: false,
            timerValue: 15, // Default to 15 seconds
            defaultTimerValue: 15, // User's preferred timer duration
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
                8: { title: 'Mystery & Logic', theme: 'brainstorm' },
                9: { title: 'Science Fiction', theme: 'brainstorm' },
                10: { title: 'Ecology & Environment', theme: 'brainstorm' },
                11: { title: 'Philosophy & Ethics', theme: 'brainstorm' },
                12: { title: 'Culture & Traditions', theme: 'brainstorm' }
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
                totalSets: 12,
                questionsPerSet: 4,
                regularSets: 12,
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

        // Load state from localStorage or use default
        this.state = this.loadFromLocalStorage();

        this.listeners = new Map();
        this.timerInterval = null; // Add timer interval reference
        this.initializeUI();
        this.isResetting = false; // Initialize resetting flag
        this.serverInitiatedReset = false; // Initialize server-initiated reset flag

        // Make sure timer is stopped on initialization
        this.stopTimerCountdown();
    }

    // Load state from localStorage
    loadFromLocalStorage() {
        try {
            const savedState = localStorage.getItem('quizBowlGameState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                // Merge with default state to ensure all properties exist
                return this.mergeWithDefaults(parsedState);
            }
        } catch (error) {
        }
        return JSON.parse(JSON.stringify(this.defaultState)); // Deep copy default state
    }

    // Save state to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('quizBowlGameState', JSON.stringify(this.state));
        } catch (error) {
        }
    }

    // Merge saved state with defaults to ensure all properties exist
    mergeWithDefaults(savedState) {
        const merged = JSON.parse(JSON.stringify(this.defaultState));

        // Recursively merge objects
        const mergeObjects = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    mergeObjects(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };

        mergeObjects(merged, savedState);
        return merged;
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
            });

            // Subscribe to team name changes
            this.subscribe(`teams.${teamId}.name`, () => {
                this.updateTeamDisplays();
            });

            // Subscribe to team color changes
            this.subscribe(`teams.${teamId}.color`, () => {
                this.updateTeamDisplays();
                // Also update team character colors
                this.initializeTeamCharacters();
            });

            // Subscribe to action card changes
            this.subscribe(`actionCards.${teamId}.angel`, () => {
                this.updateTeamDisplays();
            });

            this.subscribe(`actionCards.${teamId}.devil`, () => {
                this.updateTeamDisplays();
            });

            this.subscribe(`actionCards.${teamId}.cross`, () => {
                this.updateTeamDisplays();
            });
        }

        // Subscribe to timer changes
        this.subscribe('timerValue', () => {
            this.updateTimerDisplay();
        });

        this.subscribe('timerRunning', () => {
            this.updateTimerDisplay();
        });

        // Subscribe to question set changes
        for (let setNumber = 1; setNumber <= 12; setNumber++) {
            this.subscribe(`questionSets.${setNumber}.title`, () => {
                this.updateQuestionSetDisplay();
            });

            this.subscribe(`questionSets.${setNumber}.theme`, () => {
                this.updateQuestionSetDisplay();
            });

            this.subscribe(`questionSets.${setNumber}.icon`, () => {
                this.updateQuestionSetDisplay();
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
        this.saveToLocalStorage(); // Auto-save to localStorage

        // Handle timer countdown
        if (key === 'timerRunning') {
            if (value === true) {
                this.startTimerCountdown();
            } else {
                this.stopTimerCountdown();
            }
        }
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
        this.saveToLocalStorage(); // Auto-save to localStorage
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

    // Set chance display to default
    setChanceDisplayToDefault() {
        const chanceElement = document.getElementById('chanceQuestion');
        if (chanceElement) {
            chanceElement.textContent = '(3/3 chances)';
            chanceElement.style.display = 'block';
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

    // Calculate and update team rankings (delegates to new calculateRankings)
    updateRankings() {
        this.calculateRankings();
    }

    // Update ranking displays on team cards
    // Calculate team rankings based on scores
    calculateRankings() {
        // Get all teams with their scores
        const teams = Object.keys(this.state.teams).map(teamId => ({
            id: teamId,
            score: this.state.teams[teamId].score || 0
        }));

        // Sort teams by score (highest first)
        teams.sort((a, b) => b.score - a.score);

        // Initialize rankings - start fresh
        const newRankings = {};

        // Check if all teams have zero scores
        const allZeroScores = teams.every(team => team.score === 0);

        if (allZeroScores) {
            // All teams get badge when all have zero scores
            teams.forEach(team => {
                newRankings[team.id] = { rank: 'badge', position: 0 };
            });
        } else {
            // Handle mixed scores

            // First, assign badge to all zero-score teams
            teams.forEach(team => {
                if (team.score === 0) {
                    newRankings[team.id] = { rank: 'badge', position: 0 };
                }
            });

            // Get teams with non-zero scores
            const scoringTeams = teams.filter(team => team.score > 0);

            if (scoringTeams.length > 0) {
                let currentRank = 1;
                let currentRankName = '1st';

                for (let i = 0; i < scoringTeams.length; i++) {
                    const currentTeam = scoringTeams[i];

                    // If this is not the first team and score is different from previous team
                    if (i > 0 && currentTeam.score < scoringTeams[i - 1].score) {
                        // Count how many teams had higher scores
                        currentRank = i + 1;

                        // Determine rank name
                        if (currentRank === 1) currentRankName = '1st';
                        else if (currentRank === 2) currentRankName = '2nd';
                        else if (currentRank === 3) currentRankName = '3rd';
                        else currentRankName = 'badge'; // 4th and beyond get badge
                    }

                    // Assign rank (teams with same score get same rank)
                    newRankings[currentTeam.id] = { rank: currentRankName, position: currentRank };
                }
            }
        }



        // Update state
        this.state.rankings = newRankings;

        // Update displays
        this.updateRankingDisplays();
    }

    updateRankingDisplays() {
        Object.keys(this.state.rankings).forEach(teamId => {
            const ranking = this.state.rankings[teamId];
            const rankingElement = document.getElementById(`teamRanking${teamId}`);

            if (rankingElement && ranking) {
                // Update ranking image based on rank
                const rankImages = {
                    '1st': 'assets/rankings/ranking-1st.png',
                    '2nd': 'assets/rankings/ranking-2nd.png',
                    '3rd': 'assets/rankings/ranking-3rd.png',
                    'badge': 'assets/rankings/ranking-badge.png'
                };

                const newSrc = rankImages[ranking.rank];
                if (newSrc) {
                    rankingElement.src = newSrc;
                }
            }
        });
    }

    // Update team displays
    updateTeamDisplays() {
        // Calculate rankings first
        this.calculateRankings();

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
        // Skip timer display update on console page
        if (window.location.pathname.includes('console.html')) {
            return;
        }

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

        } else {
        }
    }

    // Start timer countdown
    startTimerCountdown() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.state.timerRunning && this.state.timerValue > 0) {
                this.set('timerValue', this.state.timerValue - 1);
            } else if (this.state.timerValue <= 0) {
                this.stopTimerCountdown();
            }
        }, 1000);
    }

    // Stop timer countdown
    stopTimerCountdown() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Update timer value and remember it as default
    updateTimerValue(newValue) {
        this.set('timerValue', newValue);
        this.set('defaultTimerValue', newValue); // Remember this as the new default
    }

    // Reset timer to default value (15 seconds)
    resetTimerToDefault() {
        this.set('timerValue', 15);
        this.set('defaultTimerValue', 15); // Reset default back to 15
    }

    // Stop timer and reset to remembered value
    stopTimerAndReset() {
        this.set('timerRunning', false);
        this.set('timerValue', this.state.defaultTimerValue);
    }

    // Trigger emergency meeting when timer reaches zero
    triggerEmergencyMeeting() {
        // Skip emergency meeting on console page
        if (window.location.pathname.includes('console.html')) {
            return;
        }

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
            });
        } catch (error) {
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

    // Comprehensive game reset
    reset() {
        // Prevent infinite loops - don't reset if already resetting
        if (this.isResetting) {
            return;
        }

        // Set resetting flag to prevent loops
        this.isResetting = true;

        // 1. Check character position and move to first planet if needed with animation
        this.resetCharacterToFirstPlanet();

        // 2. Clear localStorage completely and reset game-state parameters to default
        localStorage.removeItem('quizBowlGameState');

        // Reset to default state completely by reloading default state
        this.state = JSON.parse(JSON.stringify(this.defaultState));

        // Stop timer countdown
        this.stopTimerCountdown();

        // 3. Reset progressCharacter to white and hide action cards
        this.resetProgressCharacter();
        this.hideMainCharacterActionCards();

        // 4. Reset all planets to default state
        this.resetPlanetsToDefault();

        // 5. Reset subjectIcon, currentQuestionSet, and chanceQuestion to default
        this.resetUIElementsToDefault();

        // 6. Reset team characters, names, scores, and action cards
        this.resetTeamsToDefault();

        // 7. Reset tables (teams and questions)
        this.resetTablesToDefault();

        // 8. Clear logs
        this.clearLogs();

        // 9. Reset volume to default
        this.resetVolumeToDefault();

        // 10. Reset timer to default
        this.resetTimerToDefault();

        // 11. Reset questionBlockNumber to default
        this.resetQuestionBlockToDefault();

        // Clear all Q1 failure tracking states for all sets
        for (let setNumber = 1; setNumber <= 12; setNumber++) {
            const failedTeamsKey = `q1FailedTeams_${setNumber}`;
            const attemptsKey = `q1Attempts_${setNumber}`;
            this.state[failedTeamsKey] = [];
            this.state[attemptsKey] = 0;
        }

        // Reset team graying (visual reset)
        if (window.hotkeysManager && window.hotkeysManager.resetTeamGraying) {
            window.hotkeysManager.resetTeamGraying();
        }

        // Save the reset state to localStorage
        this.saveToLocalStorage();

        // Update all UI elements
        this.updatePlanetBlocks();
        this.updateTeamDisplays();
        this.updateTimerDisplay();
        this.updateQuestionSetDisplay();
        this.setChanceDisplayToDefault();

        // Clear server-initiated flag
        this.serverInitiatedReset = false;

        // Clear resetting flag after a short delay
        setTimeout(() => {
            this.isResetting = false;
        }, 1000);
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

    // Hide main character action cards
    hideMainCharacterActionCards() {
        const actionCards = ['mainCharacterAngel', 'mainCharacterDevil', 'mainCharacterCross'];
        actionCards.forEach(cardId => {
            const element = document.getElementById(cardId);
            if (element) {
                element.classList.remove('active');
                element.style.display = 'none';
            }
        });
    }

    // Reset character to first planet with animation if needed
    resetCharacterToFirstPlanet() {
        // Use character controller to move to Set 1, Question 1 with animation
        if (window.characterController && window.characterController.moveToQuestion) {
            // Move to first planet (Set 1, Question 1) with proper animation
            window.characterController.moveToQuestion(1, 1);
        }
    }

    // Reset all planets to default state
    resetPlanetsToDefault() {
        const planets = ['earth', 'moon', 'venus', 'jupiter'];
        planets.forEach(planet => {
            const planetElement = document.getElementById(planet);
            if (planetElement) {
                planetElement.classList.remove('current', 'completed');
            }
        });

        // Set Earth as current (first planet)
        const earthElement = document.getElementById('earth');
        if (earthElement) {
            earthElement.classList.add('current');
        }
    }

    // Reset UI elements to default
    resetUIElementsToDefault() {
        // Reset subject icon
        const subjectElement = document.getElementById('subjectIcon');
        if (subjectElement) {
            subjectElement.src = 'assets/themes/brainstorm.png';
            subjectElement.style.display = 'inline-block';
        }

        // Reset current question set
        const setElement = document.getElementById('currentQuestionSet');
        if (setElement) {
            setElement.textContent = 'General Knowledge';
        }

        // Reset chance question
        const chanceElement = document.getElementById('chanceQuestion');
        if (chanceElement) {
            chanceElement.textContent = '(3/3 chances)';
            chanceElement.style.display = 'block';
        }
    }

    // Reset teams to default
    resetTeamsToDefault() {
        // Reset team names and scores to default values from defaultState
        Object.keys(this.defaultState.teams).forEach(teamId => {
            const defaultTeam = this.defaultState.teams[teamId];

            // Update state
            this.state.teams[teamId] = { ...defaultTeam };

            // Reset team character colors to default
            const characterElement = document.getElementById(`teamCharacter${teamId}`);
            if (characterElement && window.ProgressWhite?.applyTeamColor) {
                window.ProgressWhite.applyTeamColor(characterElement, defaultTeam.color);
            }
        });

        // Reset action cards to default state
        Object.keys(this.defaultState.actionCards).forEach(teamId => {
            this.state.actionCards[teamId] = { ...this.defaultState.actionCards[teamId] };
        });
    }

    // Reset tables to default
    resetTablesToDefault() {
        // Reset teams table if it exists (modal functionality)
        if (window.updateTeamsTable) {
            window.updateTeamsTable();
        }

        // Reset questions table if it exists (modal functionality)
        if (window.updateQuestionsTable) {
            window.updateQuestionsTable();
        }
    }

    // Clear logs
    clearLogs() {
        const logsContentArea = document.getElementById('logsContentArea');
        if (logsContentArea) {
            logsContentArea.innerHTML = '';
        }

        // Also clear logs using the logs system if available
        if (window.clearLogs) {
            window.clearLogs();
        }
    }

    // Reset volume to default
    resetVolumeToDefault() {
        if (window.volumeController) {
            window.volumeController.volume = 0.5; // 50% default
            window.volumeController.updateDisplay();
            if (window.volumeController.audio) {
                window.volumeController.audio.volume = 0.5;
            }
        }
    }

    // Reset question block to default
    resetQuestionBlockToDefault() {
        const questionBlockNumber = document.getElementById('questionBlockNumber');
        if (questionBlockNumber) {
            questionBlockNumber.textContent = '1';
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

        this.save(this.state);
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

        // Save to localStorage
        this.saveToLocalStorage();

        // Update all UI elements
        this.initializeUI();

    }
}

// Export singleton instance
window.gameState = new GameState();