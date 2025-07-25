/**
 * Script to Set Progress Character to White
 * This script ensures the Among Us progress character is properly colored white
 * Integrates with existing among_us.html or works standalone
 */

// Namespace to avoid conflicts with existing code
window.ProgressWhite = window.ProgressWhite || {};

// Animation cache for loaded JSON files
ProgressWhite.animationCache = {};

// Color mapping for white character
ProgressWhite.getWhiteTeamColors = function() {
    return {
        primary: [0.969, 0.996, 0.996, 1],     // Very light white
        secondary: [0.667, 0.725, 0.725, 1],   // Light gray shadows
        light: [0.996, 0.996, 0.996, 1]       // Pure white highlights
    };
};

// Load animation data from JSON file
ProgressWhite.loadAnimationData = async function(animationSrc) {
    if (ProgressWhite.animationCache[animationSrc]) {
        return JSON.parse(JSON.stringify(ProgressWhite.animationCache[animationSrc]));
    }
    
    try {
        const response = await fetch(animationSrc);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        ProgressWhite.animationCache[animationSrc] = data;
        return JSON.parse(JSON.stringify(data));
    } catch (error) {
        console.error('❌ Error loading animation data:', error);
        return null;
    }
};

// Calculate color distance for precise color matching
ProgressWhite.calculateColorDistance = function(color1, color2) {
    const dr = color1[0] - color2[0];
    const dg = color1[1] - color2[1];
    const db = color1[2] - color2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
};

// Check if color is the main character body color
ProgressWhite.isMainCharacterColor = function(color) {
    const originalMain1 = [0.784, 0.125, 0.055, 1]; // Main red body (integer alpha)
    const originalMain2 = [0.784, 0.125, 0.055, 1.0]; // Main red body (decimal alpha)
    
    return ProgressWhite.calculateColorDistance(color, originalMain1) < 0.1 ||
           ProgressWhite.calculateColorDistance(color, originalMain2) < 0.1;
};

// Check if color is a shadow color (excluding visor shadow)
ProgressWhite.isShadowColor = function(color) {
    const originalShadow1 = [0.545, 0.094, 0.157, 1]; // Dark red shadow (integer alpha)
    const originalShadow2 = [0.545, 0.094, 0.157, 1.0]; // Dark red shadow (decimal alpha)
    const originalVisorShadow1 = [0.278, 0.38, 0.424, 1]; // Dark blue visor shadow - keep original (integer alpha)
    const originalVisorShadow2 = [0.278, 0.38, 0.424, 1.0]; // Dark blue visor shadow - keep original (decimal alpha)
    
    // Don't change the visor shadow color
    if (ProgressWhite.calculateColorDistance(color, originalVisorShadow1) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalVisorShadow2) < 0.1) {
        return false;
    }
    
    return ProgressWhite.calculateColorDistance(color, originalShadow1) < 0.1 ||
           ProgressWhite.calculateColorDistance(color, originalShadow2) < 0.1;
};

// Check if color is a light reflection color (excluding visor)
ProgressWhite.isLightColor = function(color) {
    const originalLight1 = [0.969, 0.996, 0.996, 1]; // Very light reflection (integer alpha)
    const originalLight2 = [0.969, 0.996, 0.996, 1.0]; // Very light reflection (decimal alpha)
    const originalVisor1 = [0.576, 0.788, 0.855, 1]; // Light blue visor - keep original (integer alpha)
    const originalVisor2 = [0.576, 0.788, 0.855, 1.0]; // Light blue visor - keep original (decimal alpha)
    
    // Don't change the visor color
    if (ProgressWhite.calculateColorDistance(color, originalVisor1) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalVisor2) < 0.1) {
        return false;
    }
    
    return ProgressWhite.calculateColorDistance(color, originalLight1) < 0.1 ||
           ProgressWhite.calculateColorDistance(color, originalLight2) < 0.1 ||
           (color[0] > 0.95 && color[1] > 0.95 && color[2] > 0.95);
};

// Check if color is a light blue color (newly added)
ProgressWhite.isLightBlueColor = function(color) {
    const originalLightBlue1 = [0.733, 0.945, 1.0, 1]; // New light blue color found in fears (integer alpha)
    const originalLightBlue2 = [0.733, 0.945, 1.0, 1.0]; // New light blue color found in fears (decimal alpha)
    
    return ProgressWhite.calculateColorDistance(color, originalLightBlue1) < 0.1 ||
           ProgressWhite.calculateColorDistance(color, originalLightBlue2) < 0.1;
};

// Check if color is black (for stroke colors)
ProgressWhite.isBlackColor = function(color) {
    const originalBlack1 = [0.0, 0.0, 0.0, 1]; // Pure black (integer alpha)
    const originalBlack2 = [0.0, 0.0, 0.0, 1.0]; // Pure black (decimal alpha)
    
    return ProgressWhite.calculateColorDistance(color, originalBlack1) < 0.1 ||
           ProgressWhite.calculateColorDistance(color, originalBlack2) < 0.1;
};

// Replace colors in animation layer recursively
ProgressWhite.replaceColorsInLayer = function(layer, whiteColors) {
    if (layer.shapes) {
        layer.shapes.forEach(shape => {
            if (shape.it) {
                shape.it.forEach(item => {
                    // Handle fill colors (ty: 'fl')
                    if (item.ty === 'fl' && item.c && item.c.k) {
                        const currentColor = item.c.k;
                        
                        // Check if this is the main character color (red body)
                        if (ProgressWhite.isMainCharacterColor(currentColor)) {
                            item.c.k = whiteColors.primary;
                        }
                        // Check if this is the shadow/dark color (NOT visor shadow)
                        else if (ProgressWhite.isShadowColor(currentColor)) {
                            item.c.k = whiteColors.secondary;
                        }
                        // Check if this is a light reflection color (NOT visor)
                        else if (ProgressWhite.isLightColor(currentColor)) {
                            item.c.k = whiteColors.light;
                        }
                        // Handle the new color found in fears animation (light blue)
                        else if (ProgressWhite.isLightBlueColor(currentColor)) {
                            item.c.k = whiteColors.light;
                        }
                    }
                    
                    // Handle stroke colors (ty: 'st') - but only if they're not black outlines
                    if (item.ty === 'st' && item.c && item.c.k) {
                        const currentColor = item.c.k;
                        
                        // Only replace non-black stroke colors (character body strokes)
                        if (!ProgressWhite.isBlackColor(currentColor)) {
                            if (ProgressWhite.isMainCharacterColor(currentColor)) {
                                item.c.k = whiteColors.primary;
                            }
                            else if (ProgressWhite.isShadowColor(currentColor)) {
                                item.c.k = whiteColors.secondary;
                            }
                            else if (ProgressWhite.isLightColor(currentColor)) {
                                item.c.k = whiteColors.light;
                            }
                            else if (ProgressWhite.isLightBlueColor(currentColor)) {
                                item.c.k = whiteColors.light;
                            }
                        }
                    }
                });
            }
            
            // Recursively handle nested groups
            if (shape.shapes) {
                ProgressWhite.replaceColorsInLayer(shape, whiteColors);
            }
            
            // Handle nested items within shapes
            if (shape.it) {
                shape.it.forEach(item => {
                    if (item.shapes) {
                        ProgressWhite.replaceColorsInLayer(item, whiteColors);
                    }
                });
            }
        });
    }
    
    // Handle layers that might have nested structures
    if (layer.it) {
        layer.it.forEach(item => {
            if (item.shapes) {
                ProgressWhite.replaceColorsInLayer(item, whiteColors);
            }
        });
    }
    
    return layer;
};

// Enhanced function to apply colors to animation data with better debugging
ProgressWhite.applyColorsToAnimation = async function(animationData, colorString) {
    // Convert color string to whiteColors object
    let whiteColors;
    if (typeof colorString === 'string') {
        // Get the team colors for the specified color
        if (colorString === 'white') {
            whiteColors = ProgressWhite.getWhiteTeamColors();
        } else if (ProgressWhite.teamColors[colorString]) {
            whiteColors = ProgressWhite.teamColors[colorString];
        } else {
            console.error(`❌ ProgressWhite: Unknown color string: ${colorString}`);
            return animationData;
        }
    } else {
        whiteColors = colorString; // Assume it's already a whiteColors object
    }
    
    if (animationData.layers) {
        let colorReplacements = 0;
        
        animationData.layers.forEach((layer, layerIndex) => {
            // Process the layer
            const processedLayer = ProgressWhite.replaceColorsInLayer(layer, whiteColors);
            
            // Count color replacements in this layer
            const countReplacements = (obj) => {
                let count = 0;
                if (obj.shapes) {
                    obj.shapes.forEach(shape => {
                        if (shape.it) {
                            shape.it.forEach(item => {
                                // Count fill color replacements
                                if (item.ty === 'fl' && item.c && item.c.k) {
                                    const color = item.c.k;
                                    if (ProgressWhite.isMainCharacterColor(color) || 
                                        ProgressWhite.isShadowColor(color) || 
                                        ProgressWhite.isLightColor(color) ||
                                        ProgressWhite.isLightBlueColor(color)) {
                                        count++;
                                    }
                                }
                                // Count stroke color replacements (non-black only)
                                if (item.ty === 'st' && item.c && item.c.k) {
                                    const color = item.c.k;
                                    if (!ProgressWhite.isBlackColor(color) && 
                                        (ProgressWhite.isMainCharacterColor(color) || 
                                         ProgressWhite.isShadowColor(color) || 
                                         ProgressWhite.isLightColor(color) ||
                                         ProgressWhite.isLightBlueColor(color))) {
                                        count++;
                                    }
                                }
                            });
                        }
                        if (shape.shapes) count += countReplacements(shape);
                    });
                }
                return count;
            };
            
            const layerReplacements = countReplacements(processedLayer);
            colorReplacements += layerReplacements;
            
        });
        
        if (colorReplacements === 0) {
            console.warn('⚠️ ProgressWhite: No colors were replaced. This might indicate an issue with the animation structure.');
        }
    } else {
        console.warn('⚠️ ProgressWhite: No layers found in animation data');
    }
    return animationData; // Return the modified data
};

// Generic function to apply white color to any character element
ProgressWhite.setCharacterToWhite = async function(characterElement) {
    if (!characterElement) {
        console.error('❌ ProgressWhite: Character element not found!');
        return false;
    }
    
    // Check if lottie-player is ready
    if (!characterElement.load) {
        setTimeout(() => ProgressWhite.setCharacterToWhite(characterElement), 200);
        return false;
    }
    
    // Clear any existing filters or overlays
    characterElement.style.filter = '';
    
    const existingOverlay = characterElement.parentNode.querySelector('.color-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Get the current animation source
    const currentSrc = characterElement.getAttribute('src');
    if (!currentSrc) {
        console.error(`❌ ProgressWhite: No animation source found for ${characterElement.id}!`);
        return false;
    }
    
    // Load and modify animation data
    const whiteColors = ProgressWhite.getWhiteTeamColors();
    const animationData = await ProgressWhite.loadAnimationData(currentSrc);
    
    if (!animationData) {
        console.error(`❌ ProgressWhite: Failed to load animation data for ${characterElement.id}!`);
        return false;
    }
    
    // Replace colors in all layers
    if (animationData.layers) {
        ProgressWhite.applyColorsToAnimation(animationData, whiteColors);
    }
    
    // Create a data URL from the modified JSON
    const dataUrl = 'data:application/json;base64,' + btoa(JSON.stringify(animationData));
    
    // Update the lottie player with the new white animation
    try {
        characterElement.load(dataUrl);
        return true;
    } catch (error) {
        console.error(`❌ ProgressWhite: Failed to load modified animation for ${characterElement.id}:`, error);
        return false;
    }
};

// Main function to apply white color to progress character
ProgressWhite.setProgressCharacterToWhite = async function() {
    // Find the progress character element
    const progressCharacter = document.getElementById('progressCharacter');
    
    if (!progressCharacter) {
        console.error('❌ ProgressWhite: Progress character element not found!');
        return false;
    }
    
    return await ProgressWhite.setCharacterToWhite(progressCharacter);
};

// Function to set a specific team character to white
ProgressWhite.setTeamCharacterToWhite = async function(teamId) {
    const teamCharacter = document.getElementById(`teamCharacter${teamId}`);
    
    if (!teamCharacter) {
        console.error(`❌ ProgressWhite: teamCharacter${teamId} not found!`);
        return false;
    }
    
    return await ProgressWhite.setCharacterToWhite(teamCharacter);
};

// Function to reset progress character to white (for external use)
ProgressWhite.resetProgressToWhite = async function() {
    const success = await ProgressWhite.setProgressCharacterToWhite();
    
    if (!success) {
        console.error('💥 ProgressWhite: Failed to reset progress character to white!');
    }
    
    return success;
};

// Apply run animation color to character
ProgressWhite.applyRunAnimationColor = function(characterElement) {
    if (!characterElement) {
        console.warn('❌ No character element provided for run animation color');
        return false;
    }
    
    try {
        // Apply white color immediately for run animation
        if (window.applyColorToLottiePlayer) {
            window.applyColorToLottiePlayer(characterElement, 'white');
            return true;
        } else {
            // Fallback to direct white color application
            return ProgressWhite.setProgressCharacterToWhite();
        }
    } catch (error) {
        console.error('❌ Error applying run animation color:', error);
        return false;
    }
};

// Team color mapping - All 8 available colors
ProgressWhite.teamColors = {
    'blue': {
        primary: [0.2, 0.4, 0.8, 1],          // Blue body
        secondary: [0.1, 0.2, 0.4, 1],        // Dark blue shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    },
    'cyan': {
        primary: [0.2, 0.8, 0.8, 1],          // Cyan body
        secondary: [0.1, 0.4, 0.4, 1],        // Dark cyan shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    },
    'lime': {
        primary: [0.4, 0.8, 0.2, 1],          // Lime body
        secondary: [0.2, 0.4, 0.1, 1],        // Dark lime shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    },
    'orange': {
        primary: [0.8, 0.4, 0.1, 1],          // Orange body
        secondary: [0.4, 0.2, 0.05, 1],       // Dark orange shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    },
    'pink': {
        primary: [0.8, 0.2, 0.6, 1],          // Pink body
        secondary: [0.4, 0.1, 0.3, 1],        // Dark pink shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    },
    'purple': {
        primary: [0.6, 0.2, 0.8, 1],          // Purple body
        secondary: [0.3, 0.1, 0.4, 1],        // Dark purple shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    },
    'red': {
        primary: [0.784, 0.125, 0.055, 1],     // Red body
        secondary: [0.545, 0.094, 0.157, 1],   // Dark red shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    },
    'yellow': {
        primary: [1.0, 1.0, 0.0, 1],          // Bright yellow body
        secondary: [0.6, 0.6, 0.0, 1],        // Dark yellow shadow
        light: [0.969, 0.996, 0.996, 1]       // Light reflection
    }
};

// Apply team color to character
ProgressWhite.applyTeamColor = function(characterElement, teamColor) {
    if (!characterElement) {
        console.warn('❌ No character element provided for team color');
        return false;
    }
    
    if (!ProgressWhite.teamColors[teamColor]) {
        console.warn(`❌ Unknown team color: ${teamColor}`);
        return false;
    }
    
    try {
        const colors = ProgressWhite.teamColors[teamColor];
        
        // Load current animation data
        const currentSrc = characterElement.src;
        if (!currentSrc) {
            console.warn('❌ No animation source found for character');
            return false;
        }
        
        ProgressWhite.loadAnimationData(currentSrc).then(animationData => {
            if (!animationData) {
                console.error('❌ Failed to load animation data for team color');
                return false;
            }
            
            // Apply team colors to animation with enhanced debugging
            ProgressWhite.applyColorsToAnimation(animationData, colors);
            
            // Update the character with new colors
            characterElement.load(JSON.stringify(animationData));
            
            return true;
        }).catch(error => {
            console.error('❌ Error applying team color:', error);
            return false;
        });
        
    } catch (error) {
        console.error('❌ Error applying team color:', error);
        return false;
    }
};

// Initialize all team characters with their team colors
ProgressWhite.initializeTeamColors = function() {
    const teamColorMap = {
        1: 'red',     // Team A
        2: 'blue',    // Team B
        3: 'lime',    // Team C
        4: 'orange',  // Team D
        5: 'pink',    // Team E
        6: 'yellow'   // Team F
    };
    
    // Apply team colors to all team characters
    for (let teamId = 1; teamId <= 6; teamId++) {
        const characterElement = document.getElementById(`teamCharacter${teamId}`);
        const teamColor = teamColorMap[teamId];
        
        if (characterElement && teamColor) {
            ProgressWhite.applyTeamColor(characterElement, teamColor);
        }
    }
    

};

// Apply team color to progress character
ProgressWhite.applyProgressTeamColor = function(teamColor) {
    const progressCharacter = document.getElementById('progressCharacter');
    if (progressCharacter && teamColor) {
        ProgressWhite.applyTeamColor(progressCharacter, teamColor);
    }
};

// Get all available team colors
ProgressWhite.getAllTeamColors = function() {
    return Object.keys(ProgressWhite.teamColors);
};

// Get available colors that are not currently assigned to teams
ProgressWhite.getAvailableColors = function() {
    const assignedColors = ['red', 'blue', 'lime', 'orange', 'pink', 'yellow']; // Current team assignments
    const allColors = ProgressWhite.getAllTeamColors();
    return allColors.filter(color => !assignedColors.includes(color)); // Returns ['cyan', 'purple']
};

// Smart initialization that works with existing among_us.html
ProgressWhite.initialize = function() {
    // Check if we're in among_us.html context
    const isAmongUsPage = document.querySelector('#progressCharacter') && 
                         document.querySelector('#teamCharacter1');
    
    if (isAmongUsPage) {
        // Override the existing initialization to use our enhanced white color
        const originalApplyColorToLottiePlayer = window.applyColorToLottiePlayer;
        
        window.applyColorToLottiePlayer = async function(player, color) {
            if (color === 'white' && player && player.id === 'progressCharacter') {
                return await ProgressWhite.setProgressCharacterToWhite();
            } else if (originalApplyColorToLottiePlayer) {
                return originalApplyColorToLottiePlayer(player, color);
            }
        };
        
        // Wait for the existing initialization to complete, then apply our white
        setTimeout(() => {
            ProgressWhite.setProgressCharacterToWhite();
            
            // Also initialize all team characters as white
            setTimeout(() => {
                ProgressWhite.initializeTeamColors();
            }, 500);
        }, 300);
        
    } else {
        ProgressWhite.waitForLottieAndSetWhite();
    }
};

// Wait for lottie-player to be available if needed
ProgressWhite.waitForLottieAndSetWhite = function() {
    const checkAndSet = () => {
        const progressCharacter = document.getElementById('progressCharacter');
        const teamCharacter1 = document.getElementById('teamCharacter1');
        
        if (progressCharacter && progressCharacter.load && teamCharacter1 && teamCharacter1.load) {
            ProgressWhite.setProgressCharacterToWhite();
            ProgressWhite.initializeTeamColors();
        } else {
            console.log('⏳ ProgressWhite: Waiting for lottie-players to be ready...');
            setTimeout(checkAndSet, 500);
        }
    };
    
    checkAndSet();
};

// Auto-run when DOM is ready with smart detection
ProgressWhite.autoInit = function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => ProgressWhite.initialize(), 100);
        });
    } else {
        setTimeout(() => ProgressWhite.initialize(), 100);
    }
};

// Create global aliases for backward compatibility
window.setProgressCharacterToWhite = ProgressWhite.setProgressCharacterToWhite;
window.setTeamCharacterToWhite = ProgressWhite.setTeamCharacterToWhite;
window.resetProgressToWhite = ProgressWhite.resetProgressToWhite;
window.waitForLottieAndSetWhite = ProgressWhite.waitForLottieAndSetWhite;
window.applyCharacterColor = ProgressWhite.applyCharacterColor;
window.teamAnimationSystem = ProgressWhite.teamAnimationSystem;

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setProgressCharacterToWhite: ProgressWhite.setProgressCharacterToWhite,
        setTeamCharacterToWhite: ProgressWhite.setTeamCharacterToWhite,
        resetProgressToWhite: ProgressWhite.resetProgressToWhite,
        initialize: ProgressWhite.initialize,
        waitForLottieAndSetWhite: ProgressWhite.waitForLottieAndSetWhite,
        initializeTeamColors: ProgressWhite.initializeTeamColors,
        applyTeamColor: ProgressWhite.applyTeamColor,
        applyProgressTeamColor: ProgressWhite.applyProgressTeamColor,
        applyRunAnimationColor: ProgressWhite.applyRunAnimationColor,
        applyCharacterColor: ProgressWhite.applyCharacterColor,
        teamAnimationSystem: ProgressWhite.teamAnimationSystem
    };
}

// Auto-initialize when script is loaded
if (typeof window !== 'undefined') {
    ProgressWhite.autoInit();
} 

// Global function to apply color to any character by ID
ProgressWhite.applyCharacterColor = async function(characterId, color) {
    const characterElement = document.getElementById(characterId);
    
    if (!characterElement) {
        console.error(`❌ ProgressWhite: Character element ${characterId} not found!`);
        return false;
    }
    
    // Check if lottie-player is ready
    if (!characterElement.load) {
        setTimeout(() => ProgressWhite.applyCharacterColor(characterId, color), 200);
        return false;
    }
    
    try {
        if (color === 'white') {
            return await ProgressWhite.setCharacterToWhite(characterElement);
        } else if (ProgressWhite.teamColors[color]) {
            return await ProgressWhite.applyTeamColor(characterElement, color);
        } else {
            console.warn(`❌ ProgressWhite: Unknown color ${color} for character ${characterId}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ ProgressWhite: Error applying ${color} to ${characterId}:`, error);
        return false;
    }
};

// Random animation system for team characters
ProgressWhite.teamAnimationSystem = {
    animations: [
        'among_us_eating_chocolate.json',
        'among_us_nods_with_headphones.json',
        'among_us_wipes_off_sweat.json'
    ],
    
    idleAnimation: 'among_us_idle.json',
    
    // Animation intervals for each team (30-60 seconds)
    intervals: {},
    
    // Current animation states
    animationStates: {},
    
    // Team color mapping for animation system
    teamColorMap: {
        1: 'red',
        2: 'blue',
        3: 'lime',
        4: 'orange',
        5: 'pink',
        6: 'yellow'
    },
    
    // Start random animation system for all team characters
    start: function() {
        // Initialize animation states
        for (let teamId = 1; teamId <= 6; teamId++) {
            this.animationStates[teamId] = {
                isPlaying: false,
                currentAnimation: this.idleAnimation,
            };
        }
        
        // Start animation cycles for each team
        for (let teamId = 1; teamId <= 6; teamId++) {
            this.startTeamAnimationCycle(teamId);
        }
        
    },
    
    // Get team color for a specific team ID
    getTeamColor: function(teamId) {
        const teamColorMap = {
            1: 'red',     // Team A
            2: 'blue',    // Team B
            3: 'lime',    // Team C
            4: 'orange',  // Team D
            5: 'pink',    // Team E
            6: 'yellow'   // Team F
        };
        return teamColorMap[teamId] || 'white';
    },
    
    // Start animation cycle for a specific team
    startTeamAnimationCycle: function(teamId) {
        const characterId = `teamCharacter${teamId}`;
        const characterElement = document.getElementById(characterId);
        
        if (!characterElement) {
            console.warn(`⚠️ ProgressWhite: Team character ${characterId} not found`);
            return;
        }
        
        // Clear existing interval if any
        if (this.intervals[teamId]) {
            clearInterval(this.intervals[teamId]);
        }
        
        // Set random interval between 30-60 seconds
        const interval = Math.random() * 10000 + 1000; // 10-30 seconds
        
        this.intervals[teamId] = setInterval(() => {
            this.playRandomAnimation(teamId);
        }, interval);
        
    },
    
    // Play a random animation for a specific team
    playRandomAnimation: function(teamId) {
        const characterId = `teamCharacter${teamId}`;
        const randomAnimation = this.animations[Math.floor(Math.random() * this.animations.length)];
        const animationSrc = `assets/animations/${randomAnimation}`;
        const teamColor = this.teamColorMap[teamId];
        const characterElement = document.getElementById(characterId);
        if (!characterElement) return;
        characterElement.src = animationSrc;
        characterElement.load(animationSrc);
        characterElement.addEventListener('load', async () => {
            await ProgressWhite.applyCharacterColor(characterId, teamColor);
            // Return to idle after 3 seconds
            setTimeout(() => {
                characterElement.src = `assets/animations/${this.idleAnimation}`;
                characterElement.load(`assets/animations/${this.idleAnimation}`);
                characterElement.addEventListener('load', async () => {
                    await ProgressWhite.applyCharacterColor(characterId, teamColor);
                }, { once: true });
            }, 3000);
        }, { once: true });
    },
    
    // Stop animation system
    stop: function() {
        console.log('🛑 ProgressWhite: Stopping team character animation system...');
        
        // Clear all intervals
        Object.keys(this.intervals).forEach(teamId => {
            if (this.intervals[teamId]) {
                clearInterval(this.intervals[teamId]);
            }
        });
        
        this.intervals = {};
        this.animationStates = {};
        
        console.log('✅ ProgressWhite: Team character animation system stopped');
    },
    
    // Pause animation system
    pause: function() {
        console.log('⏸️ ProgressWhite: Pausing team character animation system...');
        
        Object.keys(this.intervals).forEach(teamId => {
            if (this.intervals[teamId]) {
                clearInterval(this.intervals[teamId]);
            }
        });
        
        console.log('✅ ProgressWhite: Team character animation system paused');
    },
    
    // Resume animation system
    resume: function() {
        console.log('▶️ ProgressWhite: Resuming team character animation system...');
        
        for (let teamId = 1; teamId <= 6; teamId++) {
            this.startTeamAnimationCycle(teamId);
        }
        
        console.log('✅ ProgressWhite: Team character animation system resumed');
    }
}; 

// Main character animation system (using same logic as team characters)
ProgressWhite.mainCharacterAnimation = {
    // Play run animation for main character (simple version like team characters)
    playRunAnimation: async function(direction = 'forward', targetPosition) {
        const characterId = 'progressCharacter';
        const characterElement = document.getElementById(characterId);
        
        if (!characterElement) {
            console.error('❌ ProgressWhite: Main character not found');
            return false;
        }
        
        // Set direction (flip character) - FIX: Flip for forward, no flip for backward
        const mainCharacter = document.querySelector('.main-character');
        if (mainCharacter) {
            const scaleX = direction === 'forward' ? -1 : 1; // FIX: Flip for forward
            mainCharacter.style.transform = `scaleX(${scaleX}) translateY(var(--bounce-y, 0px))`;
        }
        
        // FIX: Also apply transform directly to the lottie-player element
        if (characterElement) {
            const scaleX = direction === 'forward' ? -1 : 1; // FIX: Flip for forward
            characterElement.style.transform = `scaleX(${scaleX})`;
        }
        
        // Get current team color
        const currentTeam = window.gameState?.get()?.currentTeam || 0;
        let teamColor = 'white';
        if (currentTeam > 0) {
            const team = window.gameState?.get()?.teams?.[currentTeam];
            if (team && team.color) {
                teamColor = team.color;
            }
        }
        
        // NEW APPROACH: Modify JSON data before loading
        const runSrc = 'assets/animations/among_us_run.json';
        
        try {
            // Fetch the JSON file
            const response = await fetch(runSrc);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${runSrc}: ${response.status}`);
            }
            const animationData = await response.json();
            
            // Apply color to the animation data
            const coloredAnimationData = await ProgressWhite.applyColorsToAnimation(animationData, teamColor);
            
            // Create a blob URL for the modified animation
            const blob = new Blob([JSON.stringify(coloredAnimationData)], { type: 'application/json' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Load the modified animation
            characterElement.src = blobUrl;
            characterElement.load(blobUrl);
            characterElement.classList.add('running');
            
            // Clean up the blob URL after loading
            characterElement.addEventListener('load', () => {
                URL.revokeObjectURL(blobUrl);
                
                // Move character to target position
                setTimeout(() => {
                    const characterContainer = document.querySelector('.character-container-main');
                    if (characterContainer) {
                        characterContainer.style.left = `${targetPosition}%`;
                    }
                    
                    // Switch to idle animation after movement
                    setTimeout(() => {
                        this.switchToIdle(characterId, teamColor, mainCharacter);
                    }, 1200); // Wait for movement to complete
                    
                }, 100); // Small delay to ensure animation is playing
                
            }, { once: true });
            
        } catch (error) {
            console.error('❌ ProgressWhite: Error modifying run animation:', error);
            
            // Fallback to original approach
            characterElement.src = runSrc;
            characterElement.load(runSrc);
            characterElement.classList.add('running');
            
            // Apply color after loading as fallback
            characterElement.addEventListener('load', async () => {
                await ProgressWhite.applyCharacterColor(characterId, teamColor);
                
                // Move character to target position
                setTimeout(() => {
                    const characterContainer = document.querySelector('.character-container-main');
                    if (characterContainer) {
                        characterContainer.style.left = `${targetPosition}%`;
                    }
                    
                    // Switch to idle animation after movement
                    setTimeout(() => {
                        this.switchToIdle(characterId, teamColor, mainCharacter);
                    }, 1200); // Wait for movement to complete
                    
                }, 100); // Small delay to ensure animation is playing
                
            }, { once: true });
        }
        
        return true;
    },
    
    // Switch main character back to idle animation (simple version like team characters)
    switchToIdle: async function(characterId, teamColor, mainCharacter) {
        const characterElement = document.getElementById(characterId);
        
        if (!characterElement) {
            console.error('❌ ProgressWhite: Main character not found for idle switch');
            return false;
        }
        
        // NEW APPROACH: Modify JSON data before loading
        const idleSrc = 'assets/animations/among_us_idle.json';
        
        try {
            // Fetch the JSON file
            const response = await fetch(idleSrc);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${idleSrc}: ${response.status}`);
            }
            const animationData = await response.json();
            
            // Apply color to the animation data
            const coloredAnimationData = await ProgressWhite.applyColorsToAnimation(animationData, teamColor);
            
            // Create a blob URL for the modified animation
            const blob = new Blob([JSON.stringify(coloredAnimationData)], { type: 'application/json' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Load the modified animation
            characterElement.src = blobUrl;
            characterElement.load(blobUrl);
            characterElement.classList.remove('running');
            
            // Clean up the blob URL after loading
            characterElement.addEventListener('load', () => {
                URL.revokeObjectURL(blobUrl);
                
                // Reset animation state - FIX: Reset transform on both elements
                if (mainCharacter) {
                    mainCharacter.style.transform = 'scaleX(1) translateY(0)';
                }
                if (characterElement) {
                    characterElement.style.transform = 'scaleX(1)';
                }
                
            }, { once: true });
            
        } catch (error) {
            console.error('❌ ProgressWhite: Error modifying idle animation:', error);
            
            // Fallback to original approach
            characterElement.src = idleSrc;
            characterElement.load(idleSrc);
            characterElement.classList.remove('running');
            
            // Apply color after loading as fallback
            characterElement.addEventListener('load', async () => {
                await ProgressWhite.applyCharacterColor(characterId, teamColor);
                
                // Reset animation state - FIX: Reset transform on both elements
                if (mainCharacter) {
                    mainCharacter.style.transform = 'scaleX(1) translateY(0)';
                }
                if (characterElement) {
                    characterElement.style.transform = 'scaleX(1)';
                }
                
            }, { once: true });
        }
        
        return true;
    }
}; 