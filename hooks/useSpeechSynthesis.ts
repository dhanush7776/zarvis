"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAvailableVoices,
  isSpeechSynthesisSupported,
  speak as speakText,
  stopSpeaking,
} from "@/lib/services/speech";

export function useSpeechSynthesis(defaultVoiceName?: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(isSpeechSynthesisSupported());
    getAvailableVoices().then(setVoices);
  }, []);

  const speak = useCallback(
    (text: string, voiceName?: string) => {
      if (!isSpeechSynthesisSupported()) return;
      setIsSpeaking(true);
      speakText(text, {
        voiceName: voiceName ?? defaultVoiceName,
        onEnd: () => setIsSpeaking(false),
      });
    },
    [defaultVoiceName],
  );

  const cancel = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  return { voices, isSpeaking, isSupported, speak, cancel };
}
