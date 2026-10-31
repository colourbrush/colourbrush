import { useState } from 'react';

/** A single-line input that adds an item on Enter and stays ready for the next one. */
export function AddInline({ placeholder, onAdd }: { placeholder: string; onAdd(title: string): void }) {
  const [text, setText] = useState('');
  return (
    <input
      className="add-inline"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && text.trim()) {
          onAdd(text.trim());
          setText('');
        }
      }}
    />
  );
}
