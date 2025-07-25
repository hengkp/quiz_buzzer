/**
 * Buzzing System
 * Manages team buzz-in visual effects and overlays
 */

class BuzzingSystem {
    constructor() {
        this.activeOverlays = new Map();
        this.teamColors = ['red', 'blue', 'lime', 'orange', 'pink', 'yellow'];
        this.autoHideDelay = 3000;
    }
    
    // Initialize buzzing system
    init() {
        this.createStyles();
        
        // Subscribe to socket events
        window.socketManager?.on('local:buzzer_pressed', (data) => {
            this.showBuzzing(data.teamId);
        });
        
        window.socketManager?.on('local:clear_buzzers', () => {
            this.clearAll();
        });
        
        console.log('✅ Buzzing system ready');
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
    
    // Show buzzing overlay for specific team
    showBuzzing(teamId) {
        if (!teamId || teamId < 1 || teamId > 6) {
            console.warn('⚠️ Invalid team ID for buzzing:', teamId);
            return;
        }
        
        const teamCard = this.findTeamCard(teamId);
        if (!teamCard) {
            console.warn('⚠️ Team card not found:', teamId);
            return;
        }
        
        // Remove existing overlay for this team
        this.clearBuzzing(teamId);
        
        // Create new overlay
        const overlay = this.createOverlay(teamId);
        teamCard.appendChild(overlay);
        
        // Store reference
        this.activeOverlays.set(teamId, overlay);
        
        // Show overlay with animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
        
        // Auto-hide after delay
        setTimeout(() => {
            this.clearBuzzing(teamId);
        }, this.autoHideDelay);
        
        console.log(`🔔 Team ${teamId} buzzed`);
    }
    
    // Create buzzing overlay element
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
    
    // Find team card element
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
        console.log('🔕 All buzzing cleared');
    }
    
    // Get active buzzing teams
    getActiveBuzzing() {
        return Array.from(this.activeOverlays.keys());
    }
    
    // Check if team is currently buzzing
    isBuzzing(teamId) {
        return this.activeOverlays.has(teamId);
    }
    
    // Set auto-hide delay
    setAutoHideDelay(delay) {
        this.autoHideDelay = Math.max(1000, delay);
    }
}

// Export singleton instance and add to global scope
window.buzzingSystem = new BuzzingSystem();

// Backward compatibility
window.showBuzzing = (teamId) => window.buzzingSystem?.showBuzzing(teamId);
window.clearBuzzing = () => window.buzzingSystem?.clearAll();

console.log('✅ Buzzing system loaded'); 