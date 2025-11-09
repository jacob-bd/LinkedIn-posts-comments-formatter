# LinkedIn Posts & Comments Formatter
<img width="1280" height="800" alt="Main" src="https://github.com/user-attachments/assets/d4095738-99a6-4a80-a502-b901f9c6ea48" />

A Chrome extension that adds powerful text formatting capabilities to LinkedIn's post editor, allowing you to create beautifully formatted posts with Unicode styling, bullets, and numbered lists.

## ✨ Features

### Works Everywhere
- **Posts** - Format your LinkedIn posts
- **Comments** - Format comments on posts
- **Replies** - Format replies to comments
- Auto-detects and appears in any LinkedIn text editor

### Text Formatting
- **Bold** - Make your text stand out
- **Italic** - Add emphasis to your content
- **Bold Italic** - Combine both styles for maximum impact
- **Strikethrough** - Show edits or changes
- **Underline** - Highlight important text

### Font Styles (7 Options)
- **Sans-serif** - Clean, modern look
- **Script** - Elegant cursive style
- **Circled** - Letters in circles (Ⓐ ⓑ ⓒ)
- **Negative Circled** - Inverted circles (🅐 🅑 🅒)
- **Squared** - Letters in squares (🄰 🄱 🄲)
- **Fullwidth** - Asian-style wide spacing (Ａ ｂ ｃ)
- **Monospace** - Typewriter style (𝙰 𝚋 𝚌)

### Lists
- **Bullet Lists** - Add professional bullet points to multiple lines
- **Numbered Lists** - Create ordered lists (1., 2., 3.)
- One-click formatting for multi-line selections

### Additional Features
- **Clear Formatting** - Remove all formatting with one click
- **Keyboard Shortcuts** - Quick formatting with hotkeys:
  - `Ctrl+B` (or `Cmd+B` on Mac) - Bold
  - `Ctrl+I` (or `Cmd+I` on Mac) - Italic
  - `Ctrl+U` (or `Cmd+U` on Mac) - Underline
  - `Ctrl+S` (or `Cmd+S` on Mac) - Strikethrough
- **Works Everywhere** - Posts, comments, and replies
- **Auto-detection** - Automatically appears when you start typing

## 🚀 Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store listing](https://chrome.google.com/webstore) (coming soon)
2. Click "Add to Chrome"
3. Confirm installation

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory
6. The extension is now installed!

## 📖 Usage

1. **Open LinkedIn** and navigate to:
   - Create a new post, OR
   - Write a comment on a post, OR
   - Reply to a comment
2. **Click in the text editor** - The formatting toolbar will automatically appear
3. **Type or select your text**
4. **Click formatting buttons** to apply styles
5. **Use keyboard shortcuts** for quick formatting
6. **Post, comment, or reply** with your beautifully formatted content!

**Note:** The formatting toolbar works in all LinkedIn text editors - posts, comments, and replies!

### Tips
- Select multiple lines and click the bullet button to create a bullet list
- Use the "Clear Formatting" button (✕) to remove all formatting
- Formatting works with all Unicode characters, so it displays correctly across all platforms

## 🔒 Privacy Policy

**Last Updated: November 2025**

### Data Collection
This extension **does not collect, store, or transmit any personal data or user content**. 

### Local Storage
The extension uses Chrome's `chrome.storage.local` API to store the following data **locally on your device only**:
- **Usage statistics** (optional): Count of formatting actions used (e.g., "bold used 5 times")
- **Settings preferences**: Your formatting preferences (enabled/disabled states)

**This data:**
- ✅ Stays on your device
- ✅ Never leaves your browser
- ✅ Is not transmitted to any external servers
- ✅ Is not shared with third parties
- ✅ Can be cleared at any time via Chrome's extension settings

### Permissions Explained
- **`activeTab`**: Required to access LinkedIn pages and inject the formatting toolbar
- **`storage`**: Used to store your preferences locally (no external transmission)
- **`notifications`**: Used to show a welcome message on first install only
- **Host permissions for `linkedin.com`**: Required to add formatting buttons to LinkedIn's interface

### Third-Party Services
This extension does not use any third-party analytics, tracking, or data collection services.

### Your Rights
You can:
- View stored data: `chrome://extensions/` → LinkedIn Posts & Comments Formatter → Details → "Inspect views: background page" → Application → Storage → Local Storage
- Clear all data: Uninstall and reinstall the extension
- Disable the extension at any time

### Contact
If you have questions about privacy, please open an issue on GitHub or contact the maintainer.

## 🛠️ Development

### Project Structure
```
├── manifest.json          # Extension manifest (Chrome Web Store config)
├── background.js          # Background service worker
├── content.js            # Main content script (formatting logic)
├── icon-*.png            # Extension icons
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Update README if needed
- Test manually before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the LinkedIn community
- Uses Unicode characters for cross-platform compatibility
- Inspired by the need for better formatting options on LinkedIn

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jacob-bd/LinkedIn-posts-comments-formatter/issues)
- **Questions**: Open a discussion on GitHub

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Text formatting (bold, italic, bold italic, strikethrough, underline)
- Font styles (7 options: Sans-serif, Script, Circled, Negative Circled, Squared, Fullwidth, Monospace)
- Bullet and numbered lists
- Clear formatting (removes all formatting)
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+S)
- Welcome notification on first install
- Performance optimizations
- Privacy-focused (no user content logging)

---

**Made with ❤️ for the LinkedIn community**

