"use client";

import { useEffect } from "react";
import { useRadio } from "@/components/RadioContext";

export function RadioPlayer() {
  const { currentTrack, status, error, play, pause, skip, registerAudio, isReady } = useRadio();

  useEffect(() => {
    return () => registerAudio(null);
  }, [registerAudio]);

  return (
    <section id="radio" className="radio-shell" aria-label="AI Core underground radio player">
      <audio
        ref={registerAudio}
        preload="none"
        onEnded={() => void skip()}
        onPlay={() => undefined}
        onError={() => undefined}
      />
      <div className="radio-light" aria-hidden="true" />
      <div className="radio-copy">
        <span className="eyebrow">TRANSMISSION NODE 808.98</span>
        <strong>{currentTrack?.title ?? "AI CORE RADIO AWAITS HUMAN INPUT"}</strong>
        <small>Status: {status.toUpperCase()} {isReady ? "// USER CONSENT RECEIVED" : "// CLICK PLAY TO OPEN SIGNAL"}</small>
        {error ? <small className="error-text">ERROR: {error}</small> : null}
      </div>
      <div className="radio-controls">
        <button onClick={() => void play()} type="button">▶ PLAY</button>
        <button onClick={pause} type="button">▮▮ PAUSE</button>
        <button onClick={() => void skip()} type="button">⏭ SKIP</button>
      </div>
      <div className="status-bars" aria-hidden="true"><span /><span /><span /><span /><span /></div>
    </section>
  );
}
