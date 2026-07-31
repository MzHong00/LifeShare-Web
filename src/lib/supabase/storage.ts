import { supabase } from "@/lib/supabase/client";

const BUCKET = "memories";

export const storageApi = {
  uploadImage: async (file: File, userId: string): Promise<string> => {
    const rawExt = file.name.split(".").pop() || "jpg"; // 확장자가 빈 문자열(예: "photo."로 끝나는 파일명)인 경우도 폴백 처리
    const ext = /^[a-zA-Z0-9]+$/.test(rawExt) ? rawExt : "jpg"; // 파일명에 "/" 등이 포함돼 경로가 깨지는 것을 방지(예: 확장자 없는 "a/b" 형태의 파일명)
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  deleteImage: async (publicUrl: string): Promise<void> => {
    // publicUrl 에서 path 추출: .../memories/<path> → <path>
    const parts = publicUrl.split(`/${BUCKET}/`);
    if (parts.length < 2) return;
    const path = parts[1];
    await supabase.storage.from(BUCKET).remove([path]);
  },
};
