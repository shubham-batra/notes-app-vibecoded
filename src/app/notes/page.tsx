import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { NotesWorkspace } from "@/components/notes-workspace";
import { createClient } from "@/lib/supabase/server";
import type { NoteListItem } from "@/types/notes";

type NoteRow = {
  id: string;
  title: string;
  content_md: string;
  updated_at: string;
  note_tags: Array<{
    tags:
      | {
          name: string;
        }[]
      | null;
  }>;
};

function mapNoteRows(rows: NoteRow[]): NoteListItem[] {
  return rows.map((note) => ({
    id: note.id,
    title: note.title,
    content_md: note.content_md,
    updated_at: note.updated_at,
    tags: note.note_tags
      .map((item) => item.tags?.[0]?.name)
      .filter((value): value is string => Boolean(value)),
  }));
}

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("notes")
    .select(
      `
      id,
      title,
      content_md,
      updated_at,
      note_tags (
        tags (name)
      )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 text-zinc-900">
        <div>
          <h1 className="text-xl font-semibold">Notes</h1>
          <p className="text-sm text-zinc-600">{user.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Sign out
          </button>
        </form>
      </header>
      <NotesWorkspace initialNotes={mapNoteRows((data ?? []) as NoteRow[])} />
    </main>
  );
}
