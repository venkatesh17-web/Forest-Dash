# Forest Dash Audio Assets

This directory is reserved for optional external sound effects and background music files (.mp3, .ogg, .wav).

By default, **FOREST DASH: SPIRIT RUNNER** utilizes a zero-dependency procedural Web Audio API engine implemented in `src/audio.js`. This generates all synthesized sound effects (jumping, sliding, coin rings, magical chimes, hits, shield breaks) and atmospheric background music in real time.

If you wish to add custom audio files in the future:
1. Place your audio files (e.g. `jump.mp3`, `theme.mp3`) into this folder.
2. Update `src/audio.js` to play your audio elements using `new Audio('assets/audio/your_file.mp3')`.

