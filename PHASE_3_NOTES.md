# Spelio Phase 3 update

This build adds local MVP behaviour on top of the existing frontend design.

## Added

- Local storage persistence under `spelio:mvp-progress:v1`
- Real settings state:
  - English visible on/off
  - Audio prompts on/off
  - Sound effects on/off
  - Welsh spelling flexible/strict
- Multi-list word selection with searchable word list modal
- 10-word practice sessions from selected lists
- Word selection priority using unseen/difficult/revealed progress
- Difficult word tracking
- Review difficult words mode
- End screen stats:
  - Correct words
  - Incorrect words
  - Revealed words
  - Time taken
- Returning-user and struggled-user homepage behaviour
- Recommendation logic after sessions

## Testing

Run:

```bash
npm install
npm run dev
```

Use Node 22 or Node 20.19+.

## Notes

Audio URLs are still empty mock values, so tapping the word pill will show `Audio unavailable`. The app is ready for real `audioUrl` values when the admin/audio phase is implemented.
