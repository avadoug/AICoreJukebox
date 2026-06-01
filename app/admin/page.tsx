import { AdminConsole } from "@/components/AdminConsole";
import { getAppSettings, getPublicTracks } from "@/lib/supabase/public";

export const revalidate = 0;

export default async function AdminPage() {
  const [tracks, settings] = await Promise.all([getPublicTracks(), getAppSettings()]);

  return (
    <main className="admin-page">
      <a className="back-link" href="/">← Back to AI Core Radio</a>
      <AdminConsole initialTracks={tracks} initialDonationUrl={settings?.donation_url || ""} />
    </main>
  );
}
