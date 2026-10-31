import { useState } from 'react';
import { CHILD_KIND, KIND_LABEL, type Node } from '../domain/types';
import { useStore } from '../data/store';
import { suggestChildren, type Suggestion } from '../services/ai/writersRoom';

/** "✨ Suggest" — asks the local model for the next level down and lets you keep the ones you like. */
export function Suggest({ show, target }: { show: Node; target: Node }) {
  const { ai, nodes, create, setError } = useStore();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<(Suggestion & { keep: boolean })[]>([]);
  const childKind = CHILD_KIND[target.kind];
  if (!childKind) return null;

  const run = async () => {
    setLoading(true);
    try {
      setItems((await suggestChildren(ai, nodes, show, target)).map((s) => ({ ...s, keep: true })));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    for (const i of items.filter((i) => i.keep)) {
      create({ kind: childKind, parentId: target.id, title: i.title, notes: i.notes });
    }
    setItems([]);
  };

  return (
    <div className="suggest">
      <button className="ghost" onClick={run} disabled={loading}>
        {loading ? 'Thinking…' : `✨ Suggest ${KIND_LABEL[childKind].toLowerCase()}s`}
      </button>
      {items.length > 0 && (
        <div className="suggest-box">
          {items.map((s, idx) => (
            <label key={idx} className="suggest-item">
              <input
                type="checkbox"
                checked={s.keep}
                onChange={() => setItems(items.map((x, j) => (j === idx ? { ...x, keep: !x.keep } : x)))}
              />
              <span>
                <strong>{s.title}</strong>
                {s.notes && <small>{s.notes}</small>}
              </span>
            </label>
          ))}
          <div className="row">
            <button onClick={accept}>Add selected</button>
            <button className="ghost" onClick={() => setItems([])}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
