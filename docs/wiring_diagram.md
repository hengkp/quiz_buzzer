# 🔧 Quiz Buzzer Wiring Diagram

## ⚡ YOUR ESP32 Board Pin Configuration

Based on your actual ESP32 board pinout, here are the **confirmed available GPIO pins**:

**Your Board Layout:**
```
Right side (USB-C at bottom): 3V3, GND, D15, D2, D4, RX2, TX2, D5, D18, D19, D21, RX0, TX0, D22, D23
Left side:                    VIN, GND, D13, D14, D27, D26, D25, D33, D32, D35, D34, Vn, VP, EN
```

## 📍 NEW Pin Assignments (Optimized for Your Board)

### 🏆 2-Team Configuration (`quiz_2teams.ino`):

```
Team 1 Button:  GPIO13 (D13) → GND
Team 2 Button:  GPIO14 (D14) → GND  
Team 1 LED:     GPIO18 (D18) → 220Ω → LED+ → GND
Team 2 LED:     GPIO19 (D19) → 220Ω → LED+ → GND
```

### 🏆 6-Team Configuration (`quiz_buzzer.ino`):

```
Team Buttons (INPUT_PULLUP):
- Team 1: GPIO4  (D4)  → GND
- Team 2: GPIO5  (D5)  → GND
- Team 3: GPIO13 (D13) → GND
- Team 4: GPIO14 (D14) → GND
- Team 5: GPIO21 (D21) → GND
- Team 6: GPIO22 (D22) → GND

Team LEDs (OUTPUT):
- Team 1: GPIO18 (D18) → 220Ω → LED+ → GND
- Team 2: GPIO19 (D19) → 220Ω → LED+ → GND
- Team 3: GPIO23 (D23) → 220Ω → LED+ → GND
- Team 4: GPIO25 (D25) → 220Ω → LED+ → GND
- Team 5: GPIO26 (D26) → 220Ω → LED+ → GND
- Team 6: GPIO27 (D27) → 220Ω → LED+ → GND
```

## 🔌 Complete Wiring Instructions

### 2-Team Setup (Testing):

#### Team 1 Circuit:
```
ESP32 D13 ────[Button]──── GND
ESP32 D18 ────[220Ω]────[LED+]──── GND
```

#### Team 2 Circuit:
```
ESP32 D14 ────[Button]──── GND
ESP32 D19 ────[220Ω]────[LED+]──── GND
```

### 6-Team Setup (Full System):

#### Buttons (All use INPUT_PULLUP):
```
D4  ────[Team 1 Button]──── GND
D5  ────[Team 2 Button]──── GND
D13 ────[Team 3 Button]──── GND
D14 ────[Team 4 Button]──── GND
D21 ────[Team 5 Button]──── GND
D22 ────[Team 6 Button]──── GND
```

#### LEDs (All use 220Ω current limiting):
```
D18 ────[220Ω]────[Team 1 LED+]──── GND
D19 ────[220Ω]────[Team 2 LED+]──── GND
D23 ────[220Ω]────[Team 3 LED+]──── GND
D25 ────[220Ω]────[Team 4 LED+]──── GND
D26 ────[220Ω]────[Team 5 LED+]──── GND
D27 ────[220Ω]────[Team 6 LED+]──── GND
```

## 🚫 Why These Pins Are SAFE

✅ **Pins We're Using (Safe):**
- **D4, D5**: General purpose I/O, no conflicts
- **D13, D14**: General purpose I/O, no conflicts
- **D18, D19**: General purpose I/O, no conflicts
- **D21, D22, D23**: General purpose I/O, no conflicts
- **D25, D26, D27**: General purpose I/O, no conflicts

❌ **Pins We're AVOIDING (Problematic):**
- **D2**: Built-in LED (causes serial corruption)
- **D15**: Strapping pin (affects boot mode)
- **RX0, TX0**: Serial programming pins
- **RX2, TX2**: Serial2 (better to avoid)
- **D34, D35**: Input-only pins (can't drive LEDs)
- **VP, Vn**: Analog-only pins
- **EN**: Reset/Enable pin

## 🛠️ Detailed Component Connections

### Buttons (INPUT_PULLUP Configuration):
- **No external resistors needed** (using internal pullup)
- **Wiring**: One leg to GPIO pin, other leg to GND
- **Logic**: HIGH when released, LOW when pressed
- **Debounce**: 20ms software debounce in code

### LEDs (OUTPUT Configuration):
- **Current limiting**: 220Ω resistor required
- **Wiring**: GPIO → 220Ω resistor → LED anode (long leg) → LED cathode (short leg) → GND
- **Logic**: HIGH = LED on, LOW = LED off
- **Current**: ~3.3V / 220Ω = 15mA (safe for ESP32)

### Power Connections:
```
ESP32 VIN ──── 5V (from USB)
ESP32 3V3 ──── 3.3V (regulated output) 
ESP32 GND ──── Common ground for all components
```

## 🔧 Arduino IDE Configuration

**Critical Settings for Your Board:**
```
Board: "ESP32 Dev Module"
Upload Speed: 921600
CPU Frequency: 240MHz
Flash Frequency: 80MHz
Flash Mode: QIO
Flash Size: 4MB
Partition Scheme: Default
Baud Rate: 115200
```

## 🧪 Testing Procedure

### Step 1: Hardware Verification
1. **Connect ESP32 via USB**
2. **Wire 2-team circuit** (D13, D14, D18, D19)
3. **Upload `quiz_2teams.ino`**
4. **Open Serial Monitor at 115200 baud**
5. **Should see**: `READY`

### Step 2: Button Testing
```
Press Team 1 button (D13) → Should see: WINNER:1
Press Team 2 button (D14) → Should see: WINNER:2
Type: RESET → Should see: READY
```

### Step 3: LED Testing
```
Press Team 1 button → D18 LED should light up
Press Team 2 button → D19 LED should light up
Type: RESET → All LEDs should turn off
```

### Step 4: Web Interface Testing
1. **Close Serial Monitor**
2. **Run**: `cd web && python dev_server.py`
3. **Open**: http://localhost:8000/admin
4. **Should see 6 team buttons with GPIO pin labels**
5. **Test keyboard keys 1-6 and R**

## 🐛 Troubleshooting Your Board

### Problem: Still Getting Corrupted Serial ()
**Solution**: 
1. ✅ Verify board selection: "ESP32 Dev Module"
2. ✅ Check baud rate: 115200 in both Arduino and Serial Monitor
3. ✅ Try different USB cable
4. ✅ Power cycle ESP32

### Problem: Buttons Not Responding
**Solution**:
1. ✅ Check wiring: GPIO pin to one button leg, other leg to GND
2. ✅ Verify pin numbers: D4, D5, D13, D14, D21, D22
3. ✅ Test button continuity with multimeter
4. ✅ Ensure momentary (not latching) buttons

### Problem: LEDs Not Lighting
**Solution**:
1. ✅ Check LED polarity: Long leg (anode) to resistor
2. ✅ Verify 220Ω resistor value (Red-Red-Brown bands)
3. ✅ Confirm GPIO pins: D18, D19, D23, D25, D26, D27
4. ✅ Test LED with 3V battery to verify it works

### Problem: Web Interface Connection
**Solution**:
1. ✅ Use Chrome or Edge browser (Web Serial API required)
2. ✅ Close Serial Monitor before running web server
3. ✅ Check URL: http://localhost:8000 (not https)

## 📋 Bill of Materials (Updated)

### For 2-Team Testing:
- **1x ESP32 board** (your FCC ID 2a53n-esp32)
- **2x Push buttons** (momentary, normally open)
- **2x LEDs** (any color, 5mm)
- **2x 220Ω resistors**
- **Breadboard + jumper wires**
- **USB cable**

### For 6-Team Full System:
- **1x ESP32 board** (your FCC ID 2a53n-esp32)
- **6x Push buttons** (momentary, normally open)
- **6x LEDs** (any color, 5mm)
- **6x 220Ω resistors**
- **Breadboard or PCB**
- **Jumper wires**
- **6x Buzzer boxes** (optional enclosures)
- **Cat-6 cables** (optional for remote boxes)

## 🎯 Expected Performance

### Normal Operation:
- **Serial startup**: `READY` within 2 seconds
- **Button response**: `WINNER:X` within 50ms
- **LED response**: Light up within 100ms  
- **Reset time**: All LEDs off within 200ms

This configuration uses your **actual available GPIO pins** and avoids all the problematic pins that were causing serial corruption and connection issues. 