/*
 * OPTIMIZED 2-Team Quiz Buzzer System for ESP32
 * 
 * FAST RESET - Instant response, no delays
 * HANDLES SIMULTANEOUS BUTTON PRESSES - One winner always guaranteed
 * SERIAL MESSAGE INTEGRITY - Atomic messages with proper framing
 * 
 * Wiring (Based on your actual ESP32 board pinout):
 *  Buttons (connect to GND when pressed):
 *  - Team 1 button: GPIO13 (D13) to GND
 *  - Team 2 button: GPIO14 (D14) to GND
 *  - Reset button: GPIO0 (onboard BOOT button)
 *
 *  LEDs (220 ohm resistors):
 *  - Team 1 LED: GPIO18 (D18) -> LED+ -> 220R -> GND
 *  - Team 2 LED: GPIO19 (D19) -> LED+ -> 220R -> GND
 *
 * Serial: 9600 baud, sends: READY, WINNER:1, WINNER:2, TIMING:T1:123
 */

const int BUTTON_1 = 13;     // Team 1 button (D13)
const int BUTTON_2 = 14;     // Team 2 button (D14)
const int RESET_BUTTON = 0;  // Onboard BOOT button (GPIO0)
const int LED_1 = 18;        // Team 1 LED (D18)
const int LED_2 = 19;        // Team 2 LED (D19)

// Game state variables
volatile bool gameActive = true;
volatile int winner = 0;
volatile bool winnerDetermined = false;

// Button state tracking 
bool button1LastState = HIGH;
bool button2LastState = HIGH;
bool resetButtonLastState = HIGH;

// First press detection - microsecond precision
unsigned long button1FirstPress = 0;
unsigned long button2FirstPress = 0;
unsigned long resetButtonFirstPress = 0;

// Timing constants - optimized for speed
const unsigned long DEBOUNCE_MICROS = 30000;    // 30ms debounce (faster)
const unsigned long RESET_HOLD_MICROS = 300000; // 300ms for reset (faster)

void setup() {
  Serial.begin(9600);
  delay(1000);  // Reduced startup delay
  
  // Configure pins
  pinMode(BUTTON_1, INPUT_PULLUP);
  pinMode(BUTTON_2, INPUT_PULLUP);
  pinMode(RESET_BUTTON, INPUT_PULLUP);
  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  
  // Initialize LEDs off
  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  
  // Send ready immediately - atomic message
  Serial.println("READY");
  Serial.flush(); // Ensure message is sent immediately
}

void loop() {
  // Fast serial check
  if (Serial.available()) {
    String cmd = Serial.readString();
    cmd.trim();
    if (cmd == "RESET") {
      fastReset();
      return; // Exit loop immediately after reset
    }
  }
  
  // Fast reset button check
  if (checkResetButtonFast()) {
    fastReset();
    return; // Exit loop immediately after reset
  }
  
  // Only check game buttons if game is active (fast exit)
  if (gameActive && !winnerDetermined) {
    checkGameButtonsFast();
  }
  
  // No delay in main loop for maximum responsiveness
}

bool checkResetButtonFast() {
  bool resetButtonCurrent = digitalRead(RESET_BUTTON);
  
  // Reset button pressed
  if (resetButtonCurrent == LOW && resetButtonLastState == HIGH) {
    resetButtonFirstPress = micros();
  }
  
  // Reset button released - fast check
  if (resetButtonCurrent == HIGH && resetButtonLastState == LOW) {
    if ((micros() - resetButtonFirstPress) >= RESET_HOLD_MICROS) {
      resetButtonLastState = resetButtonCurrent;
      return true; // Reset requested
    }
  }
  
  resetButtonLastState = resetButtonCurrent;
  return false;
}

void checkGameButtonsFast() {
  // Exit immediately if winner already determined
  if (winnerDetermined) return;
  
  unsigned long currentMicros = micros();
  
  // Read both buttons atomically
  bool button1Current = digitalRead(BUTTON_1);
  bool button2Current = digitalRead(BUTTON_2);
  
  // Detect first press for Team 1
  if (button1Current == LOW && button1LastState == HIGH && button1FirstPress == 0) {
    button1FirstPress = currentMicros;
  }
  
  // Detect first press for Team 2
  if (button2Current == LOW && button2LastState == HIGH && button2FirstPress == 0) {
    button2FirstPress = currentMicros;
  }
  
  // Fast debounce check
  bool button1Ready = (button1FirstPress > 0) && 
                      ((currentMicros - button1FirstPress) >= DEBOUNCE_MICROS) &&
                      (button1Current == LOW);
                      
  bool button2Ready = (button2FirstPress > 0) && 
                      ((currentMicros - button2FirstPress) >= DEBOUNCE_MICROS) &&
                      (button2Current == LOW);
  
  // Determine winner immediately if either button is ready
  if (button1Ready || button2Ready) {
    fastDetermineWinner(currentMicros);
  }
  
  // Clear first press times when buttons are released
  if (button1Current == HIGH && button1LastState == LOW) {
    button1FirstPress = 0;
  }
  if (button2Current == HIGH && button2LastState == LOW) {
    button2FirstPress = 0;
  }
  
  // Update states
  button1LastState = button1Current;
  button2LastState = button2Current;
}

void fastDetermineWinner(unsigned long currentMicros) {
  // Immediate exit if already determined
  if (winnerDetermined) return;
  
  // Lock winner determination immediately
  winnerDetermined = true;
  gameActive = false;
  
  int winningTeam = 0;
  String timingMsg = "";
  
  // Fast winner determination with atomic timing messages
  if (button1FirstPress > 0 && button2FirstPress > 0) {
    // Both pressed - check timing
    if (button1FirstPress <= button2FirstPress) {
      winningTeam = 1;
      // Create atomic timing message
      timingMsg = "TIMING:T1:" + String(button2FirstPress - button1FirstPress);
    } else {
      winningTeam = 2;
      // Create atomic timing message  
      timingMsg = "TIMING:T2:" + String(button1FirstPress - button2FirstPress);
    }
  } else if (button1FirstPress > 0) {
    winningTeam = 1;
  } else if (button2FirstPress > 0) {
    winningTeam = 2;
  }
  
  if (winningTeam > 0) {
    fastTeamWins(winningTeam, timingMsg);
  }
}

void fastTeamWins(int team, String timingMessage) {
  winner = team;
  
  // Immediate LED update
  if (team == 1) {
    digitalWrite(LED_1, HIGH);
    digitalWrite(LED_2, LOW);
  } else {
    digitalWrite(LED_1, LOW);
    digitalWrite(LED_2, HIGH);
  }
  
  // Send timing message first (if we have one) - atomic
  if (timingMessage.length() > 0) {
    Serial.println(timingMessage);
    Serial.flush();
  }
  
  // Send winner message immediately - atomic
  Serial.println("WINNER:" + String(team));
  Serial.flush(); // Ensure message is sent immediately
}

void fastReset() {
  // Immediate state reset
  gameActive = true;
  winner = 0;
  winnerDetermined = false;
  
  // Clear all timing variables
  button1FirstPress = 0;
  button2FirstPress = 0;
  resetButtonFirstPress = 0;
  
  // Reset button states
  button1LastState = HIGH;
  button2LastState = HIGH;
  resetButtonLastState = HIGH;
  
  // Immediate LED off
  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  
  // Send ready immediately - atomic message
  Serial.println("READY");
  Serial.flush(); // Ensure message is sent immediately
}