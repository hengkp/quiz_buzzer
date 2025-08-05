/**
 * Console Page JavaScript
 * Complete functionality for the Quiz Bowl Console interface
 */

// Global variables
let socket;
let gameState;
let selectedAttackTarget = null;
let actionHistory = [];

// Color definitions
const colorDefinitions = {
    red: '#EF4444',
    blue: '#3B82F6',
    lime: '#84CC16',
    orange: '#F97316',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    yellow: '#EAB308'
};

// Available colors (excluding white)
const availableColors = ['red', 'blue', 'lime', 'orange', 'purple', 'cyan', 'pink', 'yellow'];

// Initialize console when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Console page initializing...');
    
    // Initialize Socket.IO connection
    socket = io();
    
    // Initialize game state from the global game-state.js
    gameState = window.gameState || new GameState();
    
    // Initialize all components
    initializeTabs();
    initializeTeamsTable();
    initializeQuestionsTable();
    initializeCharacterControls();
    initializeLogs();
    
    // Disable character controller on console page to prevent errors
    if (window.characterController) {
        window.characterController.destroy();
    }
    
    // Set up socket event listeners
    setupSocketListeners();
    
    // Set up game state subscriptions for real-time updates
    setupGameStateSubscriptions();
    
    // Setup server state response listener after socket connects
    socket.on('connect', () => {
        console.log('🔌 Socket connected, setting up server state listener');
        setupServerStateListener();
        loadServerState();
    });
    
    // Update initial displays
    updateTeamsTable();
    updateQuestionsTable();
    updateGameStatusDisplay();
    
    // Add initial log entry
    addLog('Console initialized - Ready for moderation', 'success');
    addLog('Click the help button (?) for console controls', 'info');
    

    
    console.log('✅ Console page initialized successfully');
});

// ========== TAB MANAGEMENT ==========
function initializeTabs() {
    // Set up tab switching
    window.switchTab = function(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active state from all tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(tabName + 'Content').classList.add('active');
        
        // Add active state to selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');
    };
}





// ========== TEAMS MANAGEMENT ==========
function initializeTeamsTable() {
    const tableBody = document.getElementById('teamsTableBody');
    tableBody.innerHTML = '';
    
    for (let teamId = 1; teamId <= 6; teamId++) {
        const team = gameState.state.teams[teamId];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="team-color-cell">
                <div class="color-circle" style="background: ${colorDefinitions[team.color]}" onclick="toggleColorDropdown(${teamId}, event)"></div>
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
                <div class="team-action-card angel ${gameState.state.actionCards[teamId].angel ? 'active' : ''}" onclick="toggleActionCard(${teamId}, 'angel')" id="angelCard-${teamId}"></div>
                <div class="team-action-card devil ${gameState.state.actionCards[teamId].devil ? 'active' : ''}" onclick="toggleActionCard(${teamId}, 'devil')" id="devilCard-${teamId}"></div>
                <div class="team-action-card cross ${gameState.state.actionCards[teamId].cross ? 'active' : ''}" onclick="toggleActionCard(${teamId}, 'cross')" id="crossCard-${teamId}"></div>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
    
    // Populate color options
    populateAllColorOptions();
}

function updateTeamsTable() {
    for (let teamId = 1; teamId <= 6; teamId++) {
        const team = gameState.state.teams[teamId];
        
        // Update color circle
        const colorCircle = document.querySelector(`#teamsTableBody tr:nth-child(${teamId}) .color-circle`);
        if (colorCircle) {
            colorCircle.style.background = colorDefinitions[team.color];
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

function populateAllColorOptions() {
    for (let teamId = 1; teamId <= 6; teamId++) {
        populateColorOptions(teamId);
    }
}

function populateColorOptions(teamId) {
    const colorGrid = document.getElementById(`colorGrid-${teamId}`);
    if (!colorGrid) {
        console.error(`❌ Console: Color grid not found for team ${teamId}`);
        return;
    }
    
    console.log(`🎮 Console: Populating color options for team ${teamId}`);
    colorGrid.innerHTML = '';
    
    availableColors.forEach(color => {
        const isUsed = Object.values(gameState.state.teams).some(team => 
            team.color === color && gameState.state.teams[teamId].color !== color
        );
        
        const colorOption = document.createElement('div');
        colorOption.className = `color-option ${isUsed ? 'used' : ''}`;
        colorOption.style.background = colorDefinitions[color];
        colorOption.onclick = () => !isUsed && changeTeamColor(teamId, color);
        colorOption.title = color.charAt(0).toUpperCase() + color.slice(1) + (isUsed ? ' (Already Used)' : '');
        
        colorGrid.appendChild(colorOption);
    });
    
    console.log(`🎮 Console: Added ${availableColors.length} color options for team ${teamId}`);
}

function toggleColorDropdown(teamId, event) {
    const dropdown = document.getElementById(`colorDropdown-${teamId}`);
    const backdrop = document.getElementById('colorDropdownBackdrop');
    
    if (!dropdown) {
        console.error(`❌ Console: Color dropdown not found for team ${teamId}`);
        return;
    }
    
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
        console.log(`🎮 Console: Color dropdown opened for team ${teamId}`);
    } else {
        dropdown.classList.remove('active');
        backdrop.classList.remove('active');
        console.log(`🎮 Console: Color dropdown closed for team ${teamId}`);
    }
}

function closeAllColorDropdowns() {
    document.querySelectorAll('.color-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    document.getElementById('colorDropdownBackdrop').classList.remove('active');
}

function changeTeamColor(teamId, color) {
    const oldColor = gameState.state.teams[teamId].color;
    gameState.state.teams[teamId].color = color;
    
    // Update UI
    updateTeamsTable();
    
    // Close dropdown and backdrop
    closeAllColorDropdowns();
    
    // Update all color dropdowns
    populateAllColorOptions();
    
    // Emit socket event for server
    socket.emit('team_update', {
        teamId: teamId,
        updates: { color: color }
    });
    
    // Also emit for main page game state update
    socket.emit('game_state_update', {
        path: `teams.${teamId}.color`,
        value: color
    });
    
    addLog(`Team ${teamId} color: ${oldColor} → ${color}`, 'info');
}

function editTeamName(teamId) {
    const nameDisplay = document.getElementById(`teamNameDisplay-${teamId}`);
    const nameInput = document.getElementById(`teamNameInput-${teamId}`);
    
    if (nameDisplay && nameInput) {
        // Get the current name from game state instead of display element
        const currentName = gameState.state.teams[teamId].name;
        
        // Update the input value with the current game state value
        nameInput.value = currentName;
        
        nameDisplay.classList.add('hidden');
        nameInput.classList.remove('hidden');
        nameInput.focus();
        nameInput.select();
        console.log(`🎮 Console: Editing team ${teamId} name: "${currentName}"`);
    } else {
        console.error(`❌ Console: Team name elements not found for team ${teamId}`);
    }
}

function saveTeamName(teamId) {
    const nameDisplay = document.getElementById(`teamNameDisplay-${teamId}`);
    const nameInput = document.getElementById(`teamNameInput-${teamId}`);
    
    if (!nameDisplay || !nameInput) {
        console.error(`❌ Console: Team name elements not found for team ${teamId}`);
        return;
    }
    
    const newName = nameInput.value.trim();
    
    if (newName) {
        const oldName = gameState.state.teams[teamId].name;
        gameState.state.teams[teamId].name = newName;
        
        nameDisplay.textContent = newName;
        
        // Emit socket event for server
        socket.emit('team_update', {
            teamId: teamId,
            updates: { name: newName }
        });
        
        // Also emit for main page game state update
        socket.emit('game_state_update', {
            path: `teams.${teamId}.name`,
            value: newName
        });
        
        addLog(`Team ${teamId} name: "${oldName}" → "${newName}"`, 'info');
        console.log(`🎮 Console: Team ${teamId} name saved: "${newName}"`);
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
        // Get the current score from game state instead of display element
        const currentScore = gameState.state.teams[teamId].score;
        
        // Update the input value with the current game state value
        scoreInput.value = currentScore;
        
        scoreDisplay.classList.add('hidden');
        scoreInput.classList.remove('hidden');
        scoreInput.focus();
        scoreInput.select();
        console.log(`🎮 Console: Editing team ${teamId} score: ${currentScore}`);
    } else {
        console.error(`❌ Console: Team score elements not found for team ${teamId}`);
    }
}

function saveTeamScore(teamId) {
    const scoreDisplay = document.getElementById(`teamScoreDisplay-${teamId}`);
    const scoreInput = document.getElementById(`teamScoreInput-${teamId}`);
    
    if (!scoreDisplay || !scoreInput) {
        console.error(`❌ Console: Team score elements not found for team ${teamId}`);
        return;
    }
    
    const newScore = parseInt(scoreInput.value) || 0;
    const oldScore = gameState.state.teams[teamId].score;
    
    if (newScore !== oldScore) {
        gameState.state.teams[teamId].score = newScore;
        
        scoreDisplay.textContent = newScore;
        
        // Emit socket events for main page updates
        socket.emit('game_state_update', {
            path: `teams.${teamId}.score`,
            value: newScore
        });
        
        socket.emit('team_update', {
            teamId: teamId,
            updates: { score: newScore }
        });
        
        addLog(`Team ${teamId} score: ${oldScore} → ${newScore}`, 'info');
        console.log(`🎮 Console: Team ${teamId} score saved: ${newScore}`);
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
    const actionCards = gameState.state.actionCards[teamId];
    
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
    const actionCards = gameState.state.actionCards[teamId];
    
    if (cardType === 'angel') {
        if (actionCards.angelUsed) {
            addLog(`Team ${teamId} angel card already used`, 'warning');
            return;
        }
        
        const isActive = actionCards.angel;
        actionCards.angel = !isActive;
        
        updateActionCardDisplay(teamId);
        
        // Only emit game state update, let main page handle actions
        socket.emit('game_state_update', {
            path: `actionCards.${teamId}.angel`,
            value: actionCards.angel
        });
        
        addLog(`Team ${teamId} angel card: ${isActive ? 'disabled' : 'enabled'}`, 'info');
        
    } else if (cardType === 'devil') {
        if (actionCards.devilUsed) {
            addLog(`Team ${teamId} devil card already used`, 'warning');
            return;
        }
        
        const isActive = actionCards.devil;
        actionCards.devil = !isActive;
        
        updateActionCardDisplay(teamId);
        
        // Only emit game state update, let main page handle actions
        socket.emit('game_state_update', {
            path: `actionCards.${teamId}.devil`,
            value: actionCards.devil
        });
        
        addLog(`Team ${teamId} devil card: ${isActive ? 'disabled' : 'enabled'}`, 'info');
        
    } else if (cardType === 'cross') {
        const isActive = actionCards.cross;
        actionCards.cross = !isActive;
        
        updateActionCardDisplay(teamId);
        
        // Only emit game state update, let main page handle actions
        socket.emit('game_state_update', {
            path: `actionCards.${teamId}.cross`,
            value: actionCards.cross
        });
        
        addLog(`Team ${teamId} cross card: ${isActive ? 'disabled' : 'enabled'}`, 'info');
    }
}

function activateDevil(teamId) {
    if (gameState.state.actionCards[teamId].devilUsed) {
        addLog(`Team ${teamId} devil card already used`, 'warning');
        return;
    }
    
    // Activate devil card in game state
    gameState.state.actionCards[teamId].devil = true;
    updateActionCardDisplay(teamId);
    
    // Only emit game state update, let main page handle actions
    socket.emit('game_state_update', {
        path: `actionCards.${teamId}.devil`,
        value: true
    });
    
    addLog(`Team ${teamId} devil card activated`, 'info');
}

function activateCross(teamId) {
    const isActive = gameState.state.actionCards[teamId].cross;
    gameState.state.actionCards[teamId].cross = !isActive;
    
    updateActionCardDisplay(teamId);
    
    // Only emit game state update, let main page handle actions
    socket.emit('game_state_update', {
        path: `actionCards.${teamId}.cross`,
        value: gameState.state.actionCards[teamId].cross
    });
    
    addLog(`Team ${teamId} cross protection ${isActive ? 'deactivated' : 'activated'}`, 'info');
}

function showDevilAttackModal(attackerId) {
    const modal = document.getElementById('devilAttackModal');
    const grid = document.getElementById('attackTeamGrid');
    
    // Clear previous options
    grid.innerHTML = '';
    
    // Add team options (excluding attacker)
    for (let teamId = 1; teamId <= 6; teamId++) {
        if (teamId !== attackerId) {
            const team = gameState.state.teams[teamId];
            const option = document.createElement('div');
            option.className = 'attack-team-option';
            option.onclick = () => selectAttackTarget(teamId);
            
            option.innerHTML = `
                <img class="attack-team-character" src="assets/characters/character-${team.color}.png" alt="Team ${teamId}">
                <div class="attack-team-name">${team.name}</div>
            `;
            
            grid.appendChild(option);
        }
    }
    
    modal.classList.add('active');
}

function selectAttackTarget(teamId) {
    selectedAttackTarget = teamId;
    
    // Update UI to show selection
    document.querySelectorAll('.attack-team-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Enable confirm button
    document.getElementById('confirmAttackBtn').disabled = false;
}

function confirmDevilAttack() {
    if (!selectedAttackTarget) return;
    
    const attackerId = gameState.state.attackTeam;
    
    // Check if target has cross protection
    if (gameState.state.actionCards[selectedAttackTarget].cross) {
        addLog(`Team ${selectedAttackTarget} protected by cross card - devil attack blocked`, 'warning');
        cancelDevilAttack();
        return;
    }
    
    // Set victim team
    gameState.state.victimTeam = selectedAttackTarget;
    
    addLog(`Team ${attackerId} devil attacked Team ${selectedAttackTarget} - CHALLENGE MODE activated!`, 'error');
    addLog(`Team ${selectedAttackTarget} must answer: Correct = Attacker -1, Target +1 | Wrong = Attacker +2, Target -1`, 'info');
    
    // Update game status display
    updateGameStatusDisplay();
    
    // Emit game state updates
    socket.emit('game_state_update', {
        path: 'victimTeam',
        value: selectedAttackTarget
    });
    
    socket.emit('game_state_update', {
        path: 'attackTeam',
        value: attackerId
    });
    
    // Also emit for main page compatibility
    socket.emit('devil_attack', {
        attackerId: attackerId,
        targetId: selectedAttackTarget
    });
    
    cancelDevilAttack();
}

function cancelDevilAttack() {
    document.getElementById('devilAttackModal').classList.remove('active');
    document.getElementById('confirmAttackBtn').disabled = true;
    selectedAttackTarget = null;
    
    // Reset attack team if no attack was confirmed
    if (gameState.state.victimTeam === 0) {
        gameState.state.attackTeam = 0;
        updateGameStatusDisplay();
        
        // Emit game state update
        socket.emit('game_state_update', {
            path: 'attackTeam',
            value: 0
        });
    }
}

// ========== QUESTIONS MANAGEMENT ==========
function initializeQuestionsTable() {
    const tableBody = document.getElementById('questionsTableBody');
    tableBody.innerHTML = '';
    
    for (let setNumber = 1; setNumber <= 8; setNumber++) {
        const setInfo = gameState.state.questionSets[setNumber];
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
    const currentSet = gameState.state.currentSet;
    const currentQuestion = gameState.state.currentQuestion;
    
    // Update active question button
    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`button[onclick="goToQuestion(${currentSet}, ${currentQuestion})"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update theme icons
    for (let setNumber = 1; setNumber <= 8; setNumber++) {
        const setInfo = gameState.state.questionSets[setNumber];
        if (setInfo) {
            const themeIcon = document.getElementById(`themeIcon-${setNumber}`);
            if (themeIcon) {
                themeIcon.src = `assets/themes/${setInfo.theme}.png`;
                themeIcon.alt = setInfo.theme;
            }
        }
    }
    
    // Update current question info
    // Removed updateCurrentQuestionInfo call
}



function editQuestionSetTitle(setNumber) {
    const titleDisplay = document.getElementById(`questionSetTitleDisplay-${setNumber}`);
    const titleInput = document.getElementById(`questionSetTitleInput-${setNumber}`);
    
    if (titleDisplay && titleInput) {
        // Get the current title from game state instead of display element
        const currentTitle = gameState.state.questionSets[setNumber].title;
        
        // Update the input value with the current game state value
        titleInput.value = currentTitle;
        
        titleDisplay.classList.add('hidden');
        titleInput.classList.remove('hidden');
        titleInput.focus();
        titleInput.select();
        console.log(`🎮 Console: Editing question set ${setNumber} title: "${currentTitle}"`);
    } else {
        console.error(`❌ Console: Question set title elements not found for set ${setNumber}`);
    }
}

function saveQuestionSetTitle(setNumber) {
    const titleDisplay = document.getElementById(`questionSetTitleDisplay-${setNumber}`);
    const titleInput = document.getElementById(`questionSetTitleInput-${setNumber}`);
    
    if (!titleDisplay || !titleInput) {
        console.error(`❌ Console: Question set title elements not found for set ${setNumber}`);
        return;
    }
    
    const newTitle = titleInput.value.trim();
    
    if (newTitle) {
        const oldTitle = gameState.state.questionSets[setNumber].title;
        gameState.state.questionSets[setNumber].title = newTitle;
        
        titleDisplay.textContent = newTitle;
        
        // Update current question info if this is the active set
        if (setNumber === gameState.state.currentSet) {
            // Removed updateCurrentQuestionInfo call
        }
        
        // Emit for main page game state update
        socket.emit('game_state_update', {
            path: `questionSets.${setNumber}.title`,
            value: newTitle
        });
        
        // Also emit question set update for server
        socket.emit('question_set_update', {
            setNumber: setNumber,
            updates: { title: newTitle }
        });
        
        addLog(`Set ${setNumber} title updated: "${oldTitle}" → "${newTitle}"`, 'info');
        console.log(`🎮 Console: Set ${setNumber} title saved: "${newTitle}"`);
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
    themeList.innerHTML = '';
    
    // Available themes from assets/themes directory
    const themes = [
        { name: 'Brainstorm', icon: 'brainstorm' },
        { name: 'DNA', icon: 'DNA' },
        { name: 'Flask', icon: 'Flask' },
        { name: 'Oil', icon: 'Oil' }
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
    gameState.state.questionSets[setNumber].theme = icon;
    
    // Update the questions table to reflect the change
    updateQuestionsTable();
    
    // Update the current question set display if this is the current set
    if (setNumber === gameState.state.currentSet) {
        gameState.updateQuestionSetDisplay();
    }
    
    // Emit socket events for main page updates
    socket.emit('game_state_update', {
        path: `questionSets.${setNumber}.theme`,
        value: icon
    });
    
    socket.emit('question_set_update', {
        setNumber: setNumber,
        updates: { theme: icon }
    });
    
    // Close modal
    closeThemeModal();
    
    addLog(`Set ${setNumber} theme updated: ${name}`, 'info');
}

function closeThemeModal() {
    const modal = document.getElementById('themeModal');
    modal.classList.remove('active');
    window.currentThemeSetNumber = null;
}

// Make closeThemeModal available globally
window.closeThemeModal = closeThemeModal;

function goToQuestion(setNumber, questionNumber) {
    console.log(`🎮 Console: Moving to Set ${setNumber}, Question ${questionNumber}`);
    
    gameState.moveToQuestion(setNumber, questionNumber);
    updateQuestionsTable();
    
    // Emit progress update for main page compatibility (same as arrow keys)
    socket.emit('progress_update', {
        setNumber: setNumber,
        questionNumber: questionNumber,
        title: gameState.state.questionSets[setNumber].title,
        subject: gameState.state.questionSets[setNumber].theme,
        animateRun: true
    });
    
    // Also emit character update for immediate animation
    socket.emit('character_update', {
        setNumber: setNumber,
        questionNumber: questionNumber,
        animateRun: true
    });
    
    addLog(`Moved to Set ${setNumber}, Question ${questionNumber}`, 'info');
}

// ========== CHARACTER CONTROLS ==========
function initializeCharacterControls() {
    window.toggleChallenge = function() {
        const isActive = gameState.state.currentChallenge > 0;
        if (isActive) {
            gameState.state.currentChallenge = 0;
            addLog('Challenge mode disabled', 'info');
        } else {
            gameState.state.currentChallenge = 1;
            addLog('Challenge mode enabled (2x points)', 'success');
        }
        
        // Update button appearance
        const challengeBtn = document.getElementById('challengeBtn');
        if (challengeBtn) {
            challengeBtn.textContent = isActive ? 'Challenge' : 'Challenge (2x)';
            challengeBtn.classList.toggle('btn-challenge', !isActive);
        }
        
        // Update character action panel
        updateCharacterActionPanel();
        
        // Emit for main page compatibility
        socket.emit('challenge_update', { enabled: !isActive });
        

    };
    
    window.toggleAngel = function() {
        const currentTeam = gameState.state.currentTeam;
        console.log('🎮 Angel button clicked:', { currentTeam });
        
        if (currentTeam > 0) {
            // Toggle angel team state
            if (gameState.state.angelTeam === currentTeam) {
                gameState.state.angelTeam = 0;
                addLog(`Angel protection removed from Team ${currentTeam}`, 'info');
            } else {
                gameState.state.angelTeam = currentTeam;
                addLog(`Angel protection activated for Team ${currentTeam}`, 'success');
            }
            
            console.log('🎮 Angel state updated:', gameState.state.angelTeam);
            
            // Update game status display
            updateGameStatusDisplay();
            
            // Emit game state update
            socket.emit('game_state_update', {
                path: 'angelTeam',
                value: gameState.state.angelTeam
            });
        } else {
            addLog('No team selected for angel card', 'warning');
        }
    };
    
    window.toggleDevil = function() {
        const currentTeam = gameState.state.currentTeam;
        if (currentTeam > 0) {
            // Set attack team to current team
            gameState.state.attackTeam = currentTeam;
            
            // Show devil attack modal to select victim
            showDevilAttackModal(currentTeam);
            
            addLog(`Devil attack initiated by Team ${currentTeam}`, 'info');
        } else {
            addLog('No team selected for devil card', 'warning');
        }
    };
    
    window.toggleChallenge = function() {
        const currentTeam = gameState.state.currentTeam;
        const isActive = gameState.state.currentChallenge > 0;
        
        console.log('🎮 Challenge button clicked:', { currentTeam, isActive });
        
        if (isActive) {
            gameState.state.currentChallenge = 0;
            addLog('Challenge mode disabled', 'info');
        } else {
            if (currentTeam > 0) {
                gameState.state.currentChallenge = currentTeam;
                addLog(`Challenge mode enabled (2x points) for Team ${currentTeam}`, 'success');
            } else {
                gameState.state.currentChallenge = 1; // Default to team 1 if no team selected
                addLog('Challenge mode enabled (2x points) for Team 1', 'success');
            }
        }
        
        console.log('🎮 Challenge state updated:', gameState.state.currentChallenge);
        
        // Update game status display
        updateGameStatusDisplay();
        
        // Emit for main page compatibility
        socket.emit('challenge_update', { 
            enabled: !isActive,
            teamId: gameState.state.currentChallenge 
        });
        
        // Also emit game state update
        socket.emit('game_state_update', {
            path: 'currentChallenge',
            value: gameState.state.currentChallenge
        });
    };
    
    window.resetBuzzer = function() {
        clearBuzzers();
        addLog('Buzzer reset', 'info');
    };
    

    
    window.movePrevious = function() {
        const currentSet = gameState.state.currentSet;
        const currentQuestion = gameState.state.currentQuestion;
        
        let newSet = currentSet;
        let newQuestion = currentQuestion - 1;
        
        if (newQuestion < 1) {
            newSet = Math.max(1, currentSet - 1);
            newQuestion = 4;
        }
        
        console.log(`🎮 Console: Moving previous from Set ${currentSet} Q${currentQuestion} to Set ${newSet} Q${newQuestion}`);
        
        goToQuestion(newSet, newQuestion);
    };
    
    window.moveNext = function() {
        const currentSet = gameState.state.currentSet;
        const currentQuestion = gameState.state.currentQuestion;
        
        let newSet = currentSet;
        let newQuestion = currentQuestion + 1;
        
        if (newQuestion > 4) {
            newSet = Math.min(10, currentSet + 1);
            newQuestion = 1;
        }
        
        console.log(`🎮 Console: Moving next from Set ${currentSet} Q${currentQuestion} to Set ${newSet} Q${newQuestion}`);
        
        goToQuestion(newSet, newQuestion);
    };
    
    window.markCorrect = function() {
        const currentTeam = gameState.state.currentTeam;
        if (currentTeam > 0) {
            // Call the local function for console updates
            adjustScore(currentTeam, 1);
            
            addLog(`Team ${currentTeam} marked correct`, 'success');
        } else {
            addLog('No team selected for correct answer', 'warning');
        }
    };
    
    window.markIncorrect = function() {
        const currentTeam = gameState.state.currentTeam;
        if (currentTeam > 0) {
            // Call the local function for console updates
            adjustScore(currentTeam, -1);
            
            addLog(`Team ${currentTeam} marked incorrect`, 'error');
        } else {
            addLog('No team selected for incorrect answer', 'warning');
        }
    };
}

function updateCharacterActionPanel() {
    // Update the new game status display instead of character action panel
    updateGameStatusDisplay();
}

function adjustScore(teamId, adjustment) {
    let multiplier = 1;
    if (gameState.state.currentChallenge > 0 && adjustment > 0) {
        multiplier = 2;
    }
    
    const actualAdjustment = adjustment * multiplier;
    const oldScore = gameState.state.teams[teamId].score;
    
    // Check angel protection for negative adjustments
    if (adjustment < 0 && gameState.state.actionCards[teamId].angel) {
        // Use angel protection
        gameState.state.actionCards[teamId].angel = false;
        gameState.state.actionCards[teamId].angelUsed = true;
        
        updateActionCardDisplay(teamId);
        updateCharacterActionPanel();
        
        addLog(`Team ${teamId} angel protection used - no penalty applied`, 'success');
        
        socket.emit('card_update', {
            teamId: teamId,
            cardType: 'angel',
            used: true
        });
        return;
    }
    
    gameState.state.teams[teamId].score = Math.max(0, gameState.state.teams[teamId].score + actualAdjustment);
    
    // Update score display with animation
    const scoreElement = document.getElementById(`teamScore-${teamId}`);
    if (scoreElement) {
        scoreElement.classList.add('updating');
        setTimeout(() => {
            scoreElement.classList.remove('updating');
        }, 600);
        scoreElement.textContent = gameState.state.teams[teamId].score;
    }
    
    // Emit for main page compatibility
    socket.emit('score_update', {
        teamId: teamId,
        score: gameState.state.teams[teamId].score,
        adjustment: actualAdjustment,
        correct: adjustment > 0
    });
    
    const actionText = adjustment > 0 ? 'correct' : 'incorrect';
    const challengeText = multiplier > 1 ? ' (2x)' : '';
    addLog(`Team ${teamId} ${actionText}: ${oldScore} → ${gameState.state.teams[teamId].score}${challengeText}`, 
           adjustment > 0 ? 'success' : 'error');
}

function buzzTeam(teamId) {
    console.log(`🎮 Console: Buzzing team ${teamId}`);
    
    // Update game state
    gameState.state.currentTeam = teamId;
    updateCharacterActionPanel();
    
    // Emit to main page for immediate feedback
    socket.emit('buzzer_pressed', { teamId: teamId });
    

    
    addLog(`Team ${teamId} buzzed in!`, 'success');
}

function clearBuzzers() {
    
    // Reset all game state parameters
    gameState.state.currentTeam = 0;
    gameState.state.currentChallenge = 0;
    gameState.state.angelTeam = 0;
    gameState.state.attackTeam = 0;
    gameState.state.victimTeam = 0;
    
    updateGameStatusDisplay();
    
    // Emit game state updates
    socket.emit('game_state_update', {
        path: 'currentTeam',
        value: 0
    });
    socket.emit('game_state_update', {
        path: 'currentChallenge',
        value: 0
    });
    socket.emit('game_state_update', {
        path: 'angelTeam',
        value: 0
    });
    socket.emit('game_state_update', {
        path: 'attackTeam',
        value: 0
    });
    socket.emit('game_state_update', {
        path: 'victimTeam',
        value: 0
    });
    
    // Emit for main page compatibility
    socket.emit('clear_buzzers');
    
    addLog('All buzzers and game state cleared', 'info');
}

// ========== GAME STATUS DISPLAY ==========
function updateGameStatusDisplay() {
    // Removed game status functions
}







// ========== HELP MODAL ==========
function toggleHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.classList.toggle('active');
}

// ========== LOGS SYSTEM ==========
function initializeLogs() {
    window.clearLogs = function() {
        const logsContent = document.getElementById('logsContentArea');
        logsContent.innerHTML = '';
        actionHistory = [];
        addLog('Logs cleared', 'info');
    };
    
    window.exportLogs = function() {
        const logs = document.getElementById('logsContentArea').innerText;
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
}

function addLog(message, type = 'info', undoData = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    
    logEntry.className = `log-entry ${type}`;
    
    let undoButton = '';
    if (undoData) {
        actionHistory.push(undoData);
        undoButton = `<button class="log-undo-btn" onclick="undoAction(${actionHistory.length - 1})">UNDO</button>`;
    }
    
    logEntry.innerHTML = `
        <div>
            <span class="log-timestamp">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        </div>
        ${undoButton}
    `;
    
    const logsContent = document.getElementById('logsContentArea');
    logsContent.appendChild(logEntry);
    logsContent.scrollTop = logsContent.scrollHeight;
}

function undoAction(actionIndex) {
    if (actionIndex >= actionHistory.length) return;
    
    const action = actionHistory[actionIndex];
    
    switch (action.type) {
        case 'score_change':
            gameState.state.teams[action.teamId].score = action.oldScore;
            updateTeamsTable();
            addLog(`Undid score change for Team ${action.teamId}: ${action.newScore} → ${action.oldScore}`, 'warning');
            break;
        case 'name_change':
            gameState.state.teams[action.teamId].name = action.oldName;
            updateTeamsTable();
            addLog(`Undid name change for Team ${action.teamId}: "${action.newName}" → "${action.oldName}"`, 'warning');
            break;
        case 'color_change':
            gameState.state.teams[action.teamId].color = action.oldColor;
            updateTeamsTable();
            addLog(`Undid color change for Team ${action.teamId}: ${action.newColor} → ${action.oldColor}`, 'warning');
            break;
    }
    
    // Disable the undo button
    const undoButtons = document.querySelectorAll('.log-undo-btn');
    if (undoButtons[actionIndex]) {
        undoButtons[actionIndex].disabled = true;
        undoButtons[actionIndex].textContent = 'UNDONE';
    }
}

// ========== GAME RESET ==========
function resetGame() {
    if (confirm('Reset entire game? This will clear all scores, action cards, and return to Set 1 Q1.')) {
        console.log('🔄 Console: FULL RESET initiated');
        
        // Arduino reset is handled on the main page
        
        // Use the same comprehensive reset as hotkeys
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
        console.log('✅ Team character reset handled by main page');
        
        // Clear all Q1 failure tracking states for all sets
        if (window.gameState) {
            for (let setNumber = 1; setNumber <= 10; setNumber++) {
                const attemptsKey = `q1Attempts_${setNumber}`;
                window.gameState.set(attemptsKey, 0);
            }
            console.log('✅ All Q1 failure tracking states cleared');
        }
        
        // Hide chance display
        console.log('✅ Chance display reset handled by main page');
        
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
        
        // Update all console displays
        updateTeamsTable();
        updateQuestionsTable();
        
        // Clear logs
        clearLogs();
        
        addLog('Game completely reset to defaults', 'success');
        console.log('🔄 FULL game reset completed - everything back to default');
    }
}

// ========== GAME STATUS DISPLAY INITIALIZATION ==========
function initializeGameStatusDisplay() {
    // Initialize the game status display
    updateGameStatusDisplay();
    console.log('🎮 Game status display initialized');
}

// Function to reset all game state parameters
function resetGameStateParameters() {
    gameState.state.currentTeam = 0;
    gameState.state.currentChallenge = 0;
    gameState.state.angelTeam = 0;
    gameState.state.attackTeam = 0;
    gameState.state.victimTeam = 0;
    
    // Emit all game state updates
    const parameters = ['currentTeam', 'currentChallenge', 'angelTeam', 'attackTeam', 'victimTeam'];
    parameters.forEach(param => {
        socket.emit('game_state_update', {
            path: param,
            value: 0
        });
    });
    
    addLog('All game state parameters reset', 'info');
}

// ========== SERVER STATE SYNC ==========
function loadServerState() {
    console.log('🔄 Loading server state...');
    
    // Request current server state
    socket.emit('get_server_state', {});
}



function setupServerStateListener() {
    socket.on('server_state_response', (serverState) => {
        if (serverState) {
            console.log('📥 Received server state:', serverState);
            syncClientStateWithServer(serverState);
        } else {
            console.log('⚠️ No server state received, using defaults');
        }
    });
}

function syncClientStateWithServer(serverState) {
    // Sync team data
    if (serverState.teams) {
        Object.keys(serverState.teams).forEach(teamId => {
            const serverTeam = serverState.teams[teamId];
            const clientTeam = gameState.state.teams[teamId];
            
            if (clientTeam && serverTeam) {
                // Update team name if different
                if (serverTeam.name && serverTeam.name !== clientTeam.name) {
                    gameState.state.teams[teamId].name = serverTeam.name;
                    console.log(`🔄 Synced team ${teamId} name: "${clientTeam.name}" → "${serverTeam.name}"`);
                }
                
                // Update team score if different
                if (serverTeam.score !== undefined && serverTeam.score !== clientTeam.score) {
                    gameState.state.teams[teamId].score = serverTeam.score;
                    console.log(`🔄 Synced team ${teamId} score: ${clientTeam.score} → ${serverTeam.score}`);
                }
                
                // Update team color if different
                if (serverTeam.color && serverTeam.color !== clientTeam.color) {
                    gameState.state.teams[teamId].color = serverTeam.color;
                    console.log(`🔄 Synced team ${teamId} color: ${clientTeam.color} → ${serverTeam.color}`);
                }
            }
        });
    }
    

    
    // Sync question set data
    if (serverState.question_set) {
        if (serverState.question_set.current !== undefined && serverState.question_set.current !== gameState.state.currentSet) {
            gameState.state.currentSet = serverState.question_set.current;
            console.log(`🔄 Synced current set: ${gameState.state.currentSet} → ${serverState.question_set.current}`);
        }
        
        if (serverState.question_set.title && gameState.state.questionSets[gameState.state.currentSet]) {
            gameState.state.questionSets[gameState.state.currentSet].title = serverState.question_set.title;
            console.log(`🔄 Synced question set title: "${serverState.question_set.title}"`);
        }
    }
    
    // Update UI after syncing
    updateTeamsTable();
    updateQuestionsTable();
    
    console.log('✅ Server state sync completed');
}

// ========== SOCKET EVENT LISTENERS ==========
function setupSocketListeners() {
    socket.on('team_update', (data) => {
        Object.assign(gameState.state.teams[data.teamId], data.updates);
        updateTeamsTable();
    });

    socket.on('score_update', (data) => {
        gameState.state.teams[data.teamId].score = data.score;
        updateTeamsTable();
    });



    socket.on('card_update', (data) => {
        const teamId = data.teamId;
        if (gameState.state.actionCards[teamId]) {
            if (data.cardType === 'angel') {
                gameState.state.actionCards[teamId].angel = data.active;
                if (data.used) {
                    gameState.state.actionCards[teamId].angelUsed = data.used;
                }
            } else if (data.cardType === 'devil') {
                if (data.used) {
                    gameState.state.actionCards[teamId].devilUsed = data.used;
                }
            } else if (data.cardType === 'cross') {
                gameState.state.actionCards[teamId].cross = data.active;
            }
            updateActionCardDisplay(teamId);
        }
    });



    socket.on('buzzer_pressed', (data) => {
        // Update local game state
        gameState.state.currentTeam = data.teamId;
        addLog(`Team ${data.teamId} buzzed in!`, 'success');
        

    });

    socket.on('clear_buzzers', () => {
        // Update local game state - reset all parameters
        gameState.state.currentTeam = 0;
        gameState.state.currentChallenge = 0;
        gameState.state.angelTeam = 0;
        gameState.state.attackTeam = 0;
        gameState.state.victimTeam = 0;
        addLog('All buzzers and game state cleared', 'info');
    });

    socket.on('log_update', (data) => {
        addLog(data.message, data.type);
    });

    // Listen for progress updates from main page to sync console state
    socket.on('progress_update', (data) => {
        if (data.setNumber && data.questionNumber) {
            // Update local game state
            gameState.state.currentSet = data.setNumber;
            gameState.state.currentQuestion = data.questionNumber;
            // Update console UI
            updateQuestionsTable();
        }
    });

    // Listen for game state updates to sync console state
    socket.on('game_state_update', (data) => {
        if (data.path && data.value !== undefined) {
            // Update the specific game state parameter
            gameState.update(data.path, data.value);
            
            // Update console UI based on what changed
            if (data.path.startsWith('currentSet') || data.path.startsWith('currentQuestion')) {
                updateQuestionsTable();
            }
            if (data.path.startsWith('teams.')) {
                updateTeamsTable();
            }
        }
    });

    // Listen for specific game state parameter updates
    socket.on('currentChallenge_update', (data) => {
        gameState.state.currentChallenge = data.teamId || 0;
    });

    socket.on('angelTeam_update', (data) => {
        gameState.state.angelTeam = data.teamId || 0;
    });

    socket.on('attackTeam_update', (data) => {
        gameState.state.attackTeam = data.teamId || 0;
    });

    socket.on('victimTeam_update', (data) => {
        gameState.state.victimTeam = data.teamId || 0;
    });

    socket.on('currentTeam_update', (data) => {
        gameState.state.currentTeam = data.teamId || 0;
    });
}

// ========== GAME STATE SUBSCRIPTIONS ==========
function setupGameStateSubscriptions() {
    // Removed game status subscriptions
}

// ========== CLICK OUTSIDE HANDLERS ==========
document.addEventListener('click', function(event) {
    // Close color dropdowns when clicking outside
    if (!event.target.closest('.color-circle') && !event.target.closest('.color-dropdown')) {
        closeAllColorDropdowns();
    }
    
    // Close theme modal when clicking outside
    if (!event.target.closest('.question-set-theme') && !event.target.closest('#themeModal')) {
        const themeModal = document.getElementById('themeModal');
        if (themeModal && themeModal.classList.contains('active')) {
            closeThemeModal();
        }
    }
});

console.log('🎮 Console page JavaScript loaded successfully');

// Debug functions for testing
window.debugConsole = function() {
    console.log('🔍 Console Debug Info:');
    console.log('  Game State:', gameState);
    console.log('  Socket:', socket);
    console.log('  Teams:', gameState.state.teams);
    console.log('  Action Cards:', gameState.state.actionCards);
    console.log('  Current Set:', gameState.state.currentSet);
    console.log('  Current Question:', gameState.state.currentQuestion);
    console.log('  Current Team:', gameState.state.currentTeam);
};

window.testBuzz = function(teamId) {
    console.log(`🧪 Testing buzz for team ${teamId}`);
    buzzTeam(teamId);
};

window.testColorDropdown = function(teamId) {
    console.log(`🧪 Testing color dropdown for team ${teamId}`);
    toggleColorDropdown(teamId);
};

window.testTeamName = function(teamId) {
    console.log(`🧪 Testing team name edit for team ${teamId}`);
    editTeamName(teamId);
}; 