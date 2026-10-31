import { useState } from 'react';
import { useStore } from '../data/store';
import type { Node } from '../domain/types';
import { Editable } from '../components/Editable';
import { triage } from '../services/ai/writersRoom';

/** The idea inbox. Capture freely; promote ideas into a show when they earn it. */
export function WritersRoom({ open }: { open(showId: string): void }) {
  const { children } = useStore();
  const ideas = children(null, 'idea').filter((i) => i.status !== 'shelved').reverse();
  const shelved = children(null, 'idea').filter((i) => i.status === 'shelved');
  const [showShelved, setShowShelved] = useState(false);

  return (
    <div className="view">
      <h1>Writers' Room</h1>
      <p className="muted">Every idea lands here first. Nothing is lost, and nothing has to be decided now.</p>
      {ideas.length === 0 && <p className="empty-inline">The room is quiet. Use the capture bar (⌘K) to pitch something.</p>}
      <div className="ideas">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} open={open} />
        ))}
      </div>
      {shelved.length > 0 && (
        <button className="ghost" onClick={() => setShowShelved(!showShelved)}>
          {showShelved ? 'Hide' : 'Show'} {shelved.length} shelved
        </button>
      )}
      {showShelved && (
        <div className="ideas">
          {shelved.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} open={open} />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, open }: { idea: Node; open(showId: string): void }) {
  const { children, create, update, remove, ai, nodes, setError } = useStore();
  const shows = children(null, 'show');
  const [target, setTarget] = useState('new');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);

  const askAi = async () => {
    setBusy(true);
    try {
      const r = await triage(ai, idea, shows);
      setTarget(r.showId ?? 'new');
      setHint(r.reason);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const promote = () => {
    if (target === 'new') {
      update(idea.id, { kind: 'show', parentId: null, status: 'pitched', order: shows.length + 1 });
      open(idea.id);
      return;
    }
    // Lands as an episode in the show's latest season ("Season 1" is created if needed).
    const seasons = children(target, 'season');
    const season = seasons[seasons.length - 1] ?? create({ kind: 'season', parentId: target, title: 'Season 1' });
    const order = nodes.filter((n) => n.parentId === season.id).length + 1;
    update(idea.id, { kind: 'episode', parentId: season.id, status: 'pitched', order });
    open(target);
  };

  return (
    <div className={`card idea ${idea.status === 'shelved' ? 'dim' : ''}`}>
      <Editable className="title" value={idea.title} onSave={(title) => update(idea.id, { title })} />
      <Editable multiline value={idea.notes} placeholder="Notes, links, why it matters…" onSave={(notes) => update(idea.id, { notes })} />
      <div className="eyebrow">{new Date(idea.createdAt).toLocaleDateString()}</div>
      {hint && <p className="hint">✨ {hint}</p>}
      <div className="row">
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="new">→ Make it a new show</option>
          {shows.map((s) => (
            <option key={s.id} value={s.id}>
              → Episode in “{s.title}”
            </option>
          ))}
        </select>
        <button onClick={promote}>Greenlight</button>
        <button className="ghost" onClick={askAi} disabled={busy}>
          {busy ? 'Thinking…' : '✨ Where does it fit?'}
        </button>
        <span className="spacer" />
        <button className="ghost" onClick={() => update(idea.id, { status: idea.status === 'shelved' ? 'pitched' : 'shelved' })}>
          {idea.status === 'shelved' ? 'Unshelve' : 'Shelve'}
        </button>
        <button className="ghost danger" onClick={() => confirm('Delete this idea?') && remove(idea.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
