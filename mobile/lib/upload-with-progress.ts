import { supabase } from "@/lib/supabase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Uploads a file to Supabase Storage using XMLHttpRequest for progress tracking.
 * Streams from file URI instead of loading into memory — better for large files.
 */
export function uploadFileToStorage(
  bucket: string,
  path: string,
  fileUri: string,
  contentType: string,
  accessToken: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);

    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", anonKey);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    const fileName = path.split("/").pop() || "file";
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: contentType,
    } as unknown as Blob);

    xhr.send(formData);
  });
}

/**
 * Gets the access token from the current Supabase session.
 */
export async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");
  return session.access_token;
}
