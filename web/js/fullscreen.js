// Console window functionality
function openConsoleWindow() {
    const consoleUrl = 'console.html';
    const features = 'width=1200,height=800,scrollbars=yes,resizable=yes';
    window.open(consoleUrl, 'QuizBowlConsole', features);
}

// Fullscreen API functionality
function toggleFullscreen() {
    const elem = document.documentElement;
    const fullscreenBtn = document.getElementById('fullscreenToggle');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const fullscreenText = document.getElementById('fullscreenText');
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        
        // Enter fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
        
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    }
}

// Update fullscreen button state
function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenToggle');
    const fullscreenIcon = document.getElementById('fullscreenIcon');

    if (document.fullscreenElement || document.webkitFullscreenElement || 
        document.mozFullScreenElement || document.msFullscreenElement) {
        
        // In fullscreen
        fullscreenBtn.classList.add('in-fullscreen');
        fullscreenIcon.className = 'ri-fullscreen-exit-line';
        
    } else {
        // Not in fullscreen
        fullscreenBtn.classList.remove('in-fullscreen');
        fullscreenIcon.className = 'ri-fullscreen-line';
    }
}

// Ensure proper initialization order
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize fullscreen functionality
    const fullscreenBtn = document.getElementById('fullscreenToggle');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
        
        // Initialize button state
        updateFullscreenButton();
    }
    
    // Fullscreen hotkey now handled by unified hotkeys.js
    
    // Initialize systems in proper order
    setTimeout(() => {
        // Force socket manager initialization
        if (window.socketManager && !window.socketManager.isConnected) {
            window.socketManager.init();
        }
        
        // Force hotkeys initialization 
        if (window.hotkeysManager && !window.hotkeysManager.isListening) {
            window.hotkeysManager.init();
        }
        
        // Ensure character controller is properly positioned
        if (window.characterController) {
            window.characterController.updatePosition();
        }
    }, 500);
});