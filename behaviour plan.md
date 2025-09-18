Love it — “Besto as JARVIS.” Here’s a **tight, dev-ready plan** that makes your app behave like a voice assistant while respecting user intent:

---

# JARVIS-Style Behavior Plan (Besto)

## 1) Core Voice UX Rules

* **Always** capture speech → transcript → show as a **Note**.
* **Only** create a **Todo** if the user explicitly says so (e.g., “add to my todo”, “make this a task”).
* **Only** create a **Calendar event** if they explicitly say so (e.g., “add to my calendar”, “schedule this”).
* User can **manually add/edit** Notes/Todos/Events anytime.
* User can ask: **“What’s on my calendar today/tomorrow/this week?”** → read back + show UI.

---

## 2) Intents & Entities (NLP Contract)

### Intents

* `CREATE_NOTE` (default)
* `CREATE_TODO` (explicit)
* `CREATE_EVENT` (explicit)
* `ASK_CALENDAR_AGENDA` (query schedule)
* `SUMMARIZE_NOTE` (summarize a specific note or latest notes)
* `LIST_TODOS` (show or read todos)
* `CANCEL / HELP / REPEAT` (assistant controls)

### Entities

* `title` (string)
* `body` (string)
* `priority` (none/low/medium/high)
* `datetime` (start/end, due date parsing)
* `duration` (e.g., “for 30 minutes”)
* `date_scope` (today/tomorrow/this week)
* `tags` (array)

### Explicitness Heuristics

* Todo triggers when phrases contain: `todo`, `task`, `to-do`, `add to list`, `remind me to`.
* Calendar triggers when phrases contain: `calendar`, `schedule`, `add to my calendar`, `event`, `meeting`.
* Otherwise → **Note**.

---

## 3) Voice Command Examples

**Notes (default)**

* “Note: idea for onboarding flow with checklists.”
* “Capture: call supplier about shipment details.”

**Todos (explicit)**

* “Add to my todo: renew passport next week.”
* “Make a task: follow up with Ravi tomorrow morning, high priority.”

**Calendar (explicit)**

* “Add to my calendar: demo with client on Friday at 3 PM for 45 minutes.”
* “Schedule team sync next Tuesday 11 to 11:30.”

**Agenda Queries**

* “What’s on my calendar today?”
* “Any meetings tomorrow afternoon?”
* “Read my agenda for this week.”

**Summaries**

* “Summarize my last five notes.”
* “Summarize meeting notes from today.”

---

## 4) Flow Logic (Pseudocode)

```ts
// after speech -> transcript
const transcript = await recordAndTranscribe();

const intent = await classify(transcript); 
// returns { intent, title?, body?, priority?, datetime?, duration?, tags?, date_scope? }

switch (intent.type) {
  case 'CREATE_TODO':
    const todo = draftTodoFrom(intent);
    await confirmUI(todo, 'Create this todo?'); // explicit confirmation
    await supabase.insert('todos', todoRow(todo));
    maybeScheduleLocalReminder(todo.due_at);
    speak('Added to your todo list.');
    break;

  case 'CREATE_EVENT':
    const event = draftEventFrom(intent);
    await confirmUI(event, 'Add this to Google Calendar?');
    const external = await edge.calendar.create(event); // returns google eventId
    await supabase.insert('events', eventRow(event, external.id, 'google'));
    speak('Event added to your calendar.');
    break;

  case 'ASK_CALENDAR_AGENDA':
    const range = resolveRange(intent.date_scope || 'today');
    const agenda = await edge.calendar.agenda(range); // pulls from Google (or cached)
    showAgenda(agenda);
    speakAgenda(agenda);
    break;

  case 'SUMMARIZE_NOTE':
    const notes = await supabase.select('notes').limit(5).order('created_at','desc');
    const summary = await ai.summarize(notes);
    showSummary(summary);
    speak(summary);
    break;

  default: // CREATE_NOTE
    await supabase.insert('notes', noteRow(transcript));
    speak('Saved your note.');
}
```

---

## 5) Summarization Behaviors

* **On save:** “Summarize this note” button → creates a concise TL;DR.
* **Batch:** “Summarize my last N notes” → stores a **Summary** note.
* **Meeting-style:** If transcript > X chars, prompt: “Summarize?” (Yes → create summary).

---

## 6) Screens (Minimal, JARVIS-friendly)

* **Home (Mic-first):** big mic, last 5 items (Note/Todo/Event mix), quick actions (“Summarize last 5 notes”, “What’s today”).
* **Notes:** list, tags, search, tap-to-summarize, merge notes.
* **Todos:** priorities, due dates, complete, reorder.
* **Calendar:** day/week; “Connect Google Calendar” CTA; add/edit synced events.
* **Assistant Panel (Slide-up):** shows transcript, detected intent, parsed entities, confirmation chips (“Create Todo”, “Schedule Event”).

---

## 7) Supabase Schema (fits intents)

* `notes(id, user_id, content, created_at, updated_at)`
* `todos(id, user_id, title, priority, due_at, completed, note_id, created_at)`
* `events(id, user_id, title, start_at, end_at, source, external_id, note_id, created_at)`
* `summaries(id, user_id, source: 'note'|'batch', note_ids uuid[], content, created_at)`
* `user_integrations(user_id, google_refresh_token, google_access_token, google_token_expiry)`
* `sync_state(user_id, provider, token)`

All tables **RLS**: `auth.uid() = user_id` for select/insert/update/delete.

---

## 8) Google Calendar Integration (explicit only)

* **Connect flow (Settings):** OAuth with `…/auth/calendar` scope, offline access.
* **Create event:** Only after explicit intent + confirmation; store `external_id`, `source='google'`.
* **Agenda:** `events.list(primary, singleEvents=true, timeMin/timeMax)`; cache + speak results.
* **Incremental sync:** use `syncToken` stored in `sync_state`.

Spoken agenda format (clean & short):

> “You have 3 events today: 10 AM Daily Standup, 2 PM Client Demo (45 mins), 5 PM Review.”

---

## 9) AI Classifier (Compact, Deterministic)

**System prompt (outline):**

* You are a voice assistant. Classify user speech into one of: CREATE\_NOTE, CREATE\_TODO, CREATE\_EVENT, ASK\_CALENDAR\_AGENDA, SUMMARIZE\_NOTE, LIST\_TODOS, CANCEL, HELP, REPEAT.
* Only choose CREATE\_TODO or CREATE\_EVENT if the user explicitly asks (keywords included).
* Extract entities: `title`, `body`, `priority`, `datetime`, `duration`, `date_scope`, `tags`. Return strict JSON.

**Function output (example):**

```json
{
  "intent": "CREATE_EVENT",
  "title": "Client demo",
  "datetime": "2025-09-19T15:00:00+05:30",
  "duration": "45m"
}
```

**Edge case guardrails:**

* Ambiguous time (“this Friday” but past) → ask one clarifying question.
* No time for event → “What time should I schedule it?”
* No explicit keyword → save as **Note**.

---

## 10) Confirmation UX (One-tap)

* Bottom sheet shows **Detected intent + parsed fields**.
* **Primary button** text changes by intent: “Save Note”, “Create Todo”, “Add to Calendar”.
* Secondary actions: “Edit details”, “Change intent”, “Cancel”.

---

## 11) Offline & Privacy

* **Offline:** Always save as Note locally first; upgrade to Todo/Event when online & confirmed.
* **Privacy:** Keys on server via Edge Functions; refresh tokens encrypted; RLS always on.

---

## 12) Cursor Task Pack (paste into Cursor to scaffold)

**Task 1 — Intent Router**

```
Create src/lib/ai/classify.ts:
- classify(text): calls OpenAI and returns {intent, entities}.
- Implement keyword guard: only todo/event if explicit words present.
- Unit tests for 12 sample utterances.
```

**Task 2 — Capture & Confirm**

```
Update Home screen:
- Record -> transcript -> classify -> show ConfirmSheet (components/ConfirmSheet.tsx).
- On confirm: call mutateNote/Todo/Event.
```

**Task 3 — Supabase Mutations**

```
Create src/lib/data/notes.ts, todos.ts, events.ts with React Query hooks.
- useCreateNote, useCreateTodo, useCreateEvent.
- Apply optimistic updates + rollback on error.
```

**Task 4 — Google Calendar Edge**

```
Add edge_functions:
- calendar-store-token
- calendar-create-event
- calendar-agenda
- calendar-sync
Each validates Supabase JWT, handles Google OAuth/token refresh, and returns JSON.
```

**Task 5 — Agenda Query**

```
Add voice command "What's today?" on Home. 
Call /calendar-agenda?scope=today.
Render list + speak summary using TTS.
```

**Task 6 — Summaries**

```
Add summarizeLastNNotes(n=5) using OpenAI; store in 'summaries'.
UI: button on Home and Notes list header. TTS readout on success.
```

---

## 13) Acceptance Criteria (Quick)

* **Default Note:** “Remember to call mom” → saves as Note (no todo/calendar keywords).
* **Explicit Todo:** “Add to my todo: send invoice tomorrow, high priority” → creates Todo with due date & priority, after confirmation.
* **Explicit Event:** “Add to my calendar: standup at 10 AM for 15 minutes” → creates GCal event after confirmation; appears in Google Calendar.
* **Agenda:** “What’s on my calendar today?” → speaks and shows list.
* **Manual add:** From Todos screen, user can add/edit without voice.
* **Summaries:** “Summarize my last five notes” → creates a Summary note.

---

If you want, I can generate:

* the **exact Supabase SQL migration**,
* **Edge Function starters (TypeScript)** for calendar, and
* a **minimal RN screens scaffold** you can drop into Cursor and run with Expo.

Say the word and I’ll output those files next.
