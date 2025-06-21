import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Eye, Zap, Edit3, Copy, Save } from 'lucide-react';
import { DitaParser } from './utils/ditaParser';

function App() {
  const [ditaContent, setDitaContent] = useState<string>('');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndRender = useCallback((content: string) => {
    const parser = new DitaParser();
    const html = parser.parse(content);
    setRenderedHtml(html);
  }, []);

  const handleContentChange = useCallback((content: string) => {
    setDitaContent(content);
    parseAndRender(content);
  }, [parseAndRender]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.dita')) {
      alert('Please upload a .dita file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileName(file.name);
      handleContentChange(content);
    };
    reader.readAsText(file);
  }, [handleContentChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleContentChange(e.target.value);
  }, [handleContentChange]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setFileName('pasted-content.dita');
        handleContentChange(text);
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      alert('Failed to read clipboard. Please paste manually in the editor.');
    }
  }, [handleContentChange]);

  const toggleEdit = useCallback(() => {
    setIsEditing(!isEditing);
    if (!isEditing && textareaRef.current) {
      // Focus the textarea when entering edit mode
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
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
  }, [ditaContent, fileName]);

  const sampleDitaContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">
<concept id="sample_concept">
  <title>Getting Started with DITA</title>
  <shortdesc>This is a sample DITA concept topic to demonstrate the live preview functionality.</shortdesc>
  <conbody>
    <section>
      <title>What is DITA?</title>
      <p>DITA (Darwin Information Typing Architecture) is an XML-based architecture for authoring, producing, and delivering topic-oriented, information-typed content.</p>
      
      <note type="tip">You can edit this content directly in the left pane and see changes in real-time!</note>
      
      <ul>
        <li>Structured authoring</li>
        <li>Content reuse</li>
        <li>Conditional publishing</li>
        <li>Topic-based architecture</li>
      </ul>
    </section>
    
    <section>
      <title>Key Benefits</title>
      <dl>
        <dt>Consistency</dt>
        <dd>Enforces consistent structure and formatting across all content.</dd>
        <dt>Reusability</dt>
        <dd>Content can be reused across multiple publications and formats.</dd>
        <dt>Efficiency</dt>
        <dd>Streamlines the content creation and maintenance process.</dd>
      </dl>
    </section>
  </conbody>
</concept>`;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">DITA Live Preview</h1>
            <p className="text-sm text-gray-500">Edit, paste, or drop your .dita file to see it rendered instantly</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {fileName && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{fileName}</span>
            </div>
          )}
          {ditaContent && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Save DITA file"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Pane - DITA Source */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">DITA Source</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePaste}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Paste from clipboard"
              >
                <Copy className="w-3 h-3 mr-1" />
                Paste
              </button>
              {ditaContent && (
                <button
                  onClick={toggleEdit}
                  className={`inline-flex items-center px-2 py-1 text-xs rounded transition-colors ${
                    isEditing 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  {isEditing ? 'Viewing' : 'Edit'}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            {!ditaContent ? (
              <div className="flex-1 p-6">
                <div
                  className={`h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="text-center max-w-md">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Get started with DITA
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Drop a .dita file, paste content, or try the sample below
                    </p>
                    <div className="flex flex-col space-y-3">
                      <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".dita,.xml"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={handlePaste}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Paste Content
                      </button>
                      <button
                        onClick={() => {
                          setFileName('sample.dita');
                          handleContentChange(sampleDitaContent);
                          setIsEditing(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Try Sample
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {isEditing ? (
                  <div className="flex-1 p-4">
                    <textarea
                      ref={textareaRef}
                      value={ditaContent}
                      onChange={handleTextareaChange}
                      className="w-full h-full resize-none border border-gray-300 rounded-lg p-4 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paste or edit your DITA content here..."
                      spellCheck={false}
                    />
                  </div>
                ) : (
                  <div className="flex-1 p-4">
                    <div className="h-full bg-gray-900 rounded-lg p-4 overflow-auto">
                      <pre className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
                        <code>{ditaContent}</code>
                      </pre>
                    </div>
                  </div>
                )}
                
                <div className="p-4 border-t border-gray-200 flex justify-center">
                  <label className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Load Different File
                    <input
                      type="file"
                      accept=".dita,.xml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Live Preview</span>
          </div>
          
          <div className="flex-1 p-6 overflow-auto bg-white">
            {renderedHtml ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No preview available
                  </h3>
                  <p className="text-gray-500">
                    Upload, paste, or create DITA content to see the rendered preview
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;