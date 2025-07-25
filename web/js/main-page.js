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
        
        console.log('🚀 Initializing main page...');
        
        try {
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Wait for dependencies to load
            await this.waitForDependencies();
            
            // Initialize systems in order
            await this.initializeSystems();
            
            // Setup global functions for backward compatibility
            this.setupBackwardCompatibility();
            
            this.initialized = true;
            console.log('✅ Main page ready');
            
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
    
    // Setup backward compatibility functions
    setupBackwardCompatibility() {
        // Character movement
        window.moveCharacterToQuestion = (set, question) => {
            return window.characterController?.moveToQuestion(set, question);
        };
        
        // Buzzing
        window.showBuzzing = (teamId) => {
            window.buzzingSystem?.showBuzzing(teamId);
        };
        
        window.clearBuzzing = () => {
            window.buzzingSystem?.clearAll();
        };
        
        // Game state access
        window.getGameState = () => {
            return window.gameState?.get();
        };
        
        // Socket access
        window.socket = window.socketManager?.socket;
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

// Initialize the main page application
const mainPageApp = new MainPageApp();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mainPageApp.init());
} else {
    mainPageApp.init();
}

// Export for global access
window.mainPageApp = mainPageApp;

console.log('✅ Main page app loaded'); 