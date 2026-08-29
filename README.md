# Web eDITA

Web eDITA is a lightweight browser-based editor for quick DITA/XML edits, validation, and preview. It is designed for small single-file documentation fixes where opening a full XML authoring environment would be unnecessary overhead.

Live app: [https://webedita.netlify.app/](https://webedita.netlify.app/)

## What It Does

- Opens DITA/XML content from a file, drag-and-drop, or direct editing.
- Validates XML in the browser and reports parsing errors.
- Renders a live HTML preview of common DITA structures.
- Supports split editor/preview workflow with a resizable layout.
- Saves edited content back to a local file.

## Supported DITA Content

The preview renderer handles common documentation elements including concepts, tasks, references, titles, short descriptions, paragraphs, sections, notes, ordered and unordered lists, definition lists, code blocks, inline code, UI controls, figures, images, links, tables, steps, substeps, and related task content.

## Repository Contents

- `index.html` - Application shell and controls.
- `script.js` - XML parsing, validation, preview rendering, file handling, and editor interactions.
- `styles.css` - Application layout and visual styling.
- `sample.dita` - Basic sample DITA file.
- `test_example.dita` - Additional test/example DITA content.

## Running Locally

No build step is required. Open `index.html` directly in a browser, or serve the folder with any static file server.

For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
