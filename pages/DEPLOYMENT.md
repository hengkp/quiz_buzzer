# GitHub Pages Deployment Guide

This guide will help you deploy the Quiz Buzzer system to GitHub Pages.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

1. **Ensure your repository structure is correct:**
   ```
   your-repo/
   ├── web/                    # Original Flask version (kept for local development)
   └── pages/                  # GitHub Pages version
       ├── among_us.html
       ├── console.html
       ├── firebase-config.js
       ├── setup.js
       ├── js/
       ├── css/
       ├── assets/
       └── README.md
   ```

2. **Commit and push your changes:**
   ```bash
   git add pages/
   git commit -m "Add GitHub Pages version with Firebase"
   git push origin main
   ```

### 2. Configure GitHub Pages

1. **Go to your repository on GitHub**
2. **Navigate to Settings → Pages**
3. **Configure the source:**
   - Source: "Deploy from a branch"
   - Branch: `main` (or your default branch)
   - Folder: `/pages`
4. **Click "Save"**

### 3. Set Up Firebase

1. **Create a Firebase project:**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database

2. **Update the configuration:**
   - Edit `pages/firebase-config.js`
   - Replace the placeholder config with your Firebase details

3. **Set database rules:**
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

### 4. Test Your Deployment

1. **Wait for GitHub Pages to build** (usually 1-2 minutes)
2. **Visit your site:** `https://username.github.io/repository-name/`
3. **Test the setup:**
   - Open browser console (F12)
   - Run: `quizBuzzerSetup.runSetupWizard()`

## 🔧 Advanced Configuration

### Custom Domain (Optional)

1. **Add a custom domain in GitHub Pages settings**
2. **Update Firebase configuration** to include your domain
3. **Configure DNS records** as instructed by GitHub

### Environment-Specific Configs

You can create different Firebase projects for different environments:

```javascript
// firebase-config.js
const firebaseConfig = {
    // Development
    development: {
        apiKey: "dev-api-key",
        databaseURL: "https://dev-project.firebaseio.com",
        // ...
    },
    // Production
    production: {
        apiKey: "prod-api-key", 
        databaseURL: "https://prod-project.firebaseio.com",
        // ...
    }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost';
const config = firebaseConfig[isProduction ? 'production' : 'development'];
```

## 🛠️ Local Development

### Without Arduino

1. **Open `pages/among_us.html` in your browser**
2. **Use keyboard shortcuts to test:**
   - `1-6`: Simulate team buzzers
   - `R`: Reset buzzers
   - `F`: Toggle fullscreen

### With Arduino

1. **Install Node.js dependencies:**
   ```bash
   cd pages
   npm install
   ```

2. **Set up Firebase service account:**
   - Download service account key from Firebase Console
   - Save as `firebase-service-account.json`

3. **Start Arduino bridge:**
   ```bash
   npm start
   ```

## 🔒 Security Considerations

### For Development
- Use open Firebase rules (read/write: true)
- Keep API keys in client-side code (acceptable for public games)

### For Production
- Implement Firebase Authentication
- Use restrictive database rules
- Consider using environment variables for sensitive data

### Recommended Production Rules
```json
{
  "rules": {
    "game_state": {
      ".read": true,
      ".write": "auth != null"
    },
    "buzzer_events": {
      ".read": true,
      ".write": true
    },
    "logs": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**1. Firebase Connection Failed**
- Check `firebase-config.js` has correct values
- Verify database rules allow read/write
- Check browser console for errors

**2. GitHub Pages Not Loading**
- Ensure `/pages` folder is in the correct branch
- Check GitHub Pages settings
- Wait for build to complete

**3. Assets Not Loading**
- Verify all file paths are relative
- Check that assets folder is included in `/pages`
- Ensure no absolute paths in HTML/CSS

**4. Arduino Bridge Issues**
- Check Node.js version (requires 16+)
- Verify serial port permissions
- Ensure Arduino is connected and recognized

### Debug Commands

Open browser console and run:
```javascript
// Check setup status
quizBuzzerSetup.checkStatus()

// Run setup wizard
quizBuzzerSetup.runSetupWizard()

// Show instructions
quizBuzzerSetup.showInstructions()
```

## 📊 Monitoring

### Firebase Console
- Monitor database usage
- Check for errors in logs
- View real-time data

### GitHub Pages
- Check deployment status
- Monitor build logs
- View site analytics (if enabled)

## 🔄 Updates

To update your deployment:

1. **Make changes to files in `/pages`**
2. **Commit and push:**
   ```bash
   git add pages/
   git commit -m "Update GitHub Pages version"
   git push
   ```
3. **Wait for GitHub Pages to rebuild**
4. **Test the updated site**

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section**
2. **Review Firebase documentation**
3. **Check GitHub Pages documentation**
4. **Open an issue on GitHub**

## 🎉 Success!

Once deployed, your Quiz Buzzer will be available at:
`https://username.github.io/repository-name/`

The system will work with:
- ✅ Real-time multiplayer functionality
- ✅ Arduino connectivity (with bridge)
- ✅ Full game features
- ✅ Cross-platform compatibility 