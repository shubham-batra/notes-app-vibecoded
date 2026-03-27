"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function sanitizeText(value: string, fallback = "") {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function splitAndNormalizeTags(tagInput: string): string[] {
  const tags = tagInput
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(tags)].slice(0, 12);
}

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, userId: user.id };
}

export async function createNote() {
  const { supabase, userId } = await getCurrentUserId();
  const { error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      title: "Untitled note",
      content_md: "",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notes");
}

export async function deleteNote(noteId: string) {
  if (!noteId) {
    throw new Error("Missing note id");
  }

  const { supabase } = await getCurrentUserId();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notes");
}

export async function updateNote(input: {
  noteId: string;
  title: string;
  content: string;
  tagsInput: string;
}) {
  const { noteId, title, content, tagsInput } = input;
  if (!noteId) {
    throw new Error("Missing note id");
  }

  const { supabase, userId } = await getCurrentUserId();

  const nextTitle = sanitizeText(title, "Untitled note").slice(0, 120);
  const nextContent = content.slice(0, 100000);
  const tagNames = splitAndNormalizeTags(tagsInput);

  const { error: noteUpdateError } = await supabase
    .from("notes")
    .update({
      title: nextTitle,
      content_md: nextContent,
    })
    .eq("id", noteId)
    .eq("user_id", userId);

  if (noteUpdateError) {
    throw new Error(noteUpdateError.message);
  }

  if (tagNames.length > 0) {
    const { error: upsertTagsError } = await supabase.from("tags").upsert(
      tagNames.map((name) => ({
        user_id: userId,
        name,
      })),
      { onConflict: "user_id,name" },
    );

    if (upsertTagsError) {
      throw new Error(upsertTagsError.message);
    }
  }

  const { data: existingTags, error: tagFetchError } = await supabase
    .from("tags")
    .select("id,name")
    .eq("user_id", userId);

  if (tagFetchError) {
    throw new Error(tagFetchError.message);
  }

  const selectedTagIds = (existingTags ?? [])
    .filter((tag) => tagNames.includes(tag.name))
    .map((tag) => tag.id);

  const { error: clearJoinError } = await supabase.from("note_tags").delete().eq("note_id", noteId);
  if (clearJoinError) {
    throw new Error(clearJoinError.message);
  }

  if (selectedTagIds.length > 0) {
    const { error: insertJoinError } = await supabase.from("note_tags").insert(
      selectedTagIds.map((tagId) => ({
        note_id: noteId,
        tag_id: tagId,
      })),
    );
    if (insertJoinError) {
      throw new Error(insertJoinError.message);
    }
  }

  revalidatePath("/notes");
}
