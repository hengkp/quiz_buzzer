/**
 * Main Page Initialization
 * Coordinates all systems for the main Among Us Quiz Bowl interface
 */

class MainPageApp {
    constructor() {
        this.systems = [];
        this.initialized = false;
        this.initializationSteps = [
            'Game State',
            'Character Controller',
            'Buzzing System',
            'Hotkeys Manager',
            'Arduino Connection',
            'Cloud Group'
        ];
        this.completedSteps = 0;
    }
    
    // Initialize the main page application
    async init() {
        if (this.initialized) {
            return;
        }
        
        
        try {
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Wait for dependencies to load
            await this.waitForDependencies();
            
            // Initialize systems in order
            await this.initializeSystems();
            
            // Ensure character starts as white (skip on console page)
            if (!window.location.pathname.includes('console.html')) {
                await this.ensureCharacterStartsWhite();
            }
            
            // Initialize team character colors (skip on console page)
            if (!window.location.pathname.includes('console.html')) {
                await this.initializeTeamCharacterColors();
                
                // Start continuous team character random animations (5-20 seconds)
                await this.startTeamAnimations();
            }
            
            // Setup global functions for backward compatibility
            this.setupBackwardCompatibility();
            
            this.initialized = true;
            
        } catch (error) {
        }
    }
    
    // Wait for DOM to be ready
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // Wait for required dependencies
    waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                const required = [
                    'ProgressWhite' // Character colors
                ];
                
                const missing = required.filter(dep => typeof window[dep] === 'undefined');
                
                if (missing.length === 0) {
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            
            checkDependencies();
        });
    }
    
    // Initialize all systems
    async initializeSystems() {
        const systems = [
            () => this.initializeGameState(),
            () => this.initializeCharacterController(),
            () => this.initializeBuzzingSystem(),
            () => this.initializeHotkeys(),
            () => this.initializeArduinoConnection(),
            () => this.initializeCloudGroup()
        ];
        
        // Execute all systems in order
        for (let i = 0; i < systems.length; i++) {
            try {
                await systems[i]();
                this.completedSteps++;
            } catch (error) {
                throw error;
            }
        }
    }
    
    // Initialize game state
    initializeGameState() {
        if (!window.gameState) {
            throw new Error('Game state not available');
        }
        
        // Load server state and sync with client state
        this.loadServerState();
        
        return Promise.resolve();
    }
    
    // Load server state and sync with client state
    loadServerState() {
        // Server state loading not needed in standalone version
    }
    
    // Request server state
    requestServerState() {
        // Server state not needed in standalone version
    }
    
    // Add event listener for server state response
    setupServerStateListener() {
        // Server state listener not needed in standalone version
    }
    
    // Sync client state with server state
    syncClientStateWithServer(serverState) {
        // Server sync not needed in standalone version
    }
    
    // Initialize character controller
    initializeCharacterController() {
        // Skip character controller initialization on console page
        if (window.location.pathname.includes('console.html')) {
            return Promise.resolve();
        }
        
        if (!window.characterController) {
            throw new Error('Character controller not available');
        }
        
        // Wait a bit for DOM elements to be available
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = window.characterController.init();
                if (success) {
                    resolve();
                } else {
                    throw new Error('Character controller initialization failed');
                }
            }, 500);
        });
    }
    
    // Initialize buzzing system
    initializeBuzzingSystem() {
        if (!window.buzzingSystem) {
            throw new Error('Buzzing system not available');
        }
        
        const success = window.buzzingSystem.init();
        if (!success) {
            throw new Error('Buzzing system initialization failed');
        }
        
        return Promise.resolve();
    }
    
    // Initialize hotkeys
    initializeHotkeys() {
        // Skip hotkeys initialization on console page
        if (window.location.pathname.includes('console.html')) {
            return Promise.resolve();
        }
        
        if (!window.hotkeysManager) {
            throw new Error('Hotkeys manager not available');
        }
        
        const success = window.hotkeysManager.init();
        if (!success) {
            throw new Error('Hotkeys initialization failed');
        }
        
        return Promise.resolve();
    }
    
    // Initialize team character colors
    async initializeTeamCharacterColors() {
        
        try {
            // Wait for ProgressWhite to be available
            if (window.ProgressWhite?.initializeTeamColors) {
                // Wait a bit for elements to be ready
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Initialize team colors
                window.ProgressWhite.initializeTeamColors();
            } else {
                
                // Fallback: manually set team character colors
                const teamColors = ['red', 'blue', 'lime', 'orange', 'pink', 'yellow'];
                for (let i = 1; i <= 6; i++) {
                    const teamCharacter = document.getElementById(`teamCharacter${i}`);
                    if (teamCharacter && window.ProgressWhite?.applyCharacterColor) {
                        await window.ProgressWhite.applyCharacterColor(`teamCharacter${i}`, teamColors[i-1]);
                    }
                }
            }
        } catch (error) {
        }
    }
    
    // Setup backward compatibility functions
    setupBackwardCompatibility() {
        // Setup global aliases for commonly used functions
        window.moveCharacterToQuestion = (setNumber, questionNumber) => {
            if (window.characterController) {
                return window.characterController.moveToQuestion(setNumber, questionNumber);
            }
        };
        
        window.getGameState = () => {
            return window.gameState?.get();
        };
        
    }
    
    // Ensure character starts as white
    async ensureCharacterStartsWhite() {
        // Skip character initialization on console page
        if (window.location.pathname.includes('console.html')) {
            return;
        }
        
        try {
            const progressCharacter = document.getElementById('progressCharacter');
            if (progressCharacter) {
                // Wait a moment to ensure the element is fully ready
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Use ProgressWhite system to properly apply white color
                if (window.ProgressWhite && window.ProgressWhite.applyCharacterColor) {
                    const success = await window.ProgressWhite.applyCharacterColor('progressCharacter', 'white');
                } else {
                    // Fallback: direct src assignment
                    progressCharacter.src = 'assets/animations/among_us_idle.json';
                }
                
                // Ensure it's visible and playing
                progressCharacter.style.display = 'block';
                
                // Wait for it to load
                await new Promise(resolve => setTimeout(resolve, 200));
            } else {
            }
            
            // Reset game state to ensure no team is selected
            window.gameState.set('currentTeam', 0);
            
        } catch (error) {
        }
    }
    
    // Start continuous team character random animations
    async startTeamAnimations() {
        try {
            
            // Wait a bit for all characters to be properly initialized
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Start the continuous animation system
            if (window.ProgressWhite?.teamAnimationSystem) {
                window.ProgressWhite.teamAnimationSystem.startContinuousAnimations();
            } else {
            }
        } catch (error) {
        }
    }
    
    // Initialize cloud group interactions
    initializeCloudGroup() {
        if (window.location.pathname.includes('console.html')) {
            return;
        }
        
        const cloudGroup = document.getElementById('cloudGroup');
        const cloudGroupMain = document.getElementById('cloudGroupMain');
        
        if (!cloudGroup || !cloudGroupMain) {
            return;
        }
        
        
        // Simple toggle with debugging
        cloudGroupMain.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = cloudGroup.classList.contains('active');
            cloudGroup.classList.toggle('active');
            
            
            // Debug: Check if cloud options are visible
            const cloudOptions = cloudGroup.querySelectorAll('.cloud-option');
            cloudOptions.forEach((option, index) => {
                const isVisible = window.getComputedStyle(option).display !== 'none';
            });
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!cloudGroup.contains(e.target)) {
                cloudGroup.classList.remove('active');
            }
        });
        
        // Handle individual cloud button clicks with debugging
        const cloudOptions = cloudGroup.querySelectorAll('.cloud-option');
        cloudOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                
                // Close the cloud group after a short delay
                setTimeout(() => {
                    cloudGroup.classList.remove('active');
                }, 200);
            });
        });
        
        
        // Ensure global functions are available
        if (!window.toggleArduinoConnection) {
            window.toggleArduinoConnection = () => {
                    if (window.arduinoConnected) {
                    // Arduino disconnect logic (not needed in standalone)
                    } else {
                    // Arduino connect logic (not needed in standalone)
                }
            };
        }
        
        if (!window.resetGameFromMain) {
            window.resetGameFromMain = () => {
                // Use comprehensive reset directly from gameState
                if (window.gameState) {
                    window.gameState.reset();
                }
            };
        }
    }
    
    
    // Get initialization status
    getStatus() {
        return {
            initialized: this.initialized,
            completedSteps: this.completedSteps,
            totalSteps: this.initializationSteps.length,
            systems: this.systems
        };
    }
    
    initializeArduinoConnection() {
        // Skip Arduino connection on console page
        if (window.location.pathname.includes('console.html')) {
            return Promise.resolve();
        }
        
        
        // Initialize Arduino connection status
        window.arduinoConnected = false;
        
        // Listen for Arduino status changes
        document.addEventListener('arduinoStatusChanged', (event) => {
            const { connected, message } = event.detail;
            window.arduinoConnected = connected;
            this.updateArduinoUI();
        });
        
        // Get initial Arduino status (not needed in standalone)
        
        // Set up global Arduino toggle function
        window.toggleArduinoConnection = () => {
            if (window.arduinoConnected) {
            } else {
            }
        };
        
        // Set initial UI state
        this.updateArduinoUI();
        
        return Promise.resolve();
    }
    
    updateArduinoUI() {
        // Skip Arduino UI update on console page
        if (window.location.pathname.includes('console.html')) {
            return;
        }
        
        const arduinoToggle = document.getElementById('arduinoToggle');
        const arduinoIcon = document.getElementById('arduinoIcon');
        
        if (!arduinoToggle || !arduinoIcon) {
            return;
        }
        
        
        if (window.arduinoConnected) {
            arduinoIcon.className = 'ri-cpu-fill';
            arduinoToggle.title = 'Disconnect Arduino';
        } else {
            arduinoIcon.className = 'ri-cpu-line';
            arduinoToggle.title = 'Connect Arduino';
        }
    }
    
    // Reset game from main page
    resetGameFromMain() {
        // Use the comprehensive reset function directly from gameState
            if (window.gameState) {
                window.gameState.reset();
        }
        
        // Show reset confirmation
        this.showResetConfirmation();
    }
    
    // Show reset confirmation
    showResetConfirmation() {
        const resetToggle = document.getElementById('resetToggle');
        if (resetToggle) {
            const originalIcon = resetToggle.innerHTML;
            resetToggle.innerHTML = '<i class="ri-check-line"></i>';
            resetToggle.style.background = 'rgba(76, 175, 80, 0.9)';
            resetToggle.style.color = 'white';
            
            setTimeout(() => {
                resetToggle.innerHTML = originalIcon;
                resetToggle.style.background = '';
                resetToggle.style.color = '';
            }, 2000);
        }
    }
}

// Create and initialize main page app
const mainPageApp = new MainPageApp();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mainPageApp.init());
} else {
    mainPageApp.init();
}

// Export for global access
window.mainPageApp = mainPageApp;

// Global function for reset button
window.resetGameFromMain = () => {
    if (window.mainPageApp) {
        window.mainPageApp.resetGameFromMain();
    } else {
        // Use comprehensive reset directly from gameState
        if (window.gameState) {
            window.gameState.reset();
        }
    }
};

// ========== CONSOLE MODAL FUNCTIONS ==========

// Teams Modal Functions
window.openTeamsModal = () => {
    document.getElementById('teamsModal').classList.add('active');
    initializeTeamsTable();
    updateTeamsTable();
};

window.closeTeamsModal = () => {
    document.getElementById('teamsModal').classList.remove('active');
};

// Questions Modal Functions
window.openQuestionsModal = () => {
    document.getElementById('questionsModal').classList.add('active');
    initializeQuestionsTable();
    updateQuestionsTable();
};

window.closeQuestionsModal = () => {
    document.getElementById('questionsModal').classList.remove('active');
};

// Logs Modal Functions
window.openLogsModal = () => {
    document.getElementById('logsModal').classList.add('active');
};

window.closeLogsModal = () => {
    document.getElementById('logsModal').classList.remove('active');
};

// Upload Modal Functions
window.openUploadModal = () => {
    document.getElementById('uploadModal').classList.add('active');
    initializeXLSXHandling();
};

window.closeUploadModal = () => {
    document.getElementById('uploadModal').classList.remove('active');
    const fileInput = document.getElementById('xlsxFileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    if (fileInput) fileInput.value = '';
    if (uploadBtn) uploadBtn.disabled = true;
};

// Theme Modal Functions
window.closeThemeModal = () => {
    const modal = document.getElementById('themeModal');
    modal.classList.remove('active');
    window.currentThemeSetNumber = null;
};

// ========== TEAMS MANAGEMENT ==========

function initializeTeamsTable() {
    const tableBody = document.getElementById('teamsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    for (let teamId = 1; teamId <= 6; teamId++) {
        const team = window.gameState.state.teams[teamId];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="team-color-cell">
                <div class="color-circle" style="background: ${getColorValue(team.color)}" onclick="toggleColorDropdown(${teamId}, event)"></div>
            </td>
            <td class="team-name-cell">
                <div class="team-name-display" onclick="editTeamName(${teamId})" id="teamNameDisplay-${teamId}">${team.name}</div>
                <input type="text" class="team-name-input hidden" id="teamNameInput-${teamId}" value="${team.name}" onblur="saveTeamName(${teamId})" onkeypress="handleTeamNameKeypress(event, ${teamId})">
            </td>
            <td class="team-score-cell">
                <div class="team-score-display" onclick="editTeamScore(${teamId})" id="teamScoreDisplay-${teamId}">${team.score}</div>
                <input type="number" class="team-score-input hidden" id="teamScoreInput-${teamId}" value="${team.score}" onblur="saveTeamScore(${teamId})" onkeypress="handleTeamScoreKeypress(event, ${teamId})">
            </td>
            <td class="team-cards-cell">
                <div class="team-action-card angel ${window.gameState.state.actionCards[teamId].angel ? 'active' : ''}" onclick="toggleActionCard(${teamId}, 'angel')" id="angelCard-${teamId}"></div>
                <div class="team-action-card devil ${window.gameState.state.actionCards[teamId].devil ? 'active' : ''}" onclick="toggleActionCard(${teamId}, 'devil')" id="devilCard-${teamId}"></div>
                <div class="team-action-card cross ${window.gameState.state.actionCards[teamId].cross ? 'active' : ''}" onclick="toggleActionCard(${teamId}, 'cross')" id="crossCard-${teamId}"></div>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
    
    populateAllColorOptions();
}

function updateTeamsTable() {
    for (let teamId = 1; teamId <= 6; teamId++) {
        const team = window.gameState.state.teams[teamId];
        
        // Update color circle
        const colorCircle = document.querySelector(`#teamsTableBody tr:nth-child(${teamId}) .color-circle`);
        if (colorCircle) {
            colorCircle.style.background = getColorValue(team.color);
        }
        
        // Update name display
        const nameDisplay = document.getElementById(`teamNameDisplay-${teamId}`);
        if (nameDisplay) {
            nameDisplay.textContent = team.name;
        }
        
        // Update score
        const scoreDisplay = document.getElementById(`teamScoreDisplay-${teamId}`);
        if (scoreDisplay) {
            scoreDisplay.textContent = team.score;
        }
        
        // Update action cards
        updateActionCardDisplay(teamId);
    }
}

function getColorValue(color) {
    const colorMap = {
        red: '#EF4444',
        blue: '#3B82F6',
        lime: '#84CC16',
        orange: '#F97316',
        purple: '#8B5CF6',
        cyan: '#06B6D4',
        pink: '#EC4899',
        yellow: '#EAB308'
    };
    return colorMap[color] || color;
}

function populateAllColorOptions() {
    for (let teamId = 1; teamId <= 6; teamId++) {
        populateColorOptions(teamId);
    }
}

function populateColorOptions(teamId) {
    const colorGrid = document.getElementById(`colorGrid-${teamId}`);
    if (!colorGrid) return;
    
    colorGrid.innerHTML = '';
    
    const availableColors = ['red', 'blue', 'lime', 'orange', 'purple', 'cyan', 'pink', 'yellow'];
    
    availableColors.forEach(color => {
        const isUsed = Object.values(window.gameState.state.teams).some(team => 
            team.color === color && window.gameState.state.teams[teamId].color !== color
        );
        
        const colorOption = document.createElement('div');
        colorOption.className = `color-option ${isUsed ? 'used' : ''}`;
        colorOption.style.background = getColorValue(color);
        colorOption.onclick = () => !isUsed && changeTeamColor(teamId, color);
        colorOption.title = color.charAt(0).toUpperCase() + color.slice(1) + (isUsed ? ' (Already Used)' : '');
        
        colorGrid.appendChild(colorOption);
    });
}

function toggleColorDropdown(teamId, event) {
    const dropdown = document.getElementById(`colorDropdown-${teamId}`);
    const backdrop = document.getElementById('colorDropdownBackdrop');
    
    if (!dropdown) return;
    
    // Close all other dropdowns first
    document.querySelectorAll('.color-dropdown').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
        }
    });
    
    const isActive = dropdown.classList.contains('active');
    
    if (!isActive) {
        dropdown.classList.add('active');
        backdrop.classList.add('active');
        populateColorOptions(teamId);
    } else {
        dropdown.classList.remove('active');
        backdrop.classList.remove('active');
    }
}

window.closeAllColorDropdowns = () => {
    document.querySelectorAll('.color-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    const backdrop = document.getElementById('colorDropdownBackdrop');
    if (backdrop) backdrop.classList.remove('active');
};

function changeTeamColor(teamId, color) {
    const oldColor = window.gameState.state.teams[teamId].color;
    window.gameState.state.teams[teamId].color = color;
    
    // Update UI
    updateTeamsTable();
    
    // Close dropdown and backdrop
    window.closeAllColorDropdowns();
    
    // Update all color dropdowns
    populateAllColorOptions();
    
    addLog(`Team ${teamId} color: ${oldColor} → ${color}`, 'info');
}

function editTeamName(teamId) {
    const nameDisplay = document.getElementById(`teamNameDisplay-${teamId}`);
    const nameInput = document.getElementById(`teamNameInput-${teamId}`);
    
    if (nameDisplay && nameInput) {
        const currentName = window.gameState.state.teams[teamId].name;
        nameInput.value = currentName;
        nameDisplay.classList.add('hidden');
        nameInput.classList.remove('hidden');
        nameInput.focus();
        nameInput.select();
    }
}

function saveTeamName(teamId) {
    const nameDisplay = document.getElementById(`teamNameDisplay-${teamId}`);
    const nameInput = document.getElementById(`teamNameInput-${teamId}`);
    
    if (!nameDisplay || !nameInput) return;
    
    const newName = nameInput.value.trim();
    
    if (newName) {
        const oldName = window.gameState.state.teams[teamId].name;
        window.gameState.state.teams[teamId].name = newName;
        
        nameDisplay.textContent = newName;
        
        addLog(`Team ${teamId} name: "${oldName}" → "${newName}"`, 'info');
    }
    
    nameDisplay.classList.remove('hidden');
    nameInput.classList.add('hidden');
}

function handleTeamNameKeypress(event, teamId) {
    if (event.key === 'Enter') {
        saveTeamName(teamId);
    }
}

function editTeamScore(teamId) {
    const scoreDisplay = document.getElementById(`teamScoreDisplay-${teamId}`);
    const scoreInput = document.getElementById(`teamScoreInput-${teamId}`);
    
    if (scoreDisplay && scoreInput) {
        const currentScore = window.gameState.state.teams[teamId].score;
        scoreInput.value = currentScore;
        scoreDisplay.classList.add('hidden');
        scoreInput.classList.remove('hidden');
        scoreInput.focus();
        scoreInput.select();
    }
}

function saveTeamScore(teamId) {
    const scoreDisplay = document.getElementById(`teamScoreDisplay-${teamId}`);
    const scoreInput = document.getElementById(`teamScoreInput-${teamId}`);
    
    if (!scoreDisplay || !scoreInput) return;
    
    const newScore = parseInt(scoreInput.value) || 0;
    const oldScore = window.gameState.state.teams[teamId].score;
    
    if (newScore !== oldScore) {
        window.gameState.state.teams[teamId].score = newScore;
        scoreDisplay.textContent = newScore;
        
        // Update rankings when score changes
        window.gameState.calculateRankings();
        
        addLog(`Team ${teamId} score: ${oldScore} → ${newScore}`, 'info');
    }
    
    scoreDisplay.classList.remove('hidden');
    scoreInput.classList.add('hidden');
}

function handleTeamScoreKeypress(event, teamId) {
    if (event.key === 'Enter') {
        saveTeamScore(teamId);
    }
}

function updateActionCardDisplay(teamId) {
    const actionCards = window.gameState.state.actionCards[teamId];
    
    // Update angel card
    const angelCard = document.getElementById(`angelCard-${teamId}`);
    if (angelCard) {
        angelCard.className = `team-action-card angel ${actionCards.angel ? 'active' : ''} ${actionCards.angelUsed ? 'used' : ''}`;
    }
    
    // Update devil card
    const devilCard = document.getElementById(`devilCard-${teamId}`);
    if (devilCard) {
        devilCard.className = `team-action-card devil ${actionCards.devil ? 'active' : ''} ${actionCards.devilUsed ? 'used' : ''}`;
    }
    
    // Update cross card
    const crossCard = document.getElementById(`crossCard-${teamId}`);
    if (crossCard) {
        crossCard.className = `team-action-card cross ${actionCards.cross ? 'active' : ''}`;
    }
}

function toggleActionCard(teamId, cardType) {
    const actionCards = window.gameState.state.actionCards[teamId];
    
    if (cardType === 'angel') {
        if (actionCards.angelUsed) {
            addLog(`Team ${teamId} angel card already used`, 'warning');
            return;
        }
        
        const isActive = actionCards.angel;
        actionCards.angel = !isActive;
        
        updateActionCardDisplay(teamId);
        
        addLog(`Team ${teamId} angel card: ${isActive ? 'disabled' : 'enabled'}`, 'info');
        
    } else if (cardType === 'devil') {
        if (actionCards.devilUsed) {
            addLog(`Team ${teamId} devil card already used`, 'warning');
            return;
        }
        
        const isActive = actionCards.devil;
        actionCards.devil = !isActive;
        
        updateActionCardDisplay(teamId);
        
        addLog(`Team ${teamId} devil card: ${isActive ? 'disabled' : 'enabled'}`, 'info');
        
    } else if (cardType === 'cross') {
        const isActive = actionCards.cross;
        actionCards.cross = !isActive;
        
        updateActionCardDisplay(teamId);
        
        addLog(`Team ${teamId} cross card: ${isActive ? 'disabled' : 'enabled'}`, 'info');
    }
}

// ========== QUESTIONS MANAGEMENT ==========

function initializeQuestionsTable() {
    const tableBody = document.getElementById('questionsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    for (let setNumber = 1; setNumber <= 8; setNumber++) {
        const setInfo = window.gameState.state.questionSets[setNumber];
        if (!setInfo) continue;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="question-set-number">Set ${setNumber}</td>
            <td class="question-set-title-cell">
                <div class="question-set-title-display" onclick="editQuestionSetTitle(${setNumber})" id="questionSetTitleDisplay-${setNumber}">${setInfo.title}</div>
                <input type="text" class="question-set-title-input hidden" id="questionSetTitleInput-${setNumber}" 
                       value="${setInfo.title}" 
                       onblur="saveQuestionSetTitle(${setNumber})" 
                       onkeypress="handleQuestionSetTitleKeypress(event, ${setNumber})">
            </td>
            <td class="question-set-theme">
                <img src="assets/themes/${setInfo.theme}.png" alt="${setInfo.theme}" class="theme-icon clickable" id="themeIcon-${setNumber}" onclick="toggleThemeDropdown(${setNumber})" title="Click to change theme">
            </td>
            <td class="question-buttons">
                <button class="question-btn" onclick="goToQuestion(${setNumber}, 1)">Q1</button>
                <button class="question-btn" onclick="goToQuestion(${setNumber}, 2)">Q2</button>
                <button class="question-btn" onclick="goToQuestion(${setNumber}, 3)">Q3</button>
                <button class="question-btn" onclick="goToQuestion(${setNumber}, 4)">Q4</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
    
    updateQuestionsTable();
}

function updateQuestionsTable() {
    const currentSet = window.gameState.state.currentSet;
    const currentQuestion = window.gameState.state.currentQuestion;
    
    // Update current question button
    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.classList.remove('current');
    });
    
    const currentBtn = document.querySelector(`button[onclick="goToQuestion(${currentSet}, ${currentQuestion})"]`);
    if (currentBtn) {
        currentBtn.classList.add('current');
    }
    
    // Update theme icons
    for (let setNumber = 1; setNumber <= 8; setNumber++) {
        const setInfo = window.gameState.state.questionSets[setNumber];
        if (setInfo) {
            const themeIcon = document.getElementById(`themeIcon-${setNumber}`);
            if (themeIcon) {
                themeIcon.src = `assets/themes/${setInfo.theme}.png`;
                themeIcon.alt = setInfo.theme;
            }
        }
    }
}

function editQuestionSetTitle(setNumber) {
    const titleDisplay = document.getElementById(`questionSetTitleDisplay-${setNumber}`);
    const titleInput = document.getElementById(`questionSetTitleInput-${setNumber}`);
    
    if (titleDisplay && titleInput) {
        const currentTitle = window.gameState.state.questionSets[setNumber].title;
        titleInput.value = currentTitle;
        titleDisplay.classList.add('hidden');
        titleInput.classList.remove('hidden');
        titleInput.focus();
        titleInput.select();
    }
}

function saveQuestionSetTitle(setNumber) {
    const titleDisplay = document.getElementById(`questionSetTitleDisplay-${setNumber}`);
    const titleInput = document.getElementById(`questionSetTitleInput-${setNumber}`);
    
    if (!titleDisplay || !titleInput) return;
    
    const newTitle = titleInput.value.trim();
    
    if (newTitle) {
        const oldTitle = window.gameState.state.questionSets[setNumber].title;
        window.gameState.state.questionSets[setNumber].title = newTitle;
        
        titleDisplay.textContent = newTitle;
        
        addLog(`Set ${setNumber} title updated: "${oldTitle}" → "${newTitle}"`, 'info');
    }
    
    titleDisplay.classList.remove('hidden');
    titleInput.classList.add('hidden');
}

function handleQuestionSetTitleKeypress(event, setNumber) {
    if (event.key === 'Enter') {
        saveQuestionSetTitle(setNumber);
    }
}

function toggleThemeDropdown(setNumber) {
    // Store the current set number for the modal
    window.currentThemeSetNumber = setNumber;
    
    // Show the theme modal
    const modal = document.getElementById('themeModal');
    modal.classList.add('active');
    
    // Populate theme options
    populateThemeOptions();
}

function populateThemeOptions() {
    const themeList = document.getElementById('themeList');
    if (!themeList) return;
    
    themeList.innerHTML = '';
    
    // Available themes from assets/themes directory
    const themes = [
        { name: 'Brainstorm', icon: 'brainstorm' },
        { name: 'Clock', icon: 'clock' },
        { name: 'DNA', icon: 'dna' },
        { name: 'Exercise', icon: 'exercise' },
        { name: 'Flask', icon: 'flask' },
        { name: 'Frustration', icon: 'frustration' },
        { name: 'Health', icon: 'health' },
        { name: 'Oil', icon: 'oil' },
        { name: 'Reru', icon: 'reru' },
        { name: 'Sleep', icon: 'sleep' },
        { name: 'Stress', icon: 'stress' },
        { name: 'Thai', icon: 'thai' },
        { name: 'Vegetable', icon: 'vegetable' }
    ];
    
    themes.forEach(theme => {
        const themeItem = document.createElement('div');
        themeItem.className = 'theme-item';
        themeItem.onclick = () => selectTheme(theme.icon, theme.name);
        
        themeItem.innerHTML = `
            <img src="assets/themes/${theme.icon}.png" alt="${theme.name}" class="theme-item-icon">
            <div class="theme-item-name">${theme.name}</div>
        `;
        
        themeList.appendChild(themeItem);
    });
}

function selectTheme(icon, name) {
    const setNumber = window.currentThemeSetNumber;
    
    // Update the theme in game state
    window.gameState.state.questionSets[setNumber].theme = icon;
    
    // Update the questions table to reflect the change
    updateQuestionsTable();
    
    // Close modal
    window.closeThemeModal();
    
    addLog(`Set ${setNumber} theme updated: ${name}`, 'info');
}

function goToQuestion(setNumber, questionNumber) {
    window.gameState.moveToQuestion(setNumber, questionNumber);
    updateQuestionsTable();
    
    addLog(`Moved to Set ${setNumber}, Question ${questionNumber}`, 'info');
}

// ========== LOGS SYSTEM ==========

window.clearLogs = function() {
    const logsContent = document.getElementById('logsContentArea');
    if (logsContent) {
        logsContent.innerHTML = `
            <div class="logs-empty">
                <i class="ri-file-list-line"></i>
                <p>No logs available</p>
                <small style="color: #ccc; margin-top: 8px;">System events will appear here</small>
            </div>
        `;
    }
};

window.exportLogs = function() {
    const logsContent = document.getElementById('logsContentArea');
    if (!logsContent) return;
    
    const logs = logsContent.innerText;
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('Logs exported successfully', 'success');
};

function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const logsContent = document.getElementById('logsContentArea');
    if (!logsContent) return;
    
    // Remove empty state if it exists
    const emptyState = logsContent.querySelector('.logs-empty');
    if (emptyState) {
        emptyState.remove();
    }
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    logEntry.innerHTML = `
        <div class="log-cell">
            <span class="log-time">${timestamp}</span>
        </div>
        <div class="log-cell">
            <span class="log-type ${type}">${type}</span>
        </div>
        <div class="log-cell">
            <span class="log-message">${message}</span>
        </div>
    `;
    
    logsContent.appendChild(logEntry);
    
    // Auto-scroll to bottom
    const wrapper = logsContent.closest('.logs-content-wrapper');
    if (wrapper) {
        wrapper.scrollTop = wrapper.scrollHeight;
    }
}

// ========== XLSX FILE HANDLING ==========

function initializeXLSXHandling() {
    const fileInput = document.getElementById('xlsxFileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (!fileInput || !uploadBtn) return;
    
    // Handle file selection
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            uploadBtn.disabled = false;
            addLog(`File selected: ${file.name}`, 'info');
        }
    });
    
    // Handle drag and drop
    const dropZone = document.querySelector('.upload-drop-zone');
    if (!dropZone) return;
    
    dropZone.addEventListener('dragover', function(event) {
        event.preventDefault();
        dropZone.style.borderColor = '#007aff';
        dropZone.style.background = 'rgba(0, 122, 255, 0.1)';
    });
    
    dropZone.addEventListener('dragleave', function(event) {
        event.preventDefault();
        dropZone.style.borderColor = 'rgba(0, 122, 255, 0.3)';
        dropZone.style.background = 'rgba(0, 122, 255, 0.02)';
    });
    
    dropZone.addEventListener('drop', function(event) {
        event.preventDefault();
        dropZone.style.borderColor = 'rgba(0, 122, 255, 0.3)';
        dropZone.style.background = 'rgba(0, 122, 255, 0.02)';
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            uploadBtn.disabled = false;
            addLog(`File dropped: ${files[0].name}`, 'info');
        }
    });
}

window.processUploadedFile = function() {
    const fileInput = document.getElementById('xlsxFileInput');
    const file = fileInput?.files[0];
    
    if (!file) {
        addLog('No file selected', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Process teams sheet
            if (workbook.SheetNames.includes('teams')) {
                const teamsSheet = workbook.Sheets['teams'];
                const teamsData = XLSX.utils.sheet_to_json(teamsSheet);
                processTeamsData(teamsData);
            }
            
            // Process questions sheet
            if (workbook.SheetNames.includes('questions')) {
                const questionsSheet = workbook.Sheets['questions'];
                const questionsData = XLSX.utils.sheet_to_json(questionsSheet);
                processQuestionsData(questionsData);
            }
            
            addLog(`Successfully processed XLSX file: ${file.name}`, 'success');
            window.closeUploadModal();
            
        } catch (error) {
            addLog(`Error processing XLSX file: ${error.message}`, 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
};

function processTeamsData(teamsData) {
    teamsData.forEach(row => {
        const teamId = parseInt(row.team_id);
        if (teamId >= 1 && teamId <= 6) {
            // Update team name
            if (row.team_name) {
                window.gameState.state.teams[teamId].name = row.team_name;
            }
            
            // Update team color
            if (row.team_color) {
                const validColors = ['red', 'blue', 'lime', 'orange', 'purple', 'cyan', 'pink', 'yellow'];
                if (validColors.includes(row.team_color.toLowerCase())) {
                    window.gameState.state.teams[teamId].color = row.team_color.toLowerCase();
                }
            }
            
            // Update score
            if (row.score !== undefined) {
                window.gameState.state.teams[teamId].score = parseInt(row.score) || 0;
            }
            
            // Update action cards
            if (row.angel !== undefined) {
                window.gameState.state.actionCards[teamId].angel = Boolean(row.angel);
            }
            if (row.devil !== undefined) {
                window.gameState.state.actionCards[teamId].devil = Boolean(row.devil);
            }
            if (row.cross !== undefined) {
                window.gameState.state.actionCards[teamId].cross = Boolean(row.cross);
            }
        }
    });
    
    updateTeamsTable();
    addLog('Teams data updated from XLSX', 'success');
}

function processQuestionsData(questionsData) {
    questionsData.forEach(row => {
        const setId = parseInt(row.set_id);
        if (setId >= 1 && setId <= 8) {
            // Update question set title
            if (row.title) {
                window.gameState.state.questionSets[setId].title = row.title;
            }
            
            // Update theme
            if (row.theme) {
                window.gameState.state.questionSets[setId].theme = row.theme.toLowerCase();
            }
        }
    });
    
    updateQuestionsTable();
    addLog('Questions data updated from XLSX', 'success');
}

window.downloadXLSX = function() {
    try {
        // Create workbook
        const workbook = XLSX.utils.book_new();
        
        // Create teams data
        const teamsData = [];
        for (let teamId = 1; teamId <= 6; teamId++) {
            const team = window.gameState.state.teams[teamId];
            const cards = window.gameState.state.actionCards[teamId];
            teamsData.push({
                team_id: teamId,
                team_name: team.name,
                team_color: team.color,
                score: team.score,
                angel: cards.angel,
                devil: cards.devil,
                cross: cards.cross
            });
        }
        
        // Create questions data
        const questionsData = [];
        for (let setId = 1; setId <= 8; setId++) {
            const questionSet = window.gameState.state.questionSets[setId];
            questionsData.push({
                set_id: setId,
                title: questionSet.title,
                theme: questionSet.theme
            });
        }
        
        // Create sheets
        const teamsSheet = XLSX.utils.json_to_sheet(teamsData);
        const questionsSheet = XLSX.utils.json_to_sheet(questionsData);
        
        // Add sheets to workbook
        XLSX.utils.book_append_sheet(workbook, teamsSheet, 'teams');
        XLSX.utils.book_append_sheet(workbook, questionsSheet, 'questions');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `quiz_bowl_data_${timestamp}.xlsx`;
        
        // Download file
        XLSX.writeFile(workbook, filename);
        
        addLog(`XLSX file downloaded: ${filename}`, 'success');
        
    } catch (error) {
        addLog(`Error creating XLSX file: ${error.message}`, 'error');
    }
};

// ========== ARDUINO CONNECTION CONTROL ==========

class ArduinoController {
    constructor() {
        this.arduinoModal = null;
        this.arduinoStatusIcon = null;
        this.arduinoStatusText = null;
        this.arduinoPortText = null;
        this.isConnected = false;
        this.currentPort = null;
        this.showTimeout = null;
        this.serialPort = null;
        this.reader = null;
        this.writer = null;
        this.connectionMode = 'unknown'; // 'webserial', 'socketio', or 'unknown'
        this.socketManager = null;
        this.init();
    }

    init() {
        this.arduinoModal = document.getElementById('arduinoModal');
        this.arduinoStatusIcon = document.getElementById('arduinoStatusIcon');
        this.arduinoStatusText = document.getElementById('arduinoStatusText');
        this.arduinoPortText = document.getElementById('arduinoPortText');
        
        // Detect connection mode
        this.detectConnectionMode();
        
        if (this.connectionMode === 'webserial') {
            this.updateConnectionStatus(false, null);
            if (window.addLog) {
                addLog('Web Serial API mode - Direct Arduino connection', 'success');
            }
            this.autoConnect(); // Attempt auto-connect on init
        } else if (this.connectionMode === 'socketio') {
            this.updateConnectionStatus(false, null);
            if (window.addLog) {
                addLog('Socket.IO mode - Server-mediated Arduino connection', 'success');
            }
            this.initSocketIO();
        } else {
            this.updateConnectionStatus('unavailable', null);
            if (window.addLog) {
                addLog('Arduino connection not available', 'error');
                addLog('Web Serial API not supported in this browser', 'info');
            }
        }
    }

    // Detect whether to use Web Serial API or Socket.IO
    detectConnectionMode() {
        // Check if Socket.IO is available (Flask server running)
        if (typeof io !== 'undefined') {
            this.connectionMode = 'socketio';
            if (window.addLog) {
                addLog('Detected Socket.IO mode - Flask server is running', 'info');
            }
        } else if ('serial' in navigator) {
            this.connectionMode = 'webserial';
            if (window.addLog) {
                addLog('Detected Web Serial API mode - Standalone mode', 'info');
            }
        } else {
            this.connectionMode = 'unknown';
            if (window.addLog) {
                addLog('No Arduino connection method available', 'error');
            }
        }
    }

    // Initialize Socket.IO connection
    initSocketIO() {
        // Initialize Socket.IO manager
        if (typeof io !== 'undefined') {
            this.socketManager = {
                socket: io(),
                on: function(event, handler) {
                    this.socket.on(event, handler);
                },
                emit: function(event, data) {
                    this.socket.emit(event, data);
                },
                connectArduino: function(port, baudrate) {
                    this.emit('connect_arduino', { port, baudrate });
                },
                disconnectArduino: function() {
                    this.emit('disconnect_arduino');
                },
                getArduinoStatus: function() {
                    this.emit('get_arduino_status');
                }
            };
            
            // Add connection event listeners for debugging
            this.socketManager.socket.on('connect', () => {
                if (window.addLog) {
                    addLog('Socket.IO connected to server', 'success');
                }
                // Get initial status after connection
                this.socketManager.getArduinoStatus();
            });
            
            this.socketManager.socket.on('disconnect', () => {
                if (window.addLog) {
                    addLog('Socket.IO disconnected from server', 'warning');
                }
            });
            
            this.socketManager.socket.on('connect_error', (error) => {
                if (window.addLog) {
                    addLog(`Socket.IO connection error: ${error}`, 'error');
                }
            });
            
            // Listen for Arduino status changes
            this.socketManager.on('arduino_status', (data) => {
                if (window.addLog) {
                    addLog(`Received arduino_status: ${JSON.stringify(data)}`, 'info');
                }
                this.isConnected = data.connected;
                this.updateConnectionStatus(data.connected, data.message || 'Socket.IO connection');
                this.showArduinoModal();
            });
            
            // Listen for Arduino buzzer data
            this.socketManager.on('buzzer_data', (data) => {
                if (window.addLog) {
                    addLog(`Received buzzer_data: ${data}`, 'info');
                }
                this.processArduinoData(data);
            });
            
            // Listen for buzzer pressed events (from server)
            this.socketManager.on('buzzer_pressed', (data) => {
                if (window.addLog) {
                    addLog(`Team ${data.teamId} buzzed in!`, 'success');
                }
                // Handle buzzer press in the game - update current team and show buzzing
                if (window.gameState) {
                    window.gameState.set('currentTeam', data.teamId);
                }
                if (window.buzzingSystem) {
                    window.buzzingSystem.simulateBuzzer(data.teamId);
                }
            });
            
            // Listen for clear buzzers event
            this.socketManager.on('clear_buzzers', () => {
                if (window.addLog) {
                    addLog('Buzzers cleared', 'info');
                }
                // Clear buzzer state in the game
                if (window.buzzingSystem) {
                    window.buzzingSystem.clearAll();
                }
                // Reset current team
                if (window.gameState) {
                    window.gameState.set('currentTeam', 0);
                }
            });
            
            if (window.addLog) {
                addLog('Socket.IO manager initialized successfully', 'success');
            }
        } else {
            if (window.addLog) {
                addLog('Socket.IO not available', 'error');
            }
        }
    }

    toggleConnection() {
        if (window.addLog) {
            addLog(`Toggle Arduino - Mode: ${this.connectionMode}, Connected: ${this.isConnected}`, 'info');
        }
        
        if (this.connectionMode === 'webserial') {
            if (this.isConnected) {
                this.disconnect();
            } else {
                this.connect();
            }
        } else if (this.connectionMode === 'socketio') {
            if (this.isConnected) {
                if (window.addLog) {
                    addLog('Disconnecting Arduino via Socket.IO...', 'info');
                }
                this.socketManager.disconnectArduino();
            } else {
                if (window.addLog) {
                    addLog('Connecting Arduino via Socket.IO...', 'info');
                }
                this.socketManager.connectArduino();
            }
        } else {
            if (window.addLog) {
                addLog('No connection mode available', 'error');
            }
        }
        this.showArduinoModal();
    }

    async autoConnect() {
        if (!('serial' in navigator)) return;

        try {
            // Get list of previously approved ports
            const ports = await navigator.serial.getPorts();
            
            if (ports.length === 0) {
                if (window.addLog) {
                    addLog('No previously connected Arduino found', 'info');
                    addLog('Press "A" to manually connect to Arduino', 'info');
                }
                return;
            }

            // Try to connect to the first available port (most recent Arduino)
            if (window.addLog) {
                addLog('Found previously connected Arduino, connecting...', 'info');
            }

            this.updateConnectionStatus('connecting', 'Auto-connecting...');

            this.serialPort = ports[0]; // Use first (most recent) port
            
            // Open the serial port with Arduino-compatible settings
            await this.serialPort.open({ 
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            // Get port info
            const portInfo = this.serialPort.getInfo();
            const portName = `USB Serial (${portInfo.usbVendorId ? `VID:${portInfo.usbVendorId.toString(16).toUpperCase()}` : 'Auto'})`;

            this.updateConnectionStatus(true, portName);
            
            if (window.addLog) {
                addLog('Arduino auto-connected successfully!', 'success');
                addLog(`Port: ${portName}`, 'info');
            }

            // Set up readers and writers
            this.reader = this.serialPort.readable.getReader();
            this.writer = this.serialPort.writable.getWriter();

            // Start reading data
            this.startReading();

        } catch (error) {
            if (window.addLog) {
                addLog('Auto-connect failed, manual connection available', 'warning');
                addLog('Press "A" to manually select Arduino port', 'info');
            }
            this.updateConnectionStatus(false, null);
        }
    }

    async connect() {
        // Check if Web Serial API is supported
        if (!('serial' in navigator)) {
            this.updateConnectionStatus('unavailable', null);
            if (window.addLog) {
                addLog('Web Serial API not supported in this browser', 'error');
                addLog('Please use Chrome, Edge, or Opera for Arduino connectivity', 'info');
            }
            return;
        }

        try {
            // Show connecting status
            this.updateConnectionStatus('connecting', 'Selecting port...');
            
            if (window.addLog) {
                addLog('Opening serial port selection dialog...', 'info');
                addLog('💡 If no Arduino appears in the list:', 'info');
                addLog('1. Your Arduino may be in use by the Flask server', 'warning');
                addLog('2. Try using a different Arduino (connect second one)', 'info');
                addLog('3. Or temporarily stop the Flask server to test', 'info');
            }

            // Request a port and open a connection with Arduino-specific filters
            this.serialPort = await navigator.serial.requestPort({
                filters: [
                    { usbVendorId: 0x2341 }, // Arduino LLC
                    { usbVendorId: 0x1A86 }, // CH340 Serial chips (common on Arduino clones)
                    { usbVendorId: 0x0403 }, // FTDI (common on Arduino boards)
                    { usbVendorId: 0x10C4 }, // Silicon Labs (ESP32 boards)
                    { usbVendorId: 0x16C0 }, // Van Ooijen Technische Informatica (Teensy)
                ]
            });
            
            if (window.addLog) {
                addLog('Serial port selected, connecting...', 'info');
            }

            // Log port info for debugging
            const portInfo = this.serialPort.getInfo();
            if (window.addLog) {
                addLog(`Port info - VID: ${portInfo.usbVendorId || 'Unknown'}, PID: ${portInfo.usbProductId || 'Unknown'}`, 'info');
            }

            // Open the serial port with Arduino-compatible settings
            await this.serialPort.open({ 
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            // Use port info from above for display name
            const portName = `USB Serial (${portInfo.usbVendorId ? `VID:${portInfo.usbVendorId.toString(16).toUpperCase()}` : 'Unknown'})`;

            this.updateConnectionStatus(true, portName);
            
            if (window.addLog) {
                addLog('Arduino connected successfully via Web Serial API', 'success');
                addLog(`Port: ${portName}`, 'info');
            }

            // Set up readers and writers
            this.reader = this.serialPort.readable.getReader();
            this.writer = this.serialPort.writable.getWriter();

            // Start reading data (optional - for receiving data from Arduino)
            this.startReading();

        } catch (error) {
            this.updateConnectionStatus(false, null);
            
            if (error.name === 'NotFoundError') {
                if (window.addLog) {
                    addLog('No serial port selected - dialog was cancelled', 'warning');
                    addLog('This usually means no Arduino was visible in the port list', 'info');
                }
                // Check what ports are available for debugging
                this.checkAvailablePorts();
            } else if (error.name === 'InvalidStateError') {
                if (window.addLog) {
                    addLog('Port is already open or in use by another application', 'error');
                    addLog('Try disconnecting other applications using this Arduino', 'info');
                }
                this.checkPortConflict();
            } else if (error.name === 'NetworkError') {
                if (window.addLog) {
                    addLog('Failed to open port - device may be disconnected', 'error');
                    addLog('Check USB connection and try again', 'info');
                }
                this.checkPortConflict();
            } else {
                if (window.addLog) {
                    addLog(`Arduino connection failed: ${error.name} - ${error.message}`, 'error');
                    addLog('Try unplugging and reconnecting your Arduino', 'info');
                }
                this.checkPortConflict();
            }
        }
    }

    async disconnect() {
        try {
            // Close reader and writer
            if (this.reader) {
                await this.reader.cancel();
                await this.reader.releaseLock();
                this.reader = null;
            }
            
            if (this.writer) {
                await this.writer.releaseLock();
                this.writer = null;
            }
            
            // Close the serial port
            if (this.serialPort) {
                await this.serialPort.close();
                this.serialPort = null;
            }
            
            this.updateConnectionStatus(false, null);
            
            if (window.addLog) {
                addLog('Arduino disconnected successfully', 'info');
            }
            
        } catch (error) {
            if (window.addLog) {
                addLog(`Error disconnecting Arduino: ${error.message}`, 'error');
            }
        }
    }

    async startReading() {
        try {
            while (this.reader && this.serialPort.readable) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    break;
                }
                
                // Convert the received data to string
                const textDecoder = new TextDecoder();
                const data = textDecoder.decode(value).trim();
                
                if (data && window.addLog) {
                    addLog(`Arduino: ${data}`, 'info');
                }
                
                // Here you can process the received data
                this.processArduinoData(data);
            }
        } catch (error) {
            if (window.addLog && error.name !== 'NetworkError') {
                addLog(`Error reading from Arduino: ${error.message}`, 'error');
            }
        }
    }

    processArduinoData(data) {
        // Process data received from Web Serial API or Socket.IO
        if (window.addLog) {
            addLog(`Processing Arduino data: ${data}`, 'info');
        }
        
        // Handle different message types
        if (data.startsWith('WINNER:')) {
            const teamId = parseInt(data.split(':')[1]);
            if (window.addLog) {
                addLog(`Team ${teamId} won the buzz!`, 'success');
            }
            // Handle winner in the game - update current team and show buzzing
            if (window.gameState) {
                window.gameState.set('currentTeam', teamId);
            }
            if (window.buzzingSystem) {
                window.buzzingSystem.simulateBuzzer(teamId);
            }
        } else if (data === 'RESET' || data === 'READY') {
            if (window.addLog) {
                addLog('Arduino reset/ready signal received', 'info');
            }
            // Clear buzzer state and reset current team
            if (window.buzzingSystem) {
                window.buzzingSystem.clearAll();
            }
            if (window.gameState) {
                window.gameState.set('currentTeam', 0);
            }
        } else if (data.startsWith('W:')) {
            // Handle W:1 format (winner format)
            const teamId = parseInt(data.split(':')[1]);
            if (window.addLog) {
                addLog(`Team ${teamId} won the buzz! (W: format)`, 'success');
            }
            // Handle winner in the game - update current team and show buzzing
            if (window.gameState) {
                window.gameState.set('currentTeam', teamId);
            }
            if (window.buzzingSystem) {
                window.buzzingSystem.simulateBuzzer(teamId);
            }
        } else {
            if (window.addLog) {
                addLog(`Other Arduino message: ${data}`, 'info');
            }
        }
    }

    async sendToArduino(data) {
        if (!this.writer || !this.isConnected) {
            if (window.addLog) {
                addLog('Arduino not connected - cannot send data', 'warning');
            }
            return false;
        }

        try {
            const encoder = new TextEncoder();
            await this.writer.write(encoder.encode(data + '\n'));
            
            if (window.addLog) {
                addLog(`Sent to Arduino: ${data}`, 'info');
            }
            
            return true;
        } catch (error) {
            if (window.addLog) {
                addLog(`Error sending to Arduino: ${error.message}`, 'error');
            }
            return false;
        }
    }

    updateConnectionStatus(status, port) {
        this.isConnected = status === true;
        this.currentPort = port;

        if (!this.arduinoStatusIcon) return;

        // Update icon classes
        this.arduinoStatusIcon.className = 'ri-cpu-line';
        
        if (status === 'connecting') {
            this.arduinoStatusIcon.parentElement.className = 'arduino-icon connecting';
            this.arduinoStatusText.textContent = 'Connecting...';
            this.arduinoPortText.textContent = port || 'Select serial port';
        } else if (status === 'unavailable') {
            this.arduinoStatusIcon.parentElement.className = 'arduino-icon disconnected';
            this.arduinoStatusText.textContent = 'Unavailable';
            this.arduinoPortText.textContent = 'Browser not supported';
        } else if (this.isConnected) {
            this.arduinoStatusIcon.parentElement.className = 'arduino-icon connected';
            this.arduinoStatusText.textContent = 'Connected';
            this.arduinoPortText.textContent = port || 'Unknown port';
        } else {
            this.arduinoStatusIcon.parentElement.className = 'arduino-icon disconnected';
            this.arduinoStatusText.textContent = 'Disconnected';
            this.arduinoPortText.textContent = 'No device';
        }
    }

    showArduinoModal() {
        if (!this.arduinoModal) return;
        
        this.arduinoModal.classList.add('active');
        
        // Clear existing timeout
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }
        
        // Auto hide after 3 seconds
        this.showTimeout = setTimeout(() => {
            this.hideArduinoModal();
        }, 3000);
    }

    hideArduinoModal() {
        if (!this.arduinoModal) return;
        
        this.arduinoModal.classList.remove('active');
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            port: this.currentPort,
            serialPort: this.serialPort
        };
    }

    // Public method to send data to Arduino
    async send(data) {
        return await this.sendToArduino(data);
    }

    // Check for potential port conflicts
    checkPortConflict() {
        if (window.addLog) {
            addLog('⚠️  IMPORTANT: Port Conflict Check', 'warning');
            addLog('The Flask server may already be using your Arduino port', 'warning');
            addLog('If connection fails, this could be the reason', 'info');
            addLog('Solution: Use different Arduino or stop the Flask server Arduino connection', 'info');
        }
    }

    // Debug: Check available ports
    async checkAvailablePorts() {
        if (!('serial' in navigator)) return;
        
        try {
            const ports = await navigator.serial.getPorts();
            if (window.addLog) {
                addLog(`🔍 Available serial ports: ${ports.length}`, 'info');
                ports.forEach((port, index) => {
                    const info = port.getInfo();
                    addLog(`Port ${index + 1}: VID=${info.usbVendorId || 'Unknown'}, PID=${info.usbProductId || 'Unknown'}`, 'info');
                });
                
                if (ports.length === 0) {
                    addLog('No previously approved serial ports found', 'warning');
                    addLog('This could mean:', 'info');
                    addLog('• No Arduino has been connected to this browser before', 'info');
                    addLog('• Arduino is being used by another application (Flask server)', 'warning');
                }
            }
        } catch (error) {
            if (window.addLog) {
                addLog(`Error checking ports: ${error.message}`, 'error');
            }
        }
    }
}

// ========== BACKGROUND MUSIC AND VOLUME CONTROL ==========

class VolumeController {
    constructor() {
        this.audio = null;
        this.volume = 0.5; // 50% default
        this.volumeModal = null;
        this.volumeFill = null;
        this.volumeText = null;
        this.volumeIcon = null;
        this.hideTimeout = null;
        this.init();
    }
    
    init() {
        this.audio = document.getElementById('backgroundMusic');
        this.volumeModal = document.getElementById('volumeModal');
        this.volumeFill = document.getElementById('volumeFill');
        this.volumeText = document.getElementById('volumeText');
        this.volumeIcon = document.getElementById('volumeIcon');
        
        if (this.audio) {
            this.audio.volume = this.volume;
            this.updateDisplay();
        }
    }
    
    increaseVolume() {
        this.volume = Math.min(1, this.volume + 0.1);
        this.updateVolume();
    }
    
    decreaseVolume() {
        this.volume = Math.max(0, this.volume - 0.1);
        this.updateVolume();
    }
    
    updateVolume() {
        if (this.audio) {
            this.audio.volume = this.volume;
        }
        this.updateDisplay();
        this.showVolumeModal();
    }
    
    updateDisplay() {
        const percentage = Math.round(this.volume * 100);
        if (this.volumeFill) {
            this.volumeFill.style.width = `${percentage}%`;
        }
        if (this.volumeText) {
            this.volumeText.textContent = `${percentage}%`;
        }
        if (this.volumeIcon) {
            // Update volume icon based on volume level
            if (this.volume === 0) {
                this.volumeIcon.className = 'ri-volume-mute-line';
            } else if (this.volume < 0.3) {
                this.volumeIcon.className = 'ri-volume-down-line';
            } else if (this.volume < 0.7) {
                this.volumeIcon.className = 'ri-volume-up-line';
            } else {
                this.volumeIcon.className = 'ri-volume-up-line';
            }
        }
    }
    
    showVolumeModal() {
        if (this.volumeModal) {
            this.volumeModal.classList.add('active');
            
            // Clear existing timeout
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
            }
            
            // Hide after 2 seconds
            this.hideTimeout = setTimeout(() => {
                this.volumeModal.classList.remove('active');
            }, 2000);
        }
    }
    
    togglePlayback() {
        if (!this.audio) return;
        
        if (this.audio.paused) {
            this.audio.play().catch(e => {
                addLog('Background music requires user interaction to start', 'info');
            });
        } else {
            this.audio.pause();
        }
    }
}

// Initialize volume controller
window.volumeController = new VolumeController();



// Initialize Arduino controller
window.arduinoController = new ArduinoController();

// Expose debug function globally
window.checkArduinoPorts = async function() {
    if (window.arduinoController) {
        await window.arduinoController.checkAvailablePorts();
    }
};

// Override updateProgress for backward compatibility
window.updateProgress = (data) => {
    if (data && data.setNumber && data.questionNumber) {
        window.characterController?.moveToQuestion(data.setNumber, data.questionNumber);
    }
};

// Set up game state listeners for question modal updates
if (window.gameState) {
    window.gameState.subscribe('currentSet', () => {
        // Update questions table if modal is open
        const questionsModal = document.getElementById('questionsModal');
        if (questionsModal && questionsModal.classList.contains('active')) {
            updateQuestionsTable();
        }
    });
    
    window.gameState.subscribe('currentQuestion', () => {
        // Update questions table if modal is open
        const questionsModal = document.getElementById('questionsModal');
        if (questionsModal && questionsModal.classList.contains('active')) {
            updateQuestionsTable();
        }
    });
}

// Initialize logs and add initial log
document.addEventListener('DOMContentLoaded', () => {
    // Initialize logs with empty state
    const logsContent = document.getElementById('logsContentArea');
    if (logsContent && logsContent.children.length === 0) {
        logsContent.innerHTML = `
            <div class="logs-empty">
                <i class="ri-file-list-line"></i>
                <p>No logs available</p>
                <small style="color: #ccc; margin-top: 8px;">System events will appear here</small>
            </div>
        `;
    }
    
    // Add initial success log after a delay
    setTimeout(() => {
        addLog('Game interface initialized - Ready to play', 'success');
    }, 1000);
});
