import { supabase } from "@/integrations/supabase/client";

export async function deleteStorageFile(publicUrl: string) {
  if (!publicUrl) return;

  try {
    const url = new URL(publicUrl);

    const parts = url.pathname.split("/");

    const bucketIndex = parts.indexOf("public") + 1;

    const bucket = parts[bucketIndex];

    const path = decodeURIComponent(
      parts.slice(bucketIndex + 1).join("/")
    );

    console.log("Deleting...");
    console.log("Bucket:", bucket);
    console.log("Path:", path);

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    console.log("Result:", data);
    console.log("Error:", error);

    if (error) {
      console.error(error);
    }
  } catch (err) {
    console.error(err);
  }
}