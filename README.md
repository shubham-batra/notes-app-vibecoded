# Notes App

Notes App is a secure, scalable v1 note-taking app built with:

- Next.js App Router (frontend + server actions)
- Supabase (Auth + Postgres)
- Tailwind CSS
- Vercel (deployment target)

## Features

- Email/password sign up and sign in
- Notes CRUD (create, read, update, delete)
- Markdown editor + preview
- Client-side search across title/content/tags
- Tags for lightweight organization
- Debounced autosave while typing

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Fill in environment values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. In Supabase SQL editor, run migration:

`supabase/migrations/202603260001_notes_schema.sql`

5. Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Security Notes

- Row Level Security (RLS) enforces per-user data access on `notes`, `tags`, and `note_tags`.
- User identity is derived from authenticated session server-side.
- Do not expose service role keys in the browser.

## Deploy to Vercel

1. Import project in Vercel.
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Ensure the SQL migration has already been applied in Supabase production.
4. Deploy.
