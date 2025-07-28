/**
 * Console Page JavaScript
 * Complete functionality for the Quiz Bowl Console interface
 */

// Global variables
let socket;
let gameState;
let isConnected = false;
let port = null;
let reader = null;
let writer = null;
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
    initializeArduinoConnection();
    initializeTimer();
    initializeTeamsTable();
    initializeQuestionsTable();
    initializeCharacterControls();
    initializeKeyboardShortcuts();
    initializeLogs();
    
    // Disable character controller on console page to prevent errors
    if (window.characterController) {
        window.characterController.destroy();
    }
    
    // Set up socket event listeners
    setupSocketListeners();
    
    // Update initial displays
    updateTimerDisplay();
    updateCurrentQuestionInfo();
    updateTeamsTable();
    updateQuestionsTable();
    
    // Add initial log entry
    addLog('Console initialized - Ready for moderation', 'success');
    addLog('Press H for keyboard shortcuts', 'info');
    
    // Initialize character display
    initializeCharacterDisplay();
    
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

// ========== ARDUINO CONNECTION ==========
function initializeArduinoConnection() {
    window.toggleConnection = async function() {
        if (isConnected) {
            await disconnectArduino();
        } else {
            await connectArduino();
        }
    };
}

async function connectArduino() {
    if ('serial' in navigator) {
        try {
            addLog('Requesting Arduino port...', 'info');
            
            // Request port from user
            port = await navigator.serial.requestPort({
                filters: [
                    { usbVendorId: 0x10C4 }, // Silicon Labs
                    { usbVendorId: 0x1A86 }, // QinHeng Electronics  
                    { usbVendorId: 0x0403 }, // FTDI
                    { usbVendorId: 0x2341 }, // Arduino LLC
                    { usbVendorId: 0x239A }, // Adafruit
                    { usbVendorId: 0x303A }  // Espressif
                ]
            });
            
            addLog('Opening port...', 'info');
            
            // Open the port with proper settings
            await port.open({ 
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });
            
            addLog('Setting up data streams...', 'info');
            
            // Set up writer first
            const textEncoder = new TextEncoderStream();
            const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
            writer = textEncoder.writable.getWriter();
            
            // Set up reader
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            reader = textDecoder.readable.getReader();
            
            // Update connection state
            isConnected = true;
            updateConnectionUI();
            
            addLog('Arduino connected successfully', 'success');
            addLog('Waiting for Arduino messages...', 'info');
            
            // Start reading data
            readArduinoData();
            
            // Send initial test
            setTimeout(() => {
                sendResetToArduino();
            }, 1000);
            
        } catch (error) {
            console.error('Connection failed:', error);
            addLog(`Connection failed: ${error.message}`, 'error');
            isConnected = false;
            updateConnectionUI();
        }
    } else {
        addLog('Web Serial API not supported in this browser. Please use Chrome or Edge.', 'error');
    }
}

async function disconnectArduino() {
    try {
        if (reader) {
            await reader.cancel();
            reader = null;
        }
        if (writer) {
            await writer.close();
            writer = null;
        }
        if (port) {
            await port.close();
            port = null;
        }
        
        isConnected = false;
        updateConnectionUI();
        addLog('Arduino disconnected', 'info');
        
    } catch (error) {
        console.error('Disconnect error:', error);
        addLog(`Disconnect error: ${error.message}`, 'error');
    }
}

function updateConnectionUI() {
    const statusIndicator = document.getElementById('arduinoStatus');
    const statusText = document.getElementById('arduinoText');
    const connectBtn = document.getElementById('connectBtn');
    
    if (isConnected) {
        statusIndicator.classList.remove('disconnected');
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Connected';
        connectBtn.textContent = 'Disconnect';
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-danger');
    } else {
        statusIndicator.classList.remove('connected');
        statusIndicator.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
        connectBtn.textContent = 'Connect Arduino';
        connectBtn.classList.remove('btn-danger');
        connectBtn.classList.add('btn-primary');
    }
}

async function readArduinoData() {
    let buffer = '';
    
    try {
        while (isConnected && reader) {
            const { value, done } = await reader.read();
            if (done) {
                console.log('Arduino reader done');
                break;
            }
            
            // Accumulate data in buffer
            buffer += value;
            console.log('Raw Arduino data:', value);
            
            // Process complete lines
            let lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            
            for (let line of lines) {
                const data = line.trim();
                if (data.length === 0) continue;
                
                console.log('Processing Arduino message:', data);
                
                // Handle Arduino messages based on actual protocol
                if (data === 'READY') {
                    addLog('Arduino ready - clearing web buzzers', 'success');
                    clearBuzzers(true);
                } else if (data.startsWith('WINNER:')) {
                    const teamId = parseInt(data.replace('WINNER:', ''));
                    if (teamId >= 1 && teamId <= 6) {
                        addLog(`🚨 Team ${teamId} buzzed in!`, 'success');
                        buzzTeam(teamId);
                        socket.emit('test_buzzer', { teamId: teamId });
                    }
                } else {
                    addLog(`Arduino: ${data}`, 'info');
                }
            }
        }
    } catch (error) {
        if (isConnected) {
            console.error('Error reading Arduino data:', error);
            addLog(`Arduino communication error: ${error.message}`, 'error');
            
            // Auto-reconnect attempt
            isConnected = false;
            updateConnectionUI();
            
            addLog('Attempting to reconnect...', 'warning');
            setTimeout(() => {
                if (!isConnected) {
                    connectArduino();
                }
            }, 2000);
        }
    }
}

async function sendResetToArduino() {
    if (isConnected && writer) {
        try {
            console.log('Sending RESET command to Arduino');
            await writer.write('RESET\n');
            addLog('✅ Reset command sent to Arduino', 'info');
        } catch (error) {
            console.error('Error sending reset:', error);
            addLog(`❌ Error sending reset: ${error.message}`, 'error');
        }
    } else {
        addLog('❌ Cannot send reset - Arduino not connected', 'warning');
    }
}

// ========== TIMER CONTROLS ==========
function initializeTimer() {
    window.editTimer = function() {
        const timerDisplay = document.getElementById('timerDisplay');
        const currentTime = timerDisplay.textContent;
        const [minutes, seconds] = currentTime.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;
        
        const newTime = prompt('Enter timer duration (seconds):', totalSeconds);
        if (newTime && !isNaN(newTime) && newTime > 0) {
            const timeValue = parseInt(newTime);
            gameState.setTimer(timeValue);
            updateTimerDisplay();
            socket.emit('set_timer', { value: timeValue });
            addLog(`Timer set to ${formatTime(timeValue)}`, 'info');
        }
    };
    
    window.startPauseTimer = function() {
        if (gameState.state.timerRunning) {
            gameState.setTimer(gameState.state.timerValue, false);
            socket.emit('pause_timer');
            addLog('Timer paused', 'warning');
        } else {
            gameState.setTimer(gameState.state.timerValue, true);
            socket.emit('start_timer');
            addLog('Timer started', 'success');
        }
        updateTimerDisplay();
    };
    
    window.stopTimer = function() {
        gameState.setTimer(gameState.state.timerValue, false);
        socket.emit('stop_timer');
        addLog('Timer stopped', 'info');
        updateTimerDisplay();
    };
    
    window.resetTimer = function() {
        const defaultTime = gameState.state.config.timerDuration;
        gameState.setTimer(defaultTime, false);
        socket.emit('reset_timer', { value: defaultTime });
        addLog('Timer reset', 'info');
        updateTimerDisplay();
    };
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    const timeValue = gameState.state.timerValue;
    timerDisplay.textContent = formatTime(timeValue);
    
    // Update button text based on timer state
    const startBtn = document.querySelector('button[onclick="startPauseTimer()"]');
    if (startBtn) {
        startBtn.textContent = gameState.state.timerRunning ? 'Pause' : 'Start';
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <div class="color-circle" style="background: ${colorDefinitions[team.color]}" onclick="toggleColorDropdown(${teamId})"></div>
                <div class="color-dropdown" id="colorDropdown-${teamId}">
                    <div class="color-grid" id="colorGrid-${teamId}"></div>
                </div>
            </td>
            <td class="team-name-cell">
                <div class="team-name-display" onclick="editTeamName(${teamId})" id="teamNameDisplay-${teamId}">${team.name}</div>
                <input type="text" class="team-name-input hidden" id="teamNameInput-${teamId}" value="${team.name}" onblur="saveTeamName(${teamId})" onkeypress="handleTeamNameKeypress(event, ${teamId})">
            </td>
            <td class="team-score-cell" id="teamScore-${teamId}">${team.score}</td>
            <td class="team-cards-cell">
                <div class="team-action-card angel ${gameState.state.actionCards[teamId].angel ? 'active' : ''}" onclick="toggleActionCard(${teamId}, 'angel')" id="angelCard-${teamId}"></div>
                <div class="team-action-card devil ${gameState.state.actionCards[teamId].devil ? 'active' : ''}" onclick="activateDevil(${teamId})" id="devilCard-${teamId}"></div>
                <div class="team-action-card cross ${gameState.state.actionCards[teamId].cross ? 'active' : ''}" onclick="activateCross(${teamId})" id="crossCard-${teamId}"></div>
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
        const scoreCell = document.getElementById(`teamScore-${teamId}`);
        if (scoreCell) {
            scoreCell.textContent = team.score;
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

function toggleColorDropdown(teamId) {
    const dropdown = document.getElementById(`colorDropdown-${teamId}`);
    
    if (!dropdown) {
        console.error(`❌ Console: Color dropdown not found for team ${teamId}`);
        return;
    }
    
    const isActive = dropdown.classList.contains('active');
    
    // Close all other dropdowns
    document.querySelectorAll('.color-dropdown').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
        }
    });
    
    if (!isActive) {
        dropdown.classList.add('active');
        populateColorOptions(teamId);
        console.log(`🎮 Console: Color dropdown opened for team ${teamId}`);
    } else {
        dropdown.classList.remove('active');
        console.log(`🎮 Console: Color dropdown closed for team ${teamId}`);
    }
}

function changeTeamColor(teamId, color) {
    const oldColor = gameState.state.teams[teamId].color;
    gameState.state.teams[teamId].color = color;
    
    // Update UI
    updateTeamsTable();
    
    // Close dropdown
    document.getElementById(`colorDropdown-${teamId}`).classList.remove('active');
    
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
        nameDisplay.classList.add('hidden');
        nameInput.classList.remove('hidden');
        nameInput.focus();
        nameInput.select();
        console.log(`🎮 Console: Editing team ${teamId} name`);
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
    if (cardType === 'angel') {
        if (gameState.state.actionCards[teamId].angelUsed) {
            addLog(`Team ${teamId} angel card already used`, 'warning');
            return;
        }
        
        const isActive = gameState.state.actionCards[teamId].angel;
        gameState.state.actionCards[teamId].angel = !isActive;
        
        updateActionCardDisplay(teamId);
        
        // Emit for main page compatibility
        socket.emit('card_update', {
            teamId: teamId,
            cardType: cardType,
            active: gameState.state.actionCards[teamId].angel
        });
        
        // Also emit for hotkeys manager compatibility
        socket.emit('angel_activated', { 
            teamId: teamId, 
            activated: gameState.state.actionCards[teamId].angel 
        });
        
        addLog(`Team ${teamId} angel card ${isActive ? 'deactivated' : 'activated'}`, 'info');
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
    
    // Emit for main page compatibility
    socket.emit('card_update', {
        teamId: teamId,
        cardType: 'devil',
        active: true
    });
    
    // Show devil attack modal
    showDevilAttackModal(teamId);
    
    addLog(`Team ${teamId} devil card activated`, 'info');
}

function activateCross(teamId) {
    const isActive = gameState.state.actionCards[teamId].cross;
    gameState.state.actionCards[teamId].cross = !isActive;
    
    updateActionCardDisplay(teamId);
    
    socket.emit('card_update', {
        teamId: teamId,
        cardType: 'cross',
        active: gameState.state.actionCards[teamId].cross
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
    
    // Find the attacker (the team that clicked the devil card)
    const attackerId = Array.from(document.querySelectorAll('.attack-team-option')).findIndex(option => 
        !option.classList.contains('selected')
    ) + 1;
    
    // Check if target has cross protection
    if (gameState.state.actionCards[selectedAttackTarget].cross) {
        addLog(`Team ${selectedAttackTarget} protected by cross card - devil attack blocked`, 'warning');
        cancelDevilAttack();
        return;
    }
    
    // Mark devil card as used
    gameState.state.actionCards[attackerId].devilUsed = true;
    
    addLog(`Team ${attackerId} devil attacked Team ${selectedAttackTarget} - CHALLENGE MODE activated!`, 'error');
    addLog(`Team ${selectedAttackTarget} must answer: Correct = Attacker -1, Target +1 | Wrong = Attacker +2, Target -1`, 'info');
    
    // Update card displays
    updateActionCardDisplay(attackerId);
    
    // Emit socket events for main page compatibility
    socket.emit('card_update', {
        teamId: attackerId,
        cardType: 'devil',
        used: true
    });
    
    socket.emit('devil_attack', {
        attackerId: attackerId,
        targetId: selectedAttackTarget
    });
    
    // Also emit for hotkeys manager compatibility
    socket.emit('devil_attack_executed', {
        attackerId: attackerId,
        targetId: selectedAttackTarget
    });
    
    cancelDevilAttack();
}

function cancelDevilAttack() {
    document.getElementById('devilAttackModal').classList.remove('active');
    document.getElementById('confirmAttackBtn').disabled = true;
    selectedAttackTarget = null;
}

// ========== QUESTIONS MANAGEMENT ==========
function initializeQuestionsTable() {
    const tableBody = document.getElementById('questionsTableBody');
    tableBody.innerHTML = '';
    
    for (let setNumber = 1; setNumber <= 10; setNumber++) {
        const setInfo = gameState.state.questionSets[setNumber];
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
            <td class="question-set-theme" onclick="toggleThemeDropdown(${setNumber})">
                <div class="theme-icon" style="background-image: url('assets/themes/${setInfo.icon}.png')" id="themeIcon-${setNumber}"></div>
                <div class="theme-dropdown" id="themeDropdown-${setNumber}"></div>
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
    
    // Update current question info
    updateCurrentQuestionInfo();
}

function updateCurrentQuestionInfo() {
    const currentSet = gameState.state.currentSet;
    const currentQuestion = gameState.state.currentQuestion;
    const setInfo = gameState.state.questionSets[currentSet];
    
    document.getElementById('currentSetTitle').textContent = setInfo.title;
    document.getElementById('currentSetNumber').textContent = `Set ${currentSet}`;
    document.getElementById('currentQuestionNumber').textContent = `Q${currentQuestion}`;
}

function editQuestionSetTitle(setNumber) {
    const titleDisplay = document.getElementById(`questionSetTitleDisplay-${setNumber}`);
    const titleInput = document.getElementById(`questionSetTitleInput-${setNumber}`);
    
    if (titleDisplay && titleInput) {
        titleDisplay.classList.add('hidden');
        titleInput.classList.remove('hidden');
        titleInput.focus();
        titleInput.select();
        console.log(`🎮 Console: Editing question set ${setNumber} title`);
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
            updateCurrentQuestionInfo();
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
    const dropdown = document.getElementById(`themeDropdown-${setNumber}`);
    const isActive = dropdown.classList.contains('active');
    
    // Close all other dropdowns
    document.querySelectorAll('.theme-dropdown').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
        }
    });
    
    if (!isActive) {
        dropdown.classList.add('active');
        populateThemeOptions(setNumber);
    } else {
        dropdown.classList.remove('active');
    }
}

function populateThemeOptions(setNumber) {
    const dropdown = document.getElementById(`themeDropdown-${setNumber}`);
    dropdown.innerHTML = '';
    
    // Add theme options (you can expand this list)
    const themes = [
        { name: 'Brainstorm', icon: 'brainstorm' },
        { name: 'Science', icon: 'brainstorm' },
        { name: 'History', icon: 'brainstorm' },
        { name: 'Arts', icon: 'brainstorm' },
        { name: 'Sports', icon: 'brainstorm' },
        { name: 'Math', icon: 'brainstorm' },
        { name: 'Current Events', icon: 'brainstorm' },
        { name: 'Mystery', icon: 'brainstorm' }
    ];
    
    themes.forEach(theme => {
        const option = document.createElement('div');
        option.className = 'theme-option';
        option.onclick = () => selectTheme(setNumber, theme.icon, theme.name);
        
        option.innerHTML = `
            <div class="theme-option-icon" style="background-image: url('assets/themes/${theme.icon}.png')"></div>
            <span>${theme.name}</span>
        `;
        
        dropdown.appendChild(option);
    });
}

function selectTheme(setNumber, icon, name) {
    gameState.state.questionSets[setNumber].icon = icon;
    
    // Update theme icon
    const themeIcon = document.getElementById(`themeIcon-${setNumber}`);
    if (themeIcon) {
        themeIcon.style.backgroundImage = `url('assets/themes/${icon}.png')`;
    }
    
    // Close dropdown
    document.getElementById(`themeDropdown-${setNumber}`).classList.remove('active');
    
    addLog(`Set ${setNumber} theme updated: ${name}`, 'info');
}

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
        
        // Also emit for hotkeys manager compatibility
        socket.emit('challenge_mode_toggled', { 
            enabled: !isActive,
            teamId: gameState.state.currentTeam 
        });
    };
    
    window.toggleAngel = function() {
        const currentTeam = gameState.state.currentTeam;
        if (currentTeam > 0) {
            // Emit the same event that main page hotkeys manager uses
            socket.emit('angel_card_action', {
                teamId: currentTeam,
                action: 'toggle'
            });
            
            // Also call the local function for console updates
            toggleActionCard(currentTeam, 'angel');
            
            addLog(`Team ${currentTeam} angel card toggled`, 'info');
        } else {
            addLog('No team selected for angel card', 'warning');
        }
    };
    
    window.toggleDevil = function() {
        const currentTeam = gameState.state.currentTeam;
        if (currentTeam > 0) {
            // Emit the same event that main page hotkeys manager uses
            socket.emit('devil_card_action', {
                teamId: currentTeam,
                action: 'toggle'
            });
            
            // Also call the local function for console updates
            activateDevil(currentTeam);
            
            addLog(`Team ${currentTeam} devil card toggled`, 'info');
        } else {
            addLog('No team selected for devil card', 'warning');
        }
    };
    
    window.toggleChallenge = function() {
        const isActive = gameState.state.currentChallenge > 0;
        if (isActive) {
            gameState.state.currentChallenge = 0;
            addLog('Challenge mode disabled', 'info');
        } else {
            gameState.state.currentChallenge = 1;
            addLog('Challenge mode enabled (2x points)', 'success');
        }
        
        // Update character action panel
        updateCharacterActionPanel();
        
        // Emit the same event that main page hotkeys manager uses
        socket.emit('challenge_mode_action', {
            enabled: !isActive,
            teamId: gameState.state.currentTeam,
            action: 'toggle'
        });
        
        // Also emit for main page compatibility
        socket.emit('challenge_update', { enabled: !isActive });
        
        // Also emit for hotkeys manager compatibility
        socket.emit('challenge_mode_toggled', { 
            enabled: !isActive,
            teamId: gameState.state.currentTeam 
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
        
        // Emit the same event that main page hotkeys manager uses
        socket.emit('navigation_action', {
            direction: 'previous',
            fromSet: currentSet,
            fromQuestion: currentQuestion,
            toSet: newSet,
            toQuestion: newQuestion
        });
        
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
        
        // Emit the same event that main page hotkeys manager uses
        socket.emit('navigation_action', {
            direction: 'next',
            fromSet: currentSet,
            fromQuestion: currentQuestion,
            toSet: newSet,
            toQuestion: newQuestion
        });
        
        goToQuestion(newSet, newQuestion);
    };
    
    window.markCorrect = function() {
        const currentTeam = gameState.state.currentTeam;
        if (currentTeam > 0) {
            // Emit the same event that main page hotkeys manager uses
            socket.emit('scoring_action', {
                teamId: currentTeam,
                isPositive: true,
                action: 'correct'
            });
            
            // Also call the local function for console updates
            adjustScore(currentTeam, 1);
            
            addLog(`Team ${currentTeam} marked correct`, 'success');
        } else {
            addLog('No team selected for correct answer', 'warning');
        }
    };
    
    window.markIncorrect = function() {
        const currentTeam = gameState.state.currentTeam;
        if (currentTeam > 0) {
            // Emit the same event that main page hotkeys manager uses
            socket.emit('scoring_action', {
                teamId: currentTeam,
                isPositive: false,
                action: 'incorrect'
            });
            
            // Also call the local function for console updates
            adjustScore(currentTeam, -1);
            
            addLog(`Team ${currentTeam} marked incorrect`, 'error');
        } else {
            addLog('No team selected for incorrect answer', 'warning');
        }
    };
}

function updateCharacterActionPanel() {
    const angelIcon = document.getElementById('mainCharacterAngel');
    const devilIcon = document.getElementById('mainCharacterDevil');
    const crossIcon = document.getElementById('mainCharacterCross');
    const challengeIcon = document.getElementById('mainCharacterChallenge');
    
    // Update angel icon
    if (angelIcon) {
        angelIcon.classList.toggle('active', gameState.state.currentTeam > 0 && 
            gameState.state.actionCards[gameState.state.currentTeam].angel);
    }
    
    // Update devil icon
    if (devilIcon) {
        devilIcon.classList.toggle('active', gameState.state.currentTeam > 0 && 
            gameState.state.actionCards[gameState.state.currentTeam].devil);
    }
    
    // Update cross icon
    if (crossIcon) {
        crossIcon.classList.toggle('active', gameState.state.currentTeam > 0 && 
            gameState.state.actionCards[gameState.state.currentTeam].cross);
    }
    
    // Update challenge icon
    if (challengeIcon) {
        challengeIcon.classList.toggle('active', gameState.state.currentChallenge > 0);
    }
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
    
    // Also emit for hotkeys manager compatibility
    socket.emit('scoring_result', {
        teamId: teamId,
        isCorrect: adjustment > 0,
        scoreChange: actualAdjustment,
        newScore: gameState.state.teams[teamId].score
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
    
    // Also emit simulate_buzzer for hotkeys manager compatibility
    socket.emit('simulate_buzzer', { teamId: teamId });
    
    // Also emit test buzzer for Arduino compatibility
    socket.emit('test_buzzer', { teamId: teamId });
    
    addLog(`Team ${teamId} buzzed in!`, 'success');
}

function clearBuzzers() {
    gameState.state.currentTeam = 0;
    updateCharacterActionPanel();
    
    // Emit the same event that main page hotkeys manager uses
    socket.emit('buzzer_reset_action', {
        action: 'clear_all',
        reason: 'manual_reset'
    });
    
    // Emit for main page compatibility
    socket.emit('clear_buzzers');
    
    // Also emit for hotkeys manager compatibility
    socket.emit('reset_buzzers');
    
    addLog('All buzzers cleared', 'info');
}

// ========== KEYBOARD SHORTCUTS ==========
function initializeKeyboardShortcuts() {
    // DISABLED: Console page now uses the unified hotkeys manager from hotkeys.js
    // All keyboard shortcuts are handled by window.hotkeysManager
    console.log('🎮 Console: Using unified hotkeys manager');
    return;
    
    /* DISABLED - Using hotkeys manager instead
    document.addEventListener('keydown', function(event) {
        // Ignore if user is typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        switch(key) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
                event.preventDefault();
                const teamId = parseInt(key);
                console.log(`🎮 Console: Buzzing team ${teamId}`);
                // Emit the same event as main page hotkeys manager
                socket.emit('simulate_buzzer', { teamId: teamId });
                break;
            case 'z':
                event.preventDefault();
                console.log('🎮 Console: Toggle Angel card');
                // Emit the same event as main page hotkeys manager
                socket.emit('angel_card_toggle', { teamId: gameState.state.currentTeam });
                break;
            case 'x':
                event.preventDefault();
                console.log('🎮 Console: Toggle Devil card');
                // Emit the same event as main page hotkeys manager
                socket.emit('devil_card_toggle', { teamId: gameState.state.currentTeam });
                break;
            case 'c':
                event.preventDefault();
                console.log('🎮 Console: Toggle Challenge mode');
                // Emit the same event as main page hotkeys manager
                socket.emit('challenge_mode_toggle', { teamId: gameState.state.currentTeam });
                break;
            case 'r':
                event.preventDefault();
                console.log('🎮 Console: Reset buzzers (R key pressed)');
                // Emit the same event as main page hotkeys manager
                socket.emit('reset_buzzers');
                // Also call the local function for immediate feedback
                clearBuzzers();
                break;
            case 'i':
                event.preventDefault();
                console.log('🎮 Console: Start/Pause timer');
                socket.emit('start_timer');
                break;
            case 'o':
                event.preventDefault();
                console.log('🎮 Console: Stop timer');
                socket.emit('stop_timer');
                break;
            case 'p':
                event.preventDefault();
                console.log('🎮 Console: Reset timer');
                socket.emit('reset_timer', { value: 15 });
                break;
            case 'arrowleft':
                event.preventDefault();
                console.log('🎮 Console: Move to previous question');
                // Use the same logic as main page for consistency
                const currentSetLeft = gameState.state.currentSet;
                const currentQuestionLeft = gameState.state.currentQuestion;
                
                let newSetLeft = currentSetLeft;
                let newQuestionLeft = currentQuestionLeft;
                
                if (currentQuestionLeft > 1) {
                    newQuestionLeft = currentQuestionLeft - 1;
                } else if (currentSetLeft > 1) {
                    newSetLeft = currentSetLeft - 1;
                    newQuestionLeft = 4;
                }
                
                // Emit only progress_update for main page (let character controller handle game state)
                console.log('🎮 Console: Emitting progress_update for arrow left:', {
                    setNumber: newSetLeft,
                    questionNumber: newQuestionLeft,
                    animateRun: true
                });
                socket.emit('progress_update', {
                    setNumber: newSetLeft,
                    questionNumber: newQuestionLeft,
                    title: gameState.state.questionSets[newSetLeft].title,
                    subject: gameState.state.questionSets[newSetLeft].theme,
                    animateRun: true
                });
                
                addLog(`Moved to Set ${newSetLeft}, Question ${newQuestionLeft}`, 'info');
                break;
            case 'arrowright':
                event.preventDefault();
                console.log('🎮 Console: Move to next question');
                // Use the same logic as main page for consistency
                const currentSetRight = gameState.state.currentSet;
                const currentQuestionRight = gameState.state.currentQuestion;
                
                let newSetRight = currentSetRight;
                let newQuestionRight = currentQuestionRight;
                
                if (currentQuestionRight < 4) {
                    newQuestionRight = currentQuestionRight + 1;
                } else if (currentSetRight < 10) {
                    newSetRight = currentSetRight + 1;
                    newQuestionRight = 1;
                }
                
                // Emit only progress_update for main page (let character controller handle game state)
                console.log('🎮 Console: Emitting progress_update for arrow right:', {
                    setNumber: newSetRight,
                    questionNumber: newQuestionRight,
                    animateRun: true
                });
                socket.emit('progress_update', {
                    setNumber: newSetRight,
                    questionNumber: newQuestionRight,
                    title: gameState.state.questionSets[newSetRight].title,
                    subject: gameState.state.questionSets[newSetRight].theme,
                    animateRun: true
                });
                
                addLog(`Moved to Set ${newSetRight}, Question ${newQuestionRight}`, 'info');
                break;
            case 'arrowup':
                event.preventDefault();
                console.log('🎮 Console: Mark correct');
                // Emit the same event as main page hotkeys manager
                socket.emit('scoring_correct', { teamId: gameState.state.currentTeam });
                break;
            case 'arrowdown':
                event.preventDefault();
                console.log('🎮 Console: Mark incorrect');
                // Emit the same event as main page hotkeys manager
                socket.emit('scoring_incorrect', { teamId: gameState.state.currentTeam });
                break;
            case '[':
                event.preventDefault();
                console.log('🎮 Console: Previous set');
                const prevSet = gameState.state.currentSet;
                if (prevSet > 1) {
                    socket.emit('progress_update', {
                        setNumber: prevSet - 1,
                        questionNumber: 1,
                        animateRun: true
                    });
                }
                break;
            case ']':
                event.preventDefault();
                console.log('🎮 Console: Next set');
                const nextSetBracket = gameState.state.currentSet;
                if (nextSetBracket < 10) {
                    socket.emit('progress_update', {
                        setNumber: nextSetBracket + 1,
                        questionNumber: 1,
                        animateRun: true
                    });
                }
                break;
            case 'q':
                event.preventDefault();
                
                // Prevent multiple rapid triggers
                if (window.lastQKeyPress && Date.now() - window.lastQKeyPress < 1000) {
                    console.log('⚠️ Console: Q key pressed too quickly, ignoring');
                    return;
                }
                window.lastQKeyPress = Date.now();
                
                console.log('🎮 Console: Full game reset');
                
                // Reset local game state
                if (gameState) {
                    gameState.reset();
                    console.log('✅ Console: Game state reset completed');
                }
                
                // Update UI
                updateTeamsTable();
                updateQuestionsTable();
                updateCurrentQuestionInfo();
                
                // Sync with server for full game reset
                socket.emit('admin_reset', {});
                console.log('✅ Console: Full game reset synced with server');
                
                addLog('Full game reset completed', 'info');
                break;
            case 'h':
                event.preventDefault();
                console.log('🎮 Console: Toggle help modal');
                toggleHelpModal();
                break;
        }
    });
    */
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
        gameState.resetGame();
        
        // Update all displays
        updateTimerDisplay();
        updateTeamsTable();
        updateQuestionsTable();
        updateCurrentQuestionInfo();
        updateCharacterActionPanel();
        
        // Clear logs
        clearLogs();
        
        addLog('Game completely reset to defaults', 'success');
    }
}

// ========== CHARACTER DISPLAY INITIALIZATION ==========
function initializeCharacterDisplay() {
    // Hide victim character by default
    const victimCharacter = document.getElementById('victimCharacter');
    if (victimCharacter) {
        victimCharacter.style.display = 'none';
    }
    
    // Show only progress character in white
    const progressCharacter = document.getElementById('progressCharacter');
    if (progressCharacter) {
        progressCharacter.style.display = 'block';
        // Set to white character (default state)
        progressCharacter.src = 'assets/animations/among_us_idle.json';
    }
    
    // Initialize action panel (all cards inactive)
    const actionPanel = document.getElementById('characterActionPanel');
    if (actionPanel) {
        const cards = actionPanel.querySelectorAll('.character-action-icon');
        cards.forEach(card => {
            card.classList.remove('active');
        });
    }
    
    // Hide score indicator by default
    const scoreIndicator = document.getElementById('scoreIndicator');
    if (scoreIndicator) {
        scoreIndicator.style.display = 'none';
    }
    
    console.log('🎭 Character display initialized - showing only progress character in white');
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

    socket.on('timer_update', (data) => {
        gameState.state.timerValue = data.value;
        gameState.state.timerRunning = data.running;
        updateTimerDisplay();
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
            updateCharacterActionPanel();
        }
    });

    socket.on('arduino_connected', (data) => {
        isConnected = true;
        updateConnectionUI();
        addLog(`Arduino connected: ${data.port}`, 'success');
    });

    socket.on('arduino_disconnected', () => {
        isConnected = false;
        updateConnectionUI();
        addLog('Arduino disconnected', 'error');
    });

    socket.on('buzzer_pressed', (data) => {
        addLog(`Team ${data.teamId} buzzed in!`, 'success');
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
            updateCurrentQuestionInfo();
        }
    });
}

// ========== CLICK OUTSIDE HANDLERS ==========
document.addEventListener('click', function(event) {
    // Close color dropdowns when clicking outside
    if (!event.target.closest('.color-circle') && !event.target.closest('.color-dropdown')) {
        document.querySelectorAll('.color-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    // Close theme dropdowns when clicking outside
    if (!event.target.closest('.question-set-theme') && !event.target.closest('.theme-dropdown')) {
        document.querySelectorAll('.theme-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
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