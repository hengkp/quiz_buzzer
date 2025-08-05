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
            'Socket Manager',
            'Character Controller',
            'Buzzing System',
            'Hotkeys Manager',
            'Arduino Connection'
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
            
            // Ensure character starts as white
            await this.ensureCharacterStartsWhite();
            
            // Initialize team character colors
            await this.initializeTeamCharacterColors();
            
            // Start continuous team character random animations (5-20 seconds)
            await this.startTeamAnimations();
            
            // Setup global functions for backward compatibility
            this.setupBackwardCompatibility();
            
            // Setup local storage reset on 'q' key
            this.setupLocalStorageReset();
            
            this.initialized = true;
            
        } catch (error) {
            // Silently handle initialization errors
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
                    'firebase', // Firebase
                    'firebaseManager', // Firebase Manager
                    'socket', // Firebase Socket Manager
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
            () => this.initializeSocketManager(),
            () => this.initializeCharacterController(),
            () => this.initializeBuzzingSystem(),
            () => this.initializeHotkeys(),
            () => this.initializeArduinoConnection()
        ];
        
        // Execute all systems in order
        for (let i = 0; i < systems.length; i++) {
            try {
                await systems[i]();
                this.completedSteps++;
            } catch (error) {
                // Silently handle initialization errors
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
        // Setup server state listener after socket connects
        if (window.socket) {
            window.socket.on('connect', () => {
                this.setupServerStateListener();
                this.requestServerState();
            });
        }
    }
    
    // Request server state
    requestServerState() {
        if (window.socket) {
            window.socket.emitToServer('get_server_state', {});
        }
    }
    
    // Add event listener for server state response
    setupServerStateListener() {
        if (window.socket) {
            window.socket.on('server_state_response', (serverState) => {
                if (serverState) {
                    this.syncClientStateWithServer(serverState);
                }
            });
        }
    }
    
    // Sync client state with server state
    syncClientStateWithServer(serverState) {
        // Sync team data
        if (serverState.teams) {
            Object.keys(serverState.teams).forEach(teamId => {
                const serverTeam = serverState.teams[teamId];
                const clientTeam = window.gameState.state.teams[teamId];
                
                if (clientTeam && serverTeam) {
                    // Update team name if different
                    if (serverTeam.name && serverTeam.name !== clientTeam.name) {
                        window.gameState.state.teams[teamId].name = serverTeam.name;
                    }
                    
                    // Update team score if different
                    if (serverTeam.score !== undefined && serverTeam.score !== clientTeam.score) {
                        window.gameState.state.teams[teamId].score = serverTeam.score;
                    }
                    
                    // Update team color if different
                    if (serverTeam.color && serverTeam.color !== clientTeam.color) {
                        window.gameState.state.teams[teamId].color = serverTeam.color;
                    }
                }
            });
        }
        
        // Sync timer data
        if (serverState.timer) {
            if (serverState.timer.value !== undefined && serverState.timer.value !== window.gameState.state.timerValue) {
                window.gameState.state.timerValue = serverState.timer.value;
            }
            
            if (serverState.timer.running !== undefined && serverState.timer.running !== window.gameState.state.timerRunning) {
                window.gameState.state.timerRunning = serverState.timer.running;
            }
        }
        
        // Sync question set data
        if (serverState.question_set) {
            if (serverState.question_set.current !== undefined && serverState.question_set.current !== window.gameState.state.currentSet) {
                window.gameState.state.currentSet = serverState.question_set.current;
            }
            
            if (serverState.question_set.title && window.gameState.state.questionSets[window.gameState.state.currentSet]) {
                window.gameState.state.questionSets[window.gameState.state.currentSet].title = serverState.question_set.title;
            }
        }
        
        // Update UI after syncing
        window.gameState.updateTeamDisplays();
        window.gameState.updateTimerDisplay();
        window.gameState.updateQuestionSetDisplay();
    }
    
    // Initialize socket manager
    initializeSocketManager() {
        if (!window.socket) {
            throw new Error('Firebase socket manager not available');
        }
        
        // Firebase socket manager is already initialized
        // Override updateProgress for backward compatibility
        window.updateProgress = (data) => {
            if (data && data.setNumber && data.questionNumber) {
                window.characterController?.moveToQuestion(data.setNumber, data.questionNumber);
            }
        };
        
        // Create backward compatibility for socketManager
        window.socketManager = {
            socket: window.socket,
            isConnected: () => window.socket.connected,
            init: () => {}, // Already initialized
            resetBuzzers: () => window.socket.emitToServer('reset_buzzers', {}),
            connectArduino: () => window.socket.emitToServer('connect_arduino', {}),
            disconnectArduino: () => window.socket.emitToServer('disconnect_arduino', {}),
            getArduinoStatus: () => window.socket.emitToServer('get_arduino_status', {}),
            send: (event, data) => window.socket.emitToServer(event, data),
            on: (event, callback) => window.socket.on(event, callback),
            updateProgress: (setNumber, questionNumber) => {
                window.updateProgress({ setNumber, questionNumber });
            }
        };
        
        return Promise.resolve();
    }
    
    // Initialize character controller
    initializeCharacterController() {
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
            // Silently handle initialization errors
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
        
        window.socket = window.socketManager?.socket;
    }
    
    // Ensure character starts as white
    async ensureCharacterStartsWhite() {
        
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
            }
            
            // Reset game state to ensure no team is selected
            window.gameState.set('currentTeam', 0);
            
        } catch (error) {
            // Silently handle initialization errors
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
            }
        } catch (error) {
            // Silently handle initialization errors
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
        // Initialize Arduino connection status
        window.arduinoConnected = false;
        
        // Listen for Arduino status changes
        document.addEventListener('arduinoStatusChanged', (event) => {
            const { connected, message } = event.detail;
            window.arduinoConnected = connected;
            this.updateArduinoUI();
        });
        
        // Get initial Arduino status
        if (window.socketManager) {
            window.socketManager.getArduinoStatus();
        }
        
        // Set up global Arduino toggle function
        window.toggleArduinoConnection = () => {
            if (window.arduinoConnected) {
                window.socketManager.disconnectArduino();
            } else {
                window.socketManager.connectArduino();
            }
        };
        
        // Set initial UI state
        this.updateArduinoUI();
        
        return Promise.resolve();
    }
    
    updateArduinoUI() {
        const arduinoToggle = document.getElementById('arduinoToggle');
        const arduinoIcon = document.getElementById('arduinoIcon');
        
        if (!arduinoToggle || !arduinoIcon) {
            return;
        }
        
        if (window.arduinoConnected) {
            arduinoToggle.classList.add('connected');
            arduinoToggle.classList.remove('disconnected');
            arduinoIcon.className = 'ri-cpu-fill';
            arduinoToggle.title = 'Disconnect Arduino';
        } else {
            arduinoToggle.classList.add('disconnected');
            arduinoToggle.classList.remove('connected');
            arduinoIcon.className = 'ri-cpu-line';
            arduinoToggle.title = 'Connect Arduino';
        }
    }
    
    // Setup local storage reset on 'q' key press
    setupLocalStorageReset() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'q' || event.key === 'Q') {
                // Clear local storage and reset game state
                if (window.gameState) {
                    window.gameState.clearStorage();
                    window.gameState.reset();
                }
            }
        });
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
