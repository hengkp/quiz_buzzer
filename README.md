# DIY 6-Player Quiz Buzzer System

## Overview

Build a fastest-finger buzzer system for 6 teams using a **Seeed Studio XIAO nRF52840** microcontroller, six buzzer buttons, and a 2.4" TFT LCD. The system detects which team's buzzer is pressed first and displays the winning buzz-in number on both a small touchscreen and a large web interface.

**🚀 Quick Start**: Test the UI immediately using the included development server - no hardware required!

![Quiz Buzzer System](https://img.shields.io/badge/Status-Ready%20to%20Build-green)
![Development Server](https://img.shields.io/badge/Dev%20Server-Ready-blue)
![Testing](https://img.shields.io/badge/Keyboard%20Testing-1--6%20%26%20R-orange)

## Quick Navigation

- [🚀 **Quick Start**](#development--testing) - Test immediately without hardware
- [📦 **Setup**](#software-setup) - Environment and dependencies
- [🔧 **Hardware**](#hardware-setup) - Arduino and wiring instructions
- [🎮 **Usage**](#usage-instructions) - Operating the system
- [🛠️ **Troubleshooting**](#troubleshooting) - Common issues and solutions
- [⚡ **Advanced**](#advanced-features) - Development tools and enhancements

## Features

- ⚡ **Fast Response**: Microsecond-level detection of first button press
- 🖥️ **Dual Display**: Local TFT screen + web browser interface  
- 🎯 **6 Player Support**: Handle up to 6 teams simultaneously
- 🌐 **Web Interface**: Large, clear display for audience visibility
- 🔄 **Multiple Reset Options**: Physical button + web button + touchscreen
- 🏷️ **Custom Team Names**: Configurable team names via web interface
- 💾 **Name Persistence**: Team names saved in browser localStorage
- 🧪 **Development Server**: Test UI without hardware using simulated buzzer events
- ⌨️ **Keyboard Testing**: Use keys 1-6 for buzzer simulation and R for reset (all modes)
- 📦 **Easy Setup**: Conda environment for quick dependency management
- 📏 **Enhanced Visibility**: Large circle and prominent team names for clear display

## Project Structure

```
quiz_buzzer/
├── arduino/
│   └── quiz_buzzer.ino       # XIAO nRF52840 firmware
├── web/
│   ├── buzzer.html           # Web interface
│   ├── dev_server.py         # Development server for testing
│   └── requirements.txt      # Python dependencies
├── docs/
│   ├── wiring_diagram.md     # Detailed wiring instructions
│   └── troubleshooting.md    # Common issues and solutions
├── environment.yml           # Conda environment configuration
└── README.md                 # Complete project documentation (all-in-one)
```

## Parts Required

### Core Components
- **Seeed Studio XIAO nRF52840** - 1 piece (main controller)
- **2.4" TFT LCD with resistive touchscreen** (Adafruit 2478 or equivalent) - 1 piece
- **Buzzer Buttons** - 6 pieces (quiz buzzer boxes with big red buttons)
- **Reset Push-button** - 1 piece (momentary pushbutton)
- **Breadboard** - 1 piece (half-size or larger)

### Cables & Hardware
- **Jumper Wires** - Multiple pieces
- **Long Cables** - ~3 meters per buzzer (recommend twisted pair/Ethernet cable)
- **USB Cable** - USB-C for XIAO programming/power
- **330Ω Resistors** - 6 pieces (optional, for buzzer LEDs)
- **NPN Transistors** - Optional (if buzzers need more current)

### Tools
- Soldering iron and solder
- Wire strippers
- Multimeter (for testing)
- Small screwdriver set

## Hardware Setup

### Pin Mapping (XIAO nRF52840)

| Function | XIAO Pin | Notes |
|----------|----------|-------|
| Buzzer 1 | D0 (A0) | Input with pull-up |
| Buzzer 2 | D1 (A1) | Input with pull-up |
| Buzzer 3 | D4 (SDA) | Input with pull-up |
| Buzzer 4 | D5 (SCL) | Input with pull-up |
| Buzzer 5 | D6 (TX) | Input with pull-up |
| Buzzer 6 | D7 (RX) | Input with pull-up |
| TFT CS | D2 | SPI Chip Select |
| TFT DC | D3 | Data/Command Select |
| TFT SCK | D8 | SPI Clock |
| TFT MOSI | D10 | SPI Data Out |
| Reset Button | D9 | Input with pull-up |

### Power & Ground
- **Power**: XIAO powered via USB (5V from USB → 3.3V regulated)
- **Logic Level**: 3.3V (compatible with TFT breakout)
- **Common Ground**: Connect all buzzer switches and TFT GND to XIAO GND

### TFT Display Wiring (SPI Mode)

**Important**: Configure TFT for SPI mode by soldering IM1, IM2, IM3 jumpers to 3.3V on the back of the breakout board.

| TFT Pin | XIAO Pin | Description |
|---------|----------|-------------|
| VCC | 3V3 | Power (3.3V) |
| GND | GND | Ground |
| SCK | D8 | SPI Clock |
| MOSI (DIN) | D10 | SPI Data |
| CS | D2 | Chip Select |
| DC (D/C) | D3 | Data/Command |
| RST | 3V3* | Reset (tie to 3.3V) |

*RST can be tied to 3.3V via 10kΩ resistor instead of MCU control to save pins.

### Buzzer Wiring

Each buzzer connects as a simple switch:
1. **Common Ground**: One terminal of each buzzer switch → GND
2. **Signal Wires**: Other terminal → designated XIAO input pin
3. **Pull-ups**: Internal pull-ups enabled in software (HIGH when not pressed, LOW when pressed)

For 3-meter cable runs:
- Use twisted pair cables (like Ethernet cable) for noise immunity
- One twisted pair per buzzer: signal + ground return
- Shield cables if experiencing interference

## Software Setup

### Environment Setup

#### Option 1: Conda Environment (Recommended)

If you have Anaconda or Miniconda installed, you can create a dedicated environment for this project:

```bash
# Create the environment from the provided YAML file
conda env create -f environment.yml

# Activate the environment
conda activate quiz_buzzer

# Start the development server (for testing UI without hardware)
cd web
python dev_server.py
```

The conda environment includes all necessary Python dependencies for the development server.

#### Option 2: Python Virtual Environment

If you prefer using pip and virtual environments:

```bash
# Create virtual environment
python -m venv quiz_buzzer_env

# Activate environment (Windows)
quiz_buzzer_env\Scripts\activate

# Activate environment (macOS/Linux)
source quiz_buzzer_env/bin/activate

# Install dependencies
cd web
pip install -r requirements.txt

# Start development server
python dev_server.py
```

### Arduino IDE Configuration

1. **Install Board Support**:
   - Open Arduino IDE
   - Go to Tools → Board → Boards Manager
   - Search for "Seeed nRF52840"
   - Install the Seeed nRF52840 Boards package

2. **Install Required Libraries**:
   ```
   Adafruit ILI9341
   Adafruit GFX Library
   ```

3. **Upload Firmware**:
   - Open `arduino/quiz_buzzer.ino`
   - Select Board: "Seeed XIAO nRF52840"
   - Select correct COM port
   - Upload code

### Web Interface Setup

1. **Browser Requirements**:
   - Chrome or Edge (Web Serial API support required)
   - Firefox and Safari do NOT support Web Serial API

2. **Running the Interface**:

   **Option A: Development Server (Recommended for Testing)**:
   ```bash
   # Using conda environment
   conda activate quiz_buzzer
   cd web
   python dev_server.py
   
   # Access the interface at:
   # Main UI: http://localhost:8000
   # Admin Panel: http://localhost:8000/admin
   ```
   
   **Option B: Direct File Access**:
   - Open `web/buzzer.html` in Chrome/Edge
   - For local file access, may need to start Chrome with: `--allow-file-access-from-files`
   
   **Option C: Simple HTTP Server**:
   ```bash
   # Python 3
   cd web
   python -m http.server 8000
   
   # Node.js (if you have http-server installed)
   npx http-server
   ```

## Development & Testing

### Development Server (Hardware-Free Testing)

The included development server allows you to test the buzzer UI without needing the actual Arduino hardware. It simulates the buzzer system using WebSockets instead of Serial communication.

#### Features
- 🎮 **Full UI Testing**: Test all buzzer functionality without hardware
- 🔧 **Admin Panel**: Trigger buzzer events manually
- 📊 **Real-time Logging**: See all events in real-time
- 🌐 **WebSocket Communication**: Replaces Serial API for development
- 🎯 **Multiple Clients**: Support multiple browser windows/tabs
- ⌨️ **Keyboard Controls**: Use keys 1-6 for buzzer simulation, R for reset

#### Quick Start with Development Server

```bash
# Using conda environment (recommended)
conda activate quiz_buzzer
cd web
python dev_server.py

# Access the interfaces:
# Main UI: http://localhost:8000
# Admin Panel: http://localhost:8000/admin
```

#### Testing the Interface

**Main Buzzer UI (http://localhost:8000)**:
1. Click the connection button (top-left)
2. Click "Connect" in the modal - automatically connects to dev server
3. Connection status should turn green
4. **Keyboard shortcuts**: Press keys `1-6` to simulate team buzzer presses, `R` to reset
5. **OR use admin panel** to trigger events manually
6. Test team name editing in settings (top-right gear icon)

**Admin Test Panel (http://localhost:8000/admin)**:
- **Buzzer Simulation**: Click any team button to simulate buzzer press
- **Reset System**: Clear current winner and prepare for next round
- **Random Buzzer**: Simulate random team buzzer press
- **Event Log**: Real-time events and debugging information

#### Testing Scenarios

**Basic Functionality**:
1. Open main UI and admin panel in separate browser tabs
2. Connect the main UI to the dev server
3. Use admin panel to simulate Team 1 buzzer press
4. Verify Team 1 appears as winner in main UI
5. Click reset button in main UI or admin panel
6. Verify system resets to waiting state

**Team Names**:
1. Open settings in main UI (gear icon top-right)
2. Change team names (e.g., "Team 1" → "Lightning Bolts")
3. Close settings modal
4. Use admin panel to simulate that team's buzzer
5. Verify custom name appears in main UI

**Keyboard Shortcuts**:
1. Open main UI and ensure it has focus
2. Press keys `1`, `2`, `3`, `4`, `5`, or `6` to simulate team buzzer presses
3. Press `R` to reset the system (works in all modes)
4. Test that shortcuts are disabled when settings/connection modals are open
5. Notice the enhanced larger circle and team names for better visibility

**Multiple Clients**:
1. Open main UI in multiple browser tabs/windows
2. Connect all clients
3. Simulate buzzer press from admin panel
4. Verify all clients show the same winner

#### Switching to Production

When ready to use real Arduino hardware:
1. Stop the development server
2. Open `buzzer.html` directly in browser (or use simple HTTP server)
3. The original Serial API functionality will work with Arduino

The development server automatically modifies the HTML to use WebSockets instead of Serial API, so no code changes are needed.

## Usage Instructions

### Initial Setup
1. **Hardware Connection**:
   - Connect XIAO to computer via USB
   - Verify TFT displays "Quiz Buzzer Ready!"
   - Test each buzzer by shorting pin to ground

2. **Web Interface**:
   - Open `buzzer.html` in Chrome/Edge
   - Click "Connect to Device"
   - Select XIAO serial port from list
   - Status should show "Connected ✔️"

### Operating the System

1. **Configure Team Names** (Optional):
   - Enter custom names in the 6 text fields
   - Names are automatically saved in browser

2. **Quiz Operation**:
   - Ask question to teams
   - First team to press buzzer wins
   - Winner displays on both TFT and web interface
   - System locks out other teams until reset

3. **Reset for Next Question**:
   - Press physical reset button on breadboard, OR
   - Click "Reset" button in web interface, OR
   - Press "R" key on keyboard (works in all modes)
   - Both displays clear and system unlocks

4. **Testing/Development**:
   - Use keyboard keys 1-6 to simulate buzzer presses
   - Use "R" key for quick reset
   - Enhanced large circle and team names for better visibility

### Serial Protocol

The XIAO communicates via USB Serial (115200 baud):

**Commands from XIAO**:
- `READY` - System startup
- `WINNER:X` - Team X (1-6) won
- `RESET` - System reset complete

**Commands to XIAO**:
- `RESET\n` - Reset the system

## Troubleshooting

### Common Issues

**TFT Display Not Working**:
- Check SPI mode jumpers (IM1,IM2,IM3 to 3.3V)
- Verify wiring connections
- Ensure 3.3V power supply adequate

**Buzzer False Triggers**:
- Check for loose connections
- Add 0.1µF capacitor across input and ground
- Use shielded cables for long runs
- Verify common ground connection

**Web Interface Connection Issues**:
- Use Chrome or Edge browser only
- Check USB cable connection
- Verify correct serial port selected
- Try refreshing page and reconnecting

**No Serial Port Visible**:
- Install Seeed XIAO nRF52840 drivers
- Check Device Manager (Windows) for COM port
- Try different USB cable/port

**Development Server Issues**:
- Ensure dev server is running on port 8000
- Check that no firewall is blocking the connection
- Try refreshing the browser page
- If port 8000 is in use:
  ```bash
  # Kill any existing process on port 8000
  lsof -ti:8000 | xargs kill -9
  # Then restart the dev server
  python dev_server.py
  ```
- For dependency issues:
  ```bash
  # Reinstall dependencies
  pip install --upgrade -r requirements.txt
  ```

### Testing Procedures

1. **Individual Buzzer Test**:
   ```
   - Connect only one buzzer
   - Press button, should see "WINNER:X" in serial monitor
   - TFT should display "Winner: X"
   ```

2. **Timing Test**:
   ```
   - Have two people press different buzzers simultaneously
   - Verify only one winner is registered
   - Test multiple times to ensure consistency
   ```

3. **Reset Test**:
   ```
   - Trigger a winner
   - Press reset button → should clear displays
   - Send "RESET" via serial monitor → should clear displays
   ```

## Advanced Features

### Development Tools
- **Hardware-Free Testing**: Use the development server to test UI functionality without physical hardware
- **Admin Panel**: Built-in admin interface at `/admin` for simulating buzzer events during testing
- **Real-time Logging**: Monitor all events and debugging information in the development environment
- **Environment Management**: Pre-configured conda environment for consistent setup across different systems
- **Keyboard Testing**: Use keys 1-6 for instant buzzer simulation, R for reset (works in all modes)

#### Development Tips
- **Modifying the UI**: Edit `buzzer.html` directly, refresh browser to see changes
- **Adding Features**: Modify `dev_server.py` to add new simulation capabilities
- **WebSocket Events**: Add new WebSocket events for additional functionality
- **Debugging**: Check browser console for client-side logs, server logs appear in terminal
- **Testing**: Admin panel shows real-time event log for comprehensive debugging

### Optional Enhancements
- **Buzzer LED Control**: Use 330Ω resistors + transistors to light winner's buzzer
- **Sound Effects**: Add Web Audio API sounds to web interface
- **Question Timer**: Add countdown timer functionality
- **Score Tracking**: Extend web interface to track points
- **Wireless Buzzers**: Use XIAO's BLE capability for wireless operation

### Customization
- **Team Colors**: Modify CSS in `buzzer.html` for color coding
- **Display Themes**: Add dark/light mode toggle
- **Font Sizes**: Adjust TFT text size for different viewing distances
- **Animation Effects**: Add more visual feedback in web interface

## Safety Notes

- Use appropriate wire gauge for 3-meter runs
- Secure all connections to prevent intermittent contact
- Test thoroughly before live use
- Have backup physical reset button accessible to quizmaster
- Ensure stable power supply (avoid overloading USB port)

## License

This project is open source. Feel free to modify and distribute.

## Contributing

Submit issues and pull requests to improve the system. Areas for contribution:
- Additional buzzer support (8, 10, 12 players)
- Mobile-responsive web interface
- Advanced timing features
- BLE wireless implementation

---

**Ready to build?** Start with the hardware setup and work through each section systematically. The system should be operational within a few hours of assembly time.



