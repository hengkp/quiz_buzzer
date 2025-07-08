# 🏆 Quiz Buzzer System

A professional quiz buzzer system built with **ESP32** and a modern web interface. Perfect for classrooms, game shows, competitions, or any interactive quiz event.

## ✨ Features

- **6-Team Support**: Handles up to 6 teams simultaneously
- **Real-time Web Interface**: Modern, responsive UI with animations
- **Hardware Integration**: Direct connection to ESP32 via Web Serial API
- **🔒 HTTPS Support**: Secure connections for production deployment
- **Multi-mode Operation**: 
  - Development server simulation
  - Direct hardware connection
  - Standalone mode (keyboard simulation)
- **Cross-platform**: Works on Windows, macOS, and Linux
- **No Installation Required**: Runs directly in Chrome/Edge browsers

## 🎯 Quick Start

### Option 1: HTTP Development Mode
```bash
cd web
python dev_server.py
```
Open: http://localhost:8000

### Option 2: HTTPS Secure Mode
```bash
cd web
pip install -r requirements.txt
python dev_server.py --https
```
Open: https://localhost:8000

### Option 3: Hardware Connection
1. Upload Arduino code to ESP32
2. Serve HTML file: `python -m http.server 8080`
3. Open: http://localhost:8080/buzzer.html
4. Connect to Arduino via Web Serial API

## 🔧 Hardware Requirements

### ESP32 Board (FCC ID: 2a53n-esp32)
**Pin Configuration:**
```
Buttons: D4, D5, D13, D14, D21, D22 (Teams 1-6)
LEDs:    D18, D19, D23, D25, D26, D27 (Teams 1-6)
```

### Components (2-Team Testing)
- 1x ESP32 development board
- 2x Push buttons (momentary)
- 2x LEDs (5mm, any color)
- 2x 220Ω resistors
- Breadboard + jumper wires
- USB cable

### Components (6-Team Full System)
- 1x ESP32 development board  
- 6x Push buttons (momentary)
- 6x LEDs (5mm, any color)
- 6x 220Ω resistors
- Breadboard or PCB
- Jumper wires
- Optional: Cat-6 cables for remote buzzer boxes

## 🚀 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd quiz_buzzer
```

### 2. Install Python Dependencies
```bash
cd web
pip install -r requirements.txt
```

### 3. Arduino Setup
1. Install **ESP32 Arduino Core** in Arduino IDE
2. Select board: **"ESP32 Dev Module"**
3. Upload `arduino/quiz_2teams.ino` (testing) or `arduino/quiz_buzzer.ino` (full system)

### 4. Test the System
```bash
# Start development server
python dev_server.py

# Or with HTTPS
python dev_server.py --https
```

## 🔒 Security Features

### HTTPS Support
- **Self-signed certificates**: Automatic generation for development
- **Custom certificates**: Support for production SSL certificates
- **Encrypted communication**: All data protected in transit
- **Production ready**: Suitable for public deployments

### Usage Examples
```bash
# Basic HTTPS (self-signed)
python dev_server.py --https

# Production HTTPS (real certificate)
python dev_server.py --https --cert mycert.crt --key mykey.key

# Custom host and port
python dev_server.py --https --host 0.0.0.0 --port 8443
```

## 📱 Web Interface

### Main Features
- **Real-time buzzer detection**
- **Winner animations and effects**
- **Team customization** (names and colors)
- **Reset functionality**
- **Connection status indicators**
- **Keyboard simulation** (keys 1-6 for teams, R for reset)

### Admin Panel
Access the admin panel at `/admin` for:
- Team buzzer simulation
- System status monitoring
- Event logging
- GPIO pin reference

### Browser Support
- ✅ **Chrome/Edge**: Full Web Serial API support
- ⚠️ **Firefox**: Limited Web Serial API support
- ❌ **Safari**: No Web Serial API support

**Recommendation**: Use Chrome or Edge for the best experience.

## 🛠️ Configuration

### Arduino IDE Settings
```
Board: "ESP32 Dev Module"
Upload Speed: 921600
CPU Frequency: 240MHz
Flash Mode: QIO
Flash Size: 4MB
Baud Rate: 115200
```

### Server Options
```bash
python dev_server.py [OPTIONS]

Options:
  --https                Enable HTTPS with self-signed certificate
  --host HOST           Host to bind to (default: 0.0.0.0)
  --port PORT           Port to bind to (default: 8000)
  --cert CERT_FILE      Path to SSL certificate file
  --key KEY_FILE        Path to SSL private key file
```

## 📚 Documentation

- **[Setup Guide](SETUP.md)**: Detailed installation and configuration
- **[Wiring Diagram](docs/wiring_diagram.md)**: Hardware connection guide  
- **[HTTPS Settings](docs/https_settings.md)**: SSL/TLS configuration and certificate generation
- **[Troubleshooting](docs/troubleshooting.md)**: Common issues and solutions

## 🎮 Usage Modes

### 1. Development/Testing Mode
```bash
python dev_server.py
```
- Simulates Arduino hardware
- Perfect for testing UI and logic
- Keyboard shortcuts work (1-6, R)

### 2. Secure Development Mode
```bash
python dev_server.py --https
```
- Same as development mode but with HTTPS
- Self-signed certificate (browser warning expected)
- Ideal for network testing

### 3. Hardware Mode
```bash
python -m http.server 8080
```
- Connects to real ESP32 hardware
- Web Serial API communication
- Physical buttons and LEDs

### 4. Production Mode
```bash
python dev_server.py --https --cert cert.crt --key key.key --host 0.0.0.0 --port 443
```
- Real SSL certificate
- Public internet access
- Full security and encryption

## 🧪 Testing

### Hardware Testing
1. **Serial Monitor**: Should show `READY` at 115200 baud
2. **Button Test**: Press buttons → see `WINNER:X`
3. **LED Test**: LEDs light up when buttons pressed
4. **Reset Test**: Type `RESET` → see `READY`, LEDs turn off

### Web Interface Testing
1. **Development Server**: http://localhost:8000
2. **HTTPS Server**: https://localhost:8000
3. **Admin Panel**: `/admin` endpoint
4. **Keyboard Simulation**: Keys 1-6 and R

### Integration Testing
1. **Arduino Connection**: Web Serial API
2. **Real-time Communication**: Button press → web animation
3. **Reset Functionality**: Web reset → Arduino reset

## 🔍 Troubleshooting

### Common Issues

**Serial Corruption ( characters)**
- Verify board selection: "ESP32 Dev Module"
- Check baud rate: 115200 in both Arduino and Serial Monitor

**HTTPS Certificate Warnings**
- Self-signed: Click "Advanced" → "Proceed to localhost"
- Production: Verify certificate matches domain

**LEDs Not Working**
- Check polarity: Long leg (anode) to resistor
- Verify GPIO pins: D18, D19, D23, D25, D26, D27

**Web Serial API Issues**
- Use Chrome or Edge browser
- Ensure HTTPS for non-localhost domains
- Close Serial Monitor before connecting

## 🚀 Deployment

### Local Network
```bash
python dev_server.py --https --host 0.0.0.0 --port 8443
```
Access from any device: `https://YOUR_IP:8443`

### Internet (Production)
```bash
python dev_server.py --https --cert /path/to/cert.crt --key /path/to/key.key --host 0.0.0.0 --port 443
```
Requirements:
- Domain name
- Valid SSL certificate
- Firewall configuration (port 443)

## 📞 Support

For issues or questions:
1. Check the [troubleshooting guide](docs/troubleshooting.md)
2. Verify [wiring diagram](docs/wiring_diagram.md)
3. Review [HTTPS settings guide](docs/https_settings.md)
4. Test with development server first

## 🎯 Use Cases

- **Educational**: Classroom quizzes and interactive learning
- **Entertainment**: Game shows and trivia nights
- **Corporate**: Training sessions and team building
- **Events**: Conferences and competitive gaming
- **Broadcasting**: Live quiz shows with remote participants

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript with modern web APIs
- **Backend**: Python Flask with WebSocket support
- **Hardware**: ESP32 microcontroller with direct GPIO control
- **Communication**: Web Serial API for hardware, WebSocket for simulation
- **Security**: SSL/TLS encryption for all modes

---

**Built with ❤️ for interactive learning and fun competitions!** 🎉

The system now supports both **HTTP** (development) and **🔒 HTTPS** (production) for maximum flexibility and security.



