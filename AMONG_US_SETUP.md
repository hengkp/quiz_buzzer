# Among Us Quiz Bowl System Setup Guide

## Overview

The Among Us Quiz Bowl System is a comprehensive quiz competition platform featuring:
- **Main Display**: Beautiful projector screen with Among Us theme, progress tracking, and team management
- **Console Interface**: Control panel for managing all aspects of the quiz competition
- **Arduino Integration**: Hardware buzzer support for 6 teams
- **Sound Effects**: Immersive audio feedback for correct/incorrect answers
- **Action Cards**: Special power-ups (Angel, Devil, Cross) for strategic gameplay

## Quick Start

### 1. Start the Server

```bash
cd web
python dev_server.py --host 0.0.0.0 --port 8080
```

### 2. Open the Interfaces

**For the Projector (Main Display):**
- Open: `http://localhost:8080/among_us_main`
- This shows the beautiful Among Us-themed display with:
  - Thai competition title
  - Question set progress bar with moving Among Us character
  - Timer display
  - 6 team cards with scores, characters, and action cards

**For the Control MacBook (Console):**
- Open: `http://localhost:8080/among_us_console`
- This provides the control interface with:
  - Arduino connection management
  - Team management (names, colors, scores)
  - Timer controls
  - Question set management
  - Action card controls
  - Live action logs

### 3. Arduino Connection

1. Connect your ESP32/Arduino with the buzzer system
2. In the console, select the correct serial port
3. Click "Connect" to establish communication
4. The system supports 6 teams with hardware buzzers

## Features

### Main Display Features

- **Beautiful Thai Title**: Multi-line competition title with proper formatting
- **Progress Tracking**: Visual roadmap showing 8 question sets with 3 sub-questions each
- **Animated Character**: Among Us character that moves along the progress line
- **Team Display**: 6 teams in 2x3 grid showing:
  - Team names (editable)
  - Colorful Among Us characters with Lottie animations
  - Real-time scores
  - Action card status (Angel, Devil, Cross)
  - Rank badges for top 3 teams
- **Timer**: Large digital timer display with countdown
- **Sound Effects**: Audio feedback for game events

### Console Features

- **Arduino Management**: Connect/disconnect, port selection, status monitoring
- **Team Control**: 
  - Edit team names (Thai/English support)
  - Change team colors from 9 vibrant options
  - Adjust scores (+1, -1, reset)
  - Manage action cards
- **Timer Control**: Set, start, pause, stop, reset with custom durations
- **Question Set Management**:
  - 8 question sets with subject selection (Biology, Chemistry, Physics, General)
  - Custom question set titles
  - Progress tracking
- **Challenge Mode**: 2x score multiplier toggle
- **Live Logging**: Real-time action log with timestamps
- **Buzzer Control**: Clear buzzers, reset system

### Action Card System

1. **Angel Card**: Protects team from -1 score deduction (once per game)
2. **Devil Card**: Can be given to other teams to cause -1 score (once per game)
3. **Cross Card**: Activated after receiving devil card, prevents future devil attacks

### Color Palette

Teams can choose from 9 vibrant colors:
- Red (#D71E22)
- Blue (#1D3CE9) 
- Lime (#5BFE4B)
- Orange (#FF8D1C)
- Purple (#783DD2)
- Cyan (#44FFF7)
- White (#E9F7FF)
- Pink (#FF63D4)
- Yellow (#FFFF67)

## Competition Format

The system supports the described competition format:
- 8 main question sets + 2 spare sets
- 3 follow-up questions per set
- Challenge mode for 2x scoring
- Action card strategic gameplay
- Real-time scoring and progress tracking

## Technical Details

### File Structure
```
web/
├── among_us_main.html      # Main projector display
├── among_us_console.html   # Control console
├── dev_server.py           # Enhanced server with Among Us features
└── assets/
    ├── animations/         # Lottie Among Us animations
    ├── audio/             # Sound effects
    ├── buzzing/           # Buzzing state images
    ├── cards/             # Action card images
    ├── characters/        # Static character images
    └── rankings/          # Rank badge images
```

### Socket.IO Events

The system uses real-time WebSocket communication for:
- Team updates (names, colors, scores)
- Timer synchronization
- Buzzer presses
- Action card usage
- Question set progression
- Live logging

### Arduino Integration

Supports ESP32/Arduino with:
- 6 team buzzer inputs (GPIO pins: D4, D5, D13, D14, D21, D22)
- 6 LED outputs for feedback (GPIO pins: D18, D19, D23, D25, D26, D27)
- Serial communication protocol
- Automatic reconnection handling

## Troubleshooting

### Server Issues
- Ensure Python dependencies are installed: `pip install flask flask-socketio`
- Check if port 8080 is available
- For HTTPS mode, use `--https` flag

### Arduino Issues
- Install pySerial: `pip install pyserial`
- Check cable connection and port selection
- Verify Arduino code matches GPIO pin configuration

### Display Issues
- Ensure both pages are opened in modern browsers
- Check network connectivity between devices
- Refresh pages if synchronization issues occur

## Competition Day Setup

1. **Before the Event**:
   - Test all hardware connections
   - Verify projector display settings
   - Set up team names and colors
   - Test timer and scoring functions

2. **During Competition**:
   - Use console for all game control
   - Monitor action logs for transparency
   - Export logs for record keeping

3. **After Competition**:
   - Export final logs
   - Save team scores and rankings
   - Disconnect Arduino safely

Enjoy your Among Us-themed quiz competition! 🚀👨‍🚀 