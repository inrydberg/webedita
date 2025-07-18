let ditaContent = '';
let fileName = '';
let isEditing = false;
let isResizing = false;

// DITA Parser
class DitaParser {
    constructor() {
        this.elementMap = new Map();
        this.initializeElementMap();
    }

    initializeElementMap() {
        this.elementMap.set('concept', (el) => `<article class="concept">${this.processChildren(el)}</article>`);
        this.elementMap.set('task', (el) => `<article class="task">${this.processChildren(el)}</article>`);
        this.elementMap.set('reference', (el) => `<article class="reference">${this.processChildren(el)}</article>`);
        this.elementMap.set('title', (el) => `<h1>${this.processChildren(el)}</h1>`);
        this.elementMap.set('shortdesc', (el) => `<p class="shortdesc">${this.processChildren(el)}</p>`);
        this.elementMap.set('conbody', (el) => `<div>${this.processChildren(el)}</div>`);
        this.elementMap.set('taskbody', (el) => `<div>${this.processChildren(el)}</div>`);
        this.elementMap.set('section', (el) => `<section>${this.processChildren(el)}</section>`);
        this.elementMap.set('p', (el) => `<p>${this.processChildren(el)}</p>`);
        this.elementMap.set('ul', (el) => `<ul>${this.processChildren(el)}</ul>`);
        this.elementMap.set('ol', (el) => `<ol>${this.processChildren(el)}</ol>`);
        this.elementMap.set('li', (el) => `<li>${this.processChildren(el)}</li>`);
        this.elementMap.set('dl', (el) => `<dl>${this.processChildren(el)}</dl>`);
        this.elementMap.set('dt', (el) => `<dt>${this.processChildren(el)}</dt>`);
        this.elementMap.set('dd', (el) => `<dd>${this.processChildren(el)}</dd>`);
        this.elementMap.set('note', (el) => {
            const type = el.getAttribute('type') || 'default';
            return `<div class="note note-${type}">${this.processChildren(el)}</div>`;
        });
        this.elementMap.set('codeblock', (el) => `<pre><code>${this.escapeHtml(el.textContent)}</code></pre>`);
        this.elementMap.set('codeph', (el) => `<code>${this.escapeHtml(el.textContent)}</code>`);
        this.elementMap.set('keyword', (el) => `<strong>${this.processChildren(el)}</strong>`);
        this.elementMap.set('term', (el) => `<em>${this.processChildren(el)}</em>`);
        this.elementMap.set('xref', (el) => {
            const href = el.getAttribute('href') || '#';
            const format = el.getAttribute('format');
            const scope = el.getAttribute('scope');
            
            // Build additional attributes for the anchor tag
            let additionalAttrs = '';
            
            // Handle external scope - open in new tab/window
            if (scope === 'external') {
                additionalAttrs += ' target="_blank" rel="noopener noreferrer"';
            }
            
            // Handle format attribute - could be used for styling or other purposes
            if (format) {
                additionalAttrs += ` data-format="${format}"`;
            }
            
            // If there's no text content, use the href as display text
            const textContent = this.processChildren(el);
            const displayText = textContent.trim() || href;
            
            return `<a href="${href}"${additionalAttrs}>${displayText}</a>`;
        });
        this.elementMap.set('image', (el) => {
            const href = el.getAttribute('href') || '';
            const alt = el.getAttribute('alt') || '';
            return `<img src="${href}" alt="${alt}" />`;
        });
        this.elementMap.set('fig', (el) => `<figure>${this.processChildren(el)}</figure>`);
        this.elementMap.set('table', (el) => `<table>${this.processChildren(el)}</table>`);
        this.elementMap.set('tgroup', (el) => this.processChildren(el));
        this.elementMap.set('thead', (el) => `<thead>${this.processChildren(el)}</thead>`);
        this.elementMap.set('tbody', (el) => `<tbody>${this.processChildren(el)}</tbody>`);
        this.elementMap.set('row', (el) => `<tr>${this.processChildren(el)}</tr>`);
        this.elementMap.set('entry', (el) => {
            const isHeader = el.closest('thead');
            const tag = isHeader ? 'th' : 'td';
            return `<${tag}>${this.processChildren(el)}</${tag}>`;
        });
        
        // DITA Highlighting Elements
        this.elementMap.set('b', (el) => `<b>${this.processChildren(el)}</b>`);
        this.elementMap.set('i', (el) => `<i>${this.processChildren(el)}</i>`);
        this.elementMap.set('u', (el) => `<u>${this.processChildren(el)}</u>`);
        this.elementMap.set('sup', (el) => `<sup>${this.processChildren(el)}</sup>`);
        this.elementMap.set('sub', (el) => `<sub>${this.processChildren(el)}</sub>`);
        this.elementMap.set('line-through', (el) => `<span class="line-through">${this.processChildren(el)}</span>`);
        this.elementMap.set('overline', (el) => `<span class="overline">${this.processChildren(el)}</span>`);
        this.elementMap.set('tt', (el) => `<span class="tt">${this.processChildren(el)}</span>`);
    }

    processChildren(element) {
        let result = '';
        for (const child of Array.from(element.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent;
                if (text) result += this.escapeHtml(text);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.tagName.toLowerCase();
                if (this.elementMap.has(tagName)) {
                    result += this.elementMap.get(tagName)(child);
                } else {
                    result += this.processChildren(child);
                }
            }
        }
        return result;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    parse(ditaXml) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(ditaXml, 'text/xml');
            
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Invalid XML: ' + parseError.textContent);
            }
            
            const rootElement = doc.documentElement;
            if (!rootElement) {
                throw new Error('No root element found');
            }
            
            const tagName = rootElement.tagName.toLowerCase();
            if (this.elementMap.has(tagName)) {
                return this.elementMap.get(tagName)(rootElement);
            } else {
                return this.processChildren(rootElement);
            }
        } catch (error) {
            return `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem;">
                <h3 style="color: #dc2626; margin-bottom: 0.5rem;">Parse Error</h3>
                <p style="color: #991b1b;">${error.message}</p>
            </div>`;
        }
    }
}

const parser = new DitaParser();

// Reset to start page function
function resetToStart() {
    if (ditaContent.trim()) {
        const confirmed = confirm('Are you sure you want to return to the start page? Any unsaved changes will be lost.');
        if (!confirmed) return;
    }
    location.reload();
}

// Event handlers
function handleContentChange() {
    ditaContent = document.getElementById('ditaTextarea').value;
    updatePreview();
}

function updatePreview() {
    const html = parser.parse(ditaContent);
    const previewContent = document.getElementById('previewContent');
    const previewEmpty = document.getElementById('previewEmpty');
    
    if (ditaContent.trim()) {
        previewContent.innerHTML = html;
        previewContent.style.display = 'block';
        previewEmpty.style.display = 'none';
    } else {
        previewContent.style.display = 'none';
        previewEmpty.style.display = 'flex';
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.dita') && !file.name.toLowerCase().endsWith('.xml')) {
        alert('Please upload a .dita or .xml file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        ditaContent = e.target.result;
        fileName = file.name;
        showContent();
    };
    reader.readAsText(file);
}

function showContent() {
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('editor').style.display = isEditing ? 'flex' : 'none';
    document.getElementById('codeView').style.display = isEditing ? 'none' : 'flex';
    document.getElementById('loadFileSection').style.display = 'block';
    document.getElementById('editToggle').style.display = 'block';
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('saveBtn').style.display = 'block';
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('ditaTextarea').value = ditaContent;
    document.getElementById('codeContent').textContent = ditaContent;
    updatePreview();
    updateResizerPosition();
}

async function pasteContent() {
    try {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
            ditaContent = text;
            fileName = 'pasted-content.dita';
            isEditing = true;
            showContent();
        }
    } catch (err) {
        alert('Failed to read clipboard. Please paste manually in the editor.');
    }
}

async function loadSample() {
    try {
        const response = await fetch('sample.dita');
        const sampleContent = await response.text();
        ditaContent = sampleContent;
        fileName = 'sample.dita';
        isEditing = true;
        showContent();
    } catch (err) {
        // Fallback if sample file doesn't exist
        alert('Sample file not found. Please upload your own DITA file.');
    }
}

function toggleEdit() {
    isEditing = !isEditing;
    const editToggle = document.getElementById('editToggle');
    
    if (isEditing) {
        editToggle.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View
        `;
    } else {
        editToggle.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
        `;
    }
    
    document.getElementById('editor').style.display = isEditing ? 'flex' : 'none';
    document.getElementById('codeView').style.display = isEditing ? 'none' : 'flex';
    
    if (isEditing) {
        document.getElementById('ditaTextarea').focus();
    }
}

function saveFile() {
    if (!ditaContent || !fileName) return;
    
    const blob = new Blob([ditaContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function togglePane(side) {
    const pane = document.getElementById(side + 'Pane');
    pane.classList.toggle('collapsed');
    updateResizerPosition();
}

function updateResizerPosition() {
    const leftPane = document.getElementById('leftPane');
    const resizer = document.getElementById('resizer');
    const leftWidth = leftPane.offsetWidth;
    resizer.style.left = leftWidth + 'px';
}

// Drag and drop
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.dita') || file.name.toLowerCase().endsWith('.xml')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                ditaContent = e.target.result;
                fileName = file.name;
                showContent();
            };
            reader.readAsText(file);
        } else {
            alert('Please drop a .dita or .xml file');
        }
    }
});

// Improved resizer functionality
const resizer = document.getElementById('resizer');
const leftPane = document.getElementById('leftPane');
const rightPane = document.getElementById('rightPane');
const main = document.querySelector('.main');

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
});

function handleResize(e) {
    if (!isResizing) return;
    
    const containerRect = main.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const leftWidth = e.clientX - containerRect.left;
    const rightWidth = containerWidth - leftWidth - 4; // 4px for resizer
    
    // Minimum widths
    const minWidth = 200;
    
    if (leftWidth >= minWidth && rightWidth >= minWidth) {
        leftPane.style.flex = `0 0 ${leftWidth}px`;
        rightPane.style.flex = `0 0 ${rightWidth}px`;
        resizer.style.left = leftWidth + 'px';
    }
}

function stopResize() {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Initialize resizer position on load
window.addEventListener('load', updateResizerPosition);
window.addEventListener('resize', updateResizerPosition);