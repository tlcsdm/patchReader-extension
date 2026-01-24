# Patch Reader Extension

A browser extension to read and render patch/diff files using diff2html.

## Features

- 📄 Upload `.patch` or `.diff` files
- ✏️ Manually input patch/diff content
- 🔄 Real-time diff rendering with diff2html
- 📐 Side-by-side (左右布局) and line-by-line (上下布局) view modes
- 💾 Auto-save content and layout preference
- 🌐 Fully offline - no external dependencies

## Installation

### Chrome

1. Download the latest Chrome extension from [Releases](https://github.com/tlcsdm/patchReader-extension/releases)
2. Extract the zip file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

### Edge

1. Download the latest Edge extension from [Releases](https://github.com/tlcsdm/patchReader-extension/releases)
2. Extract the zip file
3. Open Edge and go to `edge://extensions/`
4. Enable "Developer mode" in the left sidebar
5. Click "Load unpacked" and select the extracted folder

## Usage

1. Click the extension icon in your browser toolbar
2. A new tab will open with the Patch Reader interface
3. Either:
   - Click "上传文件" to upload a `.patch` or `.diff` file
   - Paste diff content directly into the text area
4. The diff will be rendered automatically in the preview panel
5. Use the layout toggle buttons to switch between side-by-side and line-by-line views

## Development

### Prerequisites

- Node.js 18.x or later
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/tlcsdm/patchReader-extension.git
cd patchReader-extension

# Install dependencies
npm install

# Build extensions
npm run build

# Build only Chrome extension
npm run build:chrome

# Build only Edge extension
npm run build:edge
```

### Project Structure

```
patchReader-extension/
├── src/
│   ├── common/             # Shared files (copied to both browsers during build)
│   │   ├── diff-viewer.html
│   │   ├── diff-viewer.js
│   │   ├── styles.css
│   │   ├── icons/
│   │   └── lib/            # diff2html library
│   ├── chrome/             # Chrome-specific files
│   │   ├── manifest.json
│   │   └── background.js
│   └── edge/               # Edge-specific files
│       ├── manifest.json
│       └── background.js
├── scripts/
│   └── build.js            # Build script
├── .github/
│   ├── dependabot.yml
│   ├── CODEOWNERS
│   └── workflows/
│       ├── test.yml
│       ├── release.yml
│       └── push-artifact.yml
└── package.json
```

## License

MIT License - see [LICENSE](LICENSE) for details.
