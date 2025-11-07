// LinkedIn Post Formatter - Enhanced Version
// Tracks editors and manages formatting functionality

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
    const map = style === 'bold' ? boldMap :
                 style === 'italic' ? italicMap : boldItalicMap;
    return text.split('').some(char => Object.values(map).includes(char));
}

// Remove Unicode formatting
function removeFormatting(text, style) {
    const map = style === 'bold' ? boldMap :
                 style === 'italic' ? italicMap : boldItalicMap;

    return text.split('').map(char => {
        const index = Object.values(map).indexOf(char);
        return index !== -1 ? Object.keys(map)[index] : char;
    }).join('');
}

// Remove all Unicode formatting from text using the actual Unicode ranges
function clearFormatting(text) {
    if (!text) return '';

    console.log('clearFormatting input:', text);

    // Use Array.from to properly handle Unicode characters (including surrogate pairs)
    let result = Array.from(text).map(char => {
        // Use codePointAt to get the actual Unicode code point (handles surrogate pairs)
        const codePoint = char.codePointAt(0);

        console.log(`Processing char: "${char}" code point: 0x${codePoint.toString(16).toUpperCase()}`);

        // Bold (Sans-serif): U+1D5D4-U+1D607, U+1D7EC-U+1D7F5
        if (codePoint >= 0x1D5D4 && codePoint <= 0x1D5ED) {
            // Bold uppercase A-Z
            const result = String.fromCharCode(65 + (codePoint - 0x1D5D4));
            console.log(`Bold uppercase detected, converting to: ${result}`);
            return result;
        }
        if (codePoint >= 0x1D5EE && codePoint <= 0x1D607) {
            // Bold lowercase a-z
            const result = String.fromCharCode(97 + (codePoint - 0x1D5EE));
            console.log(`Bold lowercase detected, converting to: ${result}`);
            return result;
        }
        if (codePoint >= 0x1D7EC && codePoint <= 0x1D7F5) {
            // Bold numbers 0-9
            const result = String.fromCharCode(48 + (codePoint - 0x1D7EC));
            console.log(`Bold number detected, converting to: ${result}`);
            return result;
        }

        // Italic: U+1D608-U+1D63B
        if (codePoint >= 0x1D608 && codePoint <= 0x1D621) {
            // Italic uppercase A-Z
            const result = String.fromCharCode(65 + (codePoint - 0x1D608));
            console.log(`Italic uppercase detected, converting to: ${result}`);
            return result;
        }
        if (codePoint >= 0x1D622 && codePoint <= 0x1D63B) {
            // Italic lowercase a-z
            const result = String.fromCharCode(97 + (codePoint - 0x1D622));
            console.log(`Italic lowercase detected, converting to: ${result}`);
            return result;
        }

        // Bold Italic: U+1D63C-U+1D66F
        if (codePoint >= 0x1D63C && codePoint <= 0x1D655) {
            // Bold Italic uppercase A-Z
            const result = String.fromCharCode(65 + (codePoint - 0x1D63C));
            console.log(`Bold italic uppercase detected, converting to: ${result}`);
            return result;
        }
        if (codePoint >= 0x1D656 && codePoint <= 0x1D66F) {
            // Bold Italic lowercase a-z
            const result = String.fromCharCode(97 + (codePoint - 0x1D656));
            console.log(`Bold italic lowercase detected, converting to: ${result}`);
            return result;
        }

        // Also check legacy maps for backwards compatibility
        const allMaps = [boldMap, italicMap, boldItalicMap];
        for (const map of allMaps) {
            const values = Object.values(map);
            const index = values.indexOf(char);
            if (index !== -1) {
                console.log(`Found in legacy map, converting from ${char} to ${Object.keys(map)[index]}`);
                return Object.keys(map)[index];
            }
        }

        // Not a formatted character, return as-is
        console.log(`No formatting detected, keeping as-is: ${char}`);
        return char;
    }).join('');

    // Also remove bullet points
    result = result.replace(/^•\s*/gm, '');
    result = result.replace(/●\s*/g, '');
    result = result.replace(/^•/gm, '');

    console.log('clearFormatting output:', result);
    return result;
}

// Create formatting toolbar
function createFormattingBar() {
    console.log('Creating formatting bar');
    const formattingBar = document.createElement('div');
    formattingBar.className = 'linkedin-formatter-bar';
    formattingBar.style.cssText = `
        position: absolute;
        top: -55px;
        left: 0;
        right: 0;
        background-color: #f3f6f8;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        gap: 8px;
        align-items: center;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const buttons = [
        { text: 'B', action: 'bold', style: 'font-weight: bold; font-size: 14px;', title: 'Bold (Ctrl+B)' },
        { text: 'I', action: 'italic', style: 'font-style: italic; font-size: 14px;', title: 'Italic (Ctrl+I)' },
        { text: 'B/I', action: 'boldItalic', style: 'font-weight: bold; font-style: italic; font-size: 13px;', title: 'Bold Italic' },
        { text: '●', action: 'bullet', style: 'font-size: 20px; line-height: 1;', title: 'Bullet Point' },
        { text: 'Clear', action: 'clear', style: 'font-size: 12px; color: #666;', title: 'Clear Formatting' }
    ];

    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.title = button.title;

        const baseStyle = `
            background-color: #fff;
            border: 1px solid ${button.action === 'clear' ? '#999' : '#0a66c2'};
            color: ${button.action === 'clear' ? '#666' : '#0a66c2'};
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
            min-width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            ${button.style}
        `;
        btn.style.cssText = baseStyle;

        // Hover effects
        btn.onmouseenter = () => {
            if (button.action === 'clear') {
                btn.style.backgroundColor = '#666';
                btn.style.color = '#fff';
            } else {
                btn.style.backgroundColor = '#0a66c2';
                btn.style.color = '#fff';
            }
        };
        btn.onmouseleave = () => {
            btn.style.cssText = baseStyle;
        };

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Button clicked: ${button.action}`);
            formatText(button.action);

            // Track usage
            trackUsage(button.action);
        };

        formattingBar.appendChild(btn);
    });

    console.log('Formatting bar created with buttons:', buttons.map(b => b.text).join(', '));
    return formattingBar;
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

        if (action === 'bold' || action === 'italic' || action === 'boldItalic') {
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

// Attach formatter to an editor
function attachFormatter(editor) {
    if (state.editors.has(editor)) {
        console.log('Formatter already attached to this editor');
        return;
    }

    console.log('Attaching formatter to editor:', editor);
    state.editors.add(editor);
    state.currentEditor = editor;

    // Check if a bar already exists for this editor's parent
    const parent = editor.parentNode;
    if (!parent) {
        console.log('Editor has no parent, cannot attach formatter');
        return;
    }

    // Remove any existing bars in the parent to prevent duplicates
    const existingBars = parent.querySelectorAll('.linkedin-formatter-bar');
    existingBars.forEach(bar => bar.remove());

    // Create formatting bar
    const formattingBar = createFormattingBar();
    state.formattingBars.set(editor, formattingBar);

    // Only set position relative if not already set
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
        parent.style.position = 'relative';
    }

    // Insert bar before editor
    parent.insertBefore(formattingBar, editor);

    // Only add margin if not already set
    const currentMargin = window.getComputedStyle(editor).marginTop;
    if (currentMargin === '0px' || currentMargin === '') {
        editor.style.marginTop = '60px';
    }

    // Set up removal observer
    const removalObserver = new MutationObserver(() => {
        if (!document.contains(editor)) {
            formattingBar.remove();
            state.editors.delete(editor);
            state.formattingBars.delete(editor);
            if (state.currentEditor === editor) {
                state.currentEditor = null;
            }
            removalObserver.disconnect();
            console.log('Editor removed, cleaned up formatter');
        }
    });

    removalObserver.observe(parent, { childList: true });

    // Track focus
    editor.addEventListener('focus', () => {
        state.currentEditor = editor;
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

const debouncedHandleMutations = debounce(handleMutations, 500);

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
        setupObservers();
        setupKeyboardShortcuts();

        // Initial scan after a delay to let LinkedIn load
        setTimeout(scanForEditors, 2000);

        // Periodic scan every 5 seconds for robustness
        setInterval(() => {
            const editor = findPostEditor();
            if (editor && !state.editors.has(editor)) {
                console.log('Periodic scan found new editor');
                scanForEditors();
            }
        }, 5000);

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
