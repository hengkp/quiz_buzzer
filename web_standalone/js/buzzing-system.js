/**
 * Buzzing System
 * Manages team buzz-in visual effects and overlays with teamBuzzingModal integration
 * 
 * FUNCTION MANAGEMENT:
 * - playBuzzerSound(): PRIMARY implementation here (removed duplicate from hotkeys.js)
 * - showTeamBuzzingModal(): PRIMARY implementation here (removed duplicate from hotkeys.js)
 * - Global aliases: window.showBuzzing, window.clearBuzzing, window.simulateBuzzer
 */

class BuzzingSystem {
    constructor() {
        this.activeOverlays = new Map();
        this.teamColors = ['red', 'blue', 'lime', 'orange', 'pink', 'yellow'];
        this.autoHideDelay = 2000; // Changed from 3000ms to 2000ms
        this.currentBuzzingTeam = 0;
        this.modalTimeout = null; // Track modal timeout
    }
    
    // Initialize buzzing system
    init() {
        this.createStyles();
        
        return true;
    }
    
    // Create CSS styles for buzzing overlays
    createStyles() {
        const style = document.createElement('style');
        style.id = 'buzzing-system-styles';
        style.textContent = `
            .buzzing-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                z-index: 100;
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
            
            .buzzing-overlay.show {
                opacity: 1;
                transform: scale(1);
            }
            
            .buzzing-content {
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            
            .buzzing-image {
                width: 80px;
                height: 80px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
                animation: buzzPulse 0.5s ease-in-out;
            }
            
            .buzzing-text {
                font-size: 1.2rem;
                font-weight: 700;
                color: #2c3e50;
                text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
                animation: buzzSlide 0.3s ease-out 0.2s both;
            }
            
            /* Enhanced styles for score indicator */
            .score-indicator .score-popup {
                opacity: 0;
                transform: translateY(20px) scale(0.8);
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                pointer-events: none;
            }
            
            .score-indicator .score-popup.active {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            
            .score-text.positive {
                color: #22c55e;
                text-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
            }
            
            .score-text.negative {
                color: #ef4444;
                text-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
            }
            
            @keyframes buzzPulse {
                0% { transform: scale(0.8); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            @keyframes buzzSlide {
                0% { transform: translateY(20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
        `;
        
        // Remove existing styles to prevent duplication
        const existingStyles = document.getElementById('buzzing-system-styles');
        if (existingStyles) {
            existingStyles.remove();
        }
        
        document.head.appendChild(style);
    }
    
    // Show buzzing using teamBuzzingModal with enhanced features
    showBuzzing(teamId) {
        if (!teamId || teamId < 1 || teamId > 6) {
            return;
        }
        
        
        // Clear any existing timeout to prevent overlap
        if (this.modalTimeout) {
            clearTimeout(this.modalTimeout);
            this.modalTimeout = null;
        }
        
        // Update current buzzing team
        this.currentBuzzingTeam = teamId;
        
        // Show the teamBuzzingModal
        this.showTeamBuzzingModal(teamId);
        
        // Play buzzer sound
        this.playBuzzerSound();
        
        // Set new timeout to auto-hide after delay
        this.modalTimeout = setTimeout(() => {
            this.clearBuzzing(teamId);
            this.modalTimeout = null;
        }, this.autoHideDelay);
        
    }
    
    // Show team buzzing modal with proper styling
    showTeamBuzzingModal(teamId) {
        const modal = document.getElementById('teamBuzzingModal');
        const card = document.getElementById('teamBuzzingCard');
        
        if (!modal || !card) {
            return;
        }
        
        // Get team color for the buzzing card
        let teamColor = 'white';
        if (window.gameState) {
            const team = window.gameState.get('teams')[teamId];
            if (team && team.color) {
                teamColor = team.color;
            }
        }
        
        // Update card image
        card.src = `assets/buzzing/buzzing-${teamColor}.png`;
        card.alt = `Team ${teamId} Buzzed`;
        
        // Show modal with animation
        modal.classList.add('active');
        
    }
    
    // Play buzzer sound
    playBuzzerSound() {
        try {
            // Try to play correct sound first
            const audio = new Audio('assets/audio/emergency-meeting-among-us.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Fallback: try incorrect sound
            });
        } catch (error) {
        }
    }
    
    // Create buzzing overlay element (legacy support)
    createOverlay(teamId) {
        const overlay = document.createElement('div');
        overlay.className = 'buzzing-overlay';
        overlay.dataset.teamId = teamId;
        
        const content = document.createElement('div');
        content.className = 'buzzing-content';
        
        const image = document.createElement('div');
        image.className = 'buzzing-image';
        
        // Set team-specific buzzing image
        const teamColor = this.teamColors[teamId - 1] || 'white';
        image.style.backgroundImage = `url('assets/buzzing/buzzing-${teamColor}.png')`;
        
        const text = document.createElement('div');
        text.className = 'buzzing-text';
        text.textContent = 'BUZZED!';
        
        content.appendChild(image);
        content.appendChild(text);
        overlay.appendChild(content);
        
        return overlay;
    }
    
    // Find team card element (legacy support)
    findTeamCard(teamId) {
        // Try different selectors for team cards
        const selectors = [
            `[data-team-id="${teamId}"]`,
            `[data-team="${teamId}"]`,
            `.team-card:nth-child(${teamId})`,
            `#team-${teamId}`,
            `.team-${teamId}`
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        
        // Fallback: find by team name or position
        const teamCards = document.querySelectorAll('.team-card');
        if (teamCards[teamId - 1]) {
            return teamCards[teamId - 1];
        }
        
        return null;
    }
    
    // Clear specific team's buzzing overlay
    clearBuzzing(teamId) {
        // Hide the main buzzing modal (always clear it regardless of currentBuzzingTeam)
        const modal = document.getElementById('teamBuzzingModal');
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
        
        // Reset current buzzing team only if it matches
        if (this.currentBuzzingTeam === teamId) {
            this.currentBuzzingTeam = 0;
        }
        
        // Also clear any legacy overlays
        const overlay = this.activeOverlays.get(teamId);
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.activeOverlays.delete(teamId);
            }, 300);
        }
    }
    
    // Clear all buzzing overlays
    clearAll() {
        // Clear main buzzing modal
        const modal = document.getElementById('teamBuzzingModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Clear modal timeout
        if (this.modalTimeout) {
            clearTimeout(this.modalTimeout);
            this.modalTimeout = null;
        }
        
        this.currentBuzzingTeam = 0;
        
        // Clear any legacy overlays
        this.activeOverlays.forEach((overlay, teamId) => {
            this.clearBuzzing(teamId);
        });
        
        // Fallback: remove any remaining overlays
        document.querySelectorAll('.buzzing-overlay').forEach(overlay => {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        });
        
        this.activeOverlays.clear();
        
        // Reset game state
        if (window.gameState) {
            window.gameState.set('currentTeam', 0);
            window.gameState.set('currentChallenge', 0);
        }
        
    }
    
    // Get active buzzing teams
    getActiveBuzzing() {
        if (this.currentBuzzingTeam > 0) {
            return [this.currentBuzzingTeam];
        }
        return Array.from(this.activeOverlays.keys());
    }
    
    // Check if team is currently buzzing
    isBuzzing(teamId) {
        return this.currentBuzzingTeam === teamId || this.activeOverlays.has(teamId);
    }
    
    // Get current buzzing team
    getCurrentBuzzingTeam() {
        return this.currentBuzzingTeam;
    }
    
    // Set auto-hide delay
    setAutoHideDelay(delay) {
        this.autoHideDelay = Math.max(1000, delay);
    }
    
    // Simulate buzzer for testing (integrated with hotkeys)
    simulateBuzzer(teamId) {
        this.showBuzzing(teamId);
    }
    
    // Reset buzzers (integrated with hotkeys)
    resetBuzzers() {
        // Send RESET command to Arduino via server (not needed in standalone)
        this.clearAll();
    }
    
    // Handle server buzzer events
    handleServerBuzzer(data) {
        if (data && data.teamId) {
            this.showBuzzing(data.teamId);
        }
    }
    
    // Handle server clear buzzers
    handleServerClear() {
        this.clearAll();
    }
}

// Export singleton instance and add to global scope
window.buzzingSystem = new BuzzingSystem();

// Backward compatibility and enhanced API
window.showBuzzing = (teamId) => window.buzzingSystem?.showBuzzing(teamId);
window.clearBuzzing = () => window.buzzingSystem?.clearAll();
window.simulateBuzzer = (teamId) => window.buzzingSystem?.simulateBuzzer(teamId);
window.resetBuzzers = () => window.buzzingSystem?.resetBuzzers();

