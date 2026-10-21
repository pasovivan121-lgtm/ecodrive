# Run doc — EcoDrive Route AI

## Reproduce the uncommitted artifacts

The app lives in `ecodrive-route-ai/apps/web`. A fresh checkout needs no copied
environment files: all service endpoints default to public, key-less providers
and `.env` is optional (see `.env.example`).

```bash
cd ecodrive-route-ai/apps/web
npm ci
```

Node 20+ is required (Node 26 is what this worktree uses).

## Run the server

```bash
cd ecodrive-route-ai/apps/web
setsid nohup npm run dev -- --host 127.0.0.1 --port 5173 --strictPort \
  > "/home/ivanpashov/Свалени/ecodiv/.freebuff/preview-6f32921a-3fa9-45d8-8442-2fd610475383.log" 2>&1 < /dev/null &
```

Port: 5173 (project default; `--strictPort` prevents silently moving).
URL: http://127.0.0.1:5173/

Confirm readiness with `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/`
(expect `200`) and inspect the log for `VITE v8` / `ready`.

The dev server is a plain Vite process; no database, worker or backend is
required. Stop it with `kill <pid>` for the recorded listener only.
