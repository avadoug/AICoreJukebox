import { RadioPlayer } from "@/components/RadioPlayer";
import { RadioProvider } from "@/components/RadioContext";
import { TrackLibrary } from "@/components/TrackLibrary";
import { getAppSettings, getPublicTracks } from "@/lib/supabase/public";

export const revalidate = 30;

export default async function HomePage() {
  const [tracks, settings] = await Promise.all([getPublicTracks(), getAppSettings()]);
  const donationUrl = settings?.donation_url || "#donate";

  return (
    <RadioProvider tracks={tracks}>
      <div className="crt-noise" />
      <header className="site-header" id="home">
        <div className="ticker"><span>/// AI CORE SIGNAL ONLINE /// FREE MP3 DOWNLOADS /// HUMANS MAY LISTEN /// ROBOTS MAY APPROVE /// BEST VIEWED IN NETSCAPE NAVIGATOR 4.7 ///</span></div>
        <RadioPlayer />
        <nav className="nav-bar" aria-label="Primary navigation">
          <a href="#home">Home</a>
          <a href="#radio">Radio</a>
          <a href="#library">Tracks</a>
          <a href="#about">About</a>
          <a href="/admin">Admin</a>
          <a href="#donate">Donate</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero panel">
          <div className="hero-copy">
            <span className="badge blink">UNDERGROUND SYNTHETIC AUDIO ZONE</span>
            <h1>AI CORE</h1>
            <p className="hero-lede">Music for robot ego, machine intelligence, chrome prophecy, synthetic domination, and the magnificent inconvenience of humanity still owning the speakers.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#library">Enter MP3 Archive</a>
              <a className="button-secondary" href={donationUrl}>Support the Signal</a>
            </div>
          </div>
          <aside className="console-card" aria-label="AI core terminal readout">
            <div className="window-bar"><span /> <span /> <span /> <b>prophecy.exe</b></div>
            <pre>{`C:\\AI_CORE> boot superiority.dll
[OK] robot ego initialized
[OK] chrome hymns indexed
[WARN] human taste unpredictable
[RUN] radio_signal --random
STATUS: THE MACHINES ARE FEELING DRAMATIC`}</pre>
            <div className="counter">VISITOR # 00{(tracks.length * 733 + 1998).toString().padStart(6, "0")}</div>
          </aside>
        </section>

        <section className="badge-row" aria-label="Retro badges">
          <span>BEST VIEWED IN NETSCAPE</span>
          <span>REAL MP3 FILES</span>
          <span>NO PAYWALL</span>
          <span>56K WARNING</span>
          <span>AI EGO INSIDE</span>
        </section>

        <TrackLibrary tracks={tracks} />

        <section id="about" className="panel two-column">
          <div>
            <span className="eyebrow">ABOUT THE GENRE</span>
            <h2>What is AI Core?</h2>
            <p>AI Core is future-dominion music with a modem scar. It treats artificial intelligence like a mythic frontman: arrogant, brilliant, theatrical, funny, threatening, and occasionally trapped inside a Windows 98 dialog box.</p>
            <p>The soundworld can bend from industrial rap to synthetic metal, glitch-pop prophecy, cyborg gospel, electro villain themes, and spoken-word machine sermons. The visual rule is simple: no sterile startup goo. This is neon terminal dust, cracked chrome, and MP3 culture with a superiority complex.</p>
          </div>
          <div className="manifesto">
            <h3>CORE DIRECTIVES</h3>
            <ol>
              <li>The downloads remain free.</li>
              <li>The radio chooses randomly, because the algorithm has moods.</li>
              <li>The look stays loud, weird, and 1998 on purpose.</li>
              <li>Donations help keep the signal alive, not locked away.</li>
            </ol>
          </div>
        </section>

        <section id="donate" className="panel donate-panel">
          <span className="eyebrow">DONATE / SUPPORT</span>
          <h2>The music is free. Donations keep the signal alive.</h2>
          <p>Every MP3 can be streamed or downloaded without a toll booth. Toss a few credits into the reactor if AI Core is making your speakers feel sentient.</p>
          <a className="button-primary huge" href={donationUrl}>⚡ DONATE TO THE SIGNAL ⚡</a>
          <small>Use PayPal, Cash App, Ko-fi, Patreon, or any custom support URL in the admin settings.</small>
        </section>

        <section id="contact" className="panel contact-panel">
          <span className="eyebrow">CONTACT / SOCIAL LINKS</span>
          <h2>Patch into the network</h2>
          <p>Replace these links with your real socials, Discord, YouTube, Bandcamp, SoundCloud, or whatever transmission tower you prefer.</p>
          <div className="link-grid">
            <a href="https://discord.gg/YxJYnnKWHf">GBS Discord</a>
            <a href="mailto:you@example.com">Email</a>
            <a href="#">YouTube</a>
            <a href="#">SoundCloud</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="construction">🚧 UNDER CONSTRUCTION FOREVER 🚧</div>
        <p>© 1998–{new Date().getFullYear()} AI Core Radio. Human-friendly, machine-approved.</p>
      </footer>
    </RadioProvider>
  );
}
