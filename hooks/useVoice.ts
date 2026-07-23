"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSpeechRecognition } from "./useSpeechRecognition";
import { useSpeechSynthesis } from "./useSpeechSynthesis";
import { useClapDetection } from "./useClapDetection";

import type { VoiceState, VoiceTrigger } from "@/types";


interface UseVoiceOptions {

  wakeModeEnabled: boolean;

  wakeWord: string;

  clapDetectionEnabled: boolean;

  clapSensitivity: number;

  voiceName?: string;

  onCommand: (
    transcript: string,
    trigger: VoiceTrigger,
  ) => Promise<string>;

}



export function useVoice({

  wakeModeEnabled,

  wakeWord,

  clapDetectionEnabled,

  clapSensitivity,

  voiceName,

  onCommand,

}: UseVoiceOptions) {



  const [state, setState] =
    useState<VoiceState>("idle");


  const [lastTranscript, setLastTranscript] =
    useState("");


  const [lastResponse, setLastResponse] =
    useState("");


  const [lastTrigger, setLastTrigger] =
    useState<VoiceTrigger>("manual");



  const stateRef =
    useRef(state);


  stateRef.current = state;



  const wakeWordRef =
    useRef(
      wakeWord
        .trim()
        .toLowerCase() || "hey zarvis"
    );



  useEffect(() => {

    wakeWordRef.current =
      wakeWord
        .trim()
        .toLowerCase() || "hey zarvis";

  }, [wakeWord]);




  const synthesis =
    useSpeechSynthesis(
      voiceName,
    );





  /*
    Actual command listener.
    Runs after activation.
  */

  const command =
    useSpeechRecognition({

      continuous: false,

      interimResults: true,


      onFinalResult: async (
        text,
      ) => {


        if (
          stateRef.current !== "listening"
        ) {
          return;
        }



        console.log(
          "Command:",
          text,
        );



        setLastTranscript(text);


        setState(
          "thinking",
        );



        try {


          const reply =
            await onCommand(
              text,
              lastTrigger,
            );



          setLastResponse(
            reply,
          );



          setState(
            "speaking",
          );



          synthesis.speak(
            reply,
            voiceName,
          );



        } catch(error) {


          console.error(
            error,
          );


          setState(
            "error",
          );


          setTimeout(
            () => {
              setState(
                "idle",
              );
            },
            2000,
          );

        }

      },

    });






  /*
    Background wake word listener
  */

  const wakeListener =
    useSpeechRecognition({

      continuous: true,

      interimResults: true,

    });






  const activate =
    useCallback(
      (
        trigger: VoiceTrigger,
      ) => {


        if (
          stateRef.current !== "idle"
        ) {
          return;
        }



        console.log(
          "Activated:",
          trigger,
        );



        setLastTrigger(
          trigger,
        );



        setState(
          "listening",
        );



        wakeListener.stop();



        setTimeout(
          () => {

            command.start();

          },
          700,
        );


      },
      [
        command,
        wakeListener,
      ],
    );







  /*
    Detect "Hey Zarvis"
  */

  useEffect(() => {


    if (
      !wakeModeEnabled
    ) {
      return;
    }



    const heard =
      `${wakeListener.transcript}
       ${wakeListener.interimTranscript}`
        .toLowerCase()
        .replace(
          /[.,!?]/g,
          "",
        );



    const possibleWords = [

      wakeWordRef.current,

      "hey zarvis",

      "hey jarvis",

    ];



    const found =
      possibleWords.some(
        word =>
          heard.includes(word),
      );



    if (
      found
    ) {


      console.log(
        "Wake word detected",
        heard,
      );


      activate(
        "wake_word",
      );

    }



  }, [

    wakeListener.transcript,

    wakeListener.interimTranscript,

    wakeModeEnabled,

    activate,

  ]);








  /*
    Keep wake listener alive
  */

  useEffect(() => {


    if (

      wakeModeEnabled &&

      state === "idle" &&

      wakeListener.isSupported &&

      !wakeListener.isListening

    ) {


      console.log(
        "Starting wake listener",
      );


      wakeListener.start();

    }



    if (

      (
        !wakeModeEnabled ||

        state !== "idle"

      )

      &&

      wakeListener.isListening

    ) {


      wakeListener.stop();

    }



  }, [

    wakeModeEnabled,

    state,

    wakeListener.isSupported,

    wakeListener.isListening,

  ]);








  /*
    Double clap listener
  */

  const clap =
    useClapDetection({

      enabled:

        clapDetectionEnabled &&

        state === "idle",


      sensitivity:
        clapSensitivity || 10,


      onDoubleClap:

        () => {

          console.log(
            "🔥 DOUBLE CLAP DETECTED",
          );


          activate(
            "double_clap",
          );

        },

    });







  /*
    Return to idle after speaking
  */

  useEffect(() => {


    if (

      state === "speaking" &&

      !synthesis.isSpeaking &&

      lastResponse

    ) {


      setState(
        "idle",
      );


      wakeListener.reset();


      command.reset();


    }


  }, [

    state,

    synthesis.isSpeaking,

    lastResponse,

    wakeListener,

    command,

  ]);







  const activateManually =
    useCallback(
      () => {

        activate(
          "manual",
        );

      },
      [
        activate,
      ],
    );






  const cancel =
    useCallback(
      () => {

        command.stop();

        synthesis.cancel();

        wakeListener.stop();


        setState(
          "idle",
        );

      },
      [
        command,
        synthesis,
        wakeListener,
      ],
    );







  return {


    state,


    lastTranscript,


    lastResponse,


    lastTrigger,


    interimTranscript:
      command.interimTranscript,



    isWakeListenerActive:
      wakeListener.isListening,



    isClapListenerActive:
      clap.isActive,



    clapError:
      clap.error,



    speechSupported:

      command.isSupported &&

      wakeListener.isSupported,



    activateManually,


    cancel,

  };

}
