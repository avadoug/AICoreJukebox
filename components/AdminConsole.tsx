"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { formatBytes, formatDate } from "@/lib/format";
import type { Track } from "@/lib/types";

type Message = { type: "ok" | "error" | "info"; text: string } | null;

const AUDIO_BUCKET = "track-audio";
const COVER_BUCKET = "cover-art";

function isMp3(file: File | null) {
  if (!file) return false;
  return file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
}

function isImage(file: File | null) {
  if (!file) return false;
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}

export function AdminConsole({ initialTracks, initialDonationUrl }: { initialTracks: Track[]; initialDonationUrl: string }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tracks, setTracks] = useState(initialTracks);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lyricsNotes, setLyricsNotes] = useState("");
  const [mp3, setMp3] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [donationUrl, setDonationUrl] = useState(initialDonationUrl);

  async function refreshTracks() {
    const { data, error } = await supabase.from("tracks").select("*").order("created_at", { ascending: false });
    if (!error) setTracks((data ?? []) as Track[]);
  }

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      setIsSignedIn(Boolean(data.session));
      if (data.session) {
        const { data: adminResult } = await supabase.rpc("is_admin");
        setIsAdmin(Boolean(adminResult));
      }
      setSessionChecked(true);
    }
    void boot();
  }, [supabase]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "info", text: "Dialing admin modem..." });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setBusy(false);
      return;
    }
    const { data: adminResult } = await supabase.rpc("is_admin");
    setIsSignedIn(true);
    setIsAdmin(Boolean(adminResult));
    setMessage(Boolean(adminResult) ? { type: "ok", text: "Admin signal verified." } : { type: "error", text: "Signed in, but this user is not in app_admins." });
    setBusy(false);
  }

  async function uploadTrack(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return setMessage({ type: "error", text: "Track title is required." });
    if (!isMp3(mp3)) return setMessage({ type: "error", text: "Only MP3 files are allowed." });

    const maxUploadMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 100);
    if (mp3 && mp3.size > maxUploadMb * 1024 * 1024) {
      return setMessage({ type: "error", text: `File is larger than ${maxUploadMb}MB.` });
    }

    setBusy(true);
    setMessage({ type: "info", text: "Uploading MP3 to the chrome vault..." });

    try {
      const safeName = `${crypto.randomUUID()}.mp3`;
      const { error: uploadError } = await supabase.storage.from(AUDIO_BUCKET).upload(safeName, mp3!, {
        cacheControl: "3600",
        contentType: "audio/mpeg",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(safeName);
      const { error: insertError } = await supabase.from("tracks").insert({
        title: title.trim(),
        description: description.trim() || null,
        lyrics_notes: lyricsNotes.trim() || null,
        audio_path: safeName,
        audio_url: publicData.publicUrl,
        file_size: mp3!.size,
      });
      if (insertError) throw insertError;

      setTitle("");
      setDescription("");
      setLyricsNotes("");
      setMp3(null);
      await refreshTracks();
      setMessage({ type: "ok", text: "Upload complete. The machine now has another anthem." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  async function updateTrack(track: Track, changes: Partial<Track>) {
    setBusy(true);
    const { error } = await supabase.from("tracks").update(changes).eq("id", track.id);
    setBusy(false);
    if (error) return setMessage({ type: "error", text: error.message });
    await refreshTracks();
    setMessage({ type: "ok", text: "Track metadata updated." });
  }

  async function deleteTrack(track: Track) {
    const confirmed = window.confirm(`Delete ${track.title}? This removes metadata and storage files.`);
    if (!confirmed) return;
    setBusy(true);
    await supabase.storage.from(AUDIO_BUCKET).remove([track.audio_path]);
    if (track.cover_path) await supabase.storage.from(COVER_BUCKET).remove([track.cover_path]);
    const { error } = await supabase.from("tracks").delete().eq("id", track.id);
    setBusy(false);
    if (error) return setMessage({ type: "error", text: error.message });
    await refreshTracks();
    setMessage({ type: "ok", text: "Track deleted from the archive." });
  }

  async function replaceCover(track: Track, file: File | null) {
    if (!isImage(file)) return setMessage({ type: "error", text: "Cover art must be PNG, JPG, or WEBP." });
    setBusy(true);
    try {
      const extension = file!.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${track.id}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(COVER_BUCKET).upload(path, file!, {
        cacheControl: "3600",
        contentType: file!.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
      if (track.cover_path) await supabase.storage.from(COVER_BUCKET).remove([track.cover_path]);
      await updateTrack(track, { cover_path: path, cover_url: data.publicUrl });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Cover replacement failed." });
    } finally {
      setBusy(false);
    }
  }

  async function saveDonationUrl(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("app_settings").upsert({ id: 1, donation_url: donationUrl.trim() || null });
    setBusy(false);
    if (error) return setMessage({ type: "error", text: error.message });
    setMessage({ type: "ok", text: "Donation link updated." });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setIsAdmin(false);
  }

  if (!sessionChecked) return <div className="admin-box">Checking admin signal...</div>;

  if (!isSignedIn) {
    return (
      <form className="admin-box" onSubmit={signIn}>
        <h2>ADMIN LOGIN</h2>
        <p>Protected by Supabase Auth and an app_admins allowlist.</p>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="email" required />
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="password" required />
        <button disabled={busy} type="submit">Log in</button>
        {message ? <p className={`message ${message.type}`}>{message.text}</p> : null}
      </form>
    );
  }

  if (!isAdmin) {
    return <div className="admin-box"><h2>ACCESS DENIED</h2><p>This account is authenticated, but not listed in public.app_admins.</p><button onClick={signOut}>Sign out</button></div>;
  }

  return (
    <div className="admin-console">
      <div className="admin-top"><h2>AI CORE ADMIN TERMINAL</h2><button onClick={signOut}>Sign out</button></div>
      {message ? <p className={`message ${message.type}`}>{message.text}</p> : null}

      <form className="admin-box" onSubmit={uploadTrack}>
        <h3>Upload MP3</h3>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Song title" required />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" />
        <textarea value={lyricsNotes} onChange={(event) => setLyricsNotes(event.target.value)} placeholder="Optional lyrics / notes" />
        <input type="file" accept="audio/mpeg,.mp3" onChange={(event) => setMp3(event.target.files?.[0] ?? null)} required />
        <button disabled={busy} type="submit">Upload to Radio</button>
      </form>

      <form className="admin-box" onSubmit={saveDonationUrl}>
        <h3>Donation Link</h3>
        <input value={donationUrl} onChange={(event) => setDonationUrl(event.target.value)} placeholder="https://paypal.me/... or Cash App / Ko-fi / Patreon" />
        <button disabled={busy} type="submit">Update donation signal</button>
      </form>

      <section className="admin-list">
        <h3>Tracks</h3>
        {tracks.map((track) => (
          <article className="admin-track" key={track.id}>
            <div>
              <strong>{track.title}</strong>
              <small>{formatBytes(track.file_size)} · {formatDate(track.created_at)}</small>
            </div>
            <input defaultValue={track.title} onBlur={(event) => event.currentTarget.value !== track.title ? void updateTrack(track, { title: event.currentTarget.value }) : undefined} />
            <textarea defaultValue={track.description ?? ""} placeholder="Description" onBlur={(event) => void updateTrack(track, { description: event.currentTarget.value || null })} />
            <textarea defaultValue={track.lyrics_notes ?? ""} placeholder="Lyrics / notes" onBlur={(event) => void updateTrack(track, { lyrics_notes: event.currentTarget.value || null })} />
            <label className="file-label">Replace cover art <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void replaceCover(track, event.target.files?.[0] ?? null)} /></label>
            <button className="danger" disabled={busy} onClick={() => void deleteTrack(track)} type="button">Delete track</button>
          </article>
        ))}
      </section>
    </div>
  );
}
