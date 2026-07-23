"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
} from "@/lib/services/speech";


interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalResult?: (transcript: string) => void;
  autoRestart?: boolean;
}


export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
) {

  const {
    lang = "en-US",
    continuous = true,
    interimResults = true,
    onFinalResult,
    autoRestart = true,
  } = options;


  const [isSupported, setIsSupported] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  const [transcript, setTranscript] =
    useState("");

  const [interimTranscript, setInterimTranscript] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);


  const recognitionRef =
    useRef<SpeechRecognition | null>(null);


  const shouldListenRef =
    useRef(false);


  const callbackRef =
    useRef(onFinalResult);


  callbackRef.current = onFinalResult;



  useEffect(() => {

    setIsSupported(
      isSpeechRecognitionSupported(),
    );

  }, []);



  useEffect(() => {

    if (!isSpeechRecognitionSupported()) {
      return;
    }


    const Ctor =
      getSpeechRecognitionCtor();


    if (!Ctor) {
      return;
    }



    const recognition =
      new Ctor();


    recognition.lang = lang;

    recognition.continuous =
      continuous;

    recognition.interimResults =
      interimResults;



    recognition.onstart = () => {

      console.log(
        "Speech recognition started",
      );

      setIsListening(true);

    };



    recognition.onend = () => {

      console.log(
        "Speech recognition ended",
      );


      setIsListening(false);



      // Chrome stops randomly.
      // Restart while wake mode is enabled.

      if (shouldListenRef.current) {

        setTimeout(() => {

          try {

            recognition.start();

          } catch {}

        }, 500);

      }

    };



    recognition.onerror = (event) => {

      console.error(
        "Speech error:",
        event.error,
      );


      setError(
        event.error,
      );


      if (
        event.error === "not-allowed"
      ) {

        shouldListenRef.current =
          false;

      }

    };



    recognition.onresult = (event) => {

      let finalText = "";

      let interimText = "";



      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const result =
          event.results[i];


        if (result.isFinal) {

          finalText +=
            result[0].transcript;

        } else {

          interimText +=
            result[0].transcript;

        }

      }



      if (finalText) {

        const cleaned =
          finalText.trim();


        console.log(
          "Heard:",
          cleaned,
        );


        setTranscript(
          cleaned,
        );


        callbackRef.current?.(
          cleaned,
        );

      }



      setInterimTranscript(
        interimText,
      );

    };



    recognitionRef.current =
      recognition;



    return () => {

      shouldListenRef.current =
        false;


      recognition.stop();

      recognitionRef.current =
        null;

    };


  }, [
    lang,
    continuous,
    interimResults,
  ]);





  const start =
    useCallback(() => {

      setError(null);

      setTranscript("");

      shouldListenRef.current =
        true;


      try {

        recognitionRef.current?.start();

      } catch {}

    }, []);





  const stop =
    useCallback(() => {

      shouldListenRef.current =
        false;


      try {

        recognitionRef.current?.stop();

      } catch {}

    }, []);





  const reset =
    useCallback(() => {

      setTranscript("");

      setInterimTranscript("");

    }, []);





  return {

    isSupported,

    isListening,

    transcript,

    interimTranscript,

    error,

    start,

    stop,

    reset,

  };

}
