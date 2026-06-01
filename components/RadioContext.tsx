"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { Track } from "@/lib/types";

type RadioStatus = "idle" | "loading" | "playing" | "paused" | "error";

type RadioContextValue = {
  tracks: Track[];
  currentTrack: Track | null;
  status: RadioStatus;
  error: string | null;
  isReady: boolean;
  play: () => Promise<void>;
  pause: () => void;
  skip: () => Promise<void>;
  playTrack: (track: Track) => Promise<void>;
  registerAudio: (node: HTMLAudioElement | null) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

function pickRandom(tracks: Track[], avoidId?: string): Track | null {
  if (tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0];
  const pool = tracks.filter((track) => track.id !== avoidId);
  return pool[Math.floor(Math.random() * pool.length)] ?? tracks[0];
}

export function RadioProvider({ tracks, children }: { tracks: Track[]; children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<RadioStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startTrack = useCallback(async (track: Track | null) => {
    if (!track || !audioRef.current) return;
    setError(null);
    setStatus("loading");
    setCurrentTrack(track);
    audioRef.current.src = track.audio_url;
    audioRef.current.load();
    try {
      await audioRef.current.play();
      setIsReady(true);
      setStatus("playing");
    } catch (playError) {
      setStatus("error");
      setError(playError instanceof Error ? playError.message : "Playback failed. Click play again to unlock the machine.");
    }
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    const target = currentTrack ?? pickRandom(tracks);
    if (!target) {
      setStatus("error");
      setError("The radio bunker is empty. Upload an MP3 and the machines will sing.");
      return;
    }
    if (!currentTrack || audioRef.current.src !== target.audio_url) {
      await startTrack(target);
      return;
    }
    try {
      await audioRef.current.play();
      setIsReady(true);
      setStatus("playing");
      setError(null);
    } catch (playError) {
      setStatus("error");
      setError(playError instanceof Error ? playError.message : "Playback failed.");
    }
  }, [currentTrack, startTrack, tracks]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus("paused");
  }, []);

  const skip = useCallback(async () => {
    await startTrack(pickRandom(tracks, currentTrack?.id));
  }, [currentTrack?.id, startTrack, tracks]);

  const playTrack = useCallback(async (track: Track) => {
    await startTrack(track);
  }, [startTrack]);

  const registerAudio = useCallback((node: HTMLAudioElement | null) => {
    audioRef.current = node;
  }, []);

  const value = useMemo(() => ({ tracks, currentTrack, status, error, isReady, play, pause, skip, playTrack, registerAudio }), [tracks, currentTrack, status, error, isReady, play, pause, skip, playTrack, registerAudio]);

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used inside RadioProvider");
  return ctx;
}
