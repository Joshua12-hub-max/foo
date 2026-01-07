import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, AlertCircle } from 'lucide-react';

export default function SimpleRichTextEditor({ value, onChange, className }) {
  const contentRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value to innerHTML when not focused to avoid cursor jumping
  useEffect(() => {
    if (contentRef.current && !isFocused && contentRef.current.innerHTML !== value) {
      contentRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (contentRef.current) {
        const html = contentRef.current.innerHTML;
        onChange(html);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const ToolbarButton = ({ onClick, icon: Icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
        <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
        <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton 
            onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
            }} 
            icon={LinkIcon} 
            title="Link" 
        />
      </div>

      {/* Editor Area */}
      <div
        ref={contentRef}
        contentEditable
        className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto outline-none prose prose-sm max-w-none"
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
            setIsFocused(false);
            handleInput(); // Ensure final value is captured
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
