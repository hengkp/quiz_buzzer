# 🏆 Quiz Bowl Buzzer System

A professional quiz buzzer system built with **ESP32** hardware and a modern web interface featuring Among Us themed animations. Perfect for high school science competitions, classrooms, game shows, or any interactive quiz event.

## ✨ Key Features

### 🎮 **Game Interface**
- **Among Us Theme**: Animated character with Lottie animations
- **Mario-Style Scene**: Sky, clouds, ground with question blocks
- **Real-time Character Movement**: Smooth transitions across questions
- **Professional UI**: Apple-inspired design with clean typography
- **Team-Colored Buzzing**: Visual feedback with team-specific overlays
- **Action Cards System**: Angel, Devil, Cross, Challenge mechanics

### 🏗️ **Technical Features**
- **6-Team Support**: Handles up to 6 teams simultaneously
- **Real-time Synchronization**: Socket.IO communication between main page and console
- **Hardware Integration**: Direct ESP32 connection via Web Serial API
- **Modular Architecture**: Professional code organization and maintainability
- **Cross-platform**: Works on Windows, macOS, and Linux
- **No Installation Required**: Runs directly in Chrome/Edge browsers

### 🎯 **Quiz Mechanics**
- **40 Questions Total**: 10 sets × 4 questions each (8 regular + 2 backup sets)
- **15-Second Timer**: Countdown with visual indicators
- **Progressive Scoring**: +1/-1 for toss-ups, +1 for follow-ups
- **Challenge System**: 2× multiplier with risk/reward mechanics
- **Action Cards**: Strategic gameplay elements

---

## 🎲 Game Rules & Format

### **Competition Overview**
High school quiz tournament for **6 teams** (A-F) covering Biology, Physics, Chemistry, General Knowledge, and Technology. Each match is capped at **1 hour**.

### **Question Structure**
Each of the **8 question sets** contains:
1. **Toss-Up (Q1)**: Open buzzer - any team can buzz in
2. **Follow-Ups (Q2-Q4)**: Only the toss-up winner answers

### **Scoring System**
- **Toss-Up Questions**:
  - ✅ Correct: **+1 point**
  - ❌ Incorrect: **-1 point** (team barred from further buzzes on that toss-up)
- **Follow-Up Questions**:
  - ✅ Correct: **+1 point** each
  - ❌ Incorrect: **0 points** (ends team's turn for the set)

### **Challenge Multiplier**
After winning a toss-up, teams can choose:
- **No Challenge**: Q2-Q4 worth +1 point each, no penalty for wrong answers
- **×2 Challenge**: Q2-Q4 worth +2 points each, but first wrong answer = -2 points and ends set

### **Action Cards** (One-time use per team)
1. **Angel Card**: Removes penalty for wrong toss-up (-1 becomes 0)
2. **Devil Card**: Force opponent to answer, gain +2 if they fail
3. **Cross Card**: Protection and bonus mechanics

---

## 🚀 Quick Start

### **Development Mode (Recommended)**
```bash
cd web
python dev_server.py
```
**Open**: http://localhost:8000

### **HTTPS Secure Mode**
```bash
cd web
pip install -r requirements.txt
python dev_server.py --https
```
**Open**: https://localhost:8000

### **Hardware Connection Mode**
```bash
cd web
python -m http.server 8080
```
**Open**: http://localhost:8080/among_us_organized.html
Connect ESP32 via Web Serial API

---

## 🔧 Hardware Requirements

### **ESP32 Board (FCC ID: 2a53n-esp32)**
**Pin Configuration:**
```
Buttons: D4, D5, D13, D14, D21, D22 (Teams 1-6)
LEDs:    D18, D19, D23, D25, D26, D27 (Teams 1-6)
Buzzer:  D2 (Audio feedback)
Reset:   D15 (Admin reset button)
```

### **Component List**
```
• 1× ESP32 Development Board
• 6× Push Buttons (Teams)
• 6× LEDs (Team indicators)
• 1× Buzzer/Speaker (Audio feedback)
• 1× Reset Button (Admin)
• Resistors: 6× 10kΩ (pull-up), 6× 220Ω (LED current limiting)
• Breadboard and jumper wires
```

### **Wiring Diagram**
```
ESP32 Pin  | Component
-----------|----------------------------------
D4-D22     | Team buttons (1-6) with pull-up resistors
D18-D27    | Team LEDs (1-6) with current limiting resistors
D2         | Buzzer/Speaker
D15        | Admin reset button
GND        | Common ground for all components
3.3V       | Power for buttons (via pull-up resistors)
```

---

## 🏗️ Professional Architecture

### **Directory Structure**
```
quiz_buzzer/
├── web/                          # Web application
│   ├── js/                       # JavaScript modules
│   │   ├── core/                 # Core systems
│   │   │   ├── game-state.js    # Centralized state management
│   │   │   └── socket-manager.js # Socket.IO communication
│   │   ├── character/            # Character system
│   │   │   └── character-controller.js # Movement & animations
│   │   ├── ui/                   # UI components
│   │   │   ├── question-blocks.js # Question block system
│   │   │   └── buzzing-system.js # Buzzing overlays
│   │   ├── input/                # Input handling
│   │   │   └── hotkeys.js       # Keyboard controls
│   │   └── main-page.js         # App initialization
│   ├── css/                     # Stylesheets
│   │   ├── base/reset.css       # CSS foundation
│   │   └── components/character.css # Component styles
│   ├── assets/                  # Static assets
│   │   ├── animations/          # Lottie animations
│   │   ├── audio/               # Sound effects
│   │   ├── characters/          # Team character images
│   │   ├── cards/               # Action card images
│   │   └── buzzing/             # Buzzer overlay images
│   ├── tests/                   # Test files
│   ├── among_us_organized.html  # Main game interface (NEW)
│   ├── among_us.html            # Legacy main interface
│   ├── console.html             # Admin console
│   └── dev_server.py            # Development server
├── arduino/                     # Hardware code
│   ├── quiz_buzzer.ino         # Main Arduino sketch
│   ├── quiz_2teams.ino         # 2-team version
│   └── libraries.txt           # Required Arduino libraries
└── docs/                       # Documentation (removed - now in README)
```

### **Core Systems**
1. **Game State Management**: Centralized reactive state with observable changes
2. **Socket Manager**: Real-time communication between main page and console
3. **Character Controller**: Smooth character movement and animations
4. **Question Blocks**: Fixed scene with 40 question blocks and progress tracking
5. **Buzzing System**: Team-colored overlays with auto-hide functionality
6. **Hotkeys Manager**: Comprehensive keyboard input handling

---

## 🎮 Controls & Usage

### **Keyboard Controls**
- **1-6**: Team buzz-ins
- **← →**: Navigate questions
- **R**: Reset buzzers
- **Q**: Admin reset
- **Space**: Start/resume timer
- **P**: Pause timer
- **S**: Stop timer
- **H**: Show help (debug mode)

### **Admin Console**
Access via "Settings" button in top-right corner:
- **Score Management**: Adjust team scores
- **Timer Control**: Start, pause, stop, reset
- **Question Navigation**: Direct question jumping
- **Action Cards**: Activate/deactivate team cards
- **Hardware Connection**: ESP32 serial connection

### **Game Flow**
1. **Setup**: Configure team names and prepare hardware
2. **Question Sets**: Navigate through 8 sets of 4 questions each
3. **Buzzing**: Teams buzz in during toss-up questions
4. **Scoring**: Automatic score calculation with challenge bonuses
5. **Action Cards**: Strategic use of one-time cards
6. **Progress**: Visual character movement across question blocks

---

## 💻 Development

### **Technology Stack**
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Python Flask with Socket.IO
- **Hardware**: Arduino C++ for ESP32
- **Animations**: Lottie (After Effects animations)
- **Styling**: Custom CSS with Apple design principles
- **Communication**: WebSocket (Socket.IO) + Web Serial API

### **Code Organization**
- **Modular Architecture**: Singleton pattern for system components
- **Event-Driven**: Reactive state management with observers
- **Professional Patterns**: Clean separation of concerns
- **Backward Compatibility**: Legacy function support maintained
- **Error Handling**: Comprehensive error catching and recovery

### **Development Features**
- **Debug Mode**: Enhanced logging with `?debug=1` URL parameter
- **Hot Reload**: Real-time updates during development
- **Console Commands**: Manual testing via browser console
- **Modular Loading**: Individual component testing
- **Clean Logging**: 95% reduction in verbose console output

### **Key Global Functions**
```javascript
// Game State
window.gameState.moveToQuestion(set, question);
window.gameState.get('currentSet');

// Character Control
window.characterController.moveToQuestion(set, question);
window.characterController.moveForward();

// Socket Communication
window.socketManager.simulateBuzzer(teamId);
window.socketManager.updateProgress(set, question);

// UI Systems
window.buzzingSystem.showBuzzing(teamId);
window.questionBlocks.updateCurrent();
```

---

## 🔒 Security & Deployment

### **HTTPS Setup**
The system supports HTTPS for production deployment:
```bash
# Generate SSL certificates
cd web
python dev_server.py --https --cert-generate

# Use existing certificates
python dev_server.py --https --cert ssl/server.crt --key ssl/server.key
```

### **Production Deployment**
1. **Web Server**: Deploy to Apache/Nginx with SSL
2. **Hardware Access**: Requires HTTPS for Web Serial API
3. **Browser Support**: Chrome 89+, Edge 89+ (Web Serial API requirement)
4. **Network**: Local network deployment recommended for hardware integration

---

## 🐛 Troubleshooting

### **Common Issues**
1. **Hardware Not Detected**:
   - Ensure HTTPS is enabled
   - Check ESP32 USB connection
   - Verify Chrome/Edge browser (89+)
   - Install CH340/CP2102 drivers if needed

2. **Character Animation Issues**:
   - Refresh page to reload Lottie animations
   - Check network connection for CDN resources
   - Clear browser cache

3. **Socket Connection Problems**:
   - Verify server is running on correct port
   - Check firewall settings
   - Ensure both main page and console use same server

4. **Performance Issues**:
   - Use hardware acceleration in browser
   - Close unnecessary browser tabs
   - Ensure adequate system resources

### **Debug Commands**
```javascript
// Check system status
window.mainPageApp.getStatus();

// Test character movement
window.characterController.moveToQuestion(5, 3);

// Test buzzing system
window.buzzingSystem.showBuzzing(1);

// View game state
window.gameState.get();

// Check socket connection
window.socketManager.isConnected;
```

---

## 📊 Features Comparison

| Feature | Legacy System | Professional System |
|---------|---------------|-------------------|
| Code Organization | Single large file | Modular architecture |
| Character Movement | Scene scrolling | Fixed scene, moving character |
| Console Output | Verbose logging | Clean, minimal output |
| Error Handling | Basic | Comprehensive with recovery |
| State Management | Manual DOM updates | Reactive state system |
| CSS Architecture | Inline styles | Organized component files |
| Maintainability | Difficult | Professional standards |
| Performance | Good | Optimized |
| Debugging | Limited | Debug mode with tools |

---

## 🎯 Usage Scenarios

### **Educational Settings**
- **Science Competitions**: Biology, Physics, Chemistry quiz bowls
- **Classroom Reviews**: Interactive learning sessions
- **Academic Tournaments**: Inter-school competitions

### **Entertainment**
- **Game Shows**: TV show style quiz competitions
- **Corporate Events**: Team building quiz activities
- **Family Games**: Home entertainment systems

### **Technical Demonstrations**
- **Maker Faires**: Hardware integration showcases
- **Educational Workshops**: ESP32 and web development tutorials
- **Open Source Projects**: Community collaboration examples

---

## 🚧 Future Enhancements

### **Planned Features**
- **Mobile App**: Native iOS/Android applications
- **Cloud Sync**: Online tournament management
- **Analytics**: Detailed game statistics and insights
- **Custom Themes**: Alternative visual themes beyond Among Us
- **Audio System**: Enhanced sound effects and music
- **Multi-language**: Internationalization support

### **Hardware Expansions**
- **Wireless Buzzers**: ESP32-based wireless team buzzers
- **LED Strips**: Ambient lighting effects
- **Display Integration**: External scoreboards and timers
- **RFID Cards**: Physical action card integration

---

## 📄 License & Credits

### **Open Source License**
This project is released under the MIT License. See LICENSE file for details.

### **Credits**
- **Lottie Animations**: Among Us character animations
- **Socket.IO**: Real-time communication framework
- **ESP32**: Hardware platform by Espressif
- **Design Inspiration**: Apple Human Interface Guidelines

### **Contributing**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: Report bugs and request features
- **Documentation**: This comprehensive README
- **Debug Mode**: Enable with `?debug=1` for troubleshooting
- **Console Commands**: Use browser developer tools for system inspection

**Built with ❤️ for interactive learning and competition!** 🎮✨ 