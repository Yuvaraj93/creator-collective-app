Awesome—here’s a **development plan tailored specifically to building Besto with Cursor + Supabase**, including **Google Calendar integration**. It’s broken into tight, shippable phases with **Cursor-ready tasks**, **Supabase schema/RLS**, and **Calendar sync steps**.

---

# Phase 0 — Repo, Environments, and Guardrails (Day 0–1)

### Tech choices

* **App:** React Native (Expo + TypeScript)
* **Editor:** **Cursor** (AI pair-programming, inline edits, multi-file applies)
* **Backend:** **Supabase** (Auth, Postgres, RLS, Edge Functions, Realtime)
* **AI:** OpenAI (categorization), optional in MVP
* **Calendar:** Google Calendar API (OAuth, incremental sync)

### Cursor tasks (drop these into Cursor Chat)

1. **Scaffold App**

```
Create an Expo RN app in TypeScript named "besto".
Add eslint + prettier + husky precommit. Configure absolute imports @/.
Install: @react-navigation/native, @react-navigation/bottom-tabs, expo-secure-store, @tanstack/react-query, react-hook-form, zod, date-fns, expo-notifications, expo-auth-session, @react-native-async-storage/async-storage, @shopify/flash-list.
```

2. **State & Data Layer**

```
Install @supabase/supabase-js. Create lib/supabase/client.ts.
Create a minimal QueryClient provider and AuthContext provider with user session.
```

3. **UI Shell**

```
Implement BottomTabs: Home, Notes, Todos, Calendar, Settings.
Add a floating mic button on Home.
```

### Supabase setup

* Create project → get `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE`.
* Turn on **Auth**: email/password + **Google provider** (we’ll use this for Calendar).
* Enable **Storage** bucket `audio/` (for voice clips if needed).

---

# Phase 1 — MVP Capture (Week 1)

### Scope

* Local **voice → text → note** (no AI yet)
* Notes & Todos persisted to Supabase
* Basic search & filters
* Email/password auth

### Supabase schema (run in SQL editor)

```sql
-- USERS (implicit via auth.users)

-- NOTES
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  kind text not null check (kind in ('note','todo','event')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TODOS (separate for richer metadata)
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  title text not null,
  priority int default 0, -- 0=none,1=low,2=med,3=high
  due_at timestamptz,
  completed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EVENTS (for future calendar linking)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  source text default 'local', -- local|google
  external_id text,           -- google event id
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TAGS (optional in MVP—can enable later)
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null
);
create table public.note_tags (
  note_id uuid references public.notes(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

-- RLS
alter table public.notes enable row level security;
alter table public.todos enable row level security;
alter table public.events enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;

create policy "notes_select_own" on public.notes
for select using (auth.uid() = user_id);
create policy "notes_ins_own" on public.notes
for insert with check (auth.uid() = user_id);
create policy "notes_upd_own" on public.notes
for update using (auth.uid() = user_id);
create policy "notes_del_own" on public.notes
for delete using (auth.uid() = user_id);

create policy "todos_select_own" on public.todos
for select using (auth.uid() = user_id);
create policy "todos_ins_own" on public.todos
for insert with check (auth.uid() = user_id);
create policy "todos_upd_own" on public.todos
for update using (auth.uid() = user_id);
create policy "todos_del_own" on public.todos
for delete using (auth.uid() = user_id);

create policy "events_select_own" on public.events
for select using (auth.uid() = user_id);
create policy "events_ins_own" on public.events
for insert with check (auth.uid() = user_id);
create policy "events_upd_own" on public.events
for update using (auth.uid() = user_id);
create policy "events_del_own" on public.events
for delete using (auth.uid() = user_id);
```

### Cursor tasks

* **Home mic + transcription (placeholder)**
  Use `expo-speech`/`expo-av` or native Speech-to-Text module. Wire to create a `note` with `kind='note'`.
* **Notes & Todos screens** (FlashList, optimistic updates).
* **Auth flows** (sign up / sign in / sign out).

**Ship** internal build to testers.

---

# Phase 2 — AI Categorization & Smart Confirm (Week 2)

### Scope

* AI classifies transcripts into **note / todo / event**
* Smart confirm dialog pre-fills titles/dates
* Create Todo or Event records accordingly

### Cursor tasks

```
Add lib/ai/classify.ts using OpenAI. 
Input: transcript text. 
Output: { type: 'note'|'todo'|'event', title, due_at/start_at/end_at, tags[] }.
Hook this into the save flow on Home/Record screen; show confirm sheet before insert.
```

### Supabase Edge Function (optional: server-side AI)

If you want to keep keys server-side:

* Create `edge_functions/ai-classify/index.ts` (Deno)
* Secure with JWT from Supabase
* Call OpenAI from server; return classification object

---

# Phase 3 — Google Calendar Integration (Week 3–4)

### What we’ll build

* **Google OAuth** (via Supabase Auth Google provider for identity)
* **Calendar OAuth (offline access / refresh tokens)**
* **Create + Sync events** (incremental with `syncToken`)
* **Two-way updates** (optional in v1)

### Important concepts

* **Scopes:** `https://www.googleapis.com/auth/calendar`
* **Tokens:** Need long-lived refresh token; store securely.
* **Sync:**

  * Initial: `events.list(calendarId='primary', singleEvents=true, orderBy='updated')`
  * Save `nextSyncToken` → subsequent calls use `syncToken`
* **Push notifications (v2+):** Use Channels/Webhooks to get change notifications

### Recommended token strategy

* Use **Supabase Auth** purely for user identity.
* For **Calendar OAuth**, do a **separate Expo AuthSession** to Google with calendar scope and `access_type=offline`, then **store the resulting Google refresh token** encrypted in Supabase (service role writes via Edge Function).

#### Edge tables

```sql
create table public.user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_refresh_token text, -- store encrypted via Vault/KMS at edge if possible
  google_access_token text,  -- optional cache
  google_token_expiry timestamptz
);

-- RLS
alter table public.user_integrations enable row level security;
create policy "integrations_own" on public.user_integrations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

#### Edge Function: token exchange & refresh

* `POST /calendar/store-token` — exchanges auth code for tokens, stores refresh token
* `POST /calendar/refresh` — uses refresh token → new access token → updates row

#### App flows (Cursor tasks)

1. **Connect Google Calendar**

```
Implement "Connect Google Calendar" button in Settings.
Use Expo AuthSession to request scope '.../calendar' with access_type=offline, prompt=consent.
Send auth code to Supabase Edge Function /calendar/store-token.
On success, mark integration linked in local state.
```

2. **Create Calendar Event**

```
When AI detects 'event' and user confirms, call Edge Function /calendar/create-event with {title, start_at, end_at, description}.
Function: adds to Google primary calendar (using access token), stores returned eventId in public.events.external_id and source='google'.
```

3. **Incremental Sync (pull)**

```
Implement background task: call Edge Function /calendar/sync with saved syncToken.
On first time, full sync; store nextSyncToken in a new table public.sync_state(user_id, provider, token).
Insert/update public.events rows accordingly.
```

---

# Phase 4 — Reminders & Push (Week 5)

### Scope

* Push notifications (Expo Notifications)
* Local scheduled reminders for Todos due\_at
* Calendar changes reflected after periodic sync (or push channel in v2)

### Cursor tasks

```
Configure Expo Notifications with permissions.
When todo has due_at, schedule local notification.
On app start/interval, run sync job to update events from Google.
```

---

# Phase 5 — Polish, Perf, & Monetization (Week 6+)

* Advanced search (server-side Postgres `tsvector`)
* Tagging + filters
* Theming + dark mode
* Premium: AI suggestions, multi-calendar, export formats

---

## File/Folder Structure (suggested)

```
apps/besto/
  app/               # Expo Router or src/navigation for classic
  src/
    components/
    screens/
      Home.tsx
      Notes.tsx
      Todos.tsx
      Calendar.tsx
      Settings.tsx
    lib/
      supabase/
        client.ts
      ai/
        classify.ts
      calendar/
        client.ts     # thin wrapper that hits Edge Functions
      auth/
        session.ts
    store/
      queryClient.ts
      auth.ts
    hooks/
    utils/
  edge_functions/
    calendar-store-token/index.ts
    calendar-refresh/index.ts
    calendar-create-event/index.ts
    calendar-sync/index.ts
supabase/
  migrations/
```

---

## Minimal API Contracts (Edge Functions)

### `POST /calendar/store-token`

**Body:** `{ code: string, redirectUri: string }`
**Action:** Exchange code → tokens, save refresh in `user_integrations`.

### `POST /calendar/create-event`

**Body:** `{ title, start_at, end_at, description? }`
**Action:** Use access token → `events.insert`; save `external_id`.

### `POST /calendar/sync`

**Body:** none
**Action:** If `syncToken` exists → incremental; else full. Upsert `public.events`.

---

## Security & RLS Notes

* All tables RLS-enabled; rows keyed by `user_id`.
* Edge Functions verify `Authorization: Bearer <supabase_jwt>` and map to `auth.uid()`.
* Store Google **refresh tokens** encrypted (consider Deno KV + KMS or Supabase Vault if available).
* The app uses **anon key**; only Edge Functions use **service role** where needed.

---

## QA & Delivery Rhythm (for Cursor)

* **Per feature:** write a **Cursor Task** that lists files to modify + acceptance criteria.
* **Ask Cursor** to:

  * Generate component skeletons + tests
  * Wire queries/mutations (React Query)
  * Add type-safe forms (zod)
  * Write edge function handlers
* **Dev loops:** small PRs, device testing (Expo Go/TestFlight/Internal App Sharing).

---

### Quick Acceptance Criteria (MVP)

* Record voice → text appears in preview → Save as **Note** (default).
* Convert a Note to **Todo** (title, due date optional).
* See Notes/Todos lists synced per-user (RLS enforced).
* Email/password login works on iOS/Android.

### Quick Acceptance Criteria (Calendar)

* Connect Google → consent screen with calendar scope.
* Create Event from AI confirm → event visible in Google Calendar.
* Sync job pulls external changes into app’s Calendar screen.

---

If you want, I can **generate the actual SQL migration files + Edge Function starters**, and a **Cursor task pack** you can paste straight in to scaffold the code.
