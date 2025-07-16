#include <Arduino.h>

// Cat-6 Pin1 → buzz-in buttons (active-LOW)
const int BUZZER_PIN[6] = {4, 5, 13, 14, 21, 22};

// Cat-6 Pin3 → box LEDs (LOW = ON)
const int LED_PIN[6]    = {18, 19, 23, 27, 26, 25 };

// Cat-6 Pin4 → box speakers (tone())
const int SOUND_PIN[6]  = {15, 2, 16, 17, 33, 32};

// On-board BOOT button → reset
const int RESET_BUTTON  = 0;

// Timing (µs)
const unsigned long DEBOUNCE_US   = 30000;
const unsigned long RESET_HOLD_US = 300000;
const unsigned long SOUND_US      = 2000000;  // 2 s

// State
bool  gameActive       = true,
      winnerDet        = false;
unsigned long firstPress[6] = {0},
              lastState[6]  = {HIGH},
              resetLast      = HIGH,
              resetPress     = 0,
              soundStart     = 0;
int   soundTeam        = 0;
bool  soundOn          = false;

void setup() {
  Serial.begin(9600);
  delay(200);

  // buzz-in buttons
  for(int i=0;i<6;i++) pinMode(BUZZER_PIN[i], INPUT_PULLUP);
  // LEDs off by default
  for(int i=0;i<6;i++){
    pinMode(LED_PIN[i], OUTPUT);
    digitalWrite(LED_PIN[i], LOW);  // LOW → MOSFET gate=3.3V → LED OFF
  }
  // speakers idle
  for(int i=0;i<6;i++){
    pinMode(SOUND_PIN[i], OUTPUT);
    digitalWrite(SOUND_PIN[i], LOW);
  }
  // reset button
  pinMode(RESET_BUTTON, INPUT_PULLUP);

  Serial.println("READY");
}

void loop(){
  unsigned long now = micros();

  // 1) Serial RESET?
  if(Serial.available() && Serial.readStringUntil('\n')=="RESET"){
    fastReset(); return;
  }

  // 2) HW RESET?
  bool rb = digitalRead(RESET_BUTTON);
  if(rb==LOW && resetLast==HIGH) resetPress = now;
  if(rb==HIGH && resetLast==LOW && now-resetPress>=RESET_HOLD_US){
    resetLast=rb;
    fastReset(); 
    return;
  }
  resetLast=rb;

  // 3) Stop tone after 2 s
  if(soundOn && now - soundStart >= SOUND_US){
    noTone(SOUND_PIN[soundTeam-1]);
    soundOn = false;
  }

  // 4) Poll buzzers
  if(gameActive && !winnerDet){
    bool any=false;
    bool st[6];
    for(int i=0;i<6;i++){
      st[i] = digitalRead(BUZZER_PIN[i]);
      if(st[i]==LOW && lastState[i]==HIGH && firstPress[i]==0)
        firstPress[i]=now;
      if(firstPress[i] && st[i]==LOW && now-firstPress[i]>=DEBOUNCE_US)
        any=true;
    }
    for(int i=0;i<6;i++){
      if(st[i]==HIGH && lastState[i]==LOW)
        firstPress[i]=0;
      lastState[i]=st[i];
    }
    if(any) fastWin(now);
  }
}

void fastWin(unsigned long now){
  if(winnerDet) return;
  winnerDet = gameActive = false;

  // find earliest
  unsigned long earliest=0; int tm=0;
  for(int i=0;i<6;i++){
    if(firstPress[i] && now-firstPress[i]>=DEBOUNCE_US){
      if(!earliest || firstPress[i]<earliest){
        earliest=firstPress[i];
        tm = i+1;
      }
    }
  }
  if(!tm) return;

  // turn all LEDs OFF
  for(int i=0;i<6;i++) digitalWrite(LED_PIN[i], LOW);
  // light winner LED
  digitalWrite(LED_PIN[tm-1], HIGH);

  // start 2 kHz tone for 2 s
  tone(SOUND_PIN[tm-1], 2000);
  soundStart = micros();
  soundTeam  = tm;
  soundOn    = true;

  Serial.println("WINNER:" + String(tm));
}

void fastReset(){
  gameActive = true;
  winnerDet  = false;
  for(int i=0;i<6;i++){
    firstPress[i]=0;
    lastState[i]=HIGH;
    digitalWrite(LED_PIN[i], LOW);   // all off
    noTone(SOUND_PIN[i]);             // ensure no tone
  }
  soundOn = false;
  Serial.println("READY");
}