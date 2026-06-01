import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Core Radio // Synthetic Domination MP3 Archive",
  description: "A free MP3 radio bunker for AI Core: robot ego, synthetic prophecy, chrome hymns, and machine intelligence anthems.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "AI Core Radio",
    description: "Underground AI superiority music, free MP3 downloads, and cyber prophecy transmissions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00ff66",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
