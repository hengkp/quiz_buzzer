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
        // Team buzzer hotkeys (1-6) - works for both pages
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
        
        // Control hotkeys - works for both pages
        this.bind('r', (event) => {
            event.preventDefault();
            this.handleResetBuzzers();
        }, 'Reset buzzers');
        
        this.bind('q', (event) => {
            event.preventDefault();
            this.handleAdminReset();
        }, 'Admin reset');
        
        // Timer hotkeys - different behavior per page
        this.bind(' ', (event) => {
            event.preventDefault();
            this.handleTimerToggle();
        }, 'Start/pause timer');
        
        this.bind('p', (event) => {
            event.preventDefault();
            this.handlePauseTimer();
        }, 'Pause timer');
        
        this.bind('s', (event) => {
            event.preventDefault();
            this.handleStopTimer();
        }, 'Stop timer');
        
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
    
    // Handle team buzzer for both pages
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
            // Main page behavior
            window.socketManager?.simulateBuzzer(teamId);
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
                questionNumber: questionNumber 
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
    
    // Handle reset buzzers for both pages
    handleResetBuzzers() {
        if (this.pageType === 'console') {
            if (window.socket && window.socket.connected) {
                window.socket.emit('reset_buzzers');
            }
            
            // Clear local buzzer UI
            document.querySelectorAll('.team-buzzed').forEach(el => {
                el.classList.remove('team-buzzed');
            });
        } else {
            window.socketManager?.resetBuzzers();
        }
    }
    
    // Handle admin reset for both pages
    handleAdminReset() {
        if (this.pageType === 'console') {
            if (window.socket && window.socket.connected) {
                window.socket.emit('admin_reset');
            }
            
            // Reset local state
            this.updateProgress(1, 1);
            this.handleResetBuzzers();
        } else {
            window.socketManager?.adminReset();
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
            window.socketManager?.pauseTimer();
        }
    }
    
    // Handle stop timer for both pages
    handleStopTimer() {
        if (this.pageType === 'console') {
            if (window.socket && window.socket.connected) {
                window.socket.emit('stop_timer');
            }
            
            // Update UI
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.classList.remove('timer-running');
                timerDisplay.textContent = '0:00';
            }
        } else {
            window.socketManager?.stopTimer();
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
            'Timer Controls': ['space', 'p', 's'],
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
    });
} else {
    window.hotkeysManager = new HotkeysManager();
    window.hotkeysManager.init();
    
    // Backward compatibility for console
    window.consoleHotkeys = window.hotkeysManager;
}

// Backward compatibility - expose common functions
window.moveCharacterToQuestion = (set, question) => {
    window.characterController?.moveToQuestion(set, question);
}; 