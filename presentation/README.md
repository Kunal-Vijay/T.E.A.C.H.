# T.E.A.C.H. Hackathon Presentation

Premium 10-slide deck for the Infinity Learn hackathon (~8 minutes + ~4 min live demo).

## Open the deck

**Option A — direct file**

```bash
open presentation/index.html
```

**Option B — local server (recommended for Nova image assets)**

```bash
cd presentation && python3 -m http.server 8765
# Open http://localhost:8765
```

Navigate with **→** / **←** or the on-screen buttons.

## Files

| File | Purpose |
|------|---------|
| `index.html` | 10-slide presentation |
| `styles.css` | Premium dark theme (TEACH Midnight palette) |
| `SPEAKER_NOTES.md` | Full narration script (~40–60s per slide) |

## Screenshots

For even richer slides, capture these from the running app (`npm run dev` + backend):

1. Welcome page — Nova hero scene
2. Topic catalog grid
3. Topic Session Modal — mode picker
4. Loading session screen
5. Live classroom — whiteboard + Nova
6. Viva report — score ring + rubric

Drop images in `presentation/assets/` and swap into slide visual panels in `index.html`.

## Export to PowerPoint / PDF

- **PDF:** Print from browser (Cmd+P → Save as PDF, landscape)
- **PPTX:** Import PDF into PowerPoint, or rebuild slides using `SPEAKER_NOTES.md` as copy source
