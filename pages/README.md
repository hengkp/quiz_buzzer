# Quiz Buzzer - GitHub Pages Version

This is the GitHub Pages version of the Quiz Buzzer system, converted to use Firebase Realtime Database instead of Flask Socket.IO for hosting on static platforms.

## 🚀 Quick Start

### 1. Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database
   - Set database rules to allow read/write (for development)

2. **Update Firebase Configuration:**
   - Edit `firebase-config.js`
   - Replace the placeholder config with your Firebase project details:
   ```javascript
   const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       databaseURL: "https://your-project-default-rtdb.firebaseio.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "your-sender-id",
       appId: "your-app-id"
   };
   ```

### 2. Arduino Bridge Setup (Optional)

If you want Arduino connectivity:

1. **Install Node.js dependencies:**
   ```bash
   cd pages
   npm install
   ```

2. **Create Firebase Service Account:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `firebase-service-account.json` in the pages directory

3. **Start Arduino Bridge:**
   ```bash
   npm start
   ```

### 3. GitHub Pages Deployment

1. **Push to GitHub:**
   ```bash
   git add pages/
   git commit -m "Add GitHub Pages version"
   git push
   ```

2. **Enable GitHub Pages:**
   - Go to your repository settings
   - Enable GitHub Pages
   - Set source to `/pages` directory
   - Your site will be available at `https://username.github.io/repository-name/`

## 📁 File Structure

```
pages/
├── among_us.html          # Main game interface
├── console.html           # Moderator console
├── firebase-config.js     # Firebase configuration
├── arduino-bridge.js      # Node.js Arduino bridge
├── package.json           # Node.js dependencies
├── js/
│   ├── firebase-socket-manager.js  # Firebase Socket.IO replacement
│   ├── main-page.js       # Main page logic
│   ├── console-page.js    # Console logic
│   └── ...                # Other JavaScript files
├── css/                   # Stylesheets
├── assets/                # Images, animations, audio
└── README.md              # This file
```

## 🔧 Configuration

### Firebase Database Rules

For development, use these rules:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production, use more restrictive rules:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### Arduino Connection

The Arduino bridge automatically:
- Detects Arduino ports
- Connects to the first available Arduino
- Bridges Arduino communication with Firebase
- Handles reconnection on disconnection

## 🎮 Usage

### Main Interface (`among_us.html`)
- Displays the game interface
- Shows team characters and animations
- Handles buzzer events and scoring
- Supports fullscreen mode

### Console Interface (`console.html`)
- Moderator control panel
- Team management
- Timer control
- Arduino connection management
- Game state monitoring

### Keyboard Shortcuts
- `1-6`: Simulate team buzzers
- `R`: Reset buzzers
- `F`: Toggle fullscreen
- `C`: Open console

## 🔌 Arduino Compatibility

The system supports Arduino boards with:
- 6 buttons (teams A-F)
- 6 LEDs (team indicators)
- Serial communication at 9600 baud

### Arduino Pin Mapping
- **Buttons:** D4, D5, D13, D14, D21, D22
- **LEDs:** D18, D19, D23, D25, D26, D27

## 🛠️ Development

### Local Development
1. Start the Arduino bridge: `npm start`
2. Open `among_us.html` in a browser
3. Open `console.html` in another tab

### Testing Without Arduino
The system works without Arduino in simulation mode:
- Use keyboard shortcuts to simulate buzzers
- All game features work normally
- Real-time synchronization via Firebase

## 🔒 Security Notes

- Firebase API keys are visible in client-side code
- Use Firebase Security Rules to restrict access
- Consider implementing authentication for production use
- Arduino bridge requires local Node.js installation

## 🐛 Troubleshooting

### Firebase Connection Issues
- Check Firebase configuration in `firebase-config.js`
- Verify database rules allow read/write
- Check browser console for connection errors

### Arduino Connection Issues
- Ensure Arduino is connected and recognized
- Check port permissions (may need sudo on Linux/Mac)
- Verify Arduino code is uploaded and running

### GitHub Pages Issues
- Ensure all files are in the `/pages` directory
- Check that Firebase configuration is correct
- Verify all JavaScript files are loading properly

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Firebase documentation
- Open an issue on GitHub 