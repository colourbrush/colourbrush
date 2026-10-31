import { useState } from 'react';
import { useStore } from '../data/store';
import type { Node } from '../domain/types';
import { listOllamaModels } from '../services/ai/ollama';

export function Settings() {
  const { aiSettings, setAiSettings, nodes, replaceAll, user, setError } = useStore();
  const [draft, setDraft] = useState(aiSettings);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  const test = async () => {
    setStatus('Checking…');
    try {
      const found = await listOllamaModels(draft.baseUrl);
      setModels(found);
      setStatus(found.length ? `Connected. ${found.length} model(s) installed.` : 'Connected, but no models yet. Run: ollama pull llama3.2');
    } catch {
      setStatus(`Can't reach ${draft.baseUrl}. Open the Ollama app (or run "ollama serve") and try again.`);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), nodes }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `showrunner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as { nodes?: Node[] };
      if (!Array.isArray(data.nodes)) throw new Error('That file is not a Showrunner backup.');
      if (!confirm(`Replace everything here with ${data.nodes.length} items from the backup?`)) return;
      await replaceAll(data.nodes);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="view narrow">
      <h1>Settings</h1>

      <section className="card">
        <h2>AI writers' room (Ollama)</h2>
        <p className="muted">Showrunner uses Llama on your Mac through Ollama, so your ideas never leave this computer.</p>
        <label className="field">
          Ollama address
          <input value={draft.baseUrl} onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })} />
        </label>
        <label className="field">
          Model
          <input list="models" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} />
          <datalist id="models">
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <div className="row">
          <button onClick={() => setAiSettings(draft)}>Save</button>
          <button className="ghost" onClick={test}>
            Test connection
          </button>
        </div>
        {status && <p className="hint">{status}</p>}
      </section>

      <section className="card">
        <h2>Your data</h2>
        <p className="muted">{nodes.length} items stored on this Mac. Export a backup now and then.</p>
        <div className="row">
          <button onClick={exportData}>Export backup</button>
          <label className="button ghost">
            Import backup
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Account</h2>
        <p className="muted">
          Signed in as <strong>{user?.name}</strong> ({user?.plan} mode). Accounts and sync across devices come later; the data
          model is already per-user.
        </p>
      </section>
    </div>
  );
}
