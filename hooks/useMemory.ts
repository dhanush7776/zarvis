"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Memory } from "@/types/database";

export function useMemory(userId: string | undefined) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMemories(data ?? []);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMemory = useCallback(
    async (content: string, category = "general", importance = 3) => {
      if (!userId) return;
      const { data } = await supabase
        .from("memories")
        .insert({ user_id: userId, content, category, importance })
        .select("*")
        .single();
      if (data) setMemories((prev) => [data, ...prev]);
    },
    [userId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const deleteMemory = useCallback(async (id: string) => {
    await supabase.from("memories").delete().eq("id", id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMemory = useCallback(async (id: string, patch: Partial<Memory>) => {
    await supabase.from("memories").update(patch).eq("id", id);
    setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { memories, isLoading, refresh, addMemory, deleteMemory, updateMemory };
}
