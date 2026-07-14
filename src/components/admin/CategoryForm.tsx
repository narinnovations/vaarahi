import { useState } from "react";
import { uploadImage } from "@/components/admin/ImageUploader";

export type CategoryInput = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
};

type Props = {
  initialValues?: CategoryInput;
  submitLabel?: string;
  onSubmit: (values: CategoryInput) => void | Promise<void>;
};

export function CategoryForm({
  initialValues,
  submitLabel = "Save Category",
  onSubmit,
}: Props) {
  const [values, setValues] = useState<CategoryInput>(
    initialValues ?? {
      name: "",
      slug: "",
      description: "",
      image_url: "",
      sort_order: 1,
    }
  );

  const [uploading, setUploading] = useState(false);

  const update = (field: keyof CategoryInput, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const url = await uploadImage(file, "categories");

      update("image_url", url);
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      {/* Name + Slug */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Category Name
          </label>

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Slug
          </label>

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={values.slug}
            onChange={(e) => update("slug", e.target.value)}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Description
        </label>

        <textarea
          rows={4}
          className="w-full rounded-xl border px-4 py-3"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      {/* Category Image */}
      <div className="space-y-4">
        <label className="block text-sm font-medium">
          Category Image
        </label>

        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Paste image URL (optional)"
          value={values.image_url}
          onChange={(e) => update("image_url", e.target.value)}
        />

        <div className="text-center text-xs text-muted-foreground">
          OR
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="w-full rounded-xl border px-4 py-3"
        />

        {uploading && (
          <p className="text-sm text-muted-foreground">
            Uploading image...
          </p>
        )}

        {values.image_url && (
          <div>
            <img
              src={values.image_url}
              alt="Category Preview"
              className="h-32 w-32 rounded-xl border object-cover shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Sort Order */}
      <div className="w-40">
        <label className="mb-2 block text-sm font-medium">
          Display Order
        </label>

        <input
          type="number"
          className="w-full rounded-xl border px-4 py-3"
          value={values.sort_order}
          onChange={(e) =>
            update("sort_order", Number(e.target.value))
          }
        />
      </div>

      <button
        type="submit"
        className="rounded-full bg-rose-gradient px-6 py-3 text-white shadow-soft"
      >
        {submitLabel}
      </button>
    </form>
  );
}