/*
 * SIMPLIFIED 2-Team Quiz Buzzer - Debug Version
 * 
 * This simplified version helps isolate serial communication issues
 * 
 * Wiring:
 *  - Team 1 button: GPIO13 (D13) to GND
 *  - Team 2 button: GPIO14 (D14) to GND
 *  - Team 1 LED: GPIO18 (D18) -> LED+ -> 220R -> GND
 *  - Team 2 LED: GPIO19 (D19) -> LED+ -> 220R -> GND
 */

const int BUTTON_1 = 13;
const int BUTTON_2 = 14;
const int LED_1 = 18;
const int LED_2 = 19;

bool gameActive = true;
int winner = 0;

void setup() {
  // Start serial with delay
  Serial.begin(9600);  // Using 9600 for testing
  delay(2000);  // Wait longer for serial to stabilize
  
  // Configure pins
  pinMode(BUTTON_1, INPUT_PULLUP);
  pinMode(BUTTON_2, INPUT_PULLUP);
  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  
  // Turn off LEDs
  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  
  // Send ready message
  Serial.println("READY");
  delay(100);
}

void loop() {
  // Check for serial reset command
  if (Serial.available()) {
    String cmd = Serial.readString();
    cmd.trim();
    if (cmd == "RESET") {
      resetGame();
    }
  }
  
  // Simple button checking (if game active)
  if (gameActive) {
    // Team 1 button
    if (digitalRead(BUTTON_1) == LOW) {
      delay(50);  // Simple debounce
      if (digitalRead(BUTTON_1) == LOW) {
        teamWins(1);
      }
    }
    
    // Team 2 button  
    if (digitalRead(BUTTON_2) == LOW) {
      delay(50);  // Simple debounce
      if (digitalRead(BUTTON_2) == LOW) {
        teamWins(2);
      }
    }
  }
  
  delay(10);  // Small delay
}

void teamWins(int team) {
  if (!gameActive) return;
  
  gameActive = false;
  winner = team;
  
  // Turn on winner LED
  if (team == 1) {
    digitalWrite(LED_1, HIGH);
    digitalWrite(LED_2, LOW);
  } else {
    digitalWrite(LED_1, LOW);
    digitalWrite(LED_2, HIGH);
  }
  
  // Send winner message
  Serial.print("WINNER:");
  Serial.println(team);
  delay(100);
}

void resetGame() {
  gameActive = true;
  winner = 0;
  
  // Turn off all LEDs
  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  
  // Send ready message
  Serial.println("READY");
  delay(100);
} 