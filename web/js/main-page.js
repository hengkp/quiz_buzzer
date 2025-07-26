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
            'Hotkeys Manager'
        ];
        this.completedSteps = 0;
    }
    
    // Initialize the main page application
    async init() {
        if (this.initialized) {
            console.warn('⚠️ Main page already initialized');
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
            
            this.initialized = true;
            
        } catch (error) {
            console.error('❌ Main page initialization failed:', error);
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
                    'io', // Socket.IO
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
            () => this.initializeHotkeys()
        ];
        
    }
    
    // Initialize game state
    initializeGameState() {
        if (!window.gameState) {
            throw new Error('Game state not available');
        }
        
        return Promise.resolve();
    }
    
    // Initialize socket manager
    initializeSocketManager() {
        if (!window.socketManager) {
            throw new Error('Socket manager not available');
        }
        
        window.socketManager.init();
        
        // Override updateProgress for backward compatibility
        window.updateProgress = (data) => {
            if (data && data.setNumber && data.questionNumber) {
                window.characterController?.moveToQuestion(data.setNumber, data.questionNumber);
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
                console.warn('⚠️ ProgressWhite.initializeTeamColors not available');
                
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
            console.error('❌ Error initializing team character colors:', error);
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
                    console.warn('⚠️ ProgressWhite not available, using fallback');
                    // Fallback: direct src assignment
                    progressCharacter.src = 'assets/animations/among_us_idle.json';
                }
                
                // Ensure it's visible and playing
                progressCharacter.style.display = 'block';
                
                // Wait for it to load
                await new Promise(resolve => setTimeout(resolve, 200));
            } else {
                console.warn('⚠️ Progress character not found');
            }
            
            // Reset game state to ensure no team is selected
            window.gameState.set('currentTeam', 0);
            
        } catch (error) {
            console.error('❌ Error ensuring white character:', error);
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
                console.warn('⚠️ Team animation system not available');
            }
        } catch (error) {
            console.error('❌ Error starting team animations:', error);
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
