# Troubleshooting Guide

## Common Hardware Issues

### TFT Display Problems

**Blank Screen**
- Check SPI jumpers (IM1, IM2, IM3 set to HIGH)
- Verify 3.3V power at TFT VCC pin
- Test all SPI connections (CS, DC, SCK, MOSI)
- Ensure common ground connection

**Garbled Display**
- Check SPI clock (D8) connection
- Verify MOSI data line (D10)
- Try reducing SPI speed in code
- Check for loose connections

**Display Works But Touch Doesn't**
- Touch panel not implemented in this design
- Use physical reset button or web interface

### Buzzer Input Issues

**False Triggers**
- Check solid ground connections
- Add 0.1µF capacitor across input/ground
- Use shielded cables for 3m runs
- Verify pull-up resistors enabled

**No Response from Buzzer**
- Test continuity through 3m cable
- Check switch operation in buzzer box
- Verify correct pin assignment in code
- Test with multimeter (should read 3.3V when not pressed, 0V when pressed)

**Multiple Teams Trigger**
- Check for ground loops
- Ensure proper debouncing in code
- Test timing with oscilloscope if available

### Power Issues

**System Resets/Brown-outs**
- Check USB cable quality
- Monitor total current draw (<500mA)
- Use powered USB hub if needed
- Verify TFT backlight current

**XIAO Not Recognized**
- Install Seeed nRF52840 drivers
- Try different USB cable/port
- Check Device Manager for COM port

## Software Issues

### Arduino IDE Problems

**Board Not Found**
```
Solution:
1. File → Preferences → Additional Boards Manager URLs
2. Add: https://files.seeedstudio.com/arduino/package_seeedstudio_index.json
3. Tools → Board → Boards Manager
4. Search "Seeed nRF52840" and install
```

**Library Errors**
```
Required Libraries:
- Adafruit ILI9341
- Adafruit GFX Library

Install via: Sketch → Include Library → Manage Libraries
```

**Upload Fails**
- Hold RESET button while uploading
- Try lower upload speed
- Check correct COM port selected

### Web Interface Issues

**"Web Serial not supported"**
- Use Chrome or Edge browser only
- Firefox/Safari don't support Web Serial API
- Update browser to latest version

**Cannot Connect to Device**
- Check XIAO is plugged in and running
- Try refreshing page and reconnecting
- Verify correct serial port selection
- Check for other programs using the port

**Connection Lost During Use**
- Check USB cable connection
- Monitor for interference
- Try different USB port

### Serial Communication Issues

**No Data Received**
- Verify 115200 baud rate in both firmware and web app
- Check serial monitor for XIAO output
- Test with Arduino Serial Monitor first

**Partial Data/Corruption**
- Check for line ending issues (\n vs \r\n)
- Verify text encoding (UTF-8)
- Monitor for buffer overflows

## Testing Procedures

### Step-by-Step System Test

1. **Hardware Test**
   ```
   - Power on XIAO via USB
   - TFT should show "Quiz Buzzer Ready!"
   - Serial monitor should show "READY"
   ```

2. **Individual Buzzer Test**
   ```
   - Short each buzzer pin to ground manually
   - Should see "WINNER:X" in serial monitor
   - TFT should show "Winner: X"
   ```

3. **Web Interface Test**
   ```
   - Open buzzer.html in Chrome
   - Click "Connect to Device"
   - Should see "Connected ✔️"
   - Test reset functionality
   ```

4. **Timing Test**
   ```
   - Have multiple people press buzzers simultaneously
   - Only first press should register
   - Repeat test multiple times
   ```

### Diagnostic Commands

**Serial Monitor Commands**
- Type `RESET` to test reset functionality
- Monitor for `WINNER:X` messages
- Check for `READY` on startup

**Multimeter Tests**
- Buzzer inputs: 3.3V (not pressed), 0V (pressed)
- TFT VCC: 3.3V steady
- Ground continuity: <1Ω resistance

## Performance Optimization

### Reducing False Triggers

1. **Cable Improvements**
   - Use twisted pair cables
   - Add ferrite cores near XIAO
   - Keep cables away from power lines

2. **Software Filtering**
   - Increase debounce delay if needed
   - Add software filters for noise

3. **Hardware Filtering**
   - 0.1µF capacitors on inputs
   - RC filters for noisy environments

### Improving Response Time

1. **Code Optimization**
   - Reduce loop delay from 5ms if needed
   - Optimize TFT update routines
   - Use interrupts for faster response

2. **Hardware Optimization**
   - Shorter cable runs where possible
   - Higher quality switches in buzzers
   - Proper grounding techniques

## Advanced Diagnostics

### Oscilloscope Analysis
- Monitor buzzer signals for bounce
- Check SPI timing for TFT
- Verify power supply stability

### Logic Analyzer
- Capture serial communication
- Debug SPI transactions
- Analyze timing relationships

## Getting Help

### Information to Gather
- Hardware setup photos
- Serial monitor output
- Browser console errors
- Specific error messages

### Where to Get Support
- GitHub Issues (preferred)
- Arduino Forums
- Seeed Studio community

### Creating Good Bug Reports
1. Describe expected vs actual behavior
2. List steps to reproduce
3. Include error messages/screenshots
4. Specify hardware/software versions
5. Mention troubleshooting steps already tried 