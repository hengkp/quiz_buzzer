// Quiz Buzzer GitHub Pages Setup Script
// Run this in the browser console to help configure Firebase

class QuizBuzzerSetup {
    constructor() {
        this.firebaseConfig = null;
    }

    // Show setup instructions
    showInstructions() {
        const instructions = `
🎮 Quiz Buzzer GitHub Pages Setup

1. Create a Firebase Project:
   - Go to https://console.firebase.google.com/
   - Click "Create a project"
   - Enter a project name (e.g., "quiz-buzzer")
   - Follow the setup wizard

2. Enable Realtime Database:
   - In your Firebase project, go to "Realtime Database"
   - Click "Create database"
   - Choose a location
   - Start in test mode (for development)

3. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Add app" → Web app
   - Register your app
   - Copy the config object

4. Update firebase-config.js:
   - Replace the placeholder config with your real config
   - Save the file

5. Test the connection:
   - Open among_us.html in your browser
   - Check the console for connection status

Need help? Check the README.md file for detailed instructions.
        `;
        
        console.log(instructions);
        alert('Setup instructions logged to console. Press F12 to view.');
    }

    // Validate Firebase configuration
    validateConfig(config) {
        const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        const missing = required.filter(key => !config[key]);
        
        if (missing.length > 0) {
            console.error('❌ Missing required Firebase config keys:', missing);
            return false;
        }
        
        if (!config.databaseURL.includes('firebaseio.com') && !config.databaseURL.includes('firebasedatabase.app')) {
            console.error('❌ Invalid databaseURL. Should end with firebaseio.com or firebasedatabase.app');
            return false;
        }
        
        console.log('✅ Firebase configuration looks valid');
        return true;
    }

    // Test Firebase connection
    async testConnection() {
        if (!window.firebase) {
            console.error('❌ Firebase not loaded. Make sure firebase-config.js is included.');
            return false;
        }

        try {
            const db = firebase.database();
            const testRef = db.ref('test');
            
            // Try to write a test value
            await testRef.set({
                timestamp: Date.now(),
                message: 'Connection test'
            });
            
            // Try to read it back
            const snapshot = await testRef.once('value');
            const data = snapshot.val();
            
            if (data && data.message === 'Connection test') {
                console.log('✅ Firebase connection successful!');
                
                // Clean up test data
                await testRef.remove();
                return true;
            } else {
                console.error('❌ Firebase connection failed - could not read test data');
                return false;
            }
        } catch (error) {
            console.error('❌ Firebase connection failed:', error.message);
            return false;
        }
    }

    // Quick setup wizard
    async runSetupWizard() {
        console.log('🚀 Starting Quiz Buzzer Setup Wizard...');
        
        // Step 1: Check if Firebase is loaded
        if (!window.firebase) {
            console.error('❌ Firebase not loaded. Please include firebase-config.js');
            this.showInstructions();
            return;
        }

        // Step 2: Check if config is valid
        const config = firebase.app().options;
        if (!this.validateConfig(config)) {
            this.showInstructions();
            return;
        }

        // Step 3: Test connection
        console.log('🔗 Testing Firebase connection...');
        const connected = await this.testConnection();
        
        if (connected) {
            console.log('🎉 Setup complete! Your Quiz Buzzer is ready to use.');
            console.log('📱 Open among_us.html to start the game');
            console.log('🎮 Open console.html to access the moderator panel');
        } else {
            console.error('❌ Setup failed. Please check your Firebase configuration.');
            this.showInstructions();
        }
    }

    // Check current status
    checkStatus() {
        console.log('📊 Quiz Buzzer Status Check:');
        
        // Check Firebase
        if (window.firebase) {
            console.log('✅ Firebase loaded');
            const config = firebase.app().options;
            console.log('📋 Database URL:', config.databaseURL);
        } else {
            console.log('❌ Firebase not loaded');
        }
        
        // Check Firebase Manager
        if (window.firebaseManager) {
            console.log('✅ Firebase Manager loaded');
        } else {
            console.log('❌ Firebase Manager not loaded');
        }
        
        // Check Socket Manager
        if (window.socket) {
            console.log('✅ Socket Manager loaded');
        } else {
            console.log('❌ Socket Manager not loaded');
        }
        
        // Check Game State
        if (window.gameState) {
            console.log('✅ Game State loaded');
        } else {
            console.log('❌ Game State not loaded');
        }
    }
}

// Create global setup instance
window.quizBuzzerSetup = new QuizBuzzerSetup();

// Auto-run setup check when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Quiz Buzzer Setup Helper loaded');
    console.log('💡 Run quizBuzzerSetup.runSetupWizard() to start setup');
    console.log('💡 Run quizBuzzerSetup.checkStatus() to check current status');
    console.log('💡 Run quizBuzzerSetup.showInstructions() to see setup instructions');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizBuzzerSetup;
} 