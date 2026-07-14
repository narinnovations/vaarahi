import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads an image to Supabase Storage, or to Cloudinary when the
 * VITE_CLOUDINARY_CLOUD + VITE_CLOUDINARY_PRESET env vars are set.
 * Returns the public URL of the uploaded asset.
 */
export async function uploadImage(file: File, folder = "uploads"): Promise<string> {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD as string | undefined;
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET as string | undefined;
  if (cloud && preset) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    fd.append("folder", folder);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const json = (await res.json()) as { secure_url: string };
    return json.secure_url;
  }
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  // Try public URL first (works if bucket is public). Fall back to a
  // long-lived signed URL so uploads work even on private buckets.
  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
  try {
    const head = await fetch(pub.publicUrl, { method: "HEAD" });
    if (head.ok) return pub.publicUrl;
  } catch { /* ignore */ }
  const { data: signed, error: sErr } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
  if (sErr) throw sErr;
  return signed.signedUrl;
}




export function ImageUploader({
  value,
  onChange,
  folder = "uploads",
  multiple = false,
  className,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadImage(f, folder));
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 opacity-0 shadow group-hover:opacity-100"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-blush">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            disabled={busy}
            onChange={(e) => handle(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
