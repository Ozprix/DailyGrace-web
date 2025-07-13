
"use client";

import { useState, useEffect, useCallback } from "react";

export const useTextToSpeech = (text: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  const utterance = new SpeechSynthesisUtterance(text);
  // Optional: configure utterance properties
  // utterance.lang = 'en-US';
  // utterance.pitch = 1;
  // utterance.rate = 1;

  const handleSpeak = useCallback(() => {
    if (!isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
    } else {
      window.speechSynthesis.speak(utterance);
    }
    setIsSpeaking(true);
    setIsPaused(false);
  }, [isSupported, isPaused, utterance]);

  const handlePause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsSpeaking(false);
    setIsPaused(true);
  }, [isSupported]);

  const handleStop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
        if (isSupported) {
            window.speechSynthesis.cancel();
        }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    handleSpeak,
    handlePause,
    handleStop,
  };
};
