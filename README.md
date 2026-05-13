# Spelio frontend UI prototype

Static React + TypeScript + Tailwind implementation of the Spelio MVP frontend screens.

## Run

```bash
npm install
npm run dev
```

## Audio generation

Azure TTS post-processing uses the bundled `@ffmpeg-installer/ffmpeg` binary in serverless routes. Set `FFMPEG_PATH` only if a deployment environment needs to override that binary path.

## Included screens

- First-time homepage
- Returning homepage
- Struggled homepage
- Practice screen
- Settings modal
- Word list modal
- End screen

Use the tiny top-left state switcher while reviewing the prototype. It is intentionally temporary and can be removed when routing/state is added.
