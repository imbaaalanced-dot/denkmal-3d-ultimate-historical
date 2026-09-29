# Kael — Der letzte Namensträger

Original fictional character created for Denkmal 3D. All artwork and speech are generated assets; the game labels the German voice as AI-generated.

## Artwork

Provider: built-in ImageGen, not CLI. Files under `assets/hero/` (also copied to `dist/assets/hero/`). Source files kept unchanged at their generation locations. Output inspected: 1254 × 1254 pixels each; three RGBA character poses and one RGB portrait.

- `kael-idle-v1.png` — complete idle combat pose.
- `kael-step-a-v1.png` — walking pose A.
- `kael-step-b-v1.png` — walking pose B.
- `kael-portrait-v1.png` — character portrait.

Base prompt: Premium hand-painted dark fantasy tactical game hero asset. KAEL last namebearer: handsome weathered adult male warrior 35, shoulder length silver white hair, obsidian plate armor engraved antique brass, ivory scarf, tattered crimson half cape, glowing teal soul lantern at belt, slim ember sword held in right hand, small shield bracer on left forearm. High 3/4 overhead game camera, facing lower-right, top of head and boots visible. Whole body idle combat pose, weapon pointing diagonally right, complete silhouette, centered square, transparent alpha background. Crisp detailed painted materials, clear silhouette at 80px. Single character; no scenery, text, watermark, logos or sprite sheet. Warm orange edge light and turquoise lantern glow.

Pose prompts used the idle image as reference. Preserve the exact identity, clothing, equipment, camera, framing and transparent background. Pose A: left foot forward, opposite leg behind, natural counter-swing, cape trailing left. Pose B: complementary right foot forward, opposite shoulder swing and natural trailing cape. Portrait: cinematic square chest/head portrait of the same character, grave tender resolve, charcoal background, sparse embers, no text.

The runtime uses three poses, horizontal mirroring, breathing, walking bob, attack recoil, slash effects, dodge trails and temporary spirit echoes. It is a 2D sprite character, not a rigged 3D model. Equipment affects combat statistics, weapon effects and relic auras; armor variants reuse the character artwork.

## Voice

Provider: HeyGen text-to-speech, public German male voice “Mordecai — Serious & Composed”; speed 0.96. No voice cloning. Files returned by the provider used a .wav URL but contain MPEG audio; local filenames correctly use .mp3. The game serves all six files locally, without runtime provider requests. Browser speech synthesis is only an error fallback. Captions remain available with voice muted.

| File | Duration | Script |
| --- | --- | --- |
| `voice/intro.mp3` | 9.04 s | Ich bin Kael. Früher bewachte ich dieses Tor. Dann öffnete ich es. Heute hole ich die Namen zurück, die das Feuer verschlungen hat. |
| `voice/chapter2.mp3` | 7.00 s | Mara? Ich höre dich zwischen den Steinen. Wenn ein Funke von dir geblieben ist, finde ich ihn. |
| `voice/chapter3.mp3` | 6.53 s | Das Denkmal ist kein Grab. Es ist ein Gefängnis. Und ich habe den Schlüssel die ganze Zeit getragen. |
| `voice/ultimate.mp3` | 1.83 s | Kein Name geht verloren! |
| `voice/lowhp.mp3` | 4.21 s | Noch ein Atemzug. Für die, die keinen mehr haben. |
| `voice/ending.mp3` | 5.98 s | Hörst du die Glocken, Mara? Sie läuten nicht für die Toten. Sie läuten für die Heimkehrenden. |

## Gameplay

- H: character menu, equipment and discovered memories. Combat pauses while open.
- F: soul call at 100 charge, nearby damage, 3 spirit allies for 5 seconds. Echo weapon increases allies to 5.
- Three equipment slots, two choices each. Unlocks at waves 3, 4 and 8. Modifiers are derived from base stats to prevent stacking or healing exploits.
- Story events at waves 1, 4, 8 and after completion of wave 15. Endless play remains available after the epilogue.
- Device-local sound/voice preferences only; runs are not saved across page reloads.

Validation: `node tests/game.test.cjs`; browser checks of start, prologue, equipment menu and local MP3 playback. Responsive layout inspected at a narrow viewport.
