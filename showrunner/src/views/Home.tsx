import { useStore } from '../data/store';
import { progress } from '../domain/tree';
import type { Node } from '../domain/types';
import { ProgressBar } from '../components/StatusPill';

/** "Continue watching": the next open clip in every show you have going, most recent first. */
export function Home({ open }: { open(showId: string): void }) {
  const { nodes, children, update } = useStore();
  const shows = children(null, 'show').filter((s) => s.status !== 'shelved' && s.status !== 'wrapped');

  const rows = shows
    .map((show) => {
      const episodes = children(show.id, 'season')
        .filter((s) => s.status !== 'shelved')
        .flatMap((s) => children(s.id, 'episode'))
        .filter((e) => e.status === 'in_production' || e.status === 'pitched');
      const episode = episodes.find((e) => e.status === 'in_production') ?? episodes[0];
      const clip = episode && children(episode.id, 'clip').find((c) => c.status !== 'wrapped' && c.status !== 'shelved');
      const lastTouched = nodes
        .filter((n) => n.id === show.id || n.parentId === show.id)
        .reduce((max, n) => (n.updatedAt > max ? n.updatedAt : max), show.updatedAt);
      return { show, episode, clip, lastTouched };
    })
    .sort((a, b) => b.lastTouched.localeCompare(a.lastTouched));

  if (!rows.length) {
    return (
      <div className="empty">
        <h1>Nothing on air yet</h1>
        <p>Capture an idea in the bar above, or create your first show from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="view">
      <h1>Continue watching</h1>
      <div className="cards">
        {rows.map(({ show, episode, clip }) => (
          <div key={show.id} className="card clickable" onClick={() => open(show.id)}>
            <div className="eyebrow">{show.title}</div>
            {episode ? <h3>{episode.title}</h3> : <h3 className="muted">No episodes yet</h3>}
            {episode && <ProgressBar {...progress(nodes, episode)} />}
            {clip && <NextClip clip={clip} onWrap={() => update(clip.id, { status: 'wrapped' })} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function NextClip({ clip, onWrap }: { clip: Node; onWrap(): void }) {
  return (
    <label className="clip next" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={false} onChange={onWrap} />
      <span>Next: {clip.title}</span>
    </label>
  );
}
