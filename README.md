# quiz_buzzer
6-player quiz buzzer system using a Seeed Studio XIAO nRF52840

## 🔔 Features

- **First-buzz detection** among 6 wired buzzer buttons  
- On-device display of winner number on a 2.4″ TFT LCD  
- **USB Serial** streaming of buzzer events to a browser  
- Browser UI (Tailwind CSS) for large-screen display of team names, editable on the fly  
- Dual reset: physical push-button and on-screen “Reset” button  

## 📦 Repository Structure
xiaobuzzer/
├── hardware/      Hardware schematics, wiring diagrams, parts list
├── firmware/      Arduino code for the XIAO nRF52840
├── web_app/       Static HTML/CSS/JS for browser interface
├── assets/        Photos and screenshots
└── LICENSE        Project license

## 🛠️ Parts & Tools

See **`hardware/parts-list.md`** for detailed links and quantities, including:

- Seeed Studio XIAO nRF52840 MCU  
- 2.4″ TFT LCD (Adafruit 2478 or equivalent)  
- 6 × Trivia-quiz buzzer buttons  
- 1 × reset push-button  
- Breadboard, jumper cables (3 m runs), USB cable  
- (Optional) soldering iron, header pins, twist-pair cable  

## 🔌 Wiring

A full schematic and breadboard layout are in **`hardware/wiring-diagram.pdf`**.  
Key connections:

- **Buzzer Buttons** → XIAO D0–D7 (with internal pull-ups), common ground  
- **Reset Button** → XIAO D9 (pull-up)  
- **TFT LCD** (SPI mode jumpers set):  
  - CS → D2  
  - DC → D3  
  - SCK → D8 (SPI CLK)  
  - MOSI → D10 (SPI MOSI)  
  - VCC → 3.3 V, GND → GND  

## 💾 Firmware

Folder: **`firmware/`**

1. Open **`src/buzzer_system.ino`** in Arduino IDE  
2. Install libraries via Library Manager:  
   - `Adafruit ILI9341`  
   - `Adafruit GFX`  
3. Select **Seeed nRF52840 XIAO** board, upload at **115200 baud**  
4. Verify serial messages:  
   - `READY` on startup  
   - `WINNER:X` on buzz-in  
   - `RESET` on reset  

## 🌐 Web Application

Folder: **`web_app/`**

1. Open **`index.html`** in Chrome/Edge (requires Web Serial API)  
2. Click **Connect** → choose “Seeed XIAO nRF52840” USB port  
3. Enter custom team names  
4. Watch for “Winner” display on buzz-in  
5. Click **Reset** to start next round  

> If your browser blocks Web Serial on `file://`, run a local static server:  
> ```bash
> # Python 3
> cd web_app
> python3 -m http.server 8000
> # then browse to http://localhost:8000
> ```

## 📷 Assets

- **`assets/screenshots/`**: Web UI in action  
- **`assets/photos/`**: Hardware setup  



