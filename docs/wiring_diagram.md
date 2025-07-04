# Detailed Wiring Diagram - ESP32-C Node32s Quiz Buzzer System

## Component Layout Overview

```
                    ┌─────────────────┐
                    │   Mac/PC USB    │
                    └─────────┬───────┘
                              │ USB-C Cable
                    ┌─────────▼───────┐
                    │ ESP32-C Node32s │
                    │                 │
                    │  GPIO 0,1,4,5,6,7│◄─── Buzzer Inputs (6x)
                    │  GPIO A0–A5     │◄─── MOSFET Enable (6x)
                    │  GPIO 10–15     │◄─── Status LEDs (6x)
                    │  GPIO 8,9       │◄─── Reset Buttons (Yellow/Blue)
                    │  3V3 GND        │
                    └─────────────────┘
                              │
                    ┌─────────▼───────┐
                    │   Web Interface │
                    │  (Chrome/Edge)  │
                    └─────────────────┘

    Power-Gate Bank (6x BS250 P-Channel MOSFETs on breadboard):
    ┌─────────────────────────────────────────────────┐
    │ +3.3V ─── BS250 ─── RJ45 Pin3 ───► Team 1 Power │
    │           Gate ◄─── A0 (Enable 1)               │
    │                                                 │
    │ +3.3V ─── BS250 ─── RJ45 Pin3 ───► Team 2 Power │
    │           Gate ◄─── A1 (Enable 2)               │
    │                                                 │
    │         ... (repeat for Teams 3-6) ...         │
    └─────────────────────────────────────────────────┘

    Team Connections (Cat-6 cables with RJ45 connectors):
    Team 1 ────5m Cat-6───► Signal:GPIO0, GND:GND, Power:BS250-1, Enable:A0
    Team 2 ────5m Cat-6───► Signal:GPIO1, GND:GND, Power:BS250-2, Enable:A1  
    Team 3 ────5m Cat-6───► Signal:GPIO4, GND:GND, Power:BS250-3, Enable:A2
    Team 4 ────5m Cat-6───► Signal:GPIO5, GND:GND, Power:BS250-4, Enable:A3
    Team 5 ────5m Cat-6───► Signal:GPIO6, GND:GND, Power:BS250-5, Enable:A4
    Team 6 ────5m Cat-6───► Signal:GPIO7, GND:GND, Power:BS250-6, Enable:A5
    
    Reset Buttons:
    Yellow ────────────► GPIO 8
    Blue   ────────────► GPIO 9
```

## Cat-6 Cable & RJ45 Pin Mapping

Each buzzer box uses **4 conductors** from Cat-6 cable with standard color coding:

| RJ45 Pin | Wire Color | Function | Direction | ESP32-C Side | Box Side |
|----------|------------|----------|-----------|--------------|----------|
| 1 | White/Orange | BUZZER_SIGNAL | Input | GPIO pin (INPUT_PULLUP) | One leg of push-button |
| 2 | Solid Orange | GND | Ground | Common ground rail | Other leg of button & LED "–" |
| 3 | White/Green | POWER | Output | BS250 MOSFET drain | LED/buzzer "+" |
| 4 | Solid Green | ENABLE | Control | MOSFET gate (via resistors) | Unused (gate control) |
| 5-8 | *Unused* | - | - | - | - |

## Step-by-Step Wiring Instructions

### Step 1: Prepare the Breadboard

1. Place ESP32-C Node32s on breadboard
2. Connect power rails:
   - ESP32-C 3V3 → breadboard positive rail (red)
   - ESP32-C GND → breadboard negative rail (black/blue)

### Step 2: Build Power-Gate Bank (6x BS250 P-Channel MOSFETs)

For each of the 6 teams, build this circuit on the breadboard:

```
       +3.3V rail
           │
         ┌─┴─┐ Source
         │BS │  BS250 P-Channel MOSFET (TO-92 package)
         │250│
         │   │
         └─┬─┘ Drain ──► RJ45 Pin 3 (POWER) out to buzzer box
 Gate ──10Ω┤    
           │
      100kΩ│ (pull-up resistor)
           └──┬───► to +3.3V rail
             
 ESP32 Pin AX ─► Gate control (Enable signal, active LOW)
```

**Component Requirements per MOSFET:**
- 1x BS250 P-Channel MOSFET (TO-92 package)  
- 1x 10Ω resistor (gate drive limiter)
- 1x 100kΩ resistor (pull-up to 3.3V)

**BS250 Pinout (TO-92, flat side facing you):**
```
     ┌─────┐
     │ BS  │ Flat side
     │ 250 │
     └──┬──┘
   Gate │ │ Source (+3.3V)
        │ │
        │ └─── Drain (to load)
        └───── Gate
```

**MOSFET Assignments:**
- Team 1: Enable → A0, Power out → RJ45-1 Pin 3
- Team 2: Enable → A1, Power out → RJ45-2 Pin 3  
- Team 3: Enable → A2, Power out → RJ45-3 Pin 3
- Team 4: Enable → A3, Power out → RJ45-4 Pin 3
- Team 5: Enable → A4, Power out → RJ45-5 Pin 3
- Team 6: Enable → A5, Power out → RJ45-6 Pin 3

### Step 3: Status LEDs (6x on Breadboard)

Each status LED shows which team's power is active:

| Team | ESP32-C Pin | LED Connection |
|------|-------------|----------------|
| 1 | GPIO 10 | LED anode → MOSFET drain, cathode → GPIO 10 via 220Ω |
| 2 | GPIO 11 | LED anode → MOSFET drain, cathode → GPIO 11 via 220Ω |
| 3 | GPIO 12 | LED anode → MOSFET drain, cathode → GPIO 12 via 220Ω |
| 4 | GPIO 13 | LED anode → MOSFET drain, cathode → GPIO 13 via 220Ω |
| 5 | GPIO 14 | LED anode → MOSFET drain, cathode → GPIO 14 via 220Ω |
| 6 | GPIO 15 | LED anode → MOSFET drain, cathode → GPIO 15 via 220Ω |

**LED Control Logic:**
- GPIO pin HIGH = LED OFF (cathode pulled up)
- GPIO pin LOW = LED ON (current flows through 220Ω resistor)

### Step 4: Buzzer Box Connections (Simplified)

Each buzzer box contains **only**:
1. RJ45 Keystone Jack
2. Momentary push-button switch 
3. 5mm Green LED (optional) for "powered" indicator
4. Buzzer or light for audio/visual feedback

**Inside each buzzer box**:
```
RJ45 Keystone Jack          Components
┌─────────────────┐        ┌─────────────┐
│ Pin 1 (Signal)  │────────│ Button Leg 1│
│ Pin 2 (Ground)  │────┬───│ Button Leg 2│
│ Pin 3 (Power)   │────┼───│ LED/Buzz +  │
│ Pin 4 (Enable)  │    └───│ LED/Buzz -  │
│ Pins 5-8 (NC)   │        └─────────────┘
└─────────────────┘
```

**No internal MOSFETs or complex circuits needed in the boxes!**

### Step 5: Reset Buttons (Yellow & Blue)

Two simple momentary pushbuttons on the main breadboard:

| Button Color | ESP32-C Pin | Wiring |
|--------------|-------------|--------|
| Yellow | GPIO 8 | One terminal → GPIO 8, other → GND |
| Blue | GPIO 9 | One terminal → GPIO 9, other → GND |

Both use INPUT_PULLUP mode in software (normally HIGH, LOW when pressed).

### Step 6: Power Connection

- Connect ESP32-C to Mac/PC via USB-C cable
- This provides both power (5V → 3.3V regulated) and serial communication
- No external power supply needed

## Complete Pin Usage Table

| ESP32-C Pin | Function | Connection | Pull-up | Notes |
|-------------|----------|------------|---------|-------|
| GPIO 0 | Buzzer 1 Signal | RJ45-1 Pin 1 | Internal | Active LOW |
| GPIO 1 | Buzzer 2 Signal | RJ45-2 Pin 1 | Internal | Active LOW |
| GPIO 4 | Buzzer 3 Signal | RJ45-3 Pin 1 | Internal | Active LOW |
| GPIO 5 | Buzzer 4 Signal | RJ45-4 Pin 1 | Internal | Active LOW |
| GPIO 6 | Buzzer 5 Signal | RJ45-5 Pin 1 | Internal | Active LOW |
| GPIO 7 | Buzzer 6 Signal | RJ45-6 Pin 1 | Internal | Active LOW |
| GPIO 8 | Yellow Reset Btn | Button to GND | Internal | Active LOW |
| GPIO 9 | Blue Reset Btn | Button to GND | Internal | Active LOW |
| GPIO 10 | Status LED 1 | LED cathode via 220Ω | - | Active LOW |
| GPIO 11 | Status LED 2 | LED cathode via 220Ω | - | Active LOW |
| GPIO 12 | Status LED 3 | LED cathode via 220Ω | - | Active LOW |
| GPIO 13 | Status LED 4 | LED cathode via 220Ω | - | Active LOW |
| GPIO 14 | Status LED 5 | LED cathode via 220Ω | - | Active LOW |
| GPIO 15 | Status LED 6 | LED cathode via 220Ω | - | Active LOW |
| A0 | Enable 1 | BS250 Gate 1 via 10Ω | - | Active LOW |
| A1 | Enable 2 | BS250 Gate 2 via 10Ω | - | Active LOW |
| A2 | Enable 3 | BS250 Gate 3 via 10Ω | - | Active LOW |
| A3 | Enable 4 | BS250 Gate 4 via 10Ω | - | Active LOW |
| A4 | Enable 5 | BS250 Gate 5 via 10Ω | - | Active LOW |
| A5 | Enable 6 | BS250 Gate 6 via 10Ω | - | Active LOW |
| 3V3 | Power | BS250 Sources + breadboard rail | - | 3.3V supply |
| GND | Ground | Common + RJ45 Pin 2 | - | All grounds |

## Power Control Logic

**Normal State (Ready for Questions):**
- All Enable pins (A0-A5) = HIGH
- All BS250 MOSFETs OFF → No power to any buzzer box
- Teams can press buttons (signal detection still works)
- All status LEDs OFF

**Winner Locked State:**
- All Enable pins = HIGH (turn everything OFF first)
- Winner's Enable pin = LOW (power only the winner's box)
- Winner's status LED ON, others OFF
- Winner's box LED/buzzer can light up/sound

**Reset State:**
- All Enable pins = HIGH 
- All BS250 MOSFETs OFF → No power to any buzzer box
- All status LEDs OFF
- System ready for next question

## Cable Management & Testing

### Cat-6 Cable Assignments

**Standard Cat-6 Color Coding:**
```
Pair 1: White/Orange (Pin 1) + Solid Orange (Pin 2)
Pair 2: White/Green (Pin 3) + Solid Green (Pin 4)  
Pair 3: White/Blue + Solid Blue (unused)
Pair 4: White/Brown + Solid Brown (unused)
```

**Cable Labeling:**
- Label each 5m Cat-6 cable clearly: "TEAM 1", "TEAM 2", etc.
- Use cable ties every 50cm for strain relief
- Secure connections at both RJ45 ends

### Testing Procedures

**Individual Channel Test:**
1. Connect one Cat-6 cable between controller and buzzer box
2. Press buzzer button
3. Verify signal detection (check serial monitor for "WINNER:X")
4. Verify power control (status LED should light up)
5. Test reset functionality

**MOSFET Testing:**
1. Use multimeter to verify:
   - Source pin = +3.3V
   - Gate pin = +3.3V when OFF (Enable pin HIGH)
   - Gate pin = ~0V when ON (Enable pin LOW)
   - Drain pin = +3.3V when ON, floating when OFF

**Signal Integrity Test:**
1. Test all 6 channels simultaneously
2. Have multiple people press buttons at same time
3. Verify only first press is registered
4. Check for false triggers or missed presses

## Troubleshooting Wiring Issues

### MOSFET Problems
```
Symptom: LED/buzzer always on
Check:
- BS250 pinout (Source to +3.3V, not Drain!)
- Enable pin going HIGH when should be OFF
- 100kΩ pull-up resistor present (Gate→Source)

Symptom: LED/buzzer never lights
Check:
- BS250 connections (Source, Drain, Gate)
- Enable pin going LOW when winner selected
- 10Ω gate drive resistor present
- Power reaching buzzer box via Pin 3
```

### Signal Detection Problems
```
Symptom: False triggers
Check:
- Solid ground connections (RJ45 Pin 2)
- 0.1µF capacitor across input and ground
- Cable shielding for long runs

Symptom: No button response
Check:
- Continuity RJ45 Pin 1 to ESP32-C input
- Switch closing properly in buzzer box
- INPUT_PULLUP enabled in software
```

### Status LED Issues
```
Symptom: LEDs always on/off
Check:
- LED polarity (anode to MOSFET drain)
- 220Ω current limiting resistor
- GPIO pin control (HIGH=off, LOW=on)
- Common ground connections
```

This completes the updated wiring instructions for the ESP32-C Node32s system with Cat-6 infrastructure and centralized BS250 MOSFET power control. 