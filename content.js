// LinkedIn Post Formatter - Enhanced Version
// Tracks editors and manages formatting functionality

// Debug mode - set to false for production to prevent logging user content
const DEBUG = false;
const log = DEBUG ? console.log.bind(console) : () => {};
const logError = console.error.bind(console); // Always log errors

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
        /* Ensure toolbar footer uses flexbox with space-between for left/right alignment */
        .linkedin-formatter-footer-container {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
        }
        /* Left section for formatting buttons */
        .linkedin-formatter-left-section {
            display: flex !important;
            align-items: center !important;
            flex: 1 !important;
        }
        /* Right section for Post button */
        .linkedin-formatter-right-section {
            display: flex !important;
            align-items: center !important;
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
    urlCheckInterval: null,  // Store interval ID for cleanup
    currentEditor: null,
    savedSelection: null  // Store selection when opening dropdown
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
    sansSerif: {
        uppercase: 0x1D5A0,  // A-Z
        lowercase: 0x1D5BA,  // a-z
        numbers: 0x1D7E2     // 0-9
    },
    script: {
        uppercase: 0x1D49C,  // A-Z (with some exceptions)
        lowercase: 0x1D4B6   // a-z
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

// Reverse lookup maps for O(1) performance instead of O(n) indexOf
const reverseBoldMap = Object.fromEntries(Object.entries(boldMap).map(([k, v]) => [v, k]));
const reverseItalicMap = Object.fromEntries(Object.entries(italicMap).map(([k, v]) => [v, k]));
const reverseBoldItalicMap = Object.fromEntries(Object.entries(boldItalicMap).map(([k, v]) => [v, k]));

// Utility: Debounce function to limit execution frequency (optimized)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Enhanced Unicode conversion using character code ranges
function convertToUnicode(text, style) {
    // Special case for circled text
    if (style === 'circled') {
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            // Uppercase A-Z → Ⓐ-Ⓩ (U+24B6 to U+24CF)
            if (code >= 65 && code <= 90) {
                return String.fromCodePoint(0x24B6 + (code - 65));
            }
            // Lowercase a-z → ⓐ-ⓩ (U+24D0 to U+24E9)
            if (code >= 97 && code <= 122) {
                return String.fromCodePoint(0x24D0 + (code - 97));
            }
            // Numbers 0-9 → ⓪-⑨ (U+24EA, U+2460-2468)
            if (code >= 48 && code <= 57) {
                if (char === '0') return '⓪';
                return String.fromCodePoint(0x245F + (code - 48));
            }
            return char;
        }).join('');
    }

    // Special case for negative circled text
    if (style === 'negativeCircled') {
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            // Uppercase A-Z → 🅐-🅩 (U+1F150 to U+1F169)
            if (code >= 65 && code <= 90) {
                return String.fromCodePoint(0x1F150 + (code - 65));
            }
            // Lowercase - use uppercase negative circled
            if (code >= 97 && code <= 122) {
                return String.fromCodePoint(0x1F150 + (code - 97));
            }
            return char;
        }).join('');
    }

    // Special case for squared text
    if (style === 'squared') {
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            // Uppercase A-Z → 🄰-🅉 (U+1F130 to U+1F149)
            if (code >= 65 && code <= 90) {
                return String.fromCodePoint(0x1F130 + (code - 65));
            }
            // Lowercase - use uppercase squared
            if (code >= 97 && code <= 122) {
                return String.fromCodePoint(0x1F130 + (code - 97));
            }
            return char;
        }).join('');
    }

    // Special case for fullwidth text
    if (style === 'fullwidth') {
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            // Uppercase A-Z → Ａ-Ｚ (U+FF21 to U+FF3A)
            if (code >= 65 && code <= 90) {
                return String.fromCodePoint(0xFF21 + (code - 65));
            }
            // Lowercase a-z → ａ-ｚ (U+FF41 to U+FF5A)
            if (code >= 97 && code <= 122) {
                return String.fromCodePoint(0xFF41 + (code - 97));
            }
            // Numbers 0-9 → ０-９ (U+FF10 to U+FF19)
            if (code >= 48 && code <= 57) {
                return String.fromCodePoint(0xFF10 + (code - 48));
            }
            // Space → fullwidth space
            if (code === 32) {
                return String.fromCodePoint(0x3000);
            }
            return char;
        }).join('');
    }

    // Special case for script text (has some exceptions)
    if (style === 'script') {
        const scriptMap = {
            'A': '𝒜', 'B': '𝐵', 'C': '𝒞', 'D': '𝒟', 'E': '𝐸', 'F': '𝐹', 'G': '𝒢',
            'H': '𝐻', 'I': '𝐼', 'J': '𝒥', 'K': '𝒦', 'L': '𝐿', 'M': '𝑀', 'N': '𝒩',
            'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': '𝑅', 'S': '𝒮', 'T': '𝒯', 'U': '𝒰',
            'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵',
            'a': '𝒶', 'b': '𝒷', 'c': '𝒸', 'd': '𝒹', 'e': '𝑒', 'f': '𝒻', 'g': '𝑔',
            'h': '𝒽', 'i': '𝒾', 'j': '𝒿', 'k': '𝓀', 'l': '𝓁', 'm': '𝓂', 'n': '𝓃',
            'o': '𝑜', 'p': '𝓅', 'q': '𝓆', 'r': '𝓇', 's': '𝓈', 't': '𝓉', 'u': '𝓊',
            'v': '𝓋', 'w': '𝓌', 'x': '𝓍', 'y': '𝓎', 'z': '𝓏'
        };
        return text.split('').map(char => scriptMap[char] || char).join('');
    }

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

    // Use reverse lookup maps for O(1) performance instead of O(n) indexOf
    const reverseMap = style === 'bold' ? reverseBoldMap :
                       style === 'italic' ? reverseItalicMap :
                       style === 'boldItalic' ? reverseBoldItalicMap : null;

    if (reverseMap) {
        return text.split('').map(char => reverseMap[char] || char).join('');
    }

    return text;
}

// Remove all Unicode formatting from text using the actual Unicode ranges
function clearFormatting(text) {
    if (!text) return '';

    log('clearFormatting - processing text of length:', text?.length || 0);

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

        // Also check reverse legacy maps for backwards compatibility (O(1) lookup)
        const reverseMaps = [reverseBoldMap, reverseItalicMap, reverseBoldItalicMap];
        for (const reverseMap of reverseMaps) {
            if (reverseMap[char]) {
                return reverseMap[char];
            }
        }

        // Not a formatted character, return as-is
        return char;
    }).join('');

    // Remove bullet points (but preserve spaces after them if any)
    result = result.replace(/^•\s*/gm, '');
    result = result.replace(/●\s*/g, '');

    // Remove numbered lists (e.g., "1. ", "2) ", etc.)
    result = result.replace(/^\d+[\.\)]\s+/gm, '');

    log('clearFormatting - output text length:', result?.length || 0);
    return result;
}

// Save current selection
function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        state.savedSelection = selection.getRangeAt(0).cloneRange();
        log('Selection saved - length:', state.savedSelection?.toString().length || 0);
    }
}

// Restore saved selection
function restoreSelection() {
    if (state.savedSelection) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(state.savedSelection);
        log('Selection restored - length:', state.savedSelection?.toString().length || 0);
    }
}

// Create font dropdown menu
function createFontDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'linkedin-formatter-font-dropdown';
    dropdown.style.cssText = `
        display: none;
        position: absolute;
        bottom: 45px;
        left: 0;
        background: white;
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px 0;
        z-index: 1000;
        min-width: 200px;
        max-height: 300px;
        overflow-y: auto;
    `;

    const fontOptions = [
        { text: '𝗦𝗮𝗻𝘀-𝘀𝗲𝗿𝗶𝗳', action: 'sansSerif', label: 'Sans-serif' },
        { text: '𝓢𝓬𝓻𝓲𝓹𝓽', action: 'script', label: 'Script' },
        { text: 'Ⓒⓘⓡⓒⓛⓔⓓ', action: 'circled', label: 'Circled' },
        { text: '🅝🅔🅖🅐🅣🅘🅥🅔', action: 'negativeCircled', label: 'Negative Circled' },
        { text: '🅂🅀🅄🄰🅁🄴🄳', action: 'squared', label: 'Squared' },
        { text: 'Ｆｕｌｌｗｉｄｔｈ', action: 'fullwidth', label: 'Fullwidth' },
        { text: '𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎', action: 'monospace', label: 'Monospace' }
    ];

    fontOptions.forEach(option => {
        const item = document.createElement('div');
        item.className = 'font-option';
        item.textContent = `${option.text}`;
        item.title = option.label;
        item.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        `;

        item.onmouseenter = () => {
            item.style.backgroundColor = 'rgba(0,0,0,0.08)';
        };
        item.onmouseleave = () => {
            item.style.backgroundColor = 'transparent';
        };

        item.onmousedown = (e) => {
            // Prevent default to avoid losing selection
            e.preventDefault();
        };

        item.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Restore the saved selection before formatting
            restoreSelection();

            // Apply the formatting
            formatText(option.action);
            trackUsage(option.action);

            // Close the dropdown
            dropdown.style.display = 'none';
        };

        dropdown.appendChild(item);
    });

    return dropdown;
}

// Create formatting buttons container
function createFormattingButtons() {
    log('Creating formatting buttons');

    // Simple container
    const container = document.createElement('div');
    container.className = 'linkedin-formatter-buttons';
    container.style.cssText = `
        display: inline-flex;
        gap: 4px;
        align-items: center;
        flex-shrink: 0;
        white-space: nowrap;
        position: relative;
    `;

    const buttons = [
        { text: 'B', action: 'bold', title: 'Bold (Ctrl+B)' },
        { text: 'I', action: 'italic', title: 'Italic (Ctrl+I)' },
        { text: 'B/I', action: 'boldItalic', title: 'Bold Italic' },
        { text: 'S̶', action: 'strikethrough', title: 'Strikethrough' },
        { text: 'U̲', action: 'underline', title: 'Underline' },
        { text: 'Aa', action: 'font-dropdown', title: 'Font Style', isDropdown: true },
        { text: '•', action: 'bullet', title: 'Bullet List' },
        { text: '1.', action: 'numbered', title: 'Numbered List' },
        { text: '✕', action: 'clear', title: 'Clear Formatting' }
    ];

    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.title = button.title;
        btn.className = 'linkedin-formatter-btn';

        // Create custom SVG icons for special buttons
        if (button.action === 'bullet') {
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="3" cy="4" r="1.5" fill="currentColor"/>
                    <line x1="6" y1="4" x2="16" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="3" cy="9" r="1.5" fill="currentColor"/>
                    <line x1="6" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="3" cy="14" r="1.5" fill="currentColor"/>
                    <line x1="6" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            `;
        } else if (button.action === 'numbered') {
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="1" y="6" font-size="6" fill="currentColor" font-family="Arial">1</text>
                    <line x1="6" y1="4" x2="16" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <text x="1" y="11" font-size="6" fill="currentColor" font-family="Arial">2</text>
                    <line x1="6" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <text x="1" y="16" font-size="6" fill="currentColor" font-family="Arial">3</text>
                    <line x1="6" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            `;
        } else if (button.action === 'font-dropdown') {
            // Font style selector - Text Aa
            btn.textContent = 'Aa';
        } else if (button.action === 'clear') {
            // Clear formatting - T with diagonal slash
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <!-- T letter -->
                    <path d="M 6 6 L 14 6 M 10 6 L 10 16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <!-- Diagonal slash -->
                    <line x1="4" y1="17" x2="16" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        } else {
            btn.textContent = button.text;
        }

        // Style to match LinkedIn's buttons
        btn.style.cssText = `
            background-color: transparent;
            border: ${button.action === 'font-dropdown' ? '1px solid rgba(0,0,0,0.2)' : 'none'};
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

        // Handle dropdown button specially
        if (button.isDropdown) {
            const dropdown = createFontDropdown();
            container.appendChild(dropdown);

            btn.onmousedown = (e) => {
                // Save selection before button click causes it to be lost
                e.preventDefault();
                saveSelection();
            };

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                log('Font dropdown button clicked');

                // Toggle dropdown visibility
                const isVisible = dropdown.style.display === 'block';
                dropdown.style.display = isVisible ? 'none' : 'block';
            };

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        } else {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                log(`Button clicked: ${button.action}`);
                formatText(button.action);
                trackUsage(button.action);
            };
        }

        container.appendChild(btn);
    });

    log('Formatting buttons created:', buttons.map(b => b.text).join(', '));
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
        log('Usage tracking failed:', error);
    }
}

// Enhanced text formatting with better LinkedIn compatibility
function formatText(action) {
    log(`Formatting text: ${action}, selected length:`, window.getSelection().toString().length);

    try {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            log('No selection range available');
            return;
        }

        const range = selection.getRangeAt(0);
        let selectedText = range.toString();

        if (selectedText.length === 0 && action !== 'bullet') {
            log('No text selected for formatting');
            return;
        }

        let formattedText = '';

        if (action === 'bold' || action === 'italic' || action === 'boldItalic' ||
            action === 'monospace' || action === 'strikethrough' || action === 'underline' ||
            action === 'sansSerif' || action === 'script' || action === 'circled' ||
            action === 'negativeCircled' || action === 'squared' || action === 'fullwidth') {
            // Check if already formatted
            if (isFormatted(selectedText, action)) {
                // Remove formatting
                formattedText = removeFormatting(selectedText, action);
                log('Removing formatting:', action);
            } else {
                // Add formatting using enhanced Unicode conversion
                formattedText = convertToUnicode(selectedText, action);
                log('Adding formatting:', action);
            }
        } else if (action === 'bullet') {
            // For bullet points, we need to handle the DOM structure directly
            // LinkedIn uses contenteditable with div/br elements, not \n characters

            // Get all text nodes and block elements in the selection
            const container = range.commonAncestorContainer;
            const editor = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

            // Find all block-level elements (divs, paragraphs) within the selection
            let blocks = [];

            if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
                // Single line selection - just add bullet to this line
                const text = selectedText.trim();
                if (text.startsWith('• ')) {
                    formattedText = text.slice(2);
                } else if (text.startsWith('•')) {
                    formattedText = text.slice(1).trim();
                } else {
                    formattedText = '• ' + text;
                }
            } else {
                // Multi-line selection - split by actual line breaks
                // In contenteditable, check for <br> or new block elements
                const tempDiv = document.createElement('div');
                const clonedContents = range.cloneContents();
                tempDiv.appendChild(clonedContents);

                // Get text with preserved line breaks
                const htmlContent = tempDiv.innerHTML;
                // Replace <br>, </div>, </p> with newlines
                const textWithBreaks = htmlContent
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/div>/gi, '\n')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/<[^>]+>/g, '') // Remove other HTML tags
                    .trim();

                const lines = textWithBreaks.split('\n').filter(line => line.trim());

                if (lines.length === 0) {
                    formattedText = '• ' + selectedText;
                } else {
                    const allHaveBullets = lines.every(line => line.trim().startsWith('•'));

                    if (allHaveBullets) {
                        // Remove bullets
                        formattedText = lines.map(line => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('• ')) return trimmed.slice(2);
                            if (trimmed.startsWith('•')) return trimmed.slice(1).trim();
                            return trimmed;
                        }).join('\n');
                    } else {
                        // Add bullets
                        formattedText = lines.map(line => {
                            const trimmed = line.trim();
                            if (!trimmed) return '';
                            if (trimmed.startsWith('•')) return trimmed;
                            return '• ' + trimmed;
                        }).join('\n');
                    }
                }
            }
        } else if (action === 'numbered') {
            // For numbered lists, handle DOM structure like bullets
            const container = range.commonAncestorContainer;
            const editor = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

            if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
                // Single line selection
                const text = selectedText.trim();
                // Check if it starts with a number pattern like "1. " or "1) "
                if (/^\d+[\.\)]\s/.test(text)) {
                    // Remove numbering
                    formattedText = text.replace(/^\d+[\.\)]\s+/, '');
                } else {
                    formattedText = '1. ' + text;
                }
            } else {
                // Multi-line selection
                const tempDiv = document.createElement('div');
                const clonedContents = range.cloneContents();
                tempDiv.appendChild(clonedContents);

                const htmlContent = tempDiv.innerHTML;
                const textWithBreaks = htmlContent
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/div>/gi, '\n')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .trim();

                const lines = textWithBreaks.split('\n').filter(line => line.trim());

                if (lines.length === 0) {
                    formattedText = '1. ' + selectedText;
                } else {
                    const allHaveNumbers = lines.every(line => /^\d+[\.\)]\s/.test(line.trim()));

                    if (allHaveNumbers) {
                        // Remove numbering
                        formattedText = lines.map(line => {
                            return line.trim().replace(/^\d+[\.\)]\s+/, '');
                        }).join('\n');
                    } else {
                        // Add numbering
                        formattedText = lines.map((line, index) => {
                            const trimmed = line.trim();
                            if (!trimmed) return '';
                            // Don't re-number if already numbered
                            if (/^\d+[\.\)]\s/.test(trimmed)) return trimmed;
                            return `${index + 1}. ${trimmed}`;
                        }).join('\n');
                    }
                }
            }
        } else if (action === 'clear') {
            // Clear all formatting
            log('Clearing formatting from text length:', selectedText?.length || 0);
            formattedText = clearFormatting(selectedText);
            log('Cleared result length:', formattedText?.length || 0);
        }

        if (!formattedText && formattedText !== '') {
            logError('No formatted text generated');
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
                        log('Event dispatch error:', e);
                    }
                });
            }, 0);
        }

        log('Formatting applied successfully - length:', formattedText?.length || 0);
    } catch (error) {
        logError('Error applying formatting:', error);
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
    log('Finding toolbar for editor:', editor);

    // First determine if this is a main post or a comment
    const isMainPost = editor.closest('[role="dialog"]') ||
                       editor.getAttribute('placeholder')?.includes('talk about') ||
                       editor.getAttribute('aria-label')?.includes('post');

    log('Context:', isMainPost ? 'MAIN POST' : 'COMMENT/REPLY');

    let searchContainer = editor;

    // Go up several levels to find a reasonable search scope
    for (let i = 0; i < 10; i++) {
        if (searchContainer.parentElement) {
            searchContainer = searchContainer.parentElement;
        }
    }

    // SPECIAL HANDLING FOR MAIN POSTS - Find the Post button footer
    if (isMainPost) {
        log('Main post detected - looking for Post button footer');

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
                log('Found Post button:', text);
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
                log('Found footer with Post button:', footer.className);

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
                        log('✅ Found action button area in footer');
                        return div;
                    }
                }

                // If no action area found, use the footer itself
                log('✅ Using footer container for main post');
                return footer;
            }
        }
    }

    // FOR COMMENTS AND REPLIES - Use the emoji button parent (KEEP AS IS - IT'S WORKING!)
    log('Looking for emoji button for comment/reply');

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
            log(`Found emoji button with selector: ${selector}`);
            break;
        }
    }

    if (emojiButton) {
        const toolbar = emojiButton.parentElement;
        log('✅ Using emoji button parent as toolbar (comment/reply)');
        return toolbar;
    }

    // Fallback: Look for image/photo button
    const imageButton = searchContainer.querySelector('button[aria-label*="photo" i], button[aria-label*="image" i], button[aria-label*="Add a" i]');

    if (imageButton) {
        log('Found image button as fallback:', imageButton.getAttribute('aria-label'));
        const toolbar = imageButton.parentElement;
        log('✅ Using image button parent as toolbar');
        return toolbar;
    }

    console.warn('❌ Could not find toolbar for editor');
    return null;
}

// Attach formatter to an editor
function attachFormatter(editor) {
    if (state.editors.has(editor)) {
        log('Formatter already attached to this editor');
        return;
    }

    log('=== Attaching formatter ===');
    log('Editor:', editor);
    log('Editor classes:', editor.className);
    log('Editor parent:', editor.parentElement);

    state.editors.add(editor);
    state.currentEditor = editor;

    // Remove any existing formatter buttons to prevent duplicates
    const existingButtons = document.querySelectorAll('.linkedin-formatter-buttons');
    if (existingButtons.length > 0) {
        log('Removing', existingButtons.length, 'existing button sets');
        existingButtons.forEach(btn => btn.remove());
    }

    // Find LinkedIn's bottom toolbar
    const toolbar = findLinkedInToolbar(editor);
    if (!toolbar) {
        console.warn('❌ Could not find LinkedIn toolbar - buttons will not be added');
        log('Editor found - tag:', editor.tagName, 'classes:', editor.className?.substring(0, 50));
        return;
    }

    log('✅ Found toolbar:', toolbar);
    log('Toolbar classes:', toolbar.className);

    // Create formatting buttons
    const formattingButtons = createFormattingButtons();
    state.formattingBars.set(editor, formattingButtons);

    // Determine if this is a main post for special insertion logic
    const isMainPost = editor.closest('[role="dialog"]') ||
                       editor.getAttribute('placeholder')?.includes('talk about') ||
                       editor.getAttribute('aria-label')?.includes('post');

    // For main posts, restructure to align formatting buttons left with Post button on right
    if (isMainPost) {
        // Find the Post button - search in toolbar and its siblings
        let postButton = null;
        let footerContainer = toolbar.parentElement;
        
        // Search for Post button in toolbar first
        const toolbarButtons = toolbar.querySelectorAll('button');
        for (const btn of toolbarButtons) {
            const text = btn.textContent?.trim();
            const ariaLabel = btn.getAttribute('aria-label');
            if (text === 'Post' || ariaLabel?.includes('Post') ||
                btn.className?.includes('share-actions__primary') ||
                btn.className?.includes('primary-action')) {
                postButton = btn;
                break;
            }
        }

        // If not found in toolbar, search in parent container and siblings
        if (!postButton) {
            let searchContainer = toolbar.parentElement;
            for (let i = 0; i < 5 && searchContainer && searchContainer !== document.body; i++) {
                const allButtons = searchContainer.querySelectorAll('button');
                for (const btn of allButtons) {
                    const text = btn.textContent?.trim();
                    const ariaLabel = btn.getAttribute('aria-label');
                    if (text === 'Post' || ariaLabel?.includes('Post') ||
                        btn.className?.includes('share-actions__primary') ||
                        btn.className?.includes('primary-action')) {
                        postButton = btn;
                        footerContainer = searchContainer;
                        break;
                    }
                }
                if (postButton) break;
                searchContainer = searchContainer.parentElement;
            }
        }

        if (postButton && footerContainer && footerContainer !== document.body) {
            // Ensure footer container uses flexbox with space-between (CSS class handles styling)
            footerContainer.classList.add('linkedin-formatter-footer-container');

            // Check if we've already created sections (cache query results)
            let leftSection = footerContainer.querySelector('.linkedin-formatter-left-section');
            let rightSection = footerContainer.querySelector('.linkedin-formatter-right-section');

            if (!leftSection || !rightSection) {
                // First time setup - restructure the footer
                // Create left section for formatting buttons and existing toolbar items
                leftSection = document.createElement('div');
                leftSection.className = 'linkedin-formatter-left-section';
                // CSS class handles all styling, no inline styles needed

                // Create right section for Post button
                rightSection = document.createElement('div');
                rightSection.className = 'linkedin-formatter-right-section';
                // CSS class handles all styling, no inline styles needed

                // Collect all direct children of footerContainer to reorganize
                const footerChildren = Array.from(footerContainer.children);
                
                // Move toolbar and other non-Post elements to left section
                footerChildren.forEach(child => {
                    if (child.contains(postButton)) {
                        // This child contains Post button, move to right section
                        footerContainer.removeChild(child);
                        rightSection.appendChild(child);
                    } else if (child === toolbar || child.contains(toolbar)) {
                        // This is the toolbar or contains toolbar, move to left section
                        footerContainer.removeChild(child);
                        leftSection.appendChild(child);
                    } else if (!child.classList.contains('linkedin-formatter-left-section') &&
                               !child.classList.contains('linkedin-formatter-right-section')) {
                        // Other elements go to left section
                        footerContainer.removeChild(child);
                        leftSection.appendChild(child);
                    }
                });

                // Add sections to footer
                footerContainer.appendChild(leftSection);
                footerContainer.appendChild(rightSection);
            }
            // Reuse cached leftSection and rightSection variables (no need to re-query)

            // Insert formatting buttons into the toolbar (which should be in leftSection)
            // The toolbar reference is still valid
            if (leftSection && leftSection.contains(toolbar)) {
                toolbar.insertBefore(formattingButtons, toolbar.firstChild);
            } else if (leftSection) {
                // Toolbar might be nested, find it or insert at start of left section
                const nestedToolbar = leftSection.contains(toolbar) ? toolbar : leftSection.querySelector('div') || leftSection;
                nestedToolbar.insertBefore(formattingButtons, nestedToolbar.firstChild);
            } else {
                // Fallback: insert into toolbar directly
                toolbar.insertBefore(formattingButtons, toolbar.firstChild);
            }
            log('✅ Formatting buttons inserted in left section, aligned with Post button');
        } else {
            // Fallback: insert at beginning (toolbar should already have flex styling from LinkedIn)
            toolbar.insertBefore(formattingButtons, toolbar.firstChild);
            log('✅ Formatting buttons inserted (fallback - Post button not found)');
        }
    } else {
        // For comments/replies, use simple insertion
        const emojiButton = toolbar.querySelector('button[aria-label*="emoji" i], button[aria-label*="Emoji" i]');
        if (emojiButton) {
            toolbar.insertBefore(formattingButtons, emojiButton);
        } else {
            toolbar.insertBefore(formattingButtons, toolbar.firstChild);
        }
        log('✅ Formatting buttons inserted for comment/reply');
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
            log('Editor removed, cleaned up formatter');
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
        log('Editor focused:', editor);
    });
}

// Scan for editors and attach formatters
function scanForEditors() {
    log('Scanning for post editors...');
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
    state.urlCheckInterval = setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            log('URL changed from', lastUrl, 'to', currentUrl);
            lastUrl = currentUrl;
            // Clear existing editors tracking
            state.editors = new WeakSet();
            // Re-scan after navigation
            setTimeout(scanForEditors, 1000);
        }
    }, 1000);

    // Cleanup interval on page unload
    window.addEventListener('beforeunload', () => {
        if (state.urlCheckInterval) {
            clearInterval(state.urlCheckInterval);
            state.urlCheckInterval = null;
        }
    });

    log('Observers set up successfully');
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

    log('Keyboard shortcuts set up');
}

// Whitelist of allowed formatting actions
const ALLOWED_ACTIONS = [
    'bold', 'italic', 'boldItalic', 'strikethrough', 'underline',
    'monospace', 'sansSerif', 'script', 'circled', 'negativeCircled',
    'squared', 'fullwidth', 'bullet', 'numbered', 'clear'
];

// Message listener for extension communication
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    log('Message received:', request.action);
    if (request.action && ALLOWED_ACTIONS.includes(request.action)) {
        formatText(request.action);
        sendResponse({ success: true });
    } else if (request.action) {
        logError('Invalid action received:', request.action);
        sendResponse({ success: false, error: 'Invalid action' });
    }
    return true;
});

// Initialize the extension
function init() {
    log('LinkedIn Formatter - Enhanced Version initializing...');

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
                log('Periodic scan found new editor');
                scanForEditors();
            }
        }, 2000);

        log('LinkedIn Formatter initialized successfully');
    } catch (error) {
        logError('Error initializing LinkedIn Formatter:', error);
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
    logError('Extension error:', e);
});

log('LinkedIn Formatter script loaded');
