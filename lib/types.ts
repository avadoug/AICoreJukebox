export type Track = {
  id: string;
  title: string;
  description: string | null;
  lyrics_notes: string | null;
  audio_path: string;
  audio_url: string;
  cover_path: string | null;
  cover_url: string | null;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  id: number;
  donation_url: string | null;
  updated_at: string;
};
