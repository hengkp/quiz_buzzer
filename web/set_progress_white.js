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
        console.log(`🎯 Loading animation data from: ${animationSrc}`);
        const response = await fetch(animationSrc);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        ProgressWhite.animationCache[animationSrc] = data;
        console.log('✅ Animation data loaded and cached successfully');
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
    const originalMain = [0.784, 0.125, 0.055, 1]; // Main red body
    return ProgressWhite.calculateColorDistance(color, originalMain) < 0.1;
};

// Check if color is a shadow color (excluding visor shadow)
ProgressWhite.isShadowColor = function(color) {
    const originalShadow = [0.545, 0.094, 0.157, 1]; // Dark red shadow
    const originalVisorShadow = [0.278, 0.38, 0.424, 1]; // Dark blue visor shadow - keep original
    
    // Don't change the visor shadow color
    if (ProgressWhite.calculateColorDistance(color, originalVisorShadow) < 0.1) {
        return false;
    }
    
    return ProgressWhite.calculateColorDistance(color, originalShadow) < 0.1;
};

// Check if color is a light reflection color (excluding visor)
ProgressWhite.isLightColor = function(color) {
    const originalLight = [0.969, 0.996, 0.996, 1]; // Very light reflection
    const originalVisor = [0.576, 0.788, 0.855, 1]; // Light blue visor - keep original
    
    // Don't change the visor color
    if (ProgressWhite.calculateColorDistance(color, originalVisor) < 0.1) {
        return false;
    }
    
    return ProgressWhite.calculateColorDistance(color, originalLight) < 0.1 || 
           (color[0] > 0.95 && color[1] > 0.95 && color[2] > 0.95);
};

// Replace colors in animation layer recursively
ProgressWhite.replaceColorsInLayer = function(layer, whiteColors) {
    if (layer.shapes) {
        layer.shapes.forEach(shape => {
            if (shape.it) {
                shape.it.forEach(item => {
                    if (item.ty === 'fl' && item.c && item.c.k) {
                        const currentColor = item.c.k;
                        
                        // Check if this is the main character color (red body)
                        if (ProgressWhite.isMainCharacterColor(currentColor)) {
                            item.c.k = whiteColors.primary;
                            console.log('🎨 Replaced main body color with white');
                        }
                        // Check if this is the shadow/dark color (NOT visor shadow)
                        else if (ProgressWhite.isShadowColor(currentColor)) {
                            item.c.k = whiteColors.secondary;
                            console.log('🎨 Replaced shadow color with light gray');
                        }
                        // Check if this is a light reflection color (NOT visor)
                        else if (ProgressWhite.isLightColor(currentColor)) {
                            item.c.k = whiteColors.light;
                            console.log('🎨 Replaced light color with pure white');
                        }
                    }
                });
            }
            
            // Recursively handle nested groups
            if (shape.shapes) {
                ProgressWhite.replaceColorsInLayer(shape, whiteColors);
            }
        });
    }
    
    return layer;
};

// Main function to apply white color to progress character
ProgressWhite.setProgressCharacterToWhite = async function() {
    console.log('🎯 ProgressWhite: Starting progress character white color application...');
    
    // Find the progress character element
    const progressCharacter = document.getElementById('progressCharacter');
    
    if (!progressCharacter) {
        console.error('❌ ProgressWhite: Progress character element not found!');
        return false;
    }
    
    console.log('✅ ProgressWhite: Found progress character element');
    
    // Check if lottie-player is ready
    if (!progressCharacter.load) {
        console.log('⏳ ProgressWhite: Waiting for lottie-player to be ready...');
        setTimeout(() => ProgressWhite.setProgressCharacterToWhite(), 200);
        return false;
    }
    
    // Clear any existing filters or overlays
    progressCharacter.style.filter = '';
    
    const existingOverlay = progressCharacter.parentNode.querySelector('.color-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
        console.log('🧹 ProgressWhite: Removed existing color overlay');
    }
    
    // Get the current animation source
    const currentSrc = progressCharacter.getAttribute('src');
    if (!currentSrc) {
        console.error('❌ ProgressWhite: No animation source found!');
        return false;
    }
    
    console.log(`📁 ProgressWhite: Loading animation from: ${currentSrc}`);
    
    // Load and modify animation data
    const whiteColors = ProgressWhite.getWhiteTeamColors();
    const animationData = await ProgressWhite.loadAnimationData(currentSrc);
    
    if (!animationData) {
        console.error('❌ ProgressWhite: Failed to load animation data!');
        return false;
    }
    
    console.log('🎨 ProgressWhite: Applying white colors to animation...');
    
    // Replace colors in all layers
    if (animationData.layers) {
        animationData.layers.forEach(layer => {
            ProgressWhite.replaceColorsInLayer(layer, whiteColors);
        });
    }
    
    // Create a data URL from the modified JSON
    const dataUrl = 'data:application/json;base64,' + btoa(JSON.stringify(animationData));
    
    // Update the lottie player with the new white animation
    try {
        progressCharacter.load(dataUrl);
        console.log('✅ ProgressWhite: Successfully applied white color to progress character!');
        return true;
    } catch (error) {
        console.error('❌ ProgressWhite: Failed to load modified animation:', error);
        return false;
    }
};

// Function to reset progress character to white (for external use)
ProgressWhite.resetProgressToWhite = async function() {
    console.log('🔄 ProgressWhite: Resetting progress character to white...');
    const success = await ProgressWhite.setProgressCharacterToWhite();
    
    if (success) {
        console.log('🎉 ProgressWhite: Progress character successfully reset to white!');
    } else {
        console.error('💥 ProgressWhite: Failed to reset progress character to white!');
    }
    
    return success;
};

// Smart initialization that works with existing among_us.html
ProgressWhite.initialize = function() {
    console.log('🚀 ProgressWhite: Initializing...');
    
    // Check if we're in among_us.html context
    const isAmongUsPage = document.querySelector('#progressCharacter') && 
                         typeof applyColorToLottiePlayer === 'function';
    
    if (isAmongUsPage) {
        console.log('🎯 ProgressWhite: Detected among_us.html context, using enhanced integration');
        
        // Override the existing initialization to use our enhanced white color
        const originalApplyColorToLottiePlayer = window.applyColorToLottiePlayer;
        
        window.applyColorToLottiePlayer = async function(player, color) {
            if (color === 'white' && player && player.id === 'progressCharacter') {
                console.log('🔄 ProgressWhite: Intercepting white color application for progress character');
                return await ProgressWhite.setProgressCharacterToWhite();
            } else if (originalApplyColorToLottiePlayer) {
                return originalApplyColorToLottiePlayer(player, color);
            }
        };
        
        // Wait for the existing initialization to complete, then apply our white
        setTimeout(() => {
            console.log('🔄 ProgressWhite: Applying enhanced white color...');
            ProgressWhite.setProgressCharacterToWhite();
        }, 300);
        
    } else {
        console.log('🎯 ProgressWhite: Standalone mode, direct initialization');
        ProgressWhite.waitForLottieAndSetWhite();
    }
};

// Wait for lottie-player to be available if needed
ProgressWhite.waitForLottieAndSetWhite = function() {
    const checkAndSet = () => {
        const progressCharacter = document.getElementById('progressCharacter');
        if (progressCharacter && progressCharacter.load) {
            ProgressWhite.setProgressCharacterToWhite();
        } else {
            console.log('⏳ ProgressWhite: Waiting for lottie-player to be ready...');
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
window.resetProgressToWhite = ProgressWhite.resetProgressToWhite;
window.waitForLottieAndSetWhite = ProgressWhite.waitForLottieAndSetWhite;

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setProgressCharacterToWhite: ProgressWhite.setProgressCharacterToWhite,
        resetProgressToWhite: ProgressWhite.resetProgressToWhite,
        initialize: ProgressWhite.initialize,
        waitForLottieAndSetWhite: ProgressWhite.waitForLottieAndSetWhite
    };
}

// Auto-initialize when script is loaded
if (typeof window !== 'undefined') {
    console.log('🚀 ProgressWhite: Script loaded and initializing...');
    ProgressWhite.autoInit();
} 