
"use client";

import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";

interface AudioPlayerProps {
  textToSpeak: string;
}

export const AudioPlayer = ({ textToSpeak }: AudioPlayerProps) => {
  const {
    isSpeaking,
    isPaused,
    isSupported,
    handleSpeak,
    handlePause,
    handleStop,
  } = useTextToSpeech(textToSpeak);

  if (!isSupported) {
    return <p className="text-sm text-red-500">Text-to-speech is not supported in your browser.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      {!isSpeaking ? (
        <Button onClick={handleSpeak} size="icon" aria-label="Play audio">
          <Play className="h-5 w-5" />
        </Button>
      ) : (
        <Button onClick={handlePause} size="icon" aria-label="Pause audio">
          <Pause className="h-5 w-5" />
        </Button>
      )}
      <Button onClick={handleStop} size="icon" disabled={!isSpeaking && !isPaused} aria-label="Stop audio">
        <Square className="h-5 w-5" />
      </Button>
    </div>
  );
};
