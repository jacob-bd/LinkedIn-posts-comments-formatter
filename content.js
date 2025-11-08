// LinkedIn Post Formatter - Enhanced Version
// Tracks editors and manages formatting functionality

// Inject CSS to override LinkedIn's toolbar centering
function injectToolbarStyles() {
    const styleId = 'linkedin-formatter-toolbar-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Keep buttons inline without forcing new line */
        .linkedin-formatter-buttons {
            margin-right: 8px !important;
        }
    `;
    document.head.appendChild(style);
}

// State management using WeakSet for automatic garbage collection
const state = {
    editors: new WeakSet(),
    formattingBars: new WeakMap(),
    observer: null,
    urlObserver: null,
    currentEditor: null
};

// Unicode character mapping for text formatting
const unicodeRanges = {
    bold: {
        uppercase: 0x1D5D4,  // A-Z: U+1D5D4 to U+1D5ED
        lowercase: 0x1D5EE,  // a-z: U+1D5EE to U+1D607
        numbers: 0x1D7EC     // 0-9: U+1D7EC to U+1D7F5
    },
    italic: {
        uppercase: 0x1D608,  // A-Z
        lowercase: 0x1D622   // a-z
    },
    boldItalic: {
        uppercase: 0x1D63C,  // A-Z
        lowercase: 0x1D656   // a-z
    },
    monospace: {
        uppercase: 0x1D670,  // A-Z: U+1D670 to U+1D689
        lowercase: 0x1D68A,  // a-z: U+1D68A to U+1D6A3
        numbers: 0x1D7F6     // 0-9: U+1D7F6 to U+1D7FF
    },
    // Strikethrough and underline use combining characters
    strikethrough: {
        combiningChar: '\u0336'  // Combining long stroke overlay
    },
    underline: {
        combiningChar: '\u0332'  // Combining low line
    }
};

// Legacy maps for backwards compatibility and reverse conversion
const boldMap = {
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉',
    'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓',
    'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣',
    'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭',
    'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
};

const italicMap = {
    'A': '𝐴', 'B': '𝐵', 'C': '𝐶', 'D': '𝐷', 'E': '𝐸', 'F': '𝐹', 'G': '𝐺', 'H': '𝐻', 'I': '𝐼', 'J': '𝐽',
    'K': '𝐾', 'L': '𝐿', 'M': '𝑀', 'N': '𝑁', 'O': '𝑂', 'P': '𝑃', 'Q': '𝑄', 'R': '𝑅', 'S': '𝑆', 'T': '𝑇',
    'U': '𝑈', 'V': '𝑉', 'W': '𝑊', 'X': '𝑋', 'Y': '𝑌', 'Z': '𝑍',
    'a': '𝑎', 'b': '𝑏', 'c': '𝑐', 'd': '𝑑', 'e': '𝑒', 'f': '𝑓', 'g': '𝑔', 'h': 'ℎ', 'i': '𝑖', 'j': '𝑗',
    'k': '𝑘', 'l': '𝑙', 'm': '𝑚', 'n': '𝑛', 'o': '𝑜', 'p': '𝑝', 'q': '𝑞', 'r': '𝑟', 's': '𝑠', 't': '𝑡',
    'u': '𝑢', 'v': '𝑣', 'w': '𝑤', 'x': '𝑥', 'y': '𝑦', 'z': '𝑧'
};

const boldItalicMap = {
    'A': '𝑨', 'B': '𝑩', 'C': '𝑪', 'D': '𝑫', 'E': '𝑬', 'F': '𝑭', 'G': '𝑮', 'H': '𝑯', 'I': '𝑰', 'J': '𝑱',
    'K': '𝑲', 'L': '𝑳', 'M': '𝑴', 'N': '𝑵', 'O': '𝑶', 'P': '𝑷', 'Q': '𝑸', 'R': '𝑹', 'S': '𝑺', 'T': '𝑻',
    'U': '𝑼', 'V': '𝑽', 'W': '𝑾', 'X': '𝑿', 'Y': '𝒀', 'Z': '𝒁',
    'a': '𝒂', 'b': '𝒃', 'c': '𝒄', 'd': '𝒅', 'e': '𝒆', 'f': '𝒇', 'g': '𝒈', 'h': '𝒉', 'i': '𝒊', 'j': '𝒋',
    'k': '𝒌', 'l': '𝒍', 'm': '𝒎', 'n': '𝒏', 'o': '𝒐', 'p': '𝒑', 'q': '𝒒', 'r': '𝒓', 's': '𝒔', 't': '𝒕',
    'u': '𝒖', 'v': '𝒗', 'w': '𝒘', 'x': '𝒙', 'y': '𝒚', 'z': '𝒛'
};

// Utility: Debounce function to limit execution frequency
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced Unicode conversion using character code ranges
function convertToUnicode(text, style) {
    const range = unicodeRanges[style];
    if (!range) return text;

    // Handle combining characters (strikethrough, underline)
    if (range.combiningChar) {
        return text.split('').map(char => {
            // Don't add combining char to spaces or special chars
            if (char === ' ' || char === '\n' || char === '\r') {
                return char;
            }
            return char + range.combiningChar;
        }).join('');
    }

    // Handle regular Unicode ranges (bold, italic, monospace, etc.)
    return text.split('').map(char => {
        const code = char.charCodeAt(0);

        // Uppercase A-Z (65-90)
        if (code >= 65 && code <= 90 && range.uppercase) {
            return String.fromCodePoint(code - 65 + range.uppercase);
        }

        // Lowercase a-z (97-122)
        if (code >= 97 && code <= 122 && range.lowercase) {
            return String.fromCodePoint(code - 97 + range.lowercase);
        }

        // Numbers 0-9 (48-57)
        if (code >= 48 && code <= 57 && range.numbers) {
            return String.fromCodePoint(code - 48 + range.numbers);
        }

        return char; // Keep original if no mapping
    }).join('');
}

// Check if text is already formatted
function isFormatted(text, style) {
    const range = unicodeRanges[style];
    if (!range) return false;

    // Check for combining characters
    if (range.combiningChar) {
        return text.includes(range.combiningChar);
    }

    // Check legacy maps for backward compatibility
    const map = style === 'bold' ? boldMap :
                 style === 'italic' ? italicMap :
                 style === 'boldItalic' ? boldItalicMap : null;

    if (map) {
        return text.split('').some(char => Object.values(map).includes(char));
    }

    return false;
}

// Remove Unicode formatting
function removeFormatting(text, style) {
    const range = unicodeRanges[style];
    if (!range) return text;

    // Remove combining characters
    if (range.combiningChar) {
        return text.split(range.combiningChar).join('');
    }

    // Use legacy maps for backward compatibility
    const map = style === 'bold' ? boldMap :
                 style === 'italic' ? italicMap :
                 style === 'boldItalic' ? boldItalicMap : null;

    if (map) {
        return text.split('').map(char => {
            const index = Object.values(map).indexOf(char);
            return index !== -1 ? Object.keys(map)[index] : char;
        }).join('');
    }

    return text;
}

// Remove all Unicode formatting from text using the actual Unicode ranges
function clearFormatting(text) {
    if (!text) return '';

    console.log('clearFormatting input:', text);

    // First, remove combining characters (strikethrough and underline)
    // These need to be removed BEFORE processing individual characters
    let result = text;
    result = result.replace(/\u0336/g, ''); // Combining long stroke overlay (strikethrough)
    result = result.replace(/\u0332/g, ''); // Combining low line (underline)

    // Now process each character to convert formatted text back to plain
    // Use Array.from to properly handle Unicode characters (including surrogate pairs)
    result = Array.from(result).map(char => {
        // Skip whitespace characters - preserve them exactly
        if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
            return char;
        }

        // Use codePointAt to get the actual Unicode code point (handles surrogate pairs)
        const codePoint = char.codePointAt(0);

        // Bold (Sans-serif): U+1D5D4-U+1D607, U+1D7EC-U+1D7F5
        if (codePoint >= 0x1D5D4 && codePoint <= 0x1D5ED) {
            return String.fromCharCode(65 + (codePoint - 0x1D5D4)); // Bold uppercase A-Z
        }
        if (codePoint >= 0x1D5EE && codePoint <= 0x1D607) {
            return String.fromCharCode(97 + (codePoint - 0x1D5EE)); // Bold lowercase a-z
        }
        if (codePoint >= 0x1D7EC && codePoint <= 0x1D7F5) {
            return String.fromCharCode(48 + (codePoint - 0x1D7EC)); // Bold numbers 0-9
        }

        // Italic: U+1D608-U+1D63B
        if (codePoint >= 0x1D608 && codePoint <= 0x1D621) {
            return String.fromCharCode(65 + (codePoint - 0x1D608)); // Italic uppercase A-Z
        }
        if (codePoint >= 0x1D622 && codePoint <= 0x1D63B) {
            return String.fromCharCode(97 + (codePoint - 0x1D622)); // Italic lowercase a-z
        }

        // Bold Italic: U+1D63C-U+1D66F
        if (codePoint >= 0x1D63C && codePoint <= 0x1D655) {
            return String.fromCharCode(65 + (codePoint - 0x1D63C)); // Bold Italic uppercase A-Z
        }
        if (codePoint >= 0x1D656 && codePoint <= 0x1D66F) {
            return String.fromCharCode(97 + (codePoint - 0x1D656)); // Bold Italic lowercase a-z
        }

        // Monospace: U+1D670-U+1D6A3, U+1D7F6-U+1D7FF
        if (codePoint >= 0x1D670 && codePoint <= 0x1D689) {
            return String.fromCharCode(65 + (codePoint - 0x1D670)); // Monospace uppercase A-Z
        }
        if (codePoint >= 0x1D68A && codePoint <= 0x1D6A3) {
            return String.fromCharCode(97 + (codePoint - 0x1D68A)); // Monospace lowercase a-z
        }
        if (codePoint >= 0x1D7F6 && codePoint <= 0x1D7FF) {
            return String.fromCharCode(48 + (codePoint - 0x1D7F6)); // Monospace numbers 0-9
        }

        // Also check legacy maps for backwards compatibility
        const allMaps = [boldMap, italicMap, boldItalicMap];
        for (const map of allMaps) {
            const values = Object.values(map);
            const index = values.indexOf(char);
            if (index !== -1) {
                return Object.keys(map)[index];
            }
        }

        // Not a formatted character, return as-is
        return char;
    }).join('');

    // Remove bullet points (but preserve spaces after them if any)
    result = result.replace(/^•\s*/gm, '');
    result = result.replace(/●\s*/g, '');

    console.log('clearFormatting output:', result);
    return result;
}

// Create formatting buttons container
function createFormattingButtons() {
    console.log('Creating formatting buttons');

    // Simple container
    const container = document.createElement('div');
    container.className = 'linkedin-formatter-buttons';
    container.style.cssText = `
        display: inline-flex;
        gap: 4px;
        align-items: center;
        flex-shrink: 0;
        white-space: nowrap;
    `;

    const buttons = [
        { text: 'B', action: 'bold', title: 'Bold (Ctrl+B)' },
        { text: 'I', action: 'italic', title: 'Italic (Ctrl+I)' },
        { text: 'B/I', action: 'boldItalic', title: 'Bold Italic' },
        { text: 'S̶', action: 'strikethrough', title: 'Strikethrough' },
        { text: 'U̲', action: 'underline', title: 'Underline' },
        { text: '𝙼', action: 'monospace', title: 'Monospace' },
        { text: '●', action: 'bullet', title: 'Bullet Point' },
        { text: '✕', action: 'clear', title: 'Clear Formatting' }
    ];

    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.title = button.title;
        btn.className = 'linkedin-formatter-btn';

        // Style to match LinkedIn's buttons
        btn.style.cssText = `
            background-color: transparent;
            border: none;
            color: rgba(0,0,0,0.6);
            padding: 8px;
            cursor: pointer;
            border-radius: 50%;
            transition: background-color 0.2s ease;
            min-width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: ${button.action === 'bold' || button.action === 'boldItalic' ? 'bold' : 'normal'};
            font-style: ${button.action === 'italic' || button.action === 'boldItalic' ? 'italic' : 'normal'};
        `;

        // Hover effect like LinkedIn's buttons
        btn.onmouseenter = () => {
            btn.style.backgroundColor = 'rgba(0,0,0,0.08)';
        };
        btn.onmouseleave = () => {
            btn.style.backgroundColor = 'transparent';
        };

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Button clicked: ${button.action}`);
            formatText(button.action);
            trackUsage(button.action);
        };

        container.appendChild(btn);
    });

    console.log('Formatting buttons created:', buttons.map(b => b.text).join(', '));
    return container;
}

// Track usage statistics
function trackUsage(action) {
    try {
        chrome.storage.local.get(['usage'], (result) => {
            const usage = result.usage || { count: 0, actions: {} };
            usage.count++;
            usage.actions[action] = (usage.actions[action] || 0) + 1;
            usage.lastUsed = Date.now();
            chrome.storage.local.set({ usage });
        });
    } catch (error) {
        console.log('Usage tracking failed:', error);
    }
}

// Enhanced text formatting with better LinkedIn compatibility
function formatText(action) {
    console.log(`Formatting text: ${action}, selected text length:`, window.getSelection().toString().length);

    try {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            console.log('No selection range available');
            return;
        }

        const range = selection.getRangeAt(0);
        let selectedText = range.toString();

        if (selectedText.length === 0 && action !== 'bullet') {
            console.log('No text selected for formatting');
            return;
        }

        let formattedText = '';

        if (action === 'bold' || action === 'italic' || action === 'boldItalic' ||
            action === 'monospace' || action === 'strikethrough' || action === 'underline') {
            // Check if already formatted
            if (isFormatted(selectedText, action)) {
                // Remove formatting
                formattedText = removeFormatting(selectedText, action);
                console.log('Removing formatting:', action);
            } else {
                // Add formatting using enhanced Unicode conversion
                formattedText = convertToUnicode(selectedText, action);
                console.log('Adding formatting:', action);
            }
        } else if (action === 'bullet') {
            // Toggle bullet point
            if (selectedText.startsWith('• ')) {
                formattedText = selectedText.slice(2);
            } else {
                formattedText = '• ' + selectedText;
            }
        } else if (action === 'clear') {
            // Clear all formatting
            console.log('Clearing formatting from:', selectedText);
            formattedText = clearFormatting(selectedText);
            console.log('Cleared result:', formattedText);
        }

        if (!formattedText && formattedText !== '') {
            console.error('No formatted text generated');
            return;
        }

        // Save the start container and offset before deleting
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;

        // Delete the selected content
        range.deleteContents();

        // Create text node with formatted text
        const textNode = document.createTextNode(formattedText);

        // Insert the node
        range.insertNode(textNode);

        // Create new range and collapse it after the inserted text
        const newRange = document.createRange();
        newRange.setStart(textNode, formattedText.length);
        newRange.collapse(true);

        // Clear selection and add new range
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Trigger multiple events for better LinkedIn compatibility
        const editor = state.currentEditor || document.activeElement;
        if (editor && editor.isContentEditable) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                const events = [
                    new InputEvent('input', {
                        bubbles: true,
                        cancelable: false,
                        inputType: 'insertText',
                        data: formattedText
                    }),
                    new Event('change', { bubbles: true })
                ];

                events.forEach(event => {
                    try {
                        editor.dispatchEvent(event);
                    } catch (e) {
                        console.log('Event dispatch error:', e);
                    }
                });
            }, 0);
        }

        console.log('Formatting applied successfully:', formattedText.substring(0, 50));
    } catch (error) {
        console.error('Error applying formatting:', error);
    }
}

// Find post editor with multiple strategies
function findPostEditor() {
    const selectors = [
        '[contenteditable="true"][role="textbox"]',
        '.ql-editor[contenteditable="true"]',
        '[contenteditable="true"]'
    ];

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            // Check if element is visible
            if (element.offsetParent !== null && element.isContentEditable) {
                // Skip if already has a formatter attached
                if (state.editors.has(element)) {
                    continue;
                }
                return element;
            }
        }
    }
    return null;
}

// Check if element is in a post creation context (more lenient)
function isPostContext(element) {
    if (!element.isContentEditable) return false;

    // Just check if it's visible and editable - be more lenient
    return element.offsetParent !== null;
}

// Find LinkedIn's bottom toolbar - works for posts, comments, and replies
function findLinkedInToolbar(editor) {
    console.log('Finding toolbar for editor:', editor);

    // First determine if this is a main post or a comment
    const isMainPost = editor.closest('[role="dialog"]') ||
                       editor.getAttribute('placeholder')?.includes('talk about') ||
                       editor.getAttribute('aria-label')?.includes('post');

    console.log('Context:', isMainPost ? 'MAIN POST' : 'COMMENT/REPLY');

    let searchContainer = editor;

    // Go up several levels to find a reasonable search scope
    for (let i = 0; i < 10; i++) {
        if (searchContainer.parentElement) {
            searchContainer = searchContainer.parentElement;
        }
    }

    // SPECIAL HANDLING FOR MAIN POSTS - Find the Post button footer
    if (isMainPost) {
        console.log('Main post detected - looking for Post button footer');

        // Find the Post button
        const allButtons = searchContainer.querySelectorAll('button');
        let postButton = null;

        for (const btn of allButtons) {
            const text = btn.textContent?.trim();
            const ariaLabel = btn.getAttribute('aria-label');

            if (text === 'Post' ||
                ariaLabel?.includes('Post') ||
                btn.className?.includes('share-actions__primary') ||
                btn.className?.includes('primary-action')) {
                postButton = btn;
                console.log('Found Post button:', text);
                break;
            }
        }

        if (postButton) {
            // Find the footer container that has the Post button
            let footer = postButton.parentElement;

            // Go up to find the actual footer container
            while (footer && !footer.className?.includes('footer') &&
                   !footer.className?.includes('share-box__bottom') &&
                   !footer.className?.includes('share-actions')) {
                footer = footer.parentElement;
            }

            if (footer) {
                console.log('Found footer with Post button:', footer.className);

                // Find or create a container for our buttons in the footer
                // Look for child divs that might contain action buttons
                const childDivs = footer.querySelectorAll('div');

                for (const div of childDivs) {
                    // Skip if this div contains the Post button
                    if (div.contains(postButton)) {
                        continue;
                    }

                    // Check if this div has buttons (likely the action area)
                    const hasButtons = div.querySelector('button');
                    if (hasButtons) {
                        console.log('✅ Found action button area in footer');
                        return div;
                    }
                }

                // If no action area found, use the footer itself
                console.log('✅ Using footer container for main post');
                return footer;
            }
        }
    }

    // FOR COMMENTS AND REPLIES - Use the emoji button parent (KEEP AS IS - IT'S WORKING!)
    console.log('Looking for emoji button for comment/reply');

    // Try multiple emoji button selectors
    const emojiSelectors = [
        'button[aria-label*="emoji" i]',
        'button[aria-label*="Emoji" i]',
        'button[aria-label*="Open emoji" i]',
        'button[aria-label*="Add an emoji" i]',
        'button[aria-label*="Insert an emoji" i]'
    ];

    let emojiButton = null;
    for (const selector of emojiSelectors) {
        emojiButton = searchContainer.querySelector(selector);
        if (emojiButton) {
            console.log(`Found emoji button with selector: ${selector}`);
            break;
        }
    }

    if (emojiButton) {
        const toolbar = emojiButton.parentElement;
        console.log('✅ Using emoji button parent as toolbar (comment/reply)');
        return toolbar;
    }

    // Fallback: Look for image/photo button
    const imageButton = searchContainer.querySelector('button[aria-label*="photo" i], button[aria-label*="image" i], button[aria-label*="Add a" i]');

    if (imageButton) {
        console.log('Found image button as fallback:', imageButton.getAttribute('aria-label'));
        const toolbar = imageButton.parentElement;
        console.log('✅ Using image button parent as toolbar');
        return toolbar;
    }

    console.warn('❌ Could not find toolbar for editor');
    return null;
}

// Attach formatter to an editor
function attachFormatter(editor) {
    if (state.editors.has(editor)) {
        console.log('Formatter already attached to this editor');
        return;
    }

    console.log('=== Attaching formatter ===');
    console.log('Editor:', editor);
    console.log('Editor classes:', editor.className);
    console.log('Editor parent:', editor.parentElement);

    state.editors.add(editor);
    state.currentEditor = editor;

    // Remove any existing formatter buttons to prevent duplicates
    const existingButtons = document.querySelectorAll('.linkedin-formatter-buttons');
    if (existingButtons.length > 0) {
        console.log('Removing', existingButtons.length, 'existing button sets');
        existingButtons.forEach(btn => btn.remove());
    }

    // Find LinkedIn's bottom toolbar
    const toolbar = findLinkedInToolbar(editor);
    if (!toolbar) {
        console.warn('❌ Could not find LinkedIn toolbar - buttons will not be added');
        console.log('Editor HTML:', editor.outerHTML.substring(0, 200));
        return;
    }

    console.log('✅ Found toolbar:', toolbar);
    console.log('Toolbar classes:', toolbar.className);

    // Create formatting buttons
    const formattingButtons = createFormattingButtons();
    state.formattingBars.set(editor, formattingButtons);

    // Determine if this is a main post for special insertion logic
    const isMainPost = editor.closest('[role="dialog"]') ||
                       editor.getAttribute('placeholder')?.includes('talk about') ||
                       editor.getAttribute('aria-label')?.includes('post');

    // Find the emoji button to insert our buttons right before it
    const emojiButton = toolbar.querySelector('button[aria-label*="emoji" i], button[aria-label*="Emoji" i]');

    // Don't modify toolbar layout - keep buttons inline

    // Always insert at the beginning for left alignment
    try {
        console.log('Inserting buttons at beginning of toolbar');
        toolbar.insertBefore(formattingButtons, toolbar.firstChild);
        console.log('✅ Formatting buttons inserted successfully');
    } catch (error) {
        console.error('❌ Error inserting buttons:', error);
        return;
    }

    // Set up removal observer
    const removalObserver = new MutationObserver(() => {
        if (!document.contains(editor)) {
            formattingButtons.remove();
            state.editors.delete(editor);
            state.formattingBars.delete(editor);
            if (state.currentEditor === editor) {
                state.currentEditor = null;
            }
            removalObserver.disconnect();
            console.log('Editor removed, cleaned up formatter');
        }
    });

    // Observe both posts and comments containers
    const container = editor.closest('[role="dialog"], .share-box, .share-creation-state, form, [class*="comment"]');
    if (container) {
        removalObserver.observe(container, { childList: true, subtree: true });
    }

    // Track focus
    editor.addEventListener('focus', () => {
        state.currentEditor = editor;
        console.log('Editor focused:', editor);
    });
}

// Scan for editors and attach formatters
function scanForEditors() {
    console.log('Scanning for post editors...');
    const editor = findPostEditor();

    if (editor && !state.editors.has(editor)) {
        attachFormatter(editor);
    }
}

// Handle DOM mutations
function handleMutations(mutations) {
    // Just trigger a scan instead of processing each mutation
    scanForEditors();
}

const debouncedHandleMutations = debounce(handleMutations, 250);

// Set up observers
function setupObservers() {
    // DOM mutation observer - less aggressive
    state.observer = new MutationObserver(debouncedHandleMutations);
    state.observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // URL change observer for SPA navigation
    let lastUrl = location.href;
    const urlCheckInterval = setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            console.log('URL changed from', lastUrl, 'to', currentUrl);
            lastUrl = currentUrl;
            // Clear existing editors tracking
            state.editors = new WeakSet();
            // Re-scan after navigation
            setTimeout(scanForEditors, 1000);
        }
    }, 1000);

    console.log('Observers set up successfully');
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Check if we're in an editor
        if (!state.currentEditor || !state.currentEditor.isContentEditable) {
            return;
        }

        // Ctrl/Cmd + B for bold
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            formatText('bold');
        }

        // Ctrl/Cmd + I for italic
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            formatText('italic');
        }
    });

    console.log('Keyboard shortcuts set up');
}

// Message listener for extension communication
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message received:', request);
    if (request.action) {
        formatText(request.action);
        sendResponse({ success: true });
    }
    return true;
});

// Initialize the extension
function init() {
    console.log('LinkedIn Formatter - Enhanced Version initializing...');

    try {
        injectToolbarStyles();
        setupObservers();
        setupKeyboardShortcuts();

        // Initial scan after a delay to let LinkedIn load
        setTimeout(scanForEditors, 1000);
        setTimeout(scanForEditors, 2000);
        setTimeout(scanForEditors, 3000);

        // Periodic scan every 2 seconds for robustness
        setInterval(() => {
            const editor = findPostEditor();
            if (editor && !state.editors.has(editor)) {
                console.log('Periodic scan found new editor');
                scanForEditors();
            }
        }, 2000);

        console.log('LinkedIn Formatter initialized successfully');
    } catch (error) {
        console.error('Error initializing LinkedIn Formatter:', error);
        // Retry initialization after delay
        setTimeout(init, 2000);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Error recovery
window.addEventListener('error', (e) => {
    console.error('Extension error:', e);
});

console.log('LinkedIn Formatter script loaded');
