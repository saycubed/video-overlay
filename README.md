# OverlayTV - Video Overlay Editor

Draw and add text overlays to videos, control when they appear, and share with friends!

![OverlayTV Screenshot](https://via.placeholder.com/800x400/0a0a0f/ff3366?text=OverlayTV)

## Features

- 🎬 **Embed videos** from YouTube, Vimeo, and more
- ✏️ **Draw overlays** with customizable colors and brush sizes
- 📝 **Add text** annotations anywhere on the video
- ⏱️ **Timeline control** - set exactly when overlays appear and disappear
- 🔗 **Shareable links** - overlays are encoded in the URL, no database needed!

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" and import your repository
4. Vercel will auto-detect it's a React app - just click "Deploy"

That's it! Your app will be live in ~1 minute.

## How to Use

1. **Paste a YouTube URL** and click "Load Video"
2. **Pause the video** at the moment you want to add an overlay
3. **Select a tool** (Draw or Text) from the toolbar
4. **Draw or click** on the video to add your overlay
5. **Adjust timing** using the timeline at the bottom
6. **Click Share** to get a link with your annotations baked in!

## Tech Stack

- React 18
- react-player (video embedding)
- HTML Canvas (drawing)
- lz-string (URL compression for sharing)

## Project Structure

```
src/
├── App.js              # Main app component
├── App.css             # App styles
├── components/
│   ├── VideoPlayer.js  # Video embedding
│   ├── OverlayCanvas.js # Drawing canvas
│   ├── Toolbar.js      # Tool selection
│   ├── Timeline.js     # Overlay timing
│   └── ShareModal.js   # Share dialog
└── index.js            # Entry point
```

## Future Ideas

- [ ] Multi-stroke drawings per overlay
- [ ] Emoji/sticker support
- [ ] Backend for persistent storage
- [ ] Comments & reactions
- [ ] Mobile-optimized drawing

## License

MIT
