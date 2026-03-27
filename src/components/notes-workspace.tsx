"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { createNote, deleteNote, updateNote } from "@/app/actions/notes";
import type { NoteListItem } from "@/types/notes";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function NotesWorkspace({ initialNotes }: { initialNotes: NoteListItem[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [title, setTitle] = useState(initialNotes[0]?.title ?? "");
  const [content, setContent] = useState(initialNotes[0]?.content_md ?? "");
  const [tagsInput, setTagsInput] = useState((initialNotes[0]?.tags ?? []).join(", "));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isPending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)));
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesSearch =
        q.length === 0 ||
        note.title.toLowerCase().includes(q) ||
        note.content_md.toLowerCase().includes(q) ||
        note.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesTag = !activeTag || note.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [activeTag, notes, query]);

  const activeNote =
    notes.find((note) => note.id === activeNoteId) ?? filteredNotes[0] ?? notes[0] ?? null;

  useEffect(() => {
    if (!activeNote) {
      setActiveNoteId(null);
      setTitle("");
      setContent("");
      setTagsInput("");
      return;
    }

    setActiveNoteId(activeNote.id);
    setTitle(activeNote.title);
    setContent(activeNote.content_md);
    setTagsInput(activeNote.tags.join(", "));
  }, [activeNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeNoteId) return;

    const timeout = setTimeout(() => {
      setSaveStatus("saving");
      startTransition(async () => {
        try {
          await updateNote({
            noteId: activeNoteId,
            title,
            content,
            tagsInput,
          });

          setNotes((prev) =>
            prev.map((note) =>
              note.id === activeNoteId
                ? {
                    ...note,
                    title: title.trim() || "Untitled note",
                    content_md: content,
                    tags: tagsInput
                      .split(",")
                      .map((value) => value.trim().toLowerCase())
                      .filter(Boolean),
                    updated_at: new Date().toISOString(),
                  }
                : note,
            ),
          );
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        } catch {
          setSaveStatus("error");
        }
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [activeNoteId, content, startTransition, tagsInput, title]);

  const handleCreateNote = () => {
    startTransition(async () => {
      await createNote();
      window.location.reload();
    });
  };

  const handleDeleteNote = () => {
    if (!activeNoteId) return;
    startTransition(async () => {
      await deleteNote(activeNoteId);
      window.location.reload();
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-4 p-4 text-zinc-900 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Your notes</h2>
          <button
            type="button"
            onClick={handleCreateNote}
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-60"
          >
            New
          </button>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes..."
          className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`rounded-full border px-3 py-1 text-xs ${
              activeTag === null ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={`rounded-full border px-3 py-1 text-xs ${
                activeTag === tag ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {filteredNotes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full rounded-md border p-3 text-left ${
                  note.id === activeNoteId ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                }`}
              >
                <p className="truncate text-sm font-semibold">{note.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{note.content_md || "No content yet..."}</p>
              </button>
            </li>
          ))}
          {filteredNotes.length === 0 ? (
            <li className="rounded-md border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
              No notes match your filters.
            </li>
          ) : null}
        </ul>
      </aside>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900">
        {!activeNote ? (
          <div className="flex h-full items-center justify-center text-zinc-600">
            Create your first note to get started.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <span>
                  {saveStatus === "saving"
                    ? "Saving..."
                    : saveStatus === "saved"
                      ? "Saved"
                      : saveStatus === "error"
                        ? "Save failed"
                        : "Idle"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((value) => !value)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800"
                >
                  {showPreview ? "Hide preview" : "Show preview"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteNote}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-lg font-semibold text-zinc-900 placeholder:text-zinc-500"
            />

            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500"
            />

            <div className={`grid gap-4 ${showPreview ? "md:grid-cols-2" : "grid-cols-1"}`}>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write markdown..."
                className="min-h-[420px] w-full rounded-md border border-zinc-300 p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-500"
              />

              {showPreview ? (
                <article className="prose prose-zinc min-h-[420px] max-w-none overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-zinc-900">
                  <ReactMarkdown>{content || "_Nothing to preview yet._"}</ReactMarkdown>
                </article>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
