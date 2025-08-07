/**
 * Console Page JavaScript
 * Simplified console interface for game state management
 */

// Global variables
let socket;
let gameState;

// Initialize console when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Console page initializing...');
    
    // Initialize Socket.IO connection
    socket = io();
    
    // Initialize game state from localStorage
    gameState = window.gameState;
    
    // Initialize all components
    initializeTabs();
    initializeTeamsTable();
    initializeQuestionsTable();
    initializeLogs();
    
    // Set up socket event listeners
    setupSocketListeners();
    
    // Setup server state response listener after socket connects
    socket.on('connect', () => {
        console.log('🔌 Socket connected, setting up server state listener');
        setupServerStateListener();
        loadServerState();
    });
    
    // Update initial displays
    updateTeamsTable();
    updateQuestionsTable();
    
    // Add initial log entry
    addLog('Console initialized - Ready for moderation', 'success');
    
    // Initialize XLSX file handling
    initializeXLSXHandling();
    
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
        const isUsed = Object.values(gameState.state.teams).some(team => 
            team.color === color && gameState.state.teams[teamId].color !== color
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
        const currentName = gameState.state.teams[teamId].name;
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
        const currentScore = gameState.state.teams[teamId].score;
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
    const state = gameState.state;
    
    // Update angel card - active if angelTeam equals this team ID
    const angelCard = document.getElementById(`angelCard-${teamId}`);
    if (angelCard) {
        const isAngelActive = state.angelTeam === teamId;
        const isAngelAvailable = actionCards.angel;
        angelCard.className = `team-action-card angel ${isAngelActive ? 'active' : ''} ${!isAngelAvailable ? 'used' : ''}`;
    }
    
    // Update devil card - active if attackTeam equals this team ID
    const devilCard = document.getElementById(`devilCard-${teamId}`);
    if (devilCard) {
        const isDevilActive = state.attackTeam === teamId;
        const isDevilAvailable = actionCards.devil;
        devilCard.className = `team-action-card devil ${isDevilActive ? 'active' : ''} ${!isDevilAvailable ? 'used' : ''}`;
    }
    
    // Update cross card
    const crossCard = document.getElementById(`crossCard-${teamId}`);
    if (crossCard) {
        crossCard.className = `team-action-card cross ${actionCards.cross ? 'active' : ''}`;
    }
}

function toggleActionCard(teamId, cardType) {
    const actionCards = gameState.state.actionCards[teamId];
    const state = gameState.state;
    
    if (cardType === 'angel') {
        if (!actionCards.angel) {
            addLog(`Team ${teamId} angel card already used`, 'warning');
            return;
        }
        
        const isActive = state.angelTeam === teamId;
        if (isActive) {
            // Deactivate angel card
            gameState.set('angelTeam', 0);
            socket.emit('game_state_update', {
                path: 'angelTeam',
                value: 0
            });
        } else {
            // Activate angel card
            gameState.set('angelTeam', teamId);
            socket.emit('game_state_update', {
                path: 'angelTeam',
                value: teamId
            });
        }
        
        updateActionCardDisplay(teamId);
        
        addLog(`Team ${teamId} angel card: ${isActive ? 'disabled' : 'enabled'}`, 'info');
        
    } else if (cardType === 'devil') {
        if (!actionCards.devil) {
            addLog(`Team ${teamId} devil card already used`, 'warning');
            return;
        }
        
        const isActive = state.attackTeam === teamId;
        if (isActive) {
            // Deactivate devil card
            gameState.set('attackTeam', 0);
            socket.emit('game_state_update', {
                path: 'attackTeam',
                value: 0
            });
        } else {
            // Activate devil card
            gameState.set('attackTeam', teamId);
            socket.emit('game_state_update', {
                path: 'attackTeam',
                value: teamId
            });
        }
        
        updateActionCardDisplay(teamId);
        
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
}

function editQuestionSetTitle(setNumber) {
    const titleDisplay = document.getElementById(`questionSetTitleDisplay-${setNumber}`);
    const titleInput = document.getElementById(`questionSetTitleInput-${setNumber}`);
    
    if (titleDisplay && titleInput) {
        const currentTitle = gameState.state.questionSets[setNumber].title;
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
        const oldTitle = gameState.state.questionSets[setNumber].title;
        gameState.state.questionSets[setNumber].title = newTitle;
        
        titleDisplay.textContent = newTitle;
        
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

function goToQuestion(setNumber, questionNumber) {
    console.log(`🎮 Console: Moving to Set ${setNumber}, Question ${questionNumber}`);
    
    gameState.moveToQuestion(setNumber, questionNumber);
    updateQuestionsTable();
    
    // Emit progress update for main page compatibility
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

// ========== LOGS SYSTEM ==========
function initializeLogs() {
    window.clearLogs = function() {
        const logsContent = document.getElementById('logsContentArea');
        logsContent.innerHTML = '';
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

function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    
    logEntry.className = `log-entry ${type}`;
    
    logEntry.innerHTML = `
        <div>
            <span class="log-timestamp">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        </div>
    `;
    
    const logsContent = document.getElementById('logsContentArea');
    logsContent.appendChild(logEntry);
    logsContent.scrollTop = logsContent.scrollHeight;
}

// ========== GAME RESET ==========
function resetGame() {
    // Prevent infinite loops - don't reset if already resetting
    if (window.gameState && window.gameState.isResetting) {
        console.log('⚠️ Console: Reset already in progress, skipping...');
        return;
    }
    
    console.log('🔄 Console: Initiating complete game reset...');
    
    // Set resetting flag to prevent loops
    if (window.gameState) {
        window.gameState.isResetting = true;
    }
    
    // Clear localStorage on console page as well
    localStorage.removeItem('quizBowlGameState');
    console.log('✅ Console: localStorage cleared');
    
    // Reset local game state
    if (window.gameState) {
        window.gameState.reset();
        console.log('✅ Console: Local game state reset');
    }
    
    // Emit admin_reset to server
    socket.emit('admin_reset', {});
    addLog('🔄 Complete game reset initiated', 'success');
    
    // Update console UI immediately
    setTimeout(() => {
        updateTeamsTable();
        updateQuestionsTable();
        
        // Set chance display to default on main page if it exists
        const chanceElement = document.getElementById('chanceQuestion');
        if (chanceElement) {
            chanceElement.textContent = '(3/3 chances)';
            chanceElement.style.display = 'block';
        }
        
        console.log('✅ Console: UI updated after reset');
    }, 100);
    
    // Clear resetting flag after a short delay
    setTimeout(() => {
        if (window.gameState) {
            window.gameState.isResetting = false;
        }
    }, 1000);
}

// ========== UTILITY FUNCTIONS ==========
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

// ========== SERVER STATE SYNC ==========
function loadServerState() {
    console.log('🔄 Loading server state...');
    socket.emit('get_server_state', {});
}

function setupServerStateListener() {
    socket.on('server_state_response', (serverState) => {
        if (serverState) {
            console.log('📥 Received server state:', serverState);
            syncClientStateWithServer(serverState);
        } else {
            console.log('⚠️ No server state received, using localStorage');
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
        
        // Don't sync question set title from server - preserve imported data from localStorage
        // The server has default titles that would override imported XLSX data
        console.log(`🔄 Skipping question set title sync to preserve imported data`);
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
                    gameState.state.angelTeam = 0; // Reset angel team when card is used
                }
            } else if (data.cardType === 'devil') {
                if (data.used) {
                    gameState.state.attackTeam = 0; // Reset attack team when card is used
                }
            } else if (data.cardType === 'cross') {
                gameState.state.actionCards[teamId].cross = data.active;
            }
            updateActionCardDisplay(teamId);
        }
    });

    socket.on('buzzer_pressed', (data) => {
        gameState.state.currentTeam = data.teamId;
        addLog(`Team ${data.teamId} buzzed in!`, 'success');
    });

    socket.on('clear_buzzers', () => {
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
            gameState.state.currentSet = data.setNumber;
            gameState.state.currentQuestion = data.questionNumber;
            updateQuestionsTable();
        }
    });

    // Listen for game state updates to sync console state
    socket.on('game_state_update', (data) => {
        if (data.path && data.value !== undefined) {
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

// ========== XLSX FILE HANDLING ==========
function initializeXLSXHandling() {
    const fileInput = document.getElementById('xlsxFileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
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

// Global functions for modal control
window.openUploadModal = function() {
    document.getElementById('uploadModal').classList.add('active');
    addLog('Upload modal opened', 'info');
};

window.closeUploadModal = function() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('xlsxFileInput').value = '';
    document.getElementById('uploadBtn').disabled = true;
    addLog('Upload modal closed', 'info');
};

window.processUploadedFile = function() {
    const fileInput = document.getElementById('xlsxFileInput');
    const file = fileInput.files[0];
    
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
            closeUploadModal();
            
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
                gameState.state.teams[teamId].name = row.team_name;
            }
            
            // Update team color
            if (row.team_color) {
                const validColors = ['red', 'blue', 'lime', 'orange', 'purple', 'cyan', 'pink', 'yellow'];
                if (validColors.includes(row.team_color.toLowerCase())) {
                    gameState.state.teams[teamId].color = row.team_color.toLowerCase();
                }
            }
            
            // Update score
            if (row.score !== undefined) {
                gameState.state.teams[teamId].score = parseInt(row.score) || 0;
            }
            
            // Update action cards
            if (row.angel !== undefined) {
                gameState.state.actionCards[teamId].angel = Boolean(row.angel);
            }
            if (row.devil !== undefined) {
                gameState.state.actionCards[teamId].devil = Boolean(row.devil);
            }
            if (row.cross !== undefined) {
                gameState.state.actionCards[teamId].cross = Boolean(row.cross);
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
                gameState.state.questionSets[setId].title = row.title;
            }
            
            // Update theme
            if (row.theme) {
                gameState.state.questionSets[setId].theme = row.theme.toLowerCase();
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
            const team = gameState.state.teams[teamId];
            const cards = gameState.state.actionCards[teamId];
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
            const questionSet = gameState.state.questionSets[setId];
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