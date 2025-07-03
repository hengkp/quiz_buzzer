# Detailed Wiring Diagram

## Component Layout Overview

```
                    ┌─────────────────┐
                    │   MacBook USB   │
                    └─────────┬───────┘
                              │ USB-C Cable
                    ┌─────────▼───────┐
                    │  XIAO nRF52840  │
                    │                 │
                    │  D0  D1  D2  D3 │◄─── TFT Control + Buzzers 1-2
                    │  D4  D5  D6  D7 │◄─── Buzzers 3-6
                    │  D8  D9  D10    │◄─── TFT SPI + Reset
                    │  A0  A1  A2  A3 │◄─── MOSFET Enable 1-4
                    │  A4  A5         │◄─── MOSFET Enable 5-6
                    │  3V3 GND        │
                    └─────────────────┘
                              │
                    ┌─────────▼───────┐
                    │ 2.4" TFT Display│
                    │   240x320 LCD   │
                    └─────────────────┘

    Power-Gate Bank (6x P-Channel MOSFETs on breadboard):
    ┌─────────────────────────────────────────────────┐
    │ +3.3V ─── P-MOS ─── RJ45 Pin3 ───► Team 1 Power │
    │           Gate ◄─── A0 (Enable 1)               │
    │                                                 │
    │ +3.3V ─── P-MOS ─── RJ45 Pin3 ───► Team 2 Power │
    │           Gate ◄─── A1 (Enable 2)               │
    │                                                 │
    │         ... (repeat for Teams 3-6) ...         │
    └─────────────────────────────────────────────────┘

    Team Connections (4-wire Cat6 cables):
    Team 1 ────3m cable───► Signal:D0, GND:GND, Power:MOS1, Enable:A0
    Team 2 ────3m cable───► Signal:D1, GND:GND, Power:MOS2, Enable:A1  
    Team 3 ────3m cable───► Signal:D4, GND:GND, Power:MOS3, Enable:A2
    Team 4 ────3m cable───► Signal:D5, GND:GND, Power:MOS4, Enable:A3
    Team 5 ────3m cable───► Signal:D6, GND:GND, Power:MOS5, Enable:A4
    Team 6 ────3m cable───► Signal:D7, GND:GND, Power:MOS6, Enable:A5
    
    Reset Btn ──────────────► D9
```

## New 4-Wire Cable Pinout

Each buzzer now uses **4 conductors** from Cat-6 cable:

| RJ45 Pin | Wire Color | Function | Direction | Connection |
|----------|------------|----------|-----------|------------|
| 1 | White/Orange | BUZZER_SIGNAL | Input | MCU pin (with pull-up) |
| 2 | Solid Orange | GND | Ground | Common ground |
| 3 | White/Green | POWER | Output | MOSFET drain → box V+ |
| 4 | Solid Green | ENABLE | Output | MOSFET gate control (active LOW) |
| 5-8 | *Unused* | - | - | - |

## Step-by-Step Wiring Instructions

### Step 1: Prepare the Breadboard

1. Place XIAO nRF52840 on breadboard
2. Connect power rails:
   - XIAO 3V3 → breadboard positive rail (red)
   - XIAO GND → breadboard negative rail (black/blue)

### Step 2: Build Power-Gate Bank (6x P-Channel MOSFETs)

For each of the 6 teams, build this circuit on the breadboard:

```
       +3.3V rail
           │
         ┌─┴─┐ Source
         │P-│  P-Channel MOSFET (AO3401 or similar)
         │MOS│
         │FET│
         └─┬─┘ Drain ──► RJ45 Pin 3 (POWER) out to buzzer box
 Gate ──10Ω┤    
           │
      100kΩ│ (pull-up resistor)
           └──┬───► to +3.3V rail
             
 XIAO Pin AX ─► Gate control (Enable signal, active LOW)
```

**Component Requirements per MOSFET:**
- 1x P-Channel MOSFET (AO3401, IRLML6401, or similar)  
- 1x 10Ω resistor (gate drive)
- 1x 100kΩ resistor (pull-up)

**MOSFET Pin Assignments:**
- Team 1: Enable → A0, Power out → RJ45-1 Pin 3
- Team 2: Enable → A1, Power out → RJ45-2 Pin 3  
- Team 3: Enable → A2, Power out → RJ45-3 Pin 3
- Team 4: Enable → A3, Power out → RJ45-4 Pin 3
- Team 5: Enable → A4, Power out → RJ45-5 Pin 3
- Team 6: Enable → A5, Power out → RJ45-6 Pin 3

### Step 3: TFT Display Connections

**CRITICAL**: Before wiring, configure TFT for SPI mode:
- Solder IM1, IM2, IM3 jumpers to HIGH position on back of TFT board
- Leave IM0 unconnected

| TFT Pin | Wire Color | XIAO Pin | Function |
|---------|------------|----------|----------|
| VCC | Red | 3V3 | Power |
| GND | Black | GND | Ground |
| SCK | Yellow | D8 | SPI Clock |
| MOSI (DIN) | Orange | D10 | SPI Data Out |
| CS | Blue | D2 | Chip Select |
| DC (D/C) | Green | D3 | Data/Command |
| RST | White | 3V3 via 10kΩ | Reset (tied high) |

### Step 4: Buzzer Box Connections (Simplified)

Each buzzer box now contains **only**:
1. RJ45 Keystone Jack
2. Momentary switch 
3. LED and/or buzzer for feedback

**Inside each buzzer box**:
```
RJ45 Keystone Jack          Components
┌─────────────────┐        ┌─────────────┐
│ Pin 1 (Signal)  │────────│ Switch Term │
│ Pin 2 (Ground)  │────┬───│ Switch Term │
│ Pin 3 (Power)   │────┼───│ LED/Buzz +  │
│ Pin 4 (Enable)  │    └───│ LED/Buzz -  │
│ Pins 5-8 (NC)   │        └─────────────┘
└─────────────────┘
```

**No more internal MOSFETs or resistors needed in the boxes!**

### Step 5: Reset Button

Simple momentary pushbutton:
- One terminal → D9 (XIAO)
- Other terminal → GND (XIAO)
- Internal pull-up resistor used in software

### Step 6: Power Connection

- Connect XIAO to MacBook via USB-C cable
- This provides both power and serial communication
- No external power supply needed

## Complete Pin Usage Table

| XIAO Pin | Function | Connection | Pull-up | Notes |
|----------|----------|------------|---------|-------|
| D0 | Buzzer 1 Signal | RJ45-1 Pin 1 | Internal | Active LOW |
| D1 | Buzzer 2 Signal | RJ45-2 Pin 1 | Internal | Active LOW |
| D2 | TFT CS | Direct | - | SPI control |
| D3 | TFT DC | Direct | - | SPI control |
| D4 | Buzzer 3 Signal | RJ45-3 Pin 1 | Internal | Active LOW |
| D5 | Buzzer 4 Signal | RJ45-4 Pin 1 | Internal | Active LOW |
| D6 | Buzzer 5 Signal | RJ45-5 Pin 1 | Internal | Active LOW |
| D7 | Buzzer 6 Signal | RJ45-6 Pin 1 | Internal | Active LOW |
| D8 | TFT SCK | Direct | - | SPI clock |
| D9 | Reset Btn | Signal wire | Internal | Active LOW |
| D10 | TFT MOSI | Direct | - | SPI data |
| A0 | Enable 1 | MOSFET Gate 1 | - | Active LOW |
| A1 | Enable 2 | MOSFET Gate 2 | - | Active LOW |
| A2 | Enable 3 | MOSFET Gate 3 | - | Active LOW |
| A3 | Enable 4 | MOSFET Gate 4 | - | Active LOW |
| A4 | Enable 5 | MOSFET Gate 5 | - | Active LOW |
| A5 | Enable 6 | MOSFET Gate 6 | - | Active LOW |
| 3V3 | Power | TFT VCC + MOSFET Source | - | 3.3V supply |
| GND | Ground | Common + RJ45 Pin 2 | - | All grounds |

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

## Cable Management Tips

### For 4-Wire Cat-6 Runs (3 meters)

1. **Wire Assignment per Cable**:
   ```
   Cat-6 Pair 1: Pin 1 (White/Orange) + Pin 2 (Orange)
   Cat-6 Pair 2: Pin 3 (White/Green) + Pin 4 (Green)  
   Cat-6 Pair 3: Unused
   Cat-6 Pair 4: Unused
   ```

2. **Multiple Teams per Cable**:
   - One Cat-6 cable can support 2 teams (using all 4 pairs)
   - Use 3 cables total for 6 teams
   - Label clearly which pairs go to which team

3. **Strain Relief**:
   - Secure cables at both ends
   - Use cable ties every 50cm
   - Avoid sharp bends near RJ45 connectors

4. **Testing**:
   - Verify continuity on all 4 conductors per team
   - Check for shorts between conductors
   - Test MOSFET switching with multimeter

### Breadboard Layout Suggestion

```
Row 1:  3V3 ──────────────────── 3V3 Rail (Red)
Row 2:  GND ──────────────────── GND Rail (Black)

Row 5:  XIAO D0-D3  ┌─────────┐
Row 6:  XIAO D4-D7  │  XIAO   │  TFT Connections
Row 7:  XIAO D8-D10 │ nRF52840│  ├─ CS (D2)
Row 8:  XIAO A0-A3  │         │  ├─ DC (D3)  
Row 9:  XIAO A4-A5  │         │  ├─ SCK (D8)
Row 10: XIAO 3V3,GND└─────────┘  └─ MOSI (D10)

Row 12: Reset Button ──────── D9

Row 15-20: Power-Gate Bank (6x P-Channel MOSFETs)
  MOS1  MOS2  MOS3  MOS4  MOS5  MOS6
   │     │     │     │     │     │
   A0    A1    A2    A3    A4    A5

Buzzer Terminal Block (RJ45 Breakouts):
Pin1 Pin2 Pin3 Pin4  (x6 teams)
┌──┬──┬──┬──┐
│D0│GD│M1│A0│  ◄─ Team 1 Cat-6 cable
├──┼──┼──┼──┤
│D1│GD│M2│A1│  ◄─ Team 2 Cat-6 cable  
├──┼──┼──┼──┤
│..│..│..│..│  ◄─ Teams 3-6...
└──┴──┴──┴──┘
```

## Troubleshooting Wiring Issues

### Power Control Problems
```
Symptom: LED/buzzer always on
Check:
- MOSFET polarity (P-channel: Source to +3.3V)
- Enable pin driven HIGH when should be OFF
- Pull-up resistor present (100kΩ Gate→Source)

Symptom: LED/buzzer never lights
Check:
- MOSFET connections (Source, Drain, Gate)
- Enable pin going LOW when winner selected
- Power reaching buzzer box via Pin 3
- 10Ω gate drive resistor present
```

### Signal Detection Problems
```
Symptom: False triggers
Check:
- Solid ground connections (RJ45 Pin 2)
- Switch bounce (add 0.1µF cap if needed)
- Cable shielding for long runs

Symptom: No button response
Check:
- Continuity RJ45 Pin 1 to XIAO input
- Switch actually closing in buzzer box
- Pull-up enabled in software (INPUT_PULLUP)
```

### MOSFET Selection
```
Recommended P-Channel MOSFETs:
- AO3401: SOT-23 package, 4A, 30V
- IRLML6401: SOT-23 package, 3.7A, 12V  
- BSS84: SOT-23 package, 170mA, 50V (for LED-only)

Gate Threshold: Must turn on with 3.3V drive
Package: SOT-23 preferred for breadboard use
```

This completes the updated wiring instructions for the centralized power control design. The buzzer boxes are now much simpler plug-and-play units, while all the intelligence lives on the main breadboard. 