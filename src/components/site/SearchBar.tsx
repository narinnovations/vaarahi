import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  onChange,
  onClear,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search jewellery, cosmetics, handbags..."
        className="h-12 w-full rounded-full border border-border bg-background pl-12 pr-12"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}