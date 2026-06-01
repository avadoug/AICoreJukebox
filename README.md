# AI Core Radio

A production-ready Next.js + Supabase website for an intentionally loud 1998-style AI Core MP3 radio bunker. It includes a sticky underground radio player, random streaming, free downloads, admin MP3 upload, metadata editing, procedural cover art, replacement cover uploads, donation link settings, search/filtering, error handling, and Supabase RLS.

## Stack

- Next.js App Router
- React
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Plain CSS with retro 1998 cyber-console styling

## Features

- Top radio player with play, pause, skip, status text, and random track selection
- Random next-track behavior when a song ends
- User-interaction playback to avoid browser autoplay violations
- MP3 upload admin area
- Permanent cloud storage for audio files
- Metadata stored in Postgres
- Public streaming and free downloads
- File size, upload date, title, description, lyrics/notes
- Procedural CD-single cover art generated from title hashing
- Optional replacement cover art upload
- Search/filter tools for a growing library
- Donation/support area with editable donation URL
- Authentication plus admin allowlist
- RLS policies for database and storage
- Responsive desktop/mobile layout

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_MAX_UPLOAD_MB=100
```

Only `NEXT_PUBLIC_*` variables are exposed to browser code. Do not put a Supabase service-role key in this app.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. In Supabase Auth, create your admin user with email/password.
5. Copy that user's UUID.
6. Run:

```sql
insert into public.app_admins (user_id)
values ('YOUR-AUTH-USER-UUID');
```

The SQL creates:

- `public.tracks`
- `public.app_settings`
- `public.app_admins`
- `public.is_admin()`
- `track-audio` public storage bucket
- `cover-art` public storage bucket
- RLS policies for public reads and admin-only writes

## Storage bucket behavior

`track-audio` is public so visitors can stream and download MP3s without signed URL friction. Writes are still admin-only through Supabase Storage RLS. `cover-art` is also public because cover images are displayed to all visitors.

MP3 uploads are checked in three places:

1. Browser file picker: `accept="audio/mpeg,.mp3"`
2. Client validation: MIME type or `.mp3` extension
3. Supabase storage policies and bucket MIME restrictions

## Admin usage

Visit `/admin`.

You can:

- Log in with Supabase Auth
- Upload MP3s
- Add title, description, and lyrics/notes
- Edit title/description/lyrics
- Replace cover art with PNG/JPG/WEBP
- Delete tracks
- Update the donation URL

A signed-in user must also exist in `public.app_admins`, otherwise the admin page refuses access.

## Deployment

### Vercel

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.example` in Vercel Project Settings.
4. Deploy.
5. Set `NEXT_PUBLIC_SITE_URL` to your production domain.

### Any Node host

```bash
npm install
npm run build
npm run start
```

Next.js can also be deployed as a Node server, Docker container, static export with limitations, or platform adapter. This app uses runtime Supabase calls, so a normal Node/Vercel deployment is the easiest path.

## Security notes

- Keep the Supabase service-role key out of this project.
- Use Supabase RLS as the real enforcement layer.
- Public buckets mean public files. That is intentional for free streaming and downloads.
- For private/premium files later, switch to private buckets plus signed URLs.
- Add rate limiting at the platform edge if uploads become public-facing or if many admins are added.
- Use long, unique file names. The app uses `crypto.randomUUID()`.

## Customization

Edit `app/page.tsx` for copy, links, badges, and contact items.

Edit `app/globals.css` for the 1998 visual language.

Edit `components/ProceduralCover.tsx` to change the fake CD-single generation. It hashes the song title into color/geometry, so every track gets deterministic artwork without requiring an image API.
