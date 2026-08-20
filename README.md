# PROJECT NEXT — Moment-to-Market Engine (prototype)

Angular frontend + Node/TypeScript (OOP) backend + SQL (Postgres) + Ollama for local LLM agents.
Rexona is used only as example seed data — every agent and table is brand-agnostic.

## Structure

```
project-next/
  backend/    ASP.NET-style OOP agent orchestrator, but in TypeScript on Express
    src/agents/          12 agent classes, all extending Agent<T>
    src/orchestrator/    AgentOrchestrator — sequences the pipeline
    src/services/        OllamaService (local LLM calls)
    src/db/              schema.sql, seed.sql, db.ts (pg pool)
    src/routes/          REST endpoints Angular calls
    src/server.ts        Express + Socket.IO entrypoint
  frontend/   Angular 18 standalone-components app
    src/app/core/        shared models + services (OpportunityService, LiveSignalService)
    src/app/features/    the 5 prototype screens from the blueprint
```

## Run it locally

**1. Database**
```bash
createdb project_next
psql project_next -f backend/src/db/schema.sql
psql project_next -f backend/src/db/seed.sql
```

**2. Ollama Cloud** — no local install or GPU needed, inference runs on Ollama's servers:
1. Create an API key at [ollama.com/settings/keys](https://ollama.com/settings/keys)
2. Set `OLLAMA_API_KEY` in `backend/.env`
3. Set `OLLAMA_REASONING_MODEL` / `OLLAMA_COPY_MODEL` / `OLLAMA_VISION_MODEL` to cloud catalog ids
   (check what's currently available at [ollama.com/library?cloud](https://ollama.com/library?cloud))

`OllamaService` also works against a local `ollama serve` if you point `OLLAMA_BASE_URL` at
`http://localhost:11434` — it skips the auth header automatically for local/private hosts. Cloud is
the default here since it needs no local hardware.

**3. Backend**
```bash
cd backend
cp .env.example .env   # edit DATABASE_URL / OLLAMA_* as needed
npm install
npm run dev            # http://localhost:4000
```

**4. Frontend**
```bash
cd frontend
npm install
npm start               # http://localhost:4200
```

## Why this shape

- **OOP**: every agent extends the abstract `Agent<T>` class (Template Method pattern) — the
  orchestrator only sequences agents, it holds no business logic itself (Chain of Responsibility).
  Swapping an agent's internals never touches the pipeline.
- **SQL**: one schema, brand-agnostic. `brands` and `brand_knowledge` are rows, not code — adding a
  new brand is a data operation, not a deploy.
- **Ollama**: every agent that needs reasoning/generation calls a single `OllamaService` class, so
  the model, host, and key live in one place (`.env`), matching your existing local setup.
- **Angular**: one component per prototype screen (section 14 of the blueprint), routed in sequence
  Live Pulse -> Opportunity Card -> Campaign Builder -> Brand Guardian -> Launch + Learn.

## What's stubbed for the demo

- `ActivationAgent` simulates publishing rather than calling real platform APIs (matches the
  blueprint's "hybrid" prototype recommendation — controllable, no fragile live dependencies).
- Frontend components use placeholder data where a live backend call isn't wired yet — swap the
  static arrays in `campaign-builder`, `brand-guardian`, and `launch-learn` for real HTTP calls to
  `/api/campaigns/generate` and `/api/approvals` once you're ready to demo end-to-end.
- `VisualAgent` returns a text visual-direction brief, not a generated image — plug in Adobe Firefly
  or another image API behind the same `Agent<T>` interface when you're ready.
