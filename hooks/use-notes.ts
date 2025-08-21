import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useToast } from "./use-toast";
import { EnhancementSettings } from "../lib/types";

export function useNotes() {
  const toast = useToast();
  const notes = useQuery(api.notes.getNotesByUser);
  const createNote = useMutation(api.notes.createNote);
  const updateNoteContent = useMutation(api.notes.updateNoteContent);
  const updateEnhancementStatus = useMutation(api.notes.updateEnhancementStatus);
  const deleteNote = useMutation(api.notes.deleteNote);

  const createNewNote = async (
    title: string,
    originalContent: string,
    subject: string,
    settings: EnhancementSettings,
    fileId?: string,
    fileName?: string,
    fileType?: string
  ) => {
    try {
      const noteId = await createNote({
        title,
        originalContent,
        subject,
        enhancementSettings: settings,
        fileId,
        fileName,
        fileType,
      });
      toast.success("Note created successfully!");
      return noteId;
    } catch (error) {
      toast.error("Failed to create note");
      throw error;
    }
  };

  const enhanceNote = async (
    noteId: string,
    enhancedContent: string,
    processingTime?: number
  ) => {
    try {
      await updateNoteContent({
        noteId: noteId as any,
        enhancedContent,
        processingTime,
      });
      toast.success("Note enhanced successfully!");
    } catch (error) {
      toast.error("Failed to enhance note");
      throw error;
    }
  };

  const updateStatus = async (
    noteId: string,
    status: "pending" | "processing" | "completed" | "failed"
  ) => {
    try {
      await updateEnhancementStatus({
        noteId: noteId as any,
        status,
      });
    } catch (error) {
      toast.error("Failed to update note status");
      throw error;
    }
  };

  const removeNote = async (noteId: string) => {
    try {
      await deleteNote({ noteId: noteId as any });
      toast.success("Note deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete note");
      throw error;
    }
  };

  return {
    notes,
    createNewNote,
    enhanceNote,
    updateStatus,
    removeNote,
    isLoading: notes === undefined,
  };
}
