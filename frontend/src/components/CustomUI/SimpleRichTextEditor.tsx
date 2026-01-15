import { useState, useRef } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SimpleRichTextEditor({ value, onChange, placeholder = "Type something...", className = "" }: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const executeCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`border border-gray-300 rounded-xl overflow-hidden bg-white ${isFocused ? 'ring-2 ring-blue-500/20 border-blue-500' : ''} ${className}`}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
            <button
                type="button"
                onClick={() => executeCommand('bold')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                type="button"
                onClick={() => executeCommand('italic')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                type="button"
                onClick={() => executeCommand('underline')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Underline"
            >
                <UnderlineIcon size={16} />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
                type="button"
                onClick={() => executeCommand('insertUnorderedList')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
             <button
                type="button"
                onClick={() => executeCommand('justifyLeft')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Align Left"
            >
                <AlignLeft size={16} />
            </button>
            <button
                type="button"
                onClick={() => executeCommand('justifyCenter')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Align Center"
            >
                <AlignCenter size={16} />
            </button>
            <button
                type="button"
                onClick={() => executeCommand('justifyRight')}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Align Right"
            >
                <AlignRight size={16} />
            </button>
        </div>

        {/* Editor Area */}
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="p-4 min-h-[120px] outline-none prose prose-sm max-w-none text-gray-700 font-normal"
            dangerouslySetInnerHTML={{ __html: value }}
            data-placeholder={placeholder}
            style={{
                emptyCells: 'show'
            }}
        />
        <style>{`
            [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
                display: block; /* For Firefox */
            }
        `}</style>
    </div>
  );
}
