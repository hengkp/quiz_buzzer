# DIY 6-Player Quiz Buzzer System with Cat-6 Infrastructure

## Overview

This project creates a professional-grade 6-player quiz buzzer system using an **ESP32-C "Node32s"** development board and standard Cat-6 cables for infrastructure. Each buzzer box connects via Cat-6 cable carrying signal, power, and control lines back to a central controller. The system detects the first button press, gates 3.3V to that team's box (lighting its LED and sounding its buzzer), and notifies a Mac-based web interface via USB-serial.

**Key Features:**
- ⚡ **Microsecond-level detection** of first button press
- 🌐 **Professional Cat-6 infrastructure** with RJ45 connectors
- 🔌 **Centralized power control** using P-channel MOSFETs
- 🖥️ **Web interface** for audience display and control
- 🔄 **Multiple reset options** (physical buttons + web interface)
- 📏 **Long-distance capability** (tested up to 5m cable runs)

![Quiz Buzzer System](https://img.shields.io/badge/Status-Ready%20to%20Build-green)
![Development Server](https://img.shields.io/badge/Dev%20Server-Ready-blue)

## Quick Navigation

- [📦 **Parts List**](#parts-list) - Complete component requirements
- [🔧 **Wiring**](#wiring-overview) - Cat-6 cable and MOSFET setup
- [💻 **Software Setup**](#software-setup) - Arduino and web interface
- [🎮 **Usage**](#usage-instructions) - Operating the system
- [🛠️ **Troubleshooting**](#troubleshooting) - Common issues and solutions

## System Architecture

```
    Mac/PC ────USB───► ESP32-C Node32s ────Cat-6 Cables───► 6x Buzzer Boxes
                            │
                      Breadboard with:
                      • 6x BS250 MOSFETs
                      • 6x Status LEDs  
                      • 2x Reset Buttons
                      • Power distribution
```

## Parts List (6 Channels)

### Core Components
| Component | Qty | Notes |
|-----------|-----|-------|
| **ESP32-C Node32s (USB-C dev board)** | 1 | Main MCU |
| **BS250 P-channel MOSFET (TO-92)** | 6 | High-side switch for 3.3V |

### Resistors (0.25W metal-film)
| Value | Qty | Purpose |
|-------|-----|---------|
| **10Ω (1%)** | 6 | Gate drive limiter |
| **100kΩ (1%)** | 6 | Gate pull-up |
| **220Ω (1%)** | 6 | LED current limit |

### Passive Components
| Component | Qty | Purpose |
|-----------|-----|---------|
| **Ceramic capacitors, 0.1µF** | 6 | Signal-line decoupling at MCU inputs |
| **5mm Green LEDs** | 6 | In-box "powered" indicator |

### Buttons & Switches
| Component | Qty | Purpose |
|-----------|-----|---------|
| **12mm momentary push-buttons (yellow/blue)** | 2 | Breadboard reset buttons |

### Infrastructure
| Component | Qty | Purpose |
|-----------|-----|---------|
| **RJ45 Keystone Jacks (8-pin)** | 6 | Mount in each buzzer box |
| **RJ45 Bent-Pin Breakouts** | 6 | Breadboard-side Cat-6 termination |
| **Cat-6 patch cable, 5m, RJ45–RJ45** | 6 | Carry Signal, GND, Power, Enable |
| **Cat-6 jumper, 10cm** | 6 | Inside box: jack → switch & LED/buzzer wiring |

### Hardware
| Component | Qty | Purpose |
|-----------|-----|---------|
| **Solderless breadboards (830-pt)** | 2 | One for MCU & MOSFET bank, one spare |
| **Male–male jumper wires, 20cm (40-pack)** | 1 | Hook up all pins and rails |

## Wiring Overview

### 1. Cat-6 Cable & RJ45 Pin Mapping (per box)

| RJ45 Pin | Cat-6 Color | Function | Controller Side | Box Side |
|----------|-------------|----------|-----------------|----------|
| 1 | White/Orange | BUZZER_SIGNAL | → ESP32 input (INPUT_PULLUP) | → one leg of push-button |
| 2 | Solid Orange | GND | → GND rail | → other leg of push-button & LED/buzzer "–" |
| 3 | White/Green | 3.3V POWER | → MOSFET drain | → LED/buzzer "+" |
| 4 | Solid Green | ENABLE (gate ctrl) | → MOSFET gate via 10Ω & 100kΩ | → unconnected (in-box) |
| 5–8 | *unused* | | | |

### 2. Buzzer Box Internal Wiring
- **Push-button** between Pin 1 and Pin 2
- **5mm Green LED** (optional) from Pin 3 → Pin 2 with 220Ω series resistor
- **Buzzer or in-box light** also from Pin 3 → Pin 2

### 3. Breadboard Power-Gate Bank (×6)

For each channel, build this MOSFET circuit:

```
   +3.3V rail
       │
     Source
  ┌───┴───┐
  │ BS250 │
  └───┬───┘
Drain ──► RJ45 Pin 3 → box V+
       │
Gate ──┼─[10Ω]─► ESP32 GPIO (active LOW to enable)
       │
     [100kΩ]
       │
   +3.3V rail
```

- **MOSFET Source** → +3.3V
- **Drain** → RJ45 Pin 3 (power out)
- **Gate** → ESP32 "enable" pin through 10Ω; pulled up to 3.3V by 100kΩ

### 4. ESP32-C Pin Assignments

| Signal | Example Pin | Mode | Notes |
|--------|-------------|------|-------|
| **Buzz-in inputs (6x)** | GPIO 0,1,4,5,6,7 | INPUT_PULLUP | Active LOW detection |
| **MOSFET enables (6x)** | GPIO A0–A5 | OUTPUT | HIGH=off, LOW=on |
| **Status LEDs (6x)** | GPIO 10–15 | OUTPUT | HIGH=off, LOW=on |
| **Yellow Reset button** | GPIO 8 | INPUT_PULLUP | Active LOW |
| **Blue Reset button** | GPIO 9 | INPUT_PULLUP | Active LOW |

### 5. Reset Buttons
- Wire each button between its GPIO and GND
- Use INPUT_PULLUP; detect LOW to trigger resetGame()

## Power Control Logic

**Normal State (Ready for Questions):**
- All Enable pins (A0-A5) = HIGH
- All MOSFETs OFF → No power to any buzzer box
- Teams can press buttons (signal detection still works)

**Winner Locked State:**
- All Enable pins = HIGH (turn everything OFF)
- Winner's Enable pin = LOW (power only the winner's box)
- Winner's LED/buzzer can light up/sound

**Reset State:**
- All Enable pins = HIGH 
- All MOSFETs OFF → No power to any buzzer box
- System ready for next question

## Software Setup

### Environment Setup

#### Option 1: Conda Environment (Recommended)

```bash
# Create the environment from the provided YAML file
conda env create -f environment.yml

# Activate the environment
conda activate quiz_buzzer

# Start the development server (for testing UI without hardware)
cd web
python dev_server.py
```

#### Option 2: Python Virtual Environment

```bash
# Create virtual environment
python -m venv quiz_buzzer_env

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
   - Go to File → Preferences
   - Add to Additional Boards Manager URLs:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "ESP32" and install "esp32 by Espressif Systems"

2. **Board Selection**:
   - Select Board: "ESP32C3 Dev Module" (or similar ESP32-C variant)
   - Select correct COM port
   - Set upload speed to 921600

3. **Upload Firmware**:
   - Open `arduino/quiz_buzzer.ino`
   - Upload code to ESP32-C board

### Web Interface Setup

**Browser Requirements**: Chrome or Edge (Web Serial API support required)

**Option A: Development Server (Recommended for Testing)**:
```bash
conda activate quiz_buzzer
cd web
python dev_server.py

# Access interfaces:
# Main UI: http://localhost:8000
# Admin Panel: http://localhost:8000/admin
```

**Option B: Direct File Access**:
- Open `web/buzzer.html` in Chrome/Edge
- Connect directly to ESP32-C via Web Serial API

## Usage Instructions

### Initial Setup
1. **Hardware Connection**:
   - Connect ESP32-C to computer via USB
   - Verify all 6 status LEDs are OFF (system ready)
   - Test each buzzer by pressing buttons

2. **Web Interface**:
   - Open `buzzer.html` in Chrome/Edge
   - Click "Connect to Device"
   - Select ESP32-C serial port from list
   - Status should show "Connected ✔️"

### Operating the System

1. **Configure Team Names** (Optional):
   - Click settings gear icon
   - Enter custom names for each team
   - Names are automatically saved in browser

2. **Quiz Operation**:
   - Ask question to teams
   - First team to press buzzer wins
   - Winner's LED lights up and displays on web interface
   - System locks out other teams until reset

3. **Reset for Next Question**:
   - Press either physical reset button (yellow or blue) on breadboard, OR
   - Click "Reset" button in web interface, OR
   - Send "RESET" command via serial
   - All status LEDs turn OFF and system unlocks

### Development & Testing

**Development Server Features**:
- 🎮 **Hardware-Free Testing**: Test UI without ESP32-C hardware
- 🔧 **Admin Panel**: Simulate buzzer events manually
- ⌨️ **Keyboard Controls**: Use keys 1-6 for buzzer simulation, R for reset

**Testing the Interface**:
1. Start development server: `python dev_server.py`
2. Open Main UI: http://localhost:8000
3. Open Admin Panel: http://localhost:8000/admin
4. Use admin panel to simulate buzzer presses
5. Test keyboard shortcuts (1-6 for teams, R for reset)

## Troubleshooting

### Hardware Issues

**MOSFET Not Switching**:
- Check BS250 pinout (different from N-channel!)
- Verify Source connects to +3.3V, Drain to load
- Ensure 10Ω gate resistor and 100kΩ pull-up present
- Test with multimeter: Gate should be ~3.3V when OFF, ~0V when ON

**Buzzer False Triggers**:
- Add 0.1µF capacitor across buzzer input and ground
- Check for loose Cat-6 connections
- Verify solid ground reference (RJ45 Pin 2)
- Use shielded Cat-6 for noisy environments

**Status LEDs Always On/Off**:
- Check LED polarity and current-limiting resistors
- Verify GPIO pin assignments match code
- Test LED control with simple digitalWrite() test

### Software Issues

**No Serial Port Visible**:
- Install ESP32 USB drivers if needed
- Check Device Manager (Windows) / System Information (Mac)
- Try different USB cable/port
- Press and hold BOOT button while connecting (some ESP32-C boards)

**Web Interface Connection Problems**:
- Use Chrome or Edge browsers only (Web Serial API support)
- Check that ESP32-C is sending "READY" message on startup
- Verify baud rate (115200)
- Try refreshing page and reconnecting

### Cable Testing

**Cat-6 Continuity Test**:
```
Use multimeter to verify each RJ45 pin:
Pin 1 (White/Orange) → Buzzer switch terminal
Pin 2 (Solid Orange) → Ground reference  
Pin 3 (White/Green) → Power output from MOSFET
Pin 4 (Solid Green) → Gate control (unused in box)
```

**Signal Quality**:
- Cat-6 cables tested up to 5 meters successfully
- For longer runs, consider Cat-6A (better shielding)
- Avoid running parallel to AC power lines

## Serial Protocol

The ESP32-C communicates via USB Serial (115200 baud):

**Commands from ESP32-C**:
- `READY` - System startup complete
- `WINNER:X` - Team X (1-6) buzzed in first
- `RESET` - System reset complete

**Commands to ESP32-C**:
- `RESET\n` - Reset the system

## Advanced Features & Enhancements

### Optional Improvements
- **Sound Effects**: Add Web Audio API sounds to web interface
- **Question Timer**: Implement countdown timer functionality
- **Score Tracking**: Extend web interface to track points per team
- **Multiple Instances**: Run multiple buzzer systems simultaneously

### Scaling the System
- **8-12 Player Support**: Add more MOSFETs and GPIO pins
- **Wireless Buzzers**: Use ESP32's WiFi capability for wireless boxes
- **Tournament Mode**: Software enhancements for competition management

## Safety & Best Practices

- Use appropriate wire gauge for 5-meter Cat-6 runs
- Secure all RJ45 connections to prevent intermittent contact
- Test thoroughly before live quiz events
- Keep backup physical reset button accessible to quizmaster
- Label all cables clearly for quick setup/teardown

## License

This project is open source. Feel free to modify and distribute.

## Contributing

Submit issues and pull requests to improve the system. Areas for contribution:
- Additional player support (8, 10, 12 players)
- Mobile-responsive web interface
- Advanced timing features
- Tournament management software

---

**Ready to build?** Start with the parts list and work through the wiring instructions systematically. The Cat-6 infrastructure provides a professional, reliable foundation for your quiz events.



