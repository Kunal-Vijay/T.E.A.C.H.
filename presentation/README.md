# T.E.A.C.H. Hackathon Presentation

Premium 6-slide deck for the Infinity Learn hackathon (~5–6 minutes + live demo).

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
| `index.html` | 6-slide presentation |
| `styles.css` | Premium light theme (Teal + Amber accents) |
| `demo-data.json` | Exported from `teach.db` (topics + session stats) |
| `giphy.gif` | "Tumse na ho payega" meme (slide 2) |
| `TEACH-Hackathon.pptx` | PowerPoint export (all 6 slides) |
| `SPEAKER_NOTES.md` | Full narration script (~40–60s per slide) |

Refresh data and regenerate exports:

```bash
python3 scripts/export_presentation_data.py
python3 scripts/export_presentation_pptx.py
```

## Export to PowerPoint / PDF

- **PPTX:** Open `presentation/TEACH-Hackathon.pptx` (regenerate with `python3 scripts/export_presentation_pptx.py`)
- **PDF:** Print from browser (Cmd+P → Save as PDF, landscape)
