# Assets Folder

This folder contains all static assets for the Quiz Buzzer System.

## Structure

```
assets/
├── audio/
│   └── duck-toy-sound.mp3    # Duck sound effect for team buzz-ins
└── README.md                 # This file
```

## Audio Files

- **duck-toy-sound.mp3**: The main buzzer sound effect that plays when teams buzz in
  - Format: MP3
  - Duration: ~2 seconds
  - Usage: Loaded via HTML5 Audio API in buzzer.html
  - Path referenced in code: `assets/audio/duck-toy-sound.mp3`

## Adding New Audio Files

To add new audio files:

1. Place them in the `assets/audio/` directory
2. Update the file path in `buzzer.html` if replacing the duck sound
3. Supported formats: MP3, WAV, OGG (MP3 recommended for best compatibility)

## Organization

This structure keeps all static assets organized and separate from the main application files, making the project easier to maintain and deploy. 