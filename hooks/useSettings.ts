"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/types/database";

const DEFAULT_SETTINGS: Omit<Settings, "user_id" | "created_at" | "updated_at"> = {
  theme: "dark",
  language: "en",
  voice_name: "default",
  wake_mode_enabled: true,
  wake_word: "hey zarvis",
  clap_detection_enabled: true,
  clap_sensitivity: 5,
  notifications_enabled: true,
};

export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const { data } = await supabase.from("settings").select("*").eq("user_id", userId).maybeSingle();
      if (cancelled) return;
      if (data) {
        setSettings(data);
      } else {
        const { data: created } = await supabase
          .from("settings")
          .insert({ user_id: userId, ...DEFAULT_SETTINGS })
          .select("*")
          .single();
        if (!cancelled && created) setSettings(created);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (!userId) return;
      setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
      await supabase.from("settings").update(patch).eq("user_id", userId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId],
  );

  return { settings, isLoading, updateSettings };
}
