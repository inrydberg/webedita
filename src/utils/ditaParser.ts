export class DitaParser {
  private elementMap: Map<string, (element: Element) => string> = new Map();

  constructor() {
    this.initializeElementMap();
  }

  private initializeElementMap() {
    // Topic elements
    this.elementMap.set('topic', (el) => this.wrapContent(el, 'article', 'topic'));
    this.elementMap.set('concept', (el) => this.wrapContent(el, 'article', 'concept'));
    this.elementMap.set('task', (el) => this.wrapContent(el, 'article', 'task'));
    this.elementMap.set('reference', (el) => this.wrapContent(el, 'article', 'reference'));
    
    // Basic elements
    this.elementMap.set('title', (el) => `<h1 class="text-3xl font-bold text-gray-900 mb-6">${this.processChildren(el)}</h1>`);
    this.elementMap.set('shortdesc', (el) => `<p class="text-lg text-gray-600 mb-6 italic">${this.processChildren(el)}</p>`);
    this.elementMap.set('body', (el) => `<div class="prose-body">${this.processChildren(el)}</div>`);
    this.elementMap.set('section', (el) => `<section class="mb-8">${this.processChildren(el)}</section>`);
    
    // Paragraph and text elements
    this.elementMap.set('p', (el) => `<p class="mb-4 text-gray-700 leading-relaxed">${this.processChildren(el)}</p>`);
    this.elementMap.set('ph', (el) => `<span class="phrase">${this.processChildren(el)}</span>`);
    this.elementMap.set('keyword', (el) => `<strong class="font-semibold text-gray-900">${this.processChildren(el)}</strong>`);
    this.elementMap.set('term', (el) => `<em class="font-medium text-blue-700">${this.processChildren(el)}</em>`);
    
    // Lists
    this.elementMap.set('ul', (el) => `<ul class="list-disc list-inside mb-4 space-y-2">${this.processChildren(el)}</ul>`);
    this.elementMap.set('ol', (el) => `<ol class="list-decimal list-inside mb-4 space-y-2">${this.processChildren(el)}</ol>`);
    this.elementMap.set('li', (el) => `<li class="text-gray-700">${this.processChildren(el)}</li>`);
    this.elementMap.set('dl', (el) => `<dl class="mb-4">${this.processChildren(el)}</dl>`);
    this.elementMap.set('dt', (el) => `<dt class="font-semibold text-gray-900 mt-4">${this.processChildren(el)}</dt>`);
    this.elementMap.set('dd', (el) => `<dd class="text-gray-700 ml-4">${this.processChildren(el)}</dd>`);
    
    // Tables
    this.elementMap.set('table', (el) => `<table class="w-full border-collapse border border-gray-300 mb-6">${this.processChildren(el)}</table>`);
    this.elementMap.set('tgroup', (el) => this.processChildren(el));
    this.elementMap.set('thead', (el) => `<thead class="bg-gray-50">${this.processChildren(el)}</thead>`);
    this.elementMap.set('tbody', (el) => `<tbody>${this.processChildren(el)}</tbody>`);
    this.elementMap.set('row', (el) => `<tr class="border-b border-gray-200">${this.processChildren(el)}</tr>`);
    this.elementMap.set('entry', (el) => {
      const isHeader = el.closest('thead');
      const className = isHeader 
        ? 'px-4 py-3 text-left font-semibold text-gray-900 border border-gray-300'
        : 'px-4 py-3 text-gray-700 border border-gray-300';
      const tag = isHeader ? 'th' : 'td';
      return `<${tag} class="${className}">${this.processChildren(el)}</${tag}>`;
    });
    
    // Code and preformatted text
    this.elementMap.set('codeblock', (el) => `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto"><code>${this.escapeHtml(this.getTextContent(el))}</code></pre>`);
    this.elementMap.set('codeph', (el) => `<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">${this.escapeHtml(this.getTextContent(el))}</code>`);
    this.elementMap.set('pre', (el) => `<pre class="bg-gray-50 p-4 rounded-lg mb-4 overflow-x-auto text-sm">${this.escapeHtml(this.getTextContent(el))}</pre>`);
    
    // Notes and admonitions
    this.elementMap.set('note', (el) => {
      const type = el.getAttribute('type') || 'note';
      const className = this.getNoteClassName(type);
      return `<div class="${className}">${this.processChildren(el)}</div>`;
    });
    
    // Task-specific elements
    this.elementMap.set('taskbody', (el) => `<div class="task-body">${this.processChildren(el)}</div>`);
    this.elementMap.set('prereq', (el) => `<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>${this.processChildren(el)}</div>`);
    this.elementMap.set('context', (el) => `<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-3">Context</h3>${this.processChildren(el)}</div>`);
    this.elementMap.set('steps', (el) => `<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-3">Steps</h3><ol class="list-decimal list-inside space-y-4">${this.processChildren(el)}</ol></div>`);
    this.elementMap.set('step', (el) => `<li class="text-gray-700">${this.processChildren(el)}</li>`);
    this.elementMap.set('cmd', (el) => `<div class="font-medium mb-2">${this.processChildren(el)}</div>`);
    this.elementMap.set('info', (el) => `<div class="text-sm text-gray-600 ml-4">${this.processChildren(el)}</div>`);
    this.elementMap.set('result', (el) => `<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-3">Result</h3>${this.processChildren(el)}</div>`);
    this.elementMap.set('example', (el) => `<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-3">Example</h3>${this.processChildren(el)}</div>`);
    
    // Links
    this.elementMap.set('xref', (el) => {
      const href = el.getAttribute('href') || '#';
      return `<a href="${href}" class="text-blue-600 hover:text-blue-800 underline">${this.processChildren(el)}</a>`;
    });
    
    // Images
    this.elementMap.set('image', (el) => {
      const href = el.getAttribute('href') || '';
      const alt = el.getAttribute('alt') || '';
      return `<img src="${href}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-sm mb-4" />`;
    });
    
    // Figures
    this.elementMap.set('fig', (el) => `<figure class="mb-6">${this.processChildren(el)}</figure>`);
    
    // Headings (different levels)
    this.elementMap.set('h1', (el) => `<h1 class="text-2xl font-bold text-gray-900 mb-4">${this.processChildren(el)}</h1>`);
    this.elementMap.set('h2', (el) => `<h2 class="text-xl font-bold text-gray-900 mb-4">${this.processChildren(el)}</h2>`);
    this.elementMap.set('h3', (el) => `<h3 class="text-lg font-bold text-gray-900 mb-3">${this.processChildren(el)}</h3>`);
  }

  private getNoteClassName(type: string): string {
    const baseClass = 'p-4 rounded-lg mb-4 border-l-4';
    switch (type.toLowerCase()) {
      case 'warning':
        return `${baseClass} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'caution':
        return `${baseClass} bg-orange-50 border-orange-400 text-orange-800`;
      case 'danger':
        return `${baseClass} bg-red-50 border-red-400 text-red-800`;
      case 'important':
        return `${baseClass} bg-purple-50 border-purple-400 text-purple-800`;
      case 'tip':
        return `${baseClass} bg-green-50 border-green-400 text-green-800`;
      default:
        return `${baseClass} bg-blue-50 border-blue-400 text-blue-800`;
    }
  }

  private wrapContent(element: Element, tag: string, className: string): string {
    return `<${tag} class="${className} max-w-4xl mx-auto">${this.processChildren(element)}</${tag}>`;
  }

  private processChildren(element: Element): string {
    let result = '';
    
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          result += this.escapeHtml(text);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childElement = child as Element;
        const tagName = childElement.tagName.toLowerCase();
        
        if (this.elementMap.has(tagName)) {
          const handler = this.elementMap.get(tagName)!;
          result += handler(childElement);
        } else {
          // Fallback for unknown elements
          result += this.processChildren(childElement);
        }
      }
    }
    
    return result;
  }

  private getTextContent(element: Element): string {
    return element.textContent || '';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public parse(ditaXml: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(ditaXml, 'text/xml');
      
      // Check for parsing errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML: ' + parseError.textContent);
      }
      
      const rootElement = doc.documentElement;
      
      if (!rootElement) {
        throw new Error('No root element found');
      }
      
      return this.processElement(rootElement);
    } catch (error) {
      return `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-red-800 mb-2">Parse Error</h3>
          <p class="text-red-700">${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        </div>
      `;
    }
  }

  private processElement(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    
    if (this.elementMap.has(tagName)) {
      const handler = this.elementMap.get(tagName)!;
      return handler(element);
    } else {
      // Fallback for unknown elements
      return this.processChildren(element);
    }
  }
}