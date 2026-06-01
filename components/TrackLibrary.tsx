"use client";

import { useMemo, useState } from "react";
import { ProceduralCover } from "@/components/ProceduralCover";
import { useRadio } from "@/components/RadioContext";
import { formatBytes, formatDate } from "@/lib/format";
import type { Track } from "@/lib/types";

export function TrackLibrary({ tracks }: { tracks: Track[] }) {
  const { playTrack } = useRadio();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return tracks.filter((track) => {
      const haystack = `${track.title} ${track.description ?? ""} ${track.lyrics_notes ?? ""}`.toLowerCase();
      const matchesText = !needle || haystack.includes(needle);
      const matchesMode = mode === "all" || (mode === "with-notes" ? Boolean(track.lyrics_notes) : Boolean(track.description));
      return matchesText && matchesMode;
    });
  }, [mode, query, tracks]);

  return (
    <section id="library" className="panel library-panel">
      <div className="section-heading">
        <span className="eyebrow">MP3 LIBRARY</span>
        <h2>Free downloads from the synthetic throne room</h2>
        <p>Every track stays free. Stream it, save it, beam it into your Winamp-shaped soul.</p>
      </div>

      <div className="library-tools">
        <label>
          SEARCH SIGNAL
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="robot ego, prophecy, chrome..." />
        </label>
        <label>
          FILTER
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="all">All tracks</option>
            <option value="with-description">Has description</option>
            <option value="with-notes">Has lyrics/notes</option>
          </select>
        </label>
      </div>

      {tracks.length === 0 ? (
        <div className="empty-state">
          <h3>NO MP3S DETECTED</h3>
          <p>The library is currently a silent motherboard. Log into admin and upload the first AI Core artifact.</p>
        </div>
      ) : null}

      {tracks.length > 0 && filtered.length === 0 ? (
        <div className="empty-state"><h3>NO MATCHING SIGNALS</h3><p>Search terms bounced off the satellite dish. Try a broader scan.</p></div>
      ) : null}

      <div className="track-grid">
        {filtered.map((track) => (
          <article className="track-card" key={track.id}>
            <ProceduralCover title={track.title} coverUrl={track.cover_url} />
            <div className="track-copy">
              <h3>{track.title}</h3>
              <p>{track.description || "No description yet. Pure unidentified machine energy."}</p>
              {track.lyrics_notes ? <details><summary>Lyrics / notes</summary><pre>{track.lyrics_notes}</pre></details> : null}
              <dl>
                <div><dt>Size</dt><dd>{formatBytes(track.file_size)}</dd></div>
                <div><dt>Uploaded</dt><dd>{formatDate(track.created_at)}</dd></div>
              </dl>
              <div className="track-actions">
                <button type="button" onClick={() => void playTrack(track)}>▶ Play</button>
                <a href={track.audio_url} download target="_blank" rel="noreferrer">⬇ Download MP3</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
