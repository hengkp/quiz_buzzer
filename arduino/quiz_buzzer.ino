#include <Adafruit_ILI9341.h>
#include <Adafruit_GFX.h>

// Pin definitions (XIAO nRF52840 pins)
const int BUZZER_PIN[6] = {0, 1, 4, 5, 6, 7};     // D0, D1, D4, D5, D6, D7 - Signal inputs
const int ENABLE_PIN[6] = {A0, A1, A2, A3, A4, A5}; // A0-A5 - MOSFET enable outputs (active LOW)
const int RESET_BTN_PIN = 9;                        // D9 for reset button

// TFT pins
#define TFT_CS   2    // D2 -> TFT CS
#define TFT_DC   3    // D3 -> TFT D/C
#define TFT_RST  -1   // TFT RST not connected to MCU (using -1 to indicate no pin)

// Create TFT display object (using hardware SPI)
Adafruit_ILI9341 tft(TFT_CS, TFT_DC, TFT_RST);

volatile bool buzzLocked = false;
volatile int winner = -1;

void setup() {
  // Initialize serial communication (USB CDC) for debug and PC interface
  Serial.begin(115200);
  while (!Serial) { 
    delay(10); // wait for serial port to be ready
  }

  // Initialize the TFT display
  tft.begin();
  tft.setRotation(1);  // optional: rotate if needed (0-3). Depends on mounting.
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(40, 120);
  tft.print("Quiz Buzzer Ready!");

  // Configure buzzer input pins (signal lines from RJ45 Pin 1)
  for (int i = 0; i < 6; ++i) {
    pinMode(BUZZER_PIN[i], INPUT_PULLUP);
  }
  
  // Configure enable output pins (MOSFET gate control - active LOW)
  for (int i = 0; i < 6; ++i) {
    pinMode(ENABLE_PIN[i], OUTPUT);
    digitalWrite(ENABLE_PIN[i], HIGH);  // Start with all MOSFETs OFF (no power to boxes)
  }
  
  // Configure reset button input
  pinMode(RESET_BTN_PIN, INPUT_PULLUP);

  // Indicate readiness
  Serial.println("READY");  // we can send an initial ready signal to the PC app
}

void lockInWinner(int team) {
  buzzLocked = true;
  winner = team;
  
  // POWER CONTROL: Turn off all buzzers, then power only the winner
  for (int i = 0; i < 6; i++) {
    digitalWrite(ENABLE_PIN[i], HIGH);  // Turn all MOSFETs OFF (no power)
  }
  digitalWrite(ENABLE_PIN[winner-1], LOW);  // Turn winner's MOSFET ON (power winner's box)
  
  // Display winner on TFT
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextSize(5);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setCursor(20, 100);
  tft.print("Winner: ");
  tft.print(team);
  
  // Send winner to serial (for web app)
  Serial.print("WINNER:");
  Serial.println(team);
}

void resetGame() {
  buzzLocked = false;
  winner = -1;
  
  // POWER CONTROL: Turn off all buzzer power (reset state)
  for (int i = 0; i < 6; i++) {
    digitalWrite(ENABLE_PIN[i], HIGH);  // Turn all MOSFETs OFF (no power to any box)
  }
  
  // Clear display
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(30, 120);
  tft.print("Ready for next question");
  
  // Notify serial
  Serial.println("RESET");
}

void loop() {
  // Check if a winner is already locked
  if (!buzzLocked) {
    // Scan all buzzers for a press
    for (int i = 0; i < 6; ++i) {
      if (digitalRead(BUZZER_PIN[i]) == LOW) {  // button pressed (active low)
        // Debounce: simple delay to confirm, and check still pressed
        delay(20);
        if (digitalRead(BUZZER_PIN[i]) == LOW) {
          lockInWinner(i + 1);  // store winner as 1-indexed team number
        }
        break;  // exit loop once a winner is found
      }
    }
  }

  // Check hardware reset button
  if (digitalRead(RESET_BTN_PIN) == LOW) {
    // Debounce reset button
    delay(20);
    if (digitalRead(RESET_BTN_PIN) == LOW) {
      resetGame();
      // Wait until button is released to avoid rapid-fire resets
      while (digitalRead(RESET_BTN_PIN) == LOW) {
        delay(10);
      }
    }
  }

  // Check for serial commands from the web app
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "RESET") {
      resetGame();
    }
    // (You could extend protocol for name updates, etc., if needed)
  }

  // Small delay to avoid busy-wait hammering (and allow USB tasks)
  delay(5);
} 