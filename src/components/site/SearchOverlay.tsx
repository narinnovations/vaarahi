import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { SearchBar } from "./SearchBar";
import { useProductSearch } from "@/lib/search";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchOverlay({ open, onClose }: Props) {
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useProductSearch(search);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          mx-auto
          mt-0
          flex
          h-screen
          w-full
          flex-col
          bg-white

          lg:mt-20
          lg:h-[80vh]
          lg:max-w-4xl
          lg:rounded-3xl
          lg:shadow-2xl
        "
      >
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <SearchBar
                autoFocus
                value={search}
                onChange={setSearch}
                onClear={() => setSearch("")}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {search.trim().length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Start typing to search products...
            </div>
          ) : isLoading ? (
            <div className="flex h-full items-center justify-center">
              Searching...
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No products found
            </div>
          ) : (
            <div className="divide-y">
              {data.map((product) => (
                <Link
                  key={product.id}
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 transition hover:bg-amber-50
hover:scale-[1.01]
transition-all
duration-200"
                >
                  <img
                    src={
                      Array.isArray(product.images) && product.images.length > 0
                        ? product.images[0]
                        : "/placeholder.png"
                    }
                    alt={product.name}
                    className="h-16 w-16 rounded-lg border object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{product.name}</h3>

                    <p className="text-sm text-muted-foreground">
                      {product.category_slug}
                    </p>

                    <p className="mt-1 font-semibold text-primary">
                      ₹{product.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
