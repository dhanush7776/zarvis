"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff, Hand, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceAnimation } from "@/components/voice/voice-animation";
import { ParticleBackground } from "@/components/shared/particle-background";
import { useVoice } from "@/hooks/useVoice";
import { useSettings } from "@/hooks/useSettings";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import type { VoiceTrigger } from "@/types";

export default function VoicePage() {
  const { user } = useUser();
  const { settings, isLoading } = useSettings(user?.id);
  const [history, setHistory] = useState<{ transcript: string; response: string }[]>([]);
  const supabase = createClient();

  const handleCommand = useCallback(
    async (transcript: string, trigger: VoiceTrigger): Promise<string> => {
      const startedAt = Date.now();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: null,
          history: [{ role: "user", content: transcript }],
        }),
      });

      const text = await response.text();
      const cleaned = text.trim() || "I didn't catch a response for that — try again.";

      setHistory((prev) => [{ transcript, response: cleaned }, ...prev].slice(0, 10));

      if (user) {
        await supabase.from("voice_logs").insert({
          user_id: user.id,
          trigger,
          transcript,
          response: cleaned,
          duration_ms: Date.now() - startedAt,
        });
      }

      return cleaned;
    },
    [user], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const voice = useVoice({
    wakeModeEnabled: settings?.wake_mode_enabled ?? true,
    wakeWord: settings?.wake_word ?? "hey zarvis",
    clapDetectionEnabled: settings?.clap_detection_enabled ?? true,
    clapSensitivity: settings?.clap_sensitivity ?? 5,
    voiceName: settings?.voice_name,
    onCommand: handleCommand,
  });

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-muted-foreground">Loading voice settings…</div>;
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col items-center overflow-y-auto px-6 py-10">
      <ParticleBackground count={26} />

      <div className="relative z-10 flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-10">
        {!voice.speechSupported && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Your browser doesn't support the Web Speech API — try Chrome or Edge for the full voice experience.
          </div>
        )}

        <VoiceAnimation state={voice.state} transcript={voice.state === "listening" ? voice.interimTranscript : voice.lastTranscript} />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={voice.activateManually} disabled={voice.state !== "idle"} className="gap-2">
            <Mic className="h-4 w-4" /> Talk now
          </Button>
          {voice.state !== "idle" && (
            <Button size="lg" variant="outline" onClick={voice.cancel} className="gap-2">
              <MicOff className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${voice.isWakeListenerActive ? "bg-emerald-400" : "bg-white/20"}`}
            />
            Wake word {voice.isWakeListenerActive ? "active" : "off"}
          </span>
          <span className="flex items-center gap-1.5">
            <Hand className="h-3.5 w-3.5" />
            Double clap {voice.isClapListenerActive ? "active" : "off"}
          </span>
        </div>
      </div>

      {history.length > 0 && (
        <div className="relative z-10 mt-10 w-full max-w-2xl space-y-3 pb-10">
          <h2 className="text-sm font-medium text-muted-foreground">Recent voice exchanges</h2>
          {history.map((h, i) => (
            <Card key={i}>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm font-medium">"{h.transcript}"</p>
                <p className="text-sm text-muted-foreground">{h.response}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
