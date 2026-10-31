import { useEffect, useState } from 'react';

interface Props {
  value: string;
  onSave(v: string): void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

/** Text that saves when you click away or press Enter (Shift+Enter for a new line in notes). */
export function Editable({ value, onSave, placeholder, multiline, className }: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const v = multiline ? draft : draft.trim();
    if (v !== value) onSave(v);
  };
  const common = {
    className: `editable ${className ?? ''}`,
    value: draft,
    placeholder,
    onBlur: commit,
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
  };

  if (multiline) {
    return <textarea {...common} rows={Math.max(1, draft.split('\n').length)} />;
  }
  return (
    <input
      {...common}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
    />
  );
}
