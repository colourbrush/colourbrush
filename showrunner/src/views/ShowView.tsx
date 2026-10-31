import { useState } from 'react';
import { useStore } from '../data/store';
import { progress } from '../domain/tree';
import type { Node } from '../domain/types';
import { AddInline } from '../components/AddInline';
import { Editable } from '../components/Editable';
import { ProgressBar, StatusPill } from '../components/StatusPill';
import { Suggest } from '../components/Suggest';
import { recap } from '../services/ai/writersRoom';

export function ShowView({ showId, onDeleted }: { showId: string; onDeleted(): void }) {
  const { get, children, create, update, remove, nodes, ai, setError } = useStore();
  const [showShelved, setShowShelved] = useState(false);
  const [previously, setPreviously] = useState('');
  const [busy, setBusy] = useState(false);
  const show = get(showId);
  if (!show) return null;

  const seasons = children(show.id, 'season').filter((s) => showShelved || s.status !== 'shelved');

  const runRecap = async () => {
    setBusy(true);
    try {
      setPreviously(await recap(ai, nodes, show));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="view">
      <header className="show-header">
        <div className="grow">
          <Editable className="h1" value={show.title} onSave={(title) => update(show.id, { title })} />
          <Editable multiline className="logline" value={show.notes} placeholder="Logline: what is this show about?" onSave={(notes) => update(show.id, { notes })} />
        </div>
        <StatusPill status={show.status} onChange={(status) => update(show.id, { status })} />
      </header>

      <div className="row">
        <button className="ghost" onClick={runRecap} disabled={busy}>
          {busy ? 'Rolling the tape…' : '✨ Previously on…'}
        </button>
        <Suggest show={show} target={show} />
        <span className="spacer" />
        <label className="toggle">
          <input type="checkbox" checked={showShelved} onChange={() => setShowShelved(!showShelved)} /> Show shelved
        </label>
        <button className="ghost danger" onClick={() => confirm(`Delete “${show.title}” and everything in it?`) && (remove(show.id), onDeleted())}>
          Delete show
        </button>
      </div>

      {previously && (
        <blockquote className="recap">
          {previously}
          <button className="ghost close" onClick={() => setPreviously('')}>×</button>
        </blockquote>
      )}

      {seasons.map((season) => (
        <SeasonSection key={season.id} show={show} season={season} showShelved={showShelved} />
      ))}

      <AddInline placeholder={`+ New season (e.g. “Season ${seasons.length + 1}: …”)`} onAdd={(title) => create({ kind: 'season', parentId: show.id, title })} />
    </div>
  );
}

function SeasonSection({ show, season, showShelved }: { show: Node; season: Node; showShelved: boolean }) {
  const { children, create, update, remove, nodes } = useStore();
  const [collapsed, setCollapsed] = useState(season.status === 'wrapped');
  const episodes = children(season.id, 'episode').filter((e) => showShelved || e.status !== 'shelved');

  return (
    <section className={`season ${season.status === 'shelved' ? 'dim' : ''}`}>
      <div className="season-head">
        <button className="ghost twisty" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '▸' : '▾'}
        </button>
        <Editable className="h2" value={season.title} onSave={(title) => update(season.id, { title })} />
        <ProgressBar {...progress(nodes, season)} />
        <StatusPill status={season.status} onChange={(status) => update(season.id, { status })} />
        <button className="ghost danger" onClick={() => confirm(`Delete “${season.title}”?`) && remove(season.id)}>
          ×
        </button>
      </div>
      {!collapsed && (
        <>
          <Editable multiline className="arc" value={season.notes} placeholder="The arc: what changes by the end of this season?" onSave={(notes) => update(season.id, { notes })} />
          <div className="cards">
            {episodes.map((ep) => (
              <EpisodeCard key={ep.id} show={show} episode={ep} />
            ))}
            <div className="card add-card">
              <AddInline placeholder="+ New episode" onAdd={(title) => create({ kind: 'episode', parentId: season.id, title })} />
              <Suggest show={show} target={season} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function EpisodeCard({ show, episode }: { show: Node; episode: Node }) {
  const { children, create, update, remove, nodes } = useStore();
  const clips = children(episode.id, 'clip');

  return (
    <div className={`card episode ${episode.status === 'shelved' ? 'dim' : ''}`}>
      <div className="row tight">
        <span className="eyebrow">E{episode.order}</span>
        <span className="spacer" />
        <StatusPill status={episode.status} onChange={(status) => update(episode.id, { status })} />
      </div>
      <Editable className="title" value={episode.title} onSave={(title) => update(episode.id, { title })} />
      <Editable multiline value={episode.notes} placeholder="What does “done” look like?" onSave={(notes) => update(episode.id, { notes })} />
      <ProgressBar {...progress(nodes, episode)} />
      <ul className="clips">
        {clips.map((clip) => (
          <li key={clip.id} className={`clip ${clip.status}`}>
            <input
              type="checkbox"
              checked={clip.status === 'wrapped'}
              onChange={() => update(clip.id, { status: clip.status === 'wrapped' ? 'in_production' : 'wrapped' })}
            />
            <Editable value={clip.title} onSave={(title) => update(clip.id, { title })} />
            <button className="ghost danger small" onClick={() => remove(clip.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <AddInline placeholder="+ Clip" onAdd={(title) => create({ kind: 'clip', parentId: episode.id, title })} />
      <div className="row tight">
        <Suggest show={show} target={episode} />
        <span className="spacer" />
        <button className="ghost danger small" onClick={() => confirm(`Delete “${episode.title}”?`) && remove(episode.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
