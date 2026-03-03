# Database

Supabase-managed Postgres with Row-Level Security, full-text search, and RPCs.

## Migrations

8 consolidated, domain-based migrations in `supabase/migrations/`:

| Migration | Purpose |
|-----------|---------|
| `001_INITIAL_SCHEMA` | Required Postgres extensions |
| `002_ADD_IS_PINNED` | User profiles |
| `003_ADD_SEARCH_VECTOR` | Journals table with RLS, default journal trigger |
| `004_ADD_JOURNALS` | Journal entries with search vector, mood, location, pin, calendar RPC |
| `005_ENHANCED_MOOD_SYSTEM` | Entry media table + storage bucket |
| `006_ADD_CALENDAR_RPC` | User AI profiles + notification preferences |
| `007_ADD_ENTRY_MEDIA` | AI tables (sessions, messages, prompts, insights, feedback, tasks, embeddings) |
| `008_ADD_LOCATION_COORDINATES` | `handle_new_user()` trigger |

## Key Tables

### `journal_entries`

Core table with:

- Full-text search via `tsvector` column with weighted A/B ranking (title > body)
- GIN index for fast search
- `mood_category` and `mood_sub_emotion` for two-level mood tracking
- `latitude`/`longitude` with CHECK constraints
- `is_pinned` boolean with composite index for pinned-first sort
- `created_at` override support for backdating

### `journals`

Separate spaces for different areas of life. Default "My Journal" created on signup via trigger. Cascade soft-delete RPC.

### `entry_media`

Images and audio attachments. `waveform` JSONB column for voice memo visualization data. Linked to Supabase Storage bucket.

### AI Tables

- `ai_sessions` — check-in flow sessions
- `ai_messages` — conversation messages within sessions
- `ai_prompts` — generated/selected prompts with source tracking
- `ai_insights` — computed insights (streaks, milestones, summaries, anomalies)
- `ai_feedback` — user feedback on AI-generated content
- `ai_agent_tasks` — background task tracking
- `entry_embeddings` — vector embeddings for semantic search (future)

## Row-Level Security

All tables have RLS policies ensuring users can only access their own data. The backend uses the service-role key, but RLS still applies as an additional safety layer.

## RPCs

- **Calendar aggregation** — timezone-aware mood aggregation per day
- **Full-text search** — weighted search with filtering, ordering, pagination
- **Cascade soft-delete** — journal deletion cascades to entries and media

## Cache Layer

Redis sits in front of all read-heavy database paths:

| Path | TTL |
|------|-----|
| Entry lists | 5 min |
| Search results | 60s |
| Calendar data | 5 min |
| AI context | 60s |
| AI profile | 10 min |
| Notification preferences | 10 min |

Pattern-based invalidation on writes ensures cache consistency.
