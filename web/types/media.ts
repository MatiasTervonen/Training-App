export type SessionImage = {
  id: string;
  storage_path: string;
  uri: string;
};

export type SessionVideo = {
  id: string;
  storage_path: string;
  thumbnail_storage_path: string | null;
  duration_ms: number | null;
  uri: string;
  thumbnailUri: string;
};

export type SessionVoiceRecording = {
  id: string;
  storage_path: string;
  duration_ms: number | null;
  uri: string;
};

export type SessionMedia = {
  images: SessionImage[];
  videos: SessionVideo[];
  voiceRecordings: SessionVoiceRecording[];
};

export type TodoTaskMedia = {
  [taskId: string]: SessionMedia;
};
