import { useEffect, useRef, useState } from 'react';
import { useStore } from './data/store';
import { progress } from './domain/tree';
import { ProgressBar } from './components/StatusPill';
import { Home } from './views/Home';
import { Settings } from './views/Settings';
import { ShowView } from './views/ShowView';
import { WritersRoom } from './views/WritersRoom';

type Route = { view: 'home' } | { view: 'room' } | { view: 'settings' } | { view: 'show'; id: string };

export function App() {
  const { children, create, nodes, error, setError } = useStore();
  const [route, setRoute] = useState<Route>({ view: 'home' });
  const shows = children(null, 'show');
  const ideaCount = children(null, 'idea').filter((i) => i.status !== 'shelved').length;
  const open = (id: string) => setRoute({ view: 'show', id });

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">🎬 Showrunner</div>
        <nav>
          <NavItem active={route.view === 'home'} onClick={() => setRoute({ view: 'home' })}>
            Continue watching
          </NavItem>
          <NavItem active={route.view === 'room'} onClick={() => setRoute({ view: 'room' })}>
            Writers' Room {ideaCount > 0 && <span className="badge">{ideaCount}</span>}
          </NavItem>
          <div className="nav-label">Shows</div>
          {shows.map((s) => (
            <NavItem key={s.id} active={route.view === 'show' && route.id === s.id} onClick={() => open(s.id)} dim={s.status === 'shelved'}>
              <span className="grow">{s.title}</span>
              <ProgressBar {...progress(nodes, s)} />
            </NavItem>
          ))}
          <button className="ghost new-show" onClick={() => open(create({ kind: 'show', title: 'Untitled show' }).id)}>
            + New show
          </button>
        </nav>
        <span className="spacer" />
        <NavItem active={route.view === 'settings'} onClick={() => setRoute({ view: 'settings' })}>
          Settings
        </NavItem>
      </aside>

      <main>
        <QuickCapture />
        {error && (
          <div className="error" onClick={() => setError(null)}>
            {error} <span className="muted">(click to dismiss)</span>
          </div>
        )}
        {route.view === 'home' && <Home open={open} />}
        {route.view === 'room' && <WritersRoom open={open} />}
        {route.view === 'settings' && <Settings />}
        {route.view === 'show' && <ShowView showId={route.id} onDeleted={() => setRoute({ view: 'home' })} />}
      </main>
    </div>
  );
}

function NavItem({ active, dim, onClick, children }: { active: boolean; dim?: boolean; onClick(): void; children: React.ReactNode }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''} ${dim ? 'dim' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

/** Always-on capture bar. ⌘K focuses it from anywhere; Enter drops the idea in the Writers' Room. */
function QuickCapture() {
  const { create } = useStore();
  const [text, setText] = useState('');
  const [flash, setFlash] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const save = () => {
    if (!text.trim()) return;
    create({ kind: 'idea', title: text.trim() });
    setText('');
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  return (
    <div className={`capture ${flash ? 'flash' : ''}`}>
      <input
        ref={input}
        value={text}
        placeholder="Pitch an idea… (⌘K, then Enter)"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      {flash && <span className="saved">Sent to the Writers' Room</span>}
    </div>
  );
}
