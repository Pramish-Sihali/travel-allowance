'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface AutoFormatTextareaProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function AutoFormatTextarea({
  value = '',
  onChange,
  placeholder,
  rows = 6,
  className
}: AutoFormatTextareaProps) {
  const [displayValue, setDisplayValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert plain text to bullet points for display
  const formatToBulletPoints = (text: string): string => {
    if (!text) return '';
    
    return text
      .split('\n')
      .map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return '';
        
        // Don't add bullet if line already starts with bullet point
        if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          return trimmedLine;
        }
        
        // Add bullet point
        return `• ${trimmedLine}`;
      })
      .join('\n')
      .replace(/\n\n+/g, '\n\n'); // Clean up multiple empty lines
  };

  // Convert bullet points back to plain text for storage
  const formatToPlainText = (text: string): string => {
    return text
      .split('\n')
      .map(line => {
        // Remove bullet points for storage
        return line.replace(/^[•\-\*]\s*/, '').trim();
      })
      .filter(line => line !== '') // Remove empty lines
      .join('\n');
  };

  // Update display value when input value changes
  useEffect(() => {
    const formatted = formatToBulletPoints(value);
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Store the plain text version
    const plainText = formatToPlainText(newValue);
    onChange(plainText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const currentValue = textarea.value;
      
      // Insert new line and bullet point
      const beforeCursor = currentValue.substring(0, cursorPosition);
      const afterCursor = currentValue.substring(cursorPosition);
      
      let newValue: string;
      
      // If we're at the end of a line or the line is empty, add a new bullet point
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      if (currentLine.trim() === '' || currentLine.match(/^[•\-\*]\s*$/)) {
        // If current line is empty or just a bullet, don't add another bullet
        newValue = beforeCursor + '\n' + afterCursor;
      } else {
        // Add new bullet point
        newValue = beforeCursor + '\n• ' + afterCursor;
      }
      
      // Update the display value
      setDisplayValue(newValue);
      
      // Update cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = cursorPosition + (currentLine.trim() === '' ? 1 : 3);
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
      
      // Store plain text version
      const plainText = formatToPlainText(newValue);
      onChange(plainText);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    const pastedText = e.clipboardData.getData('text');
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const currentValue = textarea.value;
    
    const beforeCursor = currentValue.substring(0, cursorPosition);
    const afterCursor = currentValue.substring(textarea.selectionEnd);
    
    // Format pasted content as bullet points
    const formattedPasted = formatToBulletPoints(pastedText);
    const newValue = beforeCursor + formattedPasted + afterCursor;
    
    setDisplayValue(newValue);
    
    // Store plain text version
    const plainText = formatToPlainText(newValue);
    onChange(plainText);
    
    // Update cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = cursorPosition + formattedPasted.length;
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleFocus = () => {
    // If textarea is empty, add first bullet point
    if (!displayValue.trim()) {
      const bulletStart = '• ';
      setDisplayValue(bulletStart);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(bulletStart.length, bulletStart.length);
        }
      }, 0);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        placeholder={placeholder}
        rows={rows}
        className={`font-mono text-sm leading-relaxed ${className}`}
        style={{
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}
      />
      
      {/* Helper text */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>• Press Enter to create new bullet points</span>
          <span>• Shift+Enter for new line without bullet</span>
          <span>• Paste text to auto-format as bullets</span>
        </div>
      </div>
      
      {/* Preview section showing how data will be stored */}
      {value && (
        <details className="mt-4">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Preview stored data (click to expand)
          </summary>
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono whitespace-pre-wrap border">
            {value}
          </div>
        </details>
      )}
    </div>
  );
}