Absolutely—let’s layer **full CRUD** across every Besto feature (JARVIS-style assistant + Notes + Todos + Calendar + Summaries), end-to-end with UI, DB, RLS, and Edge functions. This is dev-ready so you can paste tasks into Cursor.

---

# ✅ CRUD Coverage Matrix

| Feature             | Create                  | Read                    | Update                      | Delete                      |
| ------------------- | ----------------------- | ----------------------- | --------------------------- | --------------------------- |
| **Notes**           | Voice/manual note       | List/search notes       | Edit text/tags              | Soft delete + restore       |
| **Todos**           | Explicit command/manual | List/filter (open/done) | Title/priority/due/complete | Soft delete + restore       |
| **Events (Local)**  | Manual or AI-confirmed  | Calendar view/day/week  | Edit title/time             | Soft delete + restore       |
| **Events (Google)** | Create in GCal via Edge | Pull agenda/sync        | Patch in GCal + local       | Delete in GCal + local      |
| **Summaries**       | From note/batch         | List summaries          | Rename/attach tags          | Delete summary              |
| **Tags**            | Add tag                 | List tags               | Rename                      | Delete (cascade note\_tags) |
| **Integrations**    | Store tokens            | Read status             | Refresh/rotate              | Disconnect (revoke)         |

---

# 🗄️ Database (Supabase) – CRUD-Ready Schemas

Add **soft delete** and consistent audit fields.

```sql
-- COMMON EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- NOTES
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  kind text not null check (kind in ('note','todo','event','summary')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- TODOS
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  title text not null,
  priority int not null default 0,  -- 0 none,1 low,2 med,3 high
  due_at timestamptz,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- EVENTS (Local + Google)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  source text not null default 'local', -- local|google
  external_id text,                     -- google event id
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- SUMMARIES
create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('note','batch')),
  note_ids uuid[] default '{}',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- TAGS
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null unique
);
create table if not exists public.note_tags (
  note_id uuid references public.notes(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

-- INTEGRATIONS
create table if not exists public.user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_refresh_token text,
  google_access_token text,
  google_token_expiry timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS (applies to all: select/insert/update/delete where auth.uid() = user_id)
alter table public.notes enable row level security;
alter table public.todos enable row level security;
alter table public.events enable row level security;
alter table public.summaries enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.user_integrations enable row level security;

-- Policies pattern (repeat per table)
create policy "select_own" on public.notes for select using (auth.uid() = user_id);
create policy "insert_own" on public.notes for insert with check (auth.uid() = user_id);
create policy "update_own" on public.notes for update using (auth.uid() = user_id);
create policy "delete_own" on public.notes for delete using (auth.uid() = user_id);
```

> **Tip:** Implement triggers to auto-update `updated_at` on UPDATE.

---

# 🔁 API & Edge Function Contracts (for Calendar + AI)

## Notes (Supabase client)

* **Create:** `insert(notes) {content, kind:'note'}`
* **Read:** `select().eq('deleted_at', null).order('created_at','desc')`
* **Update:** `update({content, updated_at: now()}).eq('id', …)`
* **Delete (soft):** `update({deleted_at: now()})`

## Todos (Supabase client)

* **Create:** from explicit intent or manual form
* **Read:** open/completed filters; due range
* **Update:** title/priority/due/completed toggle
* **Delete (soft)** + **Restore** (set `deleted_at = null`)

## Summaries (Supabase + OpenAI)

* **Create:** `/ai/summarize` Edge → returns text → insert into `summaries` (and a `notes` row with `kind='summary'` if you want one stream)
* Read/Update/Delete same pattern as notes.

## Google Calendar (Edge functions)

All functions validate Supabase JWT → map to `auth.uid()`.

* `POST /calendar/store-token`
  Body: `{ code, redirectUri }` → stores refresh token.

* `POST /calendar/create-event`
  Body: `{ title, start_at, end_at, description? }`
  Action: Create in GCal, upsert in `events` with `external_id`.

* `POST /calendar/update-event`
  Body: `{ id, title?, start_at?, end_at?, description? }`
  Action: Patch in GCal using `external_id`, update local row.

* `POST /calendar/delete-event`
  Body: `{ id }`
  Action: Delete in GCal (if `external_id`), set `deleted_at` in local row.

* `GET /calendar/agenda?scope=today|tomorrow|week`
  Action: List from GCal (or cached), return normalized events.

* `POST /calendar/sync`
  Action: Use `syncToken` from `sync_state`; upsert/soft-delete diffs.

---

# 🖥️ UI: CRUD Actions per Screen

## Home (Voice-first)

* **Create:** Voice → default Note; if “add to todo/calendar” → open Confirmation Sheet.
* **Read:** Mixed feed (recent Notes/Todos/Events).
* **Update/Delete:** Quick actions via swipe: Edit / Soft Delete / Undo.

## Notes

* **Create:** + button / voice capture.
* **Read:** Search, filters (tags, date).
* **Update:** Edit content, change kind (promote to todo/event).
* **Delete:** Move to Trash; Trash screen supports Restore/Purge.

## Todos

* **Create:** explicit voice (“add to my todo…”) or + button.
* **Read:** Open/Completed, sort by due/priority.
* **Update:** Title, due date, priority, complete toggle.
* **Delete:** Soft delete; bulk complete/delete.

## Calendar

* **Create:** explicit voice (“add to my calendar…”) or + button.
* **Read:** Day/Week agenda; “What’s today?”
* **Update:** Edit title/time → pushes to GCal and updates local.
* **Delete:** Remove from GCal + soft delete local; undo window.

## Summaries

* **Create:** “Summarize last 5 notes” or button on a long note.
* **Read:** List summaries; link back to source notes.
* **Update:** Rename summary title, attach tags.
* **Delete:** Soft delete.

## Tags

* **Create:** add tag; attach to note.
* **Read:** tag list; filter notes by tag.
* **Update:** rename tag.
* **Delete:** remove tag; cascades note\_tags.

---

# 🧠 Intent Guardrails (for CRUD)

* **Default = Note.** Only Todo/Event when user says keywords.
* **Confirm before Create/Update/Delete** for Todos/Events (one-tap bottom sheet).
* **Readbacks:** After create/update/delete, assistant **speaks** a concise confirmation:

  * “Added to your todo list.” / “Event updated to 3 PM.” / “Deleted the note.”

---

# 🧪 Acceptance Criteria (CRUD Quick Tests)

### Notes

* Create (voice/manual), edit text, soft delete, restore, hard delete from Trash.

### Todos

* Create via: “Add to my todo: send report tomorrow, high priority.”
* Read open todos sorted by due date.
* Update: change title/due/priority; toggle completed.
* Delete + Restore.

### Events (Google)

* Create via: “Add to my calendar: client call Friday 3 PM for 30 minutes.”
* Read: “What’s on my calendar today?” (speaks + renders)
* Update: change time → reflects in Google Calendar within seconds.
* Delete: removes from Google and app; undo within 10s.

### Summaries

* Create batch summary of last 5 notes; list and delete.

---

# 🧰 Cursor Task Pack (paste as tasks)

**Task A — Soft Delete & Triggers**

* Add `deleted_at` to all tables; write UPDATE trigger to refresh `updated_at` on any update.

**Task B — Data Hooks (React Query)**

* `useNotesCRUD()`, `useTodosCRUD()`, `useEventsCRUD()`, `useSummariesCRUD()`, `useTagsCRUD()`

  * create/read/update/delete functions with optimistic updates + rollback.

**Task C — Confirmation Sheet**

* Component `ConfirmSheet` that supports **Create/Update/Delete** intents with one-tap confirm.

**Task D — Trash & Restore**

* Add a global **Trash** screen to list all entities with `deleted_at != null`. Provide **Restore** and **Purge**.

**Task E — Calendar Edge CRUD**

* Implement `/calendar/create-event`, `/update-event`, `/delete-event`, `/agenda`, `/sync` with token refresh flow.

**Task F — Voice Intent Router**

* After transcription → classify → map to CRUD:

  * “update my 3 PM event to 4 PM” → `UPDATE_EVENT`
  * “delete the note about groceries” → `DELETE_NOTE`
  * “mark buy milk as done” → `UPDATE_TODO (completed=true)`

**Task G — Agenda Reader**

* “What’s on my calendar today/tomorrow/this week?” → calls `/agenda`, displays and speaks.

---

# 🔒 Security & Auditing

* RLS on all tables (own-rows only).
* Edge functions: verify Supabase JWT, map to `auth.uid()`.
* Log audit trail (optional): write to `logs` table on Create/Update/Delete with `{entity, id, action, old, new, ts}`.

---

# 🧷 Developer QoL

* **Undo snackbar** for destructive ops (10s window).
* **Bulk actions** (multi-select delete/restore).
* **Conflict handling**: if Google API fails on update/delete, revert local change and show actionable error.

---

If you want, I can generate:

* **SQL trigger functions** for `updated_at`,
* **TypeScript stubs** for `use*CRUD()` hooks,
* and **Edge function templates** for the Calendar CRUD endpoints.
