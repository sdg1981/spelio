# Spelio practice-engine update

This build fixes the end-screen stats so:

- `Incorrect` counts unique words where the user made at least one mistake, not every incorrect keypress.
- `Revealed` counts unique words where reveal was used, not every revealed letter.
- Repeated mistakes on the same word still mark the word as difficult, but only count once in the end-screen total.
- Repeated reveals on the same word still reveal letters, but only count once in the end-screen total.

The red wrong-letter state remains tied to the active letter slot so later mistakes should also show red correctly.
