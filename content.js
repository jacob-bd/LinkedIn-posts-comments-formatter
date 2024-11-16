let postInput = null;

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

function createFormattingBar() {
    console.log('Creating formatting bar');
    const formattingBar = document.createElement('div');
    formattingBar.id = 'linkedin-formatter-bar';
    formattingBar.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        right: 0;
        background-color: #f3f6f8;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 5px;
        display: flex;
        gap: 5px;
        z-index: 1000;
    `;

    const buttons = [
        { text: 'B', action: 'bold', style: 'font-weight: bold;' },
        { text: 'I', action: 'italic', style: 'font-style: italic;' },
        { text: 'B/', action: 'boldItalic', style: 'font-weight: bold; font-style: italic;' },
        { text: '•', action: 'bullet', style: 'font-size: 18px;' }
    ];

    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.style.cssText = `
            background-color: #fff;
            border: 1px solid #0a66c2;
            color: #0a66c2;
            padding: 5px 10px;
            cursor: pointer;
            ${button.style}
        `;
        btn.onclick = (e) => {
            e.preventDefault();
            console.log(`Button clicked: ${button.action}`);
            formatText(button.action);
        };
        formattingBar.appendChild(btn);
    });

    console.log('Formatting bar created with buttons:', buttons.map(b => b.text).join(', '));
    return formattingBar;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function findPostInput() {
    const selectors = [
        '[contenteditable="true"][aria-label*="post"]',  // Main post composer
        '[contenteditable="true"][aria-label*="share"]', // Share with comment
        '[contenteditable="true"][role="textbox"]'       // Generic fallback
    ];
    
    return selectors.reduce((found, selector) => {
        return found || document.querySelector(selector);
    }, null);
}

const debouncedDetectPostInput = debounce(detectPostInput, 250);

function detectPostInput() {
    console.log('Detecting post input');
    const newPostInput = findPostInput();
    if (newPostInput && newPostInput !== postInput) {
        console.log('Post input detected:', newPostInput);
        postInput = newPostInput;
        const existingBar = document.getElementById('linkedin-formatter-bar');
        if (!existingBar) {
            console.log('Creating formatting bar');
            const formattingBar = createFormattingBar();
            postInput.parentNode.style.position = 'relative';
            postInput.parentNode.insertBefore(formattingBar, postInput);
            postInput.style.marginTop = '40px';
        }
    } else {
        console.log('No post input detected or input unchanged.');
    }
}

function formatText(action) {
    console.log(`Formatting text: ${action}`);
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    let selectedText = range.toString();

    if (selectedText.length === 0 && action !== 'bullet') {
        console.log('No text selected for formatting.');
        return;
    }

    let formattedText;
    if (action === 'bold' || action === 'italic' || action === 'boldItalic') {
        const map = action === 'bold' ? boldMap : (action === 'italic' ? italicMap : boldItalicMap);
        
        // Check if the text is already formatted
        const isFormatted = selectedText.split('').some(char => Object.values(map).includes(char));
        
        if (isFormatted) {
            // Remove formatting
            formattedText = selectedText.split('').map(char => {
                const index = Object.values(map).indexOf(char);
                return index !== -1 ? Object.keys(map)[index] : char;
            }).join('');
        } else {
            // Add formatting
            formattedText = selectedText.split('').map(char => map[char] || char).join('');
        }
    } else if (action === 'bullet') {
        // Add or remove bullet point
        if (selectedText.startsWith('• ')) {
            formattedText = selectedText.slice(2);
        } else {
            formattedText = '• ' + selectedText;
        }
    }

    range.deleteContents();
    range.insertNode(document.createTextNode(formattedText));

    // Adjust the selection to include the formatted text
    const newRange = document.createRange();
    newRange.setStartBefore(range.startContainer);
    newRange.setEndAfter(range.endContainer);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Trigger input event to ensure LinkedIn recognizes the change
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    postInput.dispatchEvent(inputEvent);

    console.log('Formatting applied:', formattedText);
}

function observePageChanges() {
    let observer = null;
    
    function startObserving(target) {
        if (!target) return;
        
        // Stop any existing observation
        if (observer) {
            observer.disconnect();
        }
        
        observer = new MutationObserver((mutations) => {
            // Filter mutations to reduce unnecessary processing
            const shouldCheck = mutations.some(mutation => {
                // Check if the mutation is relevant to our needs
                if (mutation.type !== 'childList') return false;
                
                // Check if added nodes contain potential post inputs
                const hasNewInput = Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return false;
                    return node.querySelector('[contenteditable="true"]') !== null;
                });
                
                return hasNewInput;
            });
            
            if (shouldCheck) {
                debouncedDetectPostInput();
            }
        });

        // More specific observation configuration
        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
        
        // Initial check
        detectPostInput();
    }
    
    // Find the main feed or post composer container
    const feedContainer = document.querySelector('.feed-shared-update-v2, .share-box-feed-entry');
    if (feedContainer) {
        startObserving(feedContainer);
    } else {
        // If we can't find the specific container, fall back to a broader but still limited scope
        const mainContent = document.querySelector('main') || document.body;
        startObserving(mainContent);
    }
    
    // Cleanup function
    return function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };
}

// Start observing page changes with cleanup handling
const cleanup = observePageChanges();

// Cleanup when extension is disabled or page is unloaded
window.addEventListener('unload', cleanup);
chrome.runtime.onDisconnect.addListener(cleanup);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message received:', request);
    formatText(request.action);
});

console.log('LinkedIn Formatter script loaded');
