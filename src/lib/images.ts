// Resolve image filenames stored in the database to real bundled asset URLs.
// Vite requires static imports for asset URLs; we use import.meta.glob with
// eager: true to build a lookup keyed by filename.

const modules = import.meta.glob("../assets/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const map: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const name = path.split("/").pop();
  if (name) map[name] = url;
}

export function resolveImage(filename: string | null | undefined): string {
  if (!filename) return map["cat-gifts.jpg"] ?? "";
  // Allow passthrough for already-absolute URLs
  if (/^https?:\/\//.test(filename)) return filename;
  return map[filename] ?? map["cat-gifts.jpg"] ?? "";
}

export function resolveImages(list: string[] | null | undefined): string[] {
  if (!list || list.length === 0) return [resolveImage(null)];
  return list.map(resolveImage);
}
