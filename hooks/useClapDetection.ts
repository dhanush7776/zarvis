"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";


interface UseClapDetectionOptions {
  sensitivity?: number;
  maxGapMs?: number;
  refractoryMs?: number;
  enabled?: boolean;
  onDoubleClap?: () => void;
}



export function useClapDetection({

  sensitivity = 10,

  maxGapMs = 1200,

  refractoryMs = 350,

  enabled = false,

  onDoubleClap,

}: UseClapDetectionOptions) {


  const [isActive, setIsActive] =
    useState(false);


  const [error, setError] =
    useState<string | null>(null);



  const audioContextRef =
    useRef<AudioContext | null>(null);


  const analyserRef =
    useRef<AnalyserNode | null>(null);


  const streamRef =
    useRef<MediaStream | null>(null);


  const animationRef =
    useRef<number | null>(null);



  const callbackRef =
    useRef(onDoubleClap);


  callbackRef.current =
    onDoubleClap;



  const firstClapRef =
    useRef<number | null>(null);


  const lastClapRef =
    useRef(0);



  const previousVolumeRef =
    useRef(0);



  const stop =
    useCallback(() => {


      if (animationRef.current) {

        cancelAnimationFrame(
          animationRef.current
        );

      }


      animationRef.current = null;



      streamRef.current
        ?.getTracks()
        .forEach(
          track => track.stop()
        );


      streamRef.current = null;



      audioContextRef.current
        ?.close()
        .catch(() => {});



      audioContextRef.current = null;

      analyserRef.current = null;


      setIsActive(false);



    }, []);







  const start =
    useCallback(async () => {


      if (isActive) return;



      try {


        setError(null);



        const mic =
          await navigator.mediaDevices.getUserMedia({

            audio: {

              echoCancellation: false,

              noiseSuppression: false,

              autoGainControl: true,

            }

          });



        streamRef.current =
          mic;




        const AudioCtx =
          window.AudioContext ||
          (window as any).webkitAudioContext;



        const ctx =
          new AudioCtx();



        await ctx.resume();



        audioContextRef.current =
          ctx;



        const source =
          ctx.createMediaStreamSource(
            mic
          );



        const analyser =
          ctx.createAnalyser();



        analyser.fftSize =
          2048;



        analyser.smoothingTimeConstant =
          0.05;



        source.connect(
          analyser
        );



        analyserRef.current =
          analyser;




        const data =
          new Uint8Array(
            analyser.fftSize
          );





        const detect =
          () => {



            if (!analyserRef.current) {
              return;
            }



            analyserRef.current
              .getByteTimeDomainData(
                data
              );



            let sum = 0;



            for (
              let i = 0;
              i < data.length;
              i++
            ) {


              const value =
                (data[i] - 128) / 128;


              sum +=
                value * value;


            }



            const volume =
              Math.sqrt(
                sum / data.length
              );



            const jump =
              volume -
              previousVolumeRef.current;



            previousVolumeRef.current =
              volume;




            if (volume > 0.04) {

              console.log(
                "Mic:",
                volume.toFixed(3)
              );

            }




            /*
              Clap detection

              Your microphone:
              normal sound ≈ 0.05-0.12
              clap spike should jump higher
            */


            const clap =
              volume > 0.11 &&
              jump > 0.015;




            const now =
              performance.now();




            if (

              clap &&

              now -
              lastClapRef.current >
              refractoryMs

            ) {


              console.log(
                "👏 CLAP"
              );



              lastClapRef.current =
                now;




              if (
                firstClapRef.current === null
              ) {


                firstClapRef.current =
                  now;


              } else {


                const gap =
                  now -
                  firstClapRef.current;



                if (
                  gap <= maxGapMs
                ) {


                  console.log(
                    "🔥 DOUBLE CLAP DETECTED"
                  );



                  firstClapRef.current =
                    null;



                  callbackRef.current?.();



                } else {


                  firstClapRef.current =
                    now;


                }


              }


            }




            if (

              firstClapRef.current &&

              now -
              firstClapRef.current >
              maxGapMs

            ) {


              firstClapRef.current =
                null;


            }




            animationRef.current =
              requestAnimationFrame(
                detect
              );


          };




        animationRef.current =
          requestAnimationFrame(
            detect
          );



        setIsActive(true);



        console.log(
          "👏 Clap detector active"
        );



      } catch(err) {


        console.error(
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : "Microphone error"
        );


      }



    }, [

      isActive,

      maxGapMs,

      refractoryMs,

    ]);







  useEffect(() => {


    if (enabled) {

      start();

    } else {

      stop();

    }



    return stop;


  }, [

    enabled,

  ]);







  return {

    isActive,

    error,

    start,

    stop,

  };

}
