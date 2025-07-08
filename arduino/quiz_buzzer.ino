/*
 * OPTIMIZED 6-Team Quiz Buzzer System for ESP32
 * 
 * FAST RESET - Instant response, no delays
 * HANDLES SIMULTANEOUS BUTTON PRESSES - Winner determined by microsecond timing
 * SERIAL MESSAGE INTEGRITY - Atomic messages with proper framing
 * SOUND OUTPUT - 2-second sound activation for winning team's buzzer box
 * 
 * Updated pin assignments based on your actual ESP32 board:
 * Right side: 3V3, GND, D15, D2, D4, RX2, TX2, D5, D18, D19, D21, RX0, TX0, D22, D23
 * Left side: VIN, GND, D13, D14, D27, D26, D25, D33, D32, D35, D34, Vn, VP, EN
 * 
 * Team Buttons (INPUT_PULLUP, connect to GND when pressed):
 *  - Team 1 button: GPIO4  (D4)  ⟷ GND
 *  - Team 2 button: GPIO5  (D5)  ⟷ GND  
 *  - Team 3 button: GPIO13 (D13) ⟷ GND
 *  - Team 4 button: GPIO14 (D14) ⟷ GND
 *  - Team 5 button: GPIO21 (D21) ⟷ GND
 *  - Team 6 button: GPIO22 (D22) ⟷ GND
 *
 * Team LEDs (OUTPUT, connect to L+/L- on buzzer boxes):
 *  - Team 1 LED: GPIO18 (D18) → L+/L- on buzzer box
 *  - Team 2 LED: GPIO19 (D19) → L+/L- on buzzer box
 *  - Team 3 LED: GPIO23 (D23) → L+/L- on buzzer box
 *  - Team 4 LED: GPIO25 (D25) → L+/L- on buzzer box
 *  - Team 5 LED: GPIO26 (D26) → L+/L- on buzzer box
 *  - Team 6 LED: GPIO27 (D27) → L+/L- on buzzer box
 *
 * Team Sounds (OUTPUT, connect to P1/P2 on buzzer boxes for 2-second activation):
 *  - Team 1 Sound: GPIO2  (D2)  → P1/P2 on buzzer box
 *  - Team 2 Sound: GPIO15 (D15) → P1/P2 on buzzer box
 *  - Team 3 Sound: GPIO32 (D32) → P1/P2 on buzzer box
 *  - Team 4 Sound: GPIO33 (D33) → P1/P2 on buzzer box
 *  - Team 5 Sound: GPIO34 (D34) → P1/P2 on buzzer box
 *  - Team 6 Sound: GPIO35 (D35) → P1/P2 on buzzer box
 *
 * Serial Communication (9600 baud):
 *  - Sends: "WINNER:X" (X = 1-6) when team wins
 *  - Sends: "TIMING:TX:microseconds" for simultaneous presses
 *  - Sends: "READY" on startup and after reset
 *  - Receives: "RESET" to clear winner and restart
 */

// Team button pins (safe GPIO pins from your board)
const int BUZZER_PIN[6] = { 4, 5, 13, 14, 21, 22 };    // D4, D5, D13, D14, D21, D22

// Team LED pins (connect to L+/L- on buzzer boxes)  
const int LED_PIN[6] = { 18, 19, 23, 25, 26, 27 };     // D18, D19, D23, D25, D26, D27

// Team Sound pins (connect to P1/P2 on buzzer boxes)
const int SOUND_PIN[6] = { 2, 15, 32, 33, 34, 35 };    // D2, D15, D32, D33, D34, D35

// Game state variables
volatile bool gameActive = true;
volatile int winner = 0;
volatile bool winnerDetermined = false;

// Button state tracking for all 6 teams
bool buttonLastState[6] = {HIGH, HIGH, HIGH, HIGH, HIGH, HIGH};
bool resetButtonLastState = HIGH;

// First press detection - microsecond precision for all teams
unsigned long buttonFirstPress[6] = {0, 0, 0, 0, 0, 0};
unsigned long resetButtonFirstPress = 0;

// Sound control
unsigned long soundStartTime = 0;
int soundActiveTeam = 0;
bool soundActive = false;

// Reset button (onboard BOOT button)
const int RESET_BUTTON = 0;

// Timing constants - optimized for speed
const unsigned long DEBOUNCE_MICROS = 30000;    // 30ms debounce
const unsigned long RESET_HOLD_MICROS = 300000; // 300ms for reset
const unsigned long SOUND_DURATION_MICROS = 2000000; // 2 seconds sound

void setup() {
  Serial.begin(9600);
  delay(1000);  // Reduced startup delay
  
  // Configure all button pins with INPUT_PULLUP
  for (int i = 0; i < 6; i++) {
    pinMode(BUZZER_PIN[i], INPUT_PULLUP);
  }
  
  // Configure reset button
  pinMode(RESET_BUTTON, INPUT_PULLUP);
  
  // Configure all LED pins as OUTPUT, start OFF
  for (int i = 0; i < 6; i++) {
    pinMode(LED_PIN[i], OUTPUT);
    digitalWrite(LED_PIN[i], LOW);
  }
  
  // Configure all Sound pins as OUTPUT, start OFF
  for (int i = 0; i < 6; i++) {
    pinMode(SOUND_PIN[i], OUTPUT);
    digitalWrite(SOUND_PIN[i], LOW);
  }
  
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
  
  // Handle sound duration
  if (soundActive) {
    if ((micros() - soundStartTime) >= SOUND_DURATION_MICROS) {
      // Turn off sound after 2 seconds
      digitalWrite(SOUND_PIN[soundActiveTeam - 1], LOW);
      soundActive = false;
      soundActiveTeam = 0;
    }
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
  
  // Read all buttons atomically
  bool buttonCurrent[6];
  for (int i = 0; i < 6; i++) {
    buttonCurrent[i] = digitalRead(BUZZER_PIN[i]);
  }
  
  // Detect first press for each team
  for (int i = 0; i < 6; i++) {
    if (buttonCurrent[i] == LOW && buttonLastState[i] == HIGH && buttonFirstPress[i] == 0) {
      buttonFirstPress[i] = currentMicros;
    }
  }
  
  // Fast debounce check for all teams
  bool anyButtonReady = false;
  for (int i = 0; i < 6; i++) {
    if ((buttonFirstPress[i] > 0) && 
        ((currentMicros - buttonFirstPress[i]) >= DEBOUNCE_MICROS) &&
        (buttonCurrent[i] == LOW)) {
      anyButtonReady = true;
      break;
    }
  }
  
  // Determine winner immediately if any button is ready
  if (anyButtonReady) {
    fastDetermineWinner(currentMicros);
  }
  
  // Clear first press times when buttons are released
  for (int i = 0; i < 6; i++) {
    if (buttonCurrent[i] == HIGH && buttonLastState[i] == LOW) {
      buttonFirstPress[i] = 0;
    }
    buttonLastState[i] = buttonCurrent[i];
  }
}

void fastDetermineWinner(unsigned long currentMicros) {
  // Immediate exit if already determined
  if (winnerDetermined) return;
  
  // Lock winner determination immediately
  winnerDetermined = true;
  gameActive = false;
  
  int winningTeam = 0;
  unsigned long earliestPress = 0;
  String timingMsg = "";
  
  // Find the earliest press time among ready buttons
  for (int i = 0; i < 6; i++) {
    if ((buttonFirstPress[i] > 0) && 
        ((currentMicros - buttonFirstPress[i]) >= DEBOUNCE_MICROS) &&
        (digitalRead(BUZZER_PIN[i]) == LOW)) {
      
      if (earliestPress == 0 || buttonFirstPress[i] < earliestPress) {
        earliestPress = buttonFirstPress[i];
        winningTeam = i + 1;
      }
    }
  }
  
  // Check for simultaneous presses and create timing message
  if (winningTeam > 0) {
    // Look for other teams with very close timing (within 10ms = 10000 microseconds)
    for (int i = 0; i < 6; i++) {
      if ((i + 1) != winningTeam && buttonFirstPress[i] > 0 && 
          ((currentMicros - buttonFirstPress[i]) >= DEBOUNCE_MICROS) &&
          (digitalRead(BUZZER_PIN[i]) == LOW)) {
        
        unsigned long timeDiff = (buttonFirstPress[i] > earliestPress) ? 
                                (buttonFirstPress[i] - earliestPress) : 
                                (earliestPress - buttonFirstPress[i]);
        
        if (timeDiff <= 10000) { // Within 10ms - close timing
          timingMsg = "TIMING:T" + String(winningTeam) + ":" + String(timeDiff);
          break;
        }
      }
    }
    
    fastTeamWins(winningTeam, timingMsg);
  }
}

void fastTeamWins(int team, String timingMessage) {
  winner = team;
  
  // Turn off all LEDs first
  for (int i = 0; i < 6; i++) {
    digitalWrite(LED_PIN[i], LOW);
  }
  
  // Turn off all sounds first
  for (int i = 0; i < 6; i++) {
    digitalWrite(SOUND_PIN[i], LOW);
  }
  
  // Turn on winner's LED
  digitalWrite(LED_PIN[team - 1], HIGH);
  
  // Turn on winner's sound for 2 seconds
  digitalWrite(SOUND_PIN[team - 1], HIGH);
  soundStartTime = micros();
  soundActiveTeam = team;
  soundActive = true;
  
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
  for (int i = 0; i < 6; i++) {
    buttonFirstPress[i] = 0;
    buttonLastState[i] = HIGH;
  }
  resetButtonFirstPress = 0;
  resetButtonLastState = HIGH;
  
  // Reset sound control
  soundActive = false;
  soundActiveTeam = 0;
  soundStartTime = 0;
  
  // Turn off all LEDs
  for (int i = 0; i < 6; i++) {
    digitalWrite(LED_PIN[i], LOW);
  }
  
  // Turn off all sounds
  for (int i = 0; i < 6; i++) {
    digitalWrite(SOUND_PIN[i], LOW);
  }
  
  // Send ready immediately - atomic message
  Serial.println("READY");
  Serial.flush(); // Ensure message is sent immediately
}