# Quick Setup Guide

## 🚀 Get Started in 3 Steps

### Step 1: Hardware Assembly (45 minutes)
1. **Gather Parts**:
   - Seeed XIAO nRF52840
   - 2.4" TFT LCD (Adafruit 2478)
   - 6 buzzer buttons + 3m Cat-6 cables (4-wire each)
   - 6x P-Channel MOSFETs (AO3401 or IRLML6401)
   - 6x 10Ω resistors (gate drive)
   - 6x 100kΩ resistors (pull-up)
   - Breadboard + jumper wires
   - RJ45 keystone jacks for buzzer boxes

2. **Wire Connections**:
   - Follow `docs/wiring_diagram.md` for detailed connections
   - **New**: Build power-gate bank with 6 MOSFETs on breadboard
   - **Key**: Signals → D0-D7, Enables → A0-A5, TFT → SPI pins
   - **Critical**: Set TFT SPI jumpers (IM1,IM2,IM3 HIGH)
   - **4-Wire per buzzer**: Signal, Ground, Power, Enable

### Step 2: Software Setup (15 minutes)
1. **Arduino IDE**:
   ```
   - Install Seeed nRF52840 board support
   - Install Adafruit ILI9341 + GFX libraries
   - Upload arduino/quiz_buzzer.ino
   - Verify "READY" in Serial Monitor
   ```

2. **Web Interface**:
   ```bash
   # Option A: Python web server
   cd web
   python -m http.server 8000
   # Open http://localhost:8000/buzzer.html in Chrome
   
   # Option B: Direct file (Chrome with flags)
   chrome --allow-file-access-from-files web/buzzer.html
   ```

### Step 3: Test & Use (5 minutes)
1. **Connect**: Click "Connect to Device" in web interface
2. **Test**: Press each buzzer, verify winner displays AND lights up
3. **Reset**: Use physical button or web reset (all lights should turn off)
4. **Customize**: Add team names in web interface
5. **Quiz Time!** 🎉

## 💡 Quick Troubleshooting
- **TFT blank?** Check SPI jumpers and wiring
- **No web connection?** Use Chrome/Edge only, check USB cable
- **Buzzer always lit?** Check MOSFET polarity, enable pin state
- **Buzzer never lights?** Verify MOSFET gate connection, 10Ω resistor
- **False triggers?** Verify ground connections, add 0.1µF caps
- **Need help?** See `docs/troubleshooting.md`

## 📋 Updated Parts Checklist

### Core Components
- [ ] XIAO nRF52840 microcontroller
- [ ] 2.4" TFT LCD with SPI jumpers set
- [ ] 6x buzzer buttons with LEDs/buzzers
- [ ] 1x reset pushbutton
- [ ] Breadboard (full-size recommended for MOSFET bank)
- [ ] USB-C cable for programming/power

### Power Control Components (NEW)
- [ ] 6x P-Channel MOSFETs (AO3401, IRLML6401, or BSS84)
- [ ] 6x 10Ω resistors (1/4W, for gate drive)
- [ ] 6x 100kΩ resistors (1/4W, pull-up)
- [ ] Jumper wires for breadboard connections

### Cabling System (UPDATED)
- [ ] 3x Cat-6 Ethernet cables (3m each, supports 2 teams per cable)
- [ ] 6x RJ45 keystone jacks (for buzzer boxes)
- [ ] 6x small project boxes for buzzer housing
- [ ] Wire strippers and crimping tools

## 🔌 New 4-Wire System Benefits
- **Simpler buzzer boxes**: No MOSFETs or resistors inside
- **Centralized control**: All power logic on main breadboard
- **Visual feedback**: Winner's buzzer lights up automatically
- **Plug-and-play**: Buzzer boxes just need jack + switch + LED
- **Easier troubleshooting**: All complex circuits in one place

## ⚠️ Important Hardware Notes
1. **P-Channel MOSFETs**: Source connects to +3.3V, Drain to buzzer power
2. **Active LOW enable**: Enable pin HIGH = OFF, LOW = ON
3. **Pull-up resistors**: 100kΩ from Gate to Source (keeps MOSFETs OFF by default)
4. **Gate drive**: 10Ω resistor between MCU pin and MOSFET gate
5. **Cable pairs**: Use Cat-6 twisted pairs for better signal integrity

## 🎯 Ready to Build?
The new design requires more components but provides better functionality:
- **Assembly time**: ~1 hour (was 45 minutes)
- **Wiring complexity**: Moderate (centralized on breadboard)
- **Buzzer boxes**: Much simpler (just jack + switch + LED)

Start with the power-gate bank assembly, then buzzer connections.
For detailed instructions, see the main `README.md` and `docs/wiring_diagram.md`.

**Questions?** Open an issue on GitHub! 