/**
 * Script to Set Progress Character to White
 * This script ensures the Among Us progress character is properly colored white
 * Integrates with existing among_us.html or works standalone
 */

// Namespace to avoid conflicts with existing code
window.ProgressWhite = window.ProgressWhite || {};

// Color constants with visual indicators
/**
 * @fileoverview Color definitions for Among Us character customization
 * All colors are stored as HEX codes for easy maintenance and design tool integration
 */

// 🔴 RED TEAM COLORS
const RED_PRIMARY = '#D71E22';    // 🔴 Main red body
const RED_SHADOW = '#7A0838';     // 🟤 Dark red shadow  
const RED_LIGHT = '#FFE6E6';      // 💗 Light red reflection

// 🔵 BLUE TEAM COLORS
const BLUE_PRIMARY = '#1D3CE9';   // 🔵 Main blue body
const BLUE_SHADOW = '#09158E';    // 🟦 Dark blue shadow
const BLUE_LIGHT = '#CCE6FF';     // 💙 Light blue reflection

// 🟢 LIME TEAM COLORS  
const LIME_PRIMARY = '#5BFE4B';   // 🟢 Main lime body
const LIME_SHADOW = '#15A742';    // 🟩 Dark lime shadow
const LIME_LIGHT = '#E6FFE6';     // 💚 Light lime reflection

// 🟠 ORANGE TEAM COLORS
const ORANGE_PRIMARY = '#FF8D1C'; // 🟠 Main orange body
const ORANGE_SHADOW = '#B43E15';  // 🟫 Dark orange shadow
const ORANGE_LIGHT = '#FFE6CC';   // 🧡 Light orange reflection

// 💖 PINK TEAM COLORS
const PINK_PRIMARY = '#FF63D4';   // 💖 Main pink body
const PINK_SHADOW = '#AC2BAE';    // 🟪 Dark pink shadow
const PINK_LIGHT = '#FFE6FF';     // 💕 Light pink reflection

// 🟣 PURPLE TEAM COLORS
const PURPLE_PRIMARY = '#783DD2'; // 🟣 Main purple body
const PURPLE_SHADOW = '#3B177C';  // 🟪 Dark purple shadow
const PURPLE_LIGHT = '#E6CCFF';   // 💜 Light purple reflection

// 🟡 YELLOW TEAM COLORS
const YELLOW_PRIMARY = '#FFD700'; // 🟡 Main yellow body
const YELLOW_SHADOW = '#B8860B';  // 🟫 Dark yellow shadow
const YELLOW_LIGHT = '#FFFACD';   // 💛 Light yellow reflection

// ⚪ WHITE TEAM COLORS
const WHITE_PRIMARY = '#E9F7FF';  // ⚪ Main white body
const WHITE_SHADOW = '#8495C0';   // 🔵 Blue-gray shadow
const WHITE_LIGHT = '#FFFFFF';    // ⚪ Pure white reflection

// 🔷 CYAN TEAM COLORS
const CYAN_PRIMARY = '#44FFF7';   // 🔷 Main cyan body
const CYAN_SHADOW = '#024A9B';    // 🔵 Dark cyan shadow (fixed hex code)
const CYAN_LIGHT = '#CCFFFF';     // 💎 Light cyan reflection

// Utility function to convert HEX to RGB
ProgressWhite.hexToRgb = function(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    return [r, g, b, 1]; // Return as RGBA with alpha = 1
};

// Get team color for a specific team ID from game state
ProgressWhite.getTeamColor = function(teamId) {
    if (window.gameState) {
        const state = window.gameState.get();
        const team = state.teams?.[teamId];
        if (team && team.color) {
            return team.color;
        }
    }
    return 'white'; // Default fallback
};

// Animation cache for loaded JSON files
ProgressWhite.animationCache = {};

// Color mapping for white character
ProgressWhite.getWhiteTeamColors = function() {
    return {
        primary: ProgressWhite.hexToRgb(WHITE_PRIMARY),    // Main white
        secondary: ProgressWhite.hexToRgb(WHITE_SHADOW),   // Shadow white
        light: ProgressWhite.hexToRgb(WHITE_LIGHT)         // Pure white highlights
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

// Comprehensive visor protection - check if color is ANY visor-related color that should be preserved
ProgressWhite.isVisorColor = function(color) {
    // Light blue visor colors
    const originalVisor1 = [0.576, 0.788, 0.855, 1]; // Light blue visor (integer alpha)
    const originalVisor2 = [0.576, 0.788, 0.855, 1.0]; // Light blue visor (decimal alpha)
    
    // Dark blue visor shadow colors
    const originalVisorShadow1 = [0.278, 0.38, 0.424, 1]; // Dark blue visor shadow (integer alpha)
    const originalVisorShadow2 = [0.278, 0.38, 0.424, 1.0]; // Dark blue visor shadow (decimal alpha)
    
    // Check exact matches first
    if (ProgressWhite.calculateColorDistance(color, originalVisor1) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalVisor2) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalVisorShadow1) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalVisorShadow2) < 0.1) {
        return true;
    }
    
    // Additional protection for visor-like colors (blue-ish colors in visor range)
    const [r, g, b, a] = color;
    
    // Protect colors that are clearly visor-like (blue dominant, specific ranges)
    // Light visor range: high blue, moderate green, low red
    if (b > 0.8 && g > 0.7 && r < 0.7 && b > g && b > r) {
        return true;
    }
    
    // Dark visor shadow range: blue-gray colors
    if (b > 0.35 && b < 0.5 && g > 0.3 && g < 0.45 && r > 0.2 && r < 0.35 && 
        Math.abs(r - g) < 0.1 && b > r && b > g) {
        return true;
    }
    
    return false;
};

// Check if color is the main character body color (enhanced to detect various character colors)
ProgressWhite.isMainCharacterColor = function(color) {
    // FIRST: Check if this is a visor color that should be preserved
    if (ProgressWhite.isVisorColor(color)) {
        return false;
    }
    
    // Original red colors
    const originalMain1 = [0.784, 0.125, 0.055, 1]; // Main red body (integer alpha)
    const originalMain2 = [0.784, 0.125, 0.055, 1.0]; // Main red body (decimal alpha)
    
    // Check for original red
    if (ProgressWhite.calculateColorDistance(color, originalMain1) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalMain2) < 0.1) {
        return true;
    }
    
    // Enhanced detection for other character colors (but more conservative)
    const [r, g, b, a] = color;
    
    // Skip if it's too dark (black) or too light (white)
    if ((r + g + b) < 0.4 || (r + g + b) > 2.5) {
        return false;
    }
    
    // Check if it has character-like saturation (not too gray)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max > 0 ? (max - min) / max : 0;
    
    // Character body colors should have decent saturation and brightness
    return saturation > 0.3 && max > 0.4;
};

// Check if color is a shadow color (excluding visor shadow)
ProgressWhite.isShadowColor = function(color) {
    // FIRST: Check if this is a visor color that should be preserved
    if (ProgressWhite.isVisorColor(color)) {
        return false;
    }
    
    // Original red shadow colors
    const originalShadow1 = [0.545, 0.094, 0.157, 1]; // Dark red shadow (integer alpha)
    const originalShadow2 = [0.545, 0.094, 0.157, 1.0]; // Dark red shadow (decimal alpha)
    
    // Check for original red shadow
    if (ProgressWhite.calculateColorDistance(color, originalShadow1) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalShadow2) < 0.1) {
        return true;
    }
    
    // Enhanced detection for shadow colors (more conservative)
    const [r, g, b, a] = color;
    
    // Shadow colors are generally darker (lower brightness)
    const brightness = (r + g + b) / 3;
    
    // Skip very light colors and be more conservative about blue-ish colors
    if (brightness > 0.5) {
        return false;
    }
    
    // Shadow colors should have some color but be relatively dark
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max > 0 ? (max - min) / max : 0;
    
    // Look for colors that are dark but still have reasonable saturation (not pure black/gray)
    return brightness < 0.5 && brightness > 0.15 && saturation > 0.2;
};

// Check if color is a light reflection color (excluding visor)
ProgressWhite.isLightColor = function(color) {
    // FIRST: Check if this is a visor color that should be preserved
    if (ProgressWhite.isVisorColor(color)) {
        return false;
    }
    
    // Original light colors
    const originalLight1 = [0.969, 0.996, 0.996, 1]; // Very light reflection (integer alpha)
    const originalLight2 = [0.969, 0.996, 0.996, 1.0]; // Very light reflection (decimal alpha)
    
    // Check for original light colors
    if (ProgressWhite.calculateColorDistance(color, originalLight1) < 0.1 ||
        ProgressWhite.calculateColorDistance(color, originalLight2) < 0.1) {
        return true;
    }
    
    // Enhanced detection for light/highlight colors (more conservative)
    const [r, g, b, a] = color;
    
    // Light colors are generally bright
    const brightness = (r + g + b) / 3;
    
    // Look for very bright colors that could be highlights/reflections
    // These are typically desaturated (closer to white) versions of main colors
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max > 0 ? (max - min) / max : 0;
    
    // Light/highlight colors are bright and often have low saturation
    // Be more conservative to avoid affecting visor
    return brightness > 0.9 && saturation < 0.2;
};

// Check if color is a light blue color (newly added)
ProgressWhite.isLightBlueColor = function(color) {
    // FIRST: Check if this is a visor color that should be preserved
    if (ProgressWhite.isVisorColor(color)) {
        return false;
    }
    
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

// JSON String replacement method - more reliable for catching all color instances
ProgressWhite.replaceColorsViaStringEdit = function(animationData, whiteColors) {
    
    // Convert animation data to JSON string
    let jsonString = JSON.stringify(animationData);
    let replacementCount = 0;
    
    // Define known character colors that need to be replaced
    const characterColorMap = {
        // Original red character colors (main body)
        '[0.784,0.125,0.055,1]': whiteColors.primary,
        '[0.784,0.125,0.055,1.0]': whiteColors.primary,
        
        // Original red shadow colors
        '[0.545,0.094,0.157,1]': whiteColors.secondary,
        '[0.545,0.094,0.157,1.0]': whiteColors.secondary,
        
        // Original light/reflection colors
        '[0.969,0.996,0.996,1]': whiteColors.light,
        '[0.969,0.996,0.996,1.0]': whiteColors.light,
        
        // Light blue color found in some animations
        '[0.733,0.945,1.0,1]': whiteColors.light,
        '[0.733,0.945,1.0,1.0]': whiteColors.light,
        
        // Additional common character color variations
        '[0.78,0.12,0.05,1]': whiteColors.primary,
        '[0.78,0.12,0.05,1.0]': whiteColors.primary,
        '[0.54,0.09,0.15,1]': whiteColors.secondary,
        '[0.54,0.09,0.15,1.0]': whiteColors.secondary
    };
    
    // Preserve visor colors - these should NOT be replaced
    const visorColors = [
        '[0.576,0.788,0.855,1]',    // Light blue visor
        '[0.576,0.788,0.855,1.0]',  // Light blue visor
        '[0.278,0.38,0.424,1]',     // Dark blue visor shadow
        '[0.278,0.38,0.424,1.0]'    // Dark blue visor shadow
    ];
    
    // Replace character colors while preserving visor colors
    for (const [originalColor, newColor] of Object.entries(characterColorMap)) {
        // Check if this is a visor color that should be preserved
        if (visorColors.includes(originalColor)) {
            continue;
        }
        
        // Format the new color as JSON array string
        const newColorString = JSON.stringify(newColor);
        
        // Count occurrences before replacement
        const beforeCount = (jsonString.match(new RegExp(originalColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        
        if (beforeCount > 0) {
            // Replace all occurrences
            jsonString = jsonString.replace(new RegExp(originalColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newColorString);
            replacementCount += beforeCount;
        }
    }

    
    // Parse the modified JSON back to object
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('❌ Error parsing modified JSON:', error);
        return animationData; // Return original data if parsing fails
    }
};

// Legacy recursive method (kept as fallback)
ProgressWhite.replaceColorsInLayer = function(layer, whiteColors) {
    if (layer.shapes) {
        layer.shapes.forEach(shape => {
            if (shape.it) {
                shape.it.forEach(item => {
                    // Handle fill colors (ty: 'fl')
                    if (item.ty === 'fl' && item.c && item.c.k) {
                        const currentColor = item.c.k;
                        
                        // Check if this is a visor color that should be preserved
                        if (ProgressWhite.isVisorColor(currentColor)) {
                            return; // Skip this color - preserve it
                        }
                        
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
                    
                    // Handle stroke colors (ty: 'st') - but only if they're not black outlines or visor colors
                    if (item.ty === 'st' && item.c && item.c.k) {
                        const currentColor = item.c.k;
                        
                        // Check if this is a visor color that should be preserved
                        if (ProgressWhite.isVisorColor(currentColor)) {
                            return; // Skip this color - preserve it
                        }
                        
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
    
    // Use the more reliable JSON string replacement method
    const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, whiteColors);
    
    return modifiedAnimationData; // Return the modified data
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

// Main Character Animation System for question navigation
ProgressWhite.mainCharacterAnimation = {
    // Play run animation for main character movement with correct direction handling
    async playRunAnimation(direction, targetPosition) {
        return new Promise(async (resolve, reject) => {
            try {
                
                const progressCharacter = document.getElementById('progressCharacter');
                if (!progressCharacter) {
                    reject(new Error('Progress character element not found'));
                    return;
                }
                
                // Get current team state to maintain color
                let currentTeam = 0;
                let teamColor = 'white';
                if (window.gameState) {
                    const state = window.gameState.get();
                    currentTeam = state.currentTeam || 0;
                    if (currentTeam > 0 && state.teams && state.teams[currentTeam]) {
                        teamColor = state.teams[currentTeam].color || 'white';
                    }
                }
                
                // Animation timing configuration
                const ANIMATION_DURATION = 1200; // 1.2 seconds
                
                // 1. Switch to run animation with JSON string modification
                const runAnimationSrc = 'assets/animations/among_us_run.json';
                
                // Load and modify JSON string before applying
                try {
                    const response = await fetch(runAnimationSrc);
                    const animationData = await response.json();
                    
                    // Apply color via JSON string modification
                    const colorObject = teamColor === 'white' 
                        ? ProgressWhite.getWhiteTeamColors() 
                        : ProgressWhite.teamColors[teamColor] || ProgressWhite.getWhiteTeamColors();
                    const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, colorObject);
                    
                    // Convert to blob URL and load
                    const blob = new Blob([JSON.stringify(modifiedAnimationData)], { type: 'application/json' });
                    const blobUrl = URL.createObjectURL(blob);
                    
                    progressCharacter.src = blobUrl;
                    await new Promise((resolveLoad) => {
                        progressCharacter.addEventListener('ready', resolveLoad, { once: true });
                        progressCharacter.load(blobUrl);
                    });
                    
                    // Clean up blob URL
                    URL.revokeObjectURL(blobUrl);
                } catch (error) {
                    console.warn('⚠️ Fallback to standard loading:', error);
                    progressCharacter.src = runAnimationSrc;
                    await new Promise((resolveLoad) => {
                        progressCharacter.addEventListener('ready', resolveLoad, { once: true });
                        progressCharacter.load(runAnimationSrc);
                    });
                    await ProgressWhite.applyCharacterColor('progressCharacter', teamColor);
                }
                
                // Set direction: backward = default (scaleX = 1), forward = flip (scaleX = -1)
                const scaleX = direction === 'forward' ? -1 : 1;
                progressCharacter.style.transform = `scaleX(${scaleX})`;
                
                // 2. Animate position change
                const characterContainer = progressCharacter.closest('.character-container-main');
                if (characterContainer) {
                    characterContainer.style.transition = `left ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
                    characterContainer.style.left = `${targetPosition}%`;
                }
                
                // 3. After animation duration, switch back to idle
                setTimeout(async () => {
                    try {
                        // Reset transform
                        progressCharacter.style.transform = '';
                        
                        // Switch back to idle animation with JSON string modification
                        const idleAnimationSrc = 'assets/animations/among_us_idle.json';
                        
                        try {
                            const response = await fetch(idleAnimationSrc);
                            const animationData = await response.json();
                            
                            // Apply color via JSON string modification
                            const colorObject = teamColor === 'white' 
                                ? ProgressWhite.getWhiteTeamColors() 
                                : ProgressWhite.teamColors[teamColor] || ProgressWhite.getWhiteTeamColors();
                            const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, colorObject);
                            
                            // Convert to blob URL and load
                            const blob = new Blob([JSON.stringify(modifiedAnimationData)], { type: 'application/json' });
                            const blobUrl = URL.createObjectURL(blob);
                            
                            progressCharacter.src = blobUrl;
                            await new Promise((resolveIdle) => {
                                progressCharacter.addEventListener('ready', resolveIdle, { once: true });
                                progressCharacter.load(blobUrl);
                            });
                            
                            // Clean up blob URL
                            URL.revokeObjectURL(blobUrl);
                        } catch (error) {
                            console.warn('⚠️ Fallback to standard loading:', error);
                            progressCharacter.src = idleAnimationSrc;
                            await new Promise((resolveIdle) => {
                                progressCharacter.addEventListener('ready', resolveIdle, { once: true });
                                progressCharacter.load(idleAnimationSrc);
                            });
                            await ProgressWhite.applyCharacterColor('progressCharacter', teamColor);
                        }
                        
                        // Clear transition
                        if (characterContainer) {
                            characterContainer.style.transition = '';
                        }
                        
                        resolve();
                    } catch (error) {
                        console.error('❌ Error in animation cleanup:', error);
                        reject(error);
                    }
                }, ANIMATION_DURATION);
                
            } catch (error) {
                console.error('❌ Error in playRunAnimation:', error);
                reject(error);
            }
        });
    }
};

// Team Character Continuous Random Animation System (5-20 seconds)
ProgressWhite.teamAnimationSystem = {
    animationTimers: new Map(),
    isActive: false,
    
    // Start continuous random animations for all team characters
    startContinuousAnimations() {
        if (this.isActive) {
            return; // Already running
        }
        
        this.isActive = true;
        
        // Start animation cycle for each team
        for (let teamId = 1; teamId <= 6; teamId++) {
            this.scheduleNextAnimation(teamId);
        }
    },
    
    // Stop all continuous animations
    stopContinuousAnimations() {
        if (!this.isActive) {
            return;
        }
        
        this.isActive = false;
        
        // Clear all timers
        for (const [teamId, timer] of this.animationTimers) {
            clearTimeout(timer);
        }
        this.animationTimers.clear();
        
        // Return all characters to idle
        for (let teamId = 1; teamId <= 6; teamId++) {
            this.returnToIdle(teamId);
        }
    },
    
    // Schedule next random animation for a team (5-20 seconds)
    scheduleNextAnimation(teamId) {
        if (!this.isActive) {
            return;
        }
        
        // Random interval between 5-20 seconds
        const minInterval = 5000;  // 5 seconds
        const maxInterval = 20000; // 20 seconds
        const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;
        
        const timer = setTimeout(() => {
            this.playRandomAnimation(teamId);
        }, randomInterval);
        
        this.animationTimers.set(teamId, timer);
    },
    
    // Play random animation for a specific team
    async playRandomAnimation(teamId) {
        if (!this.isActive) {
            return;
        }
        
        const teamCharacter = document.getElementById(`teamCharacter${teamId}`);
        if (!teamCharacter) {
            // Schedule next animation even if character not found
            this.scheduleNextAnimation(teamId);
            return;
        }
        
        // Available random animations
        const animations = [
            'assets/animations/among_us_eating_chocolate.json',
            'assets/animations/among_us_nods_with_headphones.json',
            'assets/animations/among_us_fears.json',
            'assets/animations/among_us_wipes_off_sweat.json',
            'assets/animations/among_us_nods.json'
        ];
        
        // Get team color
        let teamColor = 'white';
        if (window.gameState) {
            const state = window.gameState.get();
            if (state.teams && state.teams[teamId]) {
                teamColor = state.teams[teamId].color || 'white';
            }
        }
        
        try {
            // Pick random animation
            const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
            
                         // Load animation with JSON string modification
             const response = await fetch(randomAnimation);
             const animationData = await response.json();
             
             // Apply color via JSON string modification
             const colorObject = teamColor === 'white' 
                 ? ProgressWhite.getWhiteTeamColors() 
                 : ProgressWhite.teamColors[teamColor] || ProgressWhite.getWhiteTeamColors();
             const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, colorObject);
            
            // Convert to blob URL and load
            const blob = new Blob([JSON.stringify(modifiedAnimationData)], { type: 'application/json' });
            const blobUrl = URL.createObjectURL(blob);
            
            teamCharacter.src = blobUrl;
            await new Promise((resolve) => {
                teamCharacter.addEventListener('ready', resolve, { once: true });
                teamCharacter.load(blobUrl);
            });
            
            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);
            
            // Return to idle after 3 seconds, then schedule next animation
            setTimeout(() => {
                this.returnToIdle(teamId);
                this.scheduleNextAnimation(teamId);
            }, 3000);
            
        } catch (error) {
            console.error(`❌ Error playing random animation for team ${teamId}:`, error);
            // Schedule next animation even on error
            this.scheduleNextAnimation(teamId);
        }
    },
    
    // Return team character to idle animation
    async returnToIdle(teamId) {
        const teamCharacter = document.getElementById(`teamCharacter${teamId}`);
        if (!teamCharacter) {
            return;
        }
        
        // Get team color
        let teamColor = 'white';
        if (window.gameState) {
            const state = window.gameState.get();
            if (state.teams && state.teams[teamId]) {
                teamColor = state.teams[teamId].color || 'white';
            }
        }
        
        try {
            const idleAnimationSrc = 'assets/animations/among_us_idle.json';
            
            // Load idle animation with JSON string modification
            const response = await fetch(idleAnimationSrc);
            const animationData = await response.json();
            
            // Apply color via JSON string modification
            const colorObject = teamColor === 'white' 
                ? ProgressWhite.getWhiteTeamColors() 
                : ProgressWhite.teamColors[teamColor] || ProgressWhite.getWhiteTeamColors();
            const modifiedAnimationData = ProgressWhite.replaceColorsViaStringEdit(animationData, colorObject);
            
            // Convert to blob URL and load
            const blob = new Blob([JSON.stringify(modifiedAnimationData)], { type: 'application/json' });
            const blobUrl = URL.createObjectURL(blob);
            
            teamCharacter.src = blobUrl;
            teamCharacter.load(blobUrl);
            
            // Clean up blob URL after a short delay
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 1000);
            
        } catch (error) {
            console.warn(`⚠️ Fallback idle loading for team ${teamId}:`, error);
            teamCharacter.src = 'assets/animations/among_us_idle.json';
            teamCharacter.load('assets/animations/among_us_idle.json');
            await ProgressWhite.applyCharacterColor(`teamCharacter${teamId}`, teamColor);
        }
    }
};

// Team color mapping - All 8 available colors with HEX codes
ProgressWhite.teamColors = {
    'blue': {
        primary: ProgressWhite.hexToRgb(BLUE_PRIMARY),    // Blue body
        secondary: ProgressWhite.hexToRgb(BLUE_SHADOW),   // Dark blue shadow
        light: ProgressWhite.hexToRgb(BLUE_LIGHT)         // Light blue reflection
    },
    'cyan': {
        primary: ProgressWhite.hexToRgb(CYAN_PRIMARY),    // Cyan body
        secondary: ProgressWhite.hexToRgb(CYAN_SHADOW),   // Dark cyan shadow
        light: ProgressWhite.hexToRgb(CYAN_LIGHT)         // Light cyan reflection
    },
    'lime': {
        primary: ProgressWhite.hexToRgb(LIME_PRIMARY),    // Lime body
        secondary: ProgressWhite.hexToRgb(LIME_SHADOW),   // Dark lime shadow
        light: ProgressWhite.hexToRgb(LIME_LIGHT)         // Light lime reflection
    },
    'orange': {
        primary: ProgressWhite.hexToRgb(ORANGE_PRIMARY),  // Orange body
        secondary: ProgressWhite.hexToRgb(ORANGE_SHADOW), // Dark orange shadow
        light: ProgressWhite.hexToRgb(ORANGE_LIGHT)       // Light orange reflection
    },
    'pink': {
        primary: ProgressWhite.hexToRgb(PINK_PRIMARY),    // Pink body
        secondary: ProgressWhite.hexToRgb(PINK_SHADOW),   // Dark pink shadow
        light: ProgressWhite.hexToRgb(PINK_LIGHT)         // Light pink reflection
    },
    'purple': {
        primary: ProgressWhite.hexToRgb(PURPLE_PRIMARY),  // Purple body
        secondary: ProgressWhite.hexToRgb(PURPLE_SHADOW), // Dark purple shadow
        light: ProgressWhite.hexToRgb(PURPLE_LIGHT)       // Light purple reflection
    },
    'red': {
        primary: ProgressWhite.hexToRgb(RED_PRIMARY),     // Red body
        secondary: ProgressWhite.hexToRgb(RED_SHADOW),    // Dark red shadow
        light: ProgressWhite.hexToRgb(RED_LIGHT)          // Light red reflection
    },
    'yellow': {
        primary: ProgressWhite.hexToRgb(YELLOW_PRIMARY),  // Bright yellow body
        secondary: ProgressWhite.hexToRgb(YELLOW_SHADOW), // Dark yellow shadow
        light: ProgressWhite.hexToRgb(YELLOW_LIGHT)       // Light yellow reflection
    }
};

// Apply specific team color to character with enhanced error handling
ProgressWhite.applyTeamColor = async function(characterElement, teamColor) {
    // Always use the original animation source, not the current src which might be a blob URL
    const originalSrc = 'assets/animations/among_us_idle.json';
    
    if (!characterElement) {
        console.warn('❌ Character element not found');
        return false;
    }
    
    // Get team color configuration
    const colors = ProgressWhite.teamColors[teamColor];
    if (!colors) {
        console.warn(`❌ Team color ${teamColor} not found`);
        return false;
    }
    
    try {
        const animationData = await ProgressWhite.loadAnimationData(originalSrc);
        if (!animationData) {
            console.error('❌ Failed to load animation data for team color');
            return false;
        }
        
        // Apply team colors to animation using the new string replacement method
        const modifiedData = await ProgressWhite.applyColorsToAnimation(animationData, colors);
        
        // Create a data URL from the modified JSON
        const dataUrl = 'data:application/json;base64,' + btoa(JSON.stringify(modifiedData));
        
        // Update the character with new colors
        characterElement.load(dataUrl);
        
        return true;
    } catch (error) {
        console.error('❌ Error in applyTeamColor:', error);
        return false;
    }
};

// Initialize all team characters with their team colors
ProgressWhite.initializeTeamColors = function() {
    // Apply team colors to all team characters
    for (let teamId = 1; teamId <= 6; teamId++) {
        const characterElement = document.getElementById(`teamCharacter${teamId}`);
        const teamColor = ProgressWhite.getTeamColor(teamId);
        
        if (characterElement && teamColor) {
            ProgressWhite.applyTeamColor(characterElement, teamColor);
        }
    }
};

// Get all available team colors
ProgressWhite.getAllTeamColors = function() {
    return Object.keys(ProgressWhite.teamColors);
};

// Get available colors that are not currently assigned to teams
ProgressWhite.getAvailableColors = function() {
    // Get assigned colors from game state
    let assignedColors = [];
    if (window.gameState) {
        const state = window.gameState.get();
        Object.values(state.teams || {}).forEach(team => {
            if (team.color) {
                assignedColors.push(team.color);
            }
        });
    } else {
        // Fallback to default team colors if game state not available
        assignedColors = ['red', 'blue', 'lime', 'orange', 'pink', 'yellow'];
    }
    
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
            setTimeout(checkAndSet, 500);
        }
    };
    
    checkAndSet();
};

// Auto-run when DOM is ready with smart detection
ProgressWhite.autoInit = function() {
    // DISABLED: Let main-page.js handle initialization to prevent conflicts
    return;
};

// Manual initialization that sets character to proper white
ProgressWhite.initWhiteOnly = function() {
    const progressCharacter = document.getElementById('progressCharacter');
    if (progressCharacter) {
        // Force load white animation
        progressCharacter.src = 'assets/animations/among_us_idle.json';
        progressCharacter.load('assets/animations/among_us_idle.json');
    }
};

// Global function to apply any color to any character by ID
ProgressWhite.applyCharacterColor = async function(characterId, color) {
    const characterElement = document.getElementById(characterId);
    
    if (!characterElement) {
        console.warn(`❌ Character element '${characterId}' not found`);
        return false;
    }
    
    // Check if lottie-player is ready
    if (!characterElement.load) {
        setTimeout(() => ProgressWhite.applyCharacterColor(characterId, color), 200);
        return false;
    }
    
    // Always use the original animation source, not the current src which might be a blob URL
    const originalSrc = 'assets/animations/among_us_idle.json';
    
    try {
        if (color === 'white') {
            const animationData = await ProgressWhite.loadAnimationData(originalSrc);
            if (!animationData) {
                console.error('❌ Failed to load animation data for white color');
                return false;
            }
            
            // Apply white colors to animation using the new string replacement method
            const modifiedData = await ProgressWhite.applyColorsToAnimation(animationData, ProgressWhite.getWhiteTeamColors());
            
            // Create a data URL from the modified JSON
            const dataUrl = 'data:application/json;base64,' + btoa(JSON.stringify(modifiedData));
            
            // Update the character with new colors
            characterElement.load(dataUrl);

            return true;
            
        } else if (ProgressWhite.teamColors[color]) {
            // For team colors, use the existing team color system
            const result = await ProgressWhite.applyTeamColor(characterElement, color);
            return result;
        } else {
            console.warn(`❌ ProgressWhite: Unknown color ${color} for character ${characterId}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ ProgressWhite: Error applying ${color} to ${characterId}:`, error);
        
        // Fallback: direct load() method
        try {
            if (characterElement.load) {
                characterElement.load('assets/animations/among_us_idle.json');
            } else {
                characterElement.src = 'assets/animations/among_us_idle.json';
            }
            return true;
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            return false;
        }
    }
};

// Create global aliases for backward compatibility
window.setProgressCharacterToWhite = ProgressWhite.setProgressCharacterToWhite;
window.setTeamCharacterToWhite = ProgressWhite.setTeamCharacterToWhite;
window.resetProgressToWhite = ProgressWhite.resetProgressToWhite;
window.waitForLottieAndSetWhite = ProgressWhite.waitForLottieAndSetWhite;
window.applyCharacterColor = ProgressWhite.applyCharacterColor;
window.teamAnimationSystem = ProgressWhite.teamAnimationSystem;
window.initializeTeamColors = ProgressWhite.initializeTeamColors;

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressWhite;
} 