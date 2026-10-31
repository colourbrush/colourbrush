# 🎬 Showrunner

A personal project tracker for wandering minds, structured like a TV series instead of a Scrum board.

| Showrunner | Means | Scrum equivalent |
|---|---|---|
| **Show** | A project | Product |
| **Season** | A big theme or arc | Epic |
| **Episode** | A meaningful, finishable deliverable | Story |
| **Clip** | One sitting of work | Task |
| **Writers' Room** | Inbox for every loose idea | Backlog, minus the guilt |

Statuses are **Pitched → In production → Wrapped → Shelved**. *Shelved* exists on purpose: parking an idea is a
normal part of the show, not a failure.

## What it does today

- **Capture anywhere:** press **⌘K**, type, **Enter**. The idea lands in the Writers' Room.
- **Greenlight:** turn an idea into a new show, or into an episode of an existing show.
- **Continue watching:** the home screen shows the next open clip in every show you have going, most recent first.
- **AI writers' room** (local Llama through Ollama, private and free):
  - *✨ Where does it fit?*: suggests which show an idea belongs to.
  - *✨ Suggest seasons / episodes / clips*: breaks work down one level; you pick which to keep.
  - *✨ Previously on…*: a recap of where a show stands and the single best next clip.
- **Your data stays on your Mac** (browser IndexedDB), with JSON export/import in Settings.

## Run it on your iMac (no Xcode needed)

1. Install Node.js once: `brew install node` (or the installer from https://nodejs.org).
2. Double-click `start.command` in Finder. The first launch installs dependencies and then opens
   http://localhost:5173.
   - Or from Terminal: `npm install && npm run dev`.
3. Optional: in Safari, choose **File → Add to Dock** to get an app-like icon.

## Turn on AI (Llama through Ollama)

1. Install Ollama from https://ollama.com and open it. It runs in the menu bar.
2. Pull a model in Terminal: `ollama pull llama3.2` (small and fast). If your iMac has 16 GB or more of RAM,
   `llama3.1:8b` or `qwen2.5:7b` give better breakdowns.
3. In Showrunner, go to **Settings → Test connection**, then pick your model.

Ollama accepts requests from `localhost` pages by default, so no extra configuration is needed when you run it
this way.

## Architecture

```
src/
  domain/      types.ts (one Node tree: show → season → episode → clip, plus idea), tree.ts (helpers)
  data/        repository.ts (storage interface + IndexedDB impl), store.tsx (React state)
  services/    auth.ts (identity interface + LocalAuth)
               ai/provider.ts (AI interface), ai/ollama.ts, ai/writersRoom.ts (prompts)
  views/       Home, WritersRoom, ShowView, Settings
  components/  small shared UI pieces
```

Three interfaces keep the commercial path open without building it now:

| Interface | Today | Later (multi-user / paid) |
|---|---|---|
| `Repository` | `LocalRepository` (IndexedDB) | Cloud repository (e.g. Supabase/Postgres), or local-first with sync |
| `AuthProvider` | `LocalAuth` (single local user) | Supabase Auth / Clerk / Sign in with Apple |
| `AiProvider` | `OllamaProvider` (local Llama) | Hosted model through your own backend, for users without a local GPU |

Every record already has a UUID, an `ownerId` and `createdAt`/`updatedAt` timestamps, which is what sync and
multi-tenancy need.

## Roadmap

1. **Use it for 2–3 weeks yourself.** Let real friction decide the next features.
2. **Package as a real Mac app (still no Xcode):** wrap with [Tauri](https://tauri.app), which needs Rust and
   Xcode's *Command Line Tools* only, not the Xcode IDE. This gives a `.app` and `.dmg`, a global capture
   hotkey and a menu-bar quick-add.
3. **Accounts and sync:** add a cloud `Repository` and `AuthProvider`, then host the web build (Vercel,
   Netlify or Cloudflare Pages).
4. **Billing:** Stripe subscription (for example, free = local only; Pro = sync + hosted AI).
5. **Distribution:** notarized Mac download (an Apple Developer account, $99/yr) and the web app. iOS capture via
   Tauri mobile or a small native companion later.
