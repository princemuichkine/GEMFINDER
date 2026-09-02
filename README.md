# Gemfinder

Find promising GitHub repositories. A daily Go collector scores repos into Postgres (Supabase); a Next.js UI lists them. This repo also exposes a **read-only stdio MCP** for agents.

Live UI: https://gemfinder-nine.vercel.app/

## MCP (stdio, read-only)

`cmd/mcp` speaks MCP over stdin/stdout. It lists five tools and does not wrap collector fetch/cleanup (those archive and clear the live table). Go 1.25 is required (MCP SDK).

| Tool | What it wraps |
| --- | --- |
| `list_gems` | Supabase RPC `get_repo_stats` (lang, score, stars, search, saved/hidden) |
| `search_github` | Live GitHub repo search (`TOKEN`) |
| `score_repo` | `scorer.CalculateBreakdown` for one repo (GitHub fetch, no DB, no LLM) |
| `get_gem_history` | Supabase RPC `get_repo_history` |
| `last_run` | Supabase RPC `get_last_run_at` |

Env (loaded from `.env` then `web/.env`; process env wins):

- `TOKEN` — GitHub token for `search_github` and `score_repo`
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` — https project URL
- `SUPABASE_SECRET_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — REST key for the list/history/last-run RPCs

Collector CLI still uses `DATABASE_URL` (Postgres). Do not put secrets in `--help`, Cursor `mcp.json`, logs, or tool results.

### Point Cursor at it

From the repo root:

```bash
go run ./cmd/mcp
```

In Cursor MCP settings (`~/.cursor/mcp.json` or the project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "gemfinder": {
      "command": "go",
      "args": ["run", "./cmd/mcp"],
      "cwd": "/absolute/path/to/GEMFINDER"
    }
  }
}
```

`cwd` must be this repo so `go run` and `.env` resolve. Copy [examples/cursor-stdio.mcp.json](examples/cursor-stdio.mcp.json) and replace the path. Do not paste `TOKEN` or database URLs into that file; the server reads them from env.

## Collector CLI

Destructive. Not exposed on MCP.

```bash
go run ./cmd/gemhunter fetch
go run ./cmd/gemhunter cleanup --days 180
```

`TOKEN` and `DATABASE_URL` come from the environment (or `--token` / `--db`). `--help` does not print live secret values.

## Web

```bash
cd web && pnpm install && pnpm dev
```
