/*
 * LIGHTNING FAST Quiz Buzzer System for ESP32-C Node32s
 * 
 * - 6 buzz-in inputs (GPIO 0, 1, 4, 5, 6, 7)
 * - 6 MOSFET enable outputs (A0–A5, active LOW)
 * - 6 status LEDs (GPIO 10–15)
 * - 2 reset buttons (yellow & blue)
 * - 1 ms polling, 10 ms debounce
 * - Cat-6 cable system with RJ45 connectors
 */

// === BUZZER & POWER PINS ===
const int BUZZER_PIN[6]  = {0, 1, 4, 5, 6, 7};       // Active-low switch inputs
const int ENABLE_PIN[6]  = {A0, A1, A2, A3, A4, A5}; // MOSFET gates (LOW=on)

// === STATUS LEDs ===
// Wire each 5 mm LED anode to its MOSFET DRAIN (3.3 V when enabled),
// and cathode to these pins (with a 220 Ω resistor in series).
const int STATUS_LED_PIN[6] = {10, 11, 12, 13, 14, 15};

// === RESET BUTTONS ===
// One yellow, one blue; both wired between pin → GND, using INPUT_PULLUP
const int YELLOW_BTN_PIN = 8;
const int BLUE_BTN_PIN   = 9;

// State
volatile bool buzzLocked = false;
volatile int  winner     = -1;

void setup() {
  // Serial for Web UI
  Serial.begin(115200);
  while (!Serial) delay(10);

  // 6 buzzer inputs
  for (int i=0; i<6; i++) {
    pinMode(BUZZER_PIN[i], INPUT_PULLUP);
  }

  // 6 MOSFET enables (active LOW)
  for (int i=0; i<6; i++) {
    pinMode(ENABLE_PIN[i], OUTPUT);
    digitalWrite(ENABLE_PIN[i], HIGH);
  }

  // 6 status LEDs
  for (int i=0; i<6; i++) {
    pinMode(STATUS_LED_PIN[i], OUTPUT);
    digitalWrite(STATUS_LED_PIN[i], HIGH); // off (anode=power, cathode pin HIGH)
  }

  // 2 reset buttons
  pinMode(YELLOW_BTN_PIN, INPUT_PULLUP);
  pinMode(BLUE_BTN_PIN,   INPUT_PULLUP);

  Serial.println("READY");
}

void lockInWinner(int team) {
  buzzLocked = true;
  winner     = team;

  // Power-control
  for (int i=0; i<6; i++) {
    digitalWrite(ENABLE_PIN[i], HIGH);         // all OFF
    digitalWrite(STATUS_LED_PIN[i], HIGH);     // all LEDs off
  }
  digitalWrite(ENABLE_PIN[team-1], LOW);       // enable winner
  digitalWrite(STATUS_LED_PIN[team-1], LOW);   // light its LED

  // Notify web UI
  Serial.print("WINNER:");
  Serial.println(team);
}

void resetGame() {
  buzzLocked = false;
  winner     = -1;

  // Turn every box OFF & LEDs off
  for (int i=0; i<6; i++) {
    digitalWrite(ENABLE_PIN[i], HIGH);
    digitalWrite(STATUS_LED_PIN[i], HIGH);
  }

  Serial.println("RESET");
}

void loop() {
  // 1 ms loop for speed
  static uint32_t lastTick = millis();
  if (millis() - lastTick < 1) return;
  lastTick = millis();

  // 1) Detect buzz-in
  if (!buzzLocked) {
    for (int i=0; i<6; i++) {
      if (digitalRead(BUZZER_PIN[i]) == LOW) {
        delay(10);
        if (digitalRead(BUZZER_PIN[i]) == LOW) {
          lockInWinner(i+1);
        }
        break;
      }
    }
  }

  // 2) Physical Reset (yellow or blue)
  if (digitalRead(YELLOW_BTN_PIN) == LOW ||
      digitalRead(BLUE_BTN_PIN)   == LOW) {
    delay(20);
    if (digitalRead(YELLOW_BTN_PIN) == LOW ||
        digitalRead(BLUE_BTN_PIN)   == LOW) {
      resetGame();
      // wait for release
      while (digitalRead(YELLOW_BTN_PIN) == LOW ||
             digitalRead(BLUE_BTN_PIN)   == LOW) {
        delay(10);
      }
    }
  }

  // 3) Web reset
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "RESET") resetGame();
  }
}