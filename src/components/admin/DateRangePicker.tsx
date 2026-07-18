import { useState } from "react";

export type DatePreset = "today" | "7d" | "30d" | "month" | "year" | "custom";

export type DateRange = { start: string; end: string };

export function rangeFromPreset(
  preset: DatePreset,
  custom?: DateRange,
): DateRange {
  const start = new Date();
  const end = new Date();

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "7d":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "30d":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "custom":
      if (custom) {
        const s = new Date(custom.start);
        const e = new Date(custom.end);

        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);

        return {
          start: s.toISOString(),
          end: e.toISOString(),
        };
      }
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: { preset: DatePreset; custom?: DateRange };
  onChange: (v: { preset: DatePreset; custom?: DateRange }) => void;
}) {
  const [custom, setCustom] = useState<DateRange>(
    value.custom ?? { start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  );
  const presets: { k: DatePreset; label: string }[] = [
    { k: "today", label: "Today" },
    { k: "7d", label: "7 days" },
    { k: "30d", label: "30 days" },
    { k: "month", label: "This month" },
    { k: "year", label: "This year" },
    { k: "custom", label: "Custom" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-full border p-1">
        {presets.map((p) => (
          <button
            key={p.k}
            onClick={() => onChange({ preset: p.k, custom: p.k === "custom" ? custom : undefined })}
            className={`rounded-full px-3 py-1 text-xs transition ${value.preset === p.k ? "bg-rose-gradient text-primary-foreground" : "hover:bg-blush"
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === "custom" && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={custom.start.slice(0, 10)}
            onChange={(e) => {
              const c = { ...custom, start: e.target.value };
              setCustom(c);
              onChange({ preset: "custom", custom: { start: new Date(c.start).toISOString(), end: new Date(c.end).toISOString() } });
            }}
            className="rounded-full border px-3 py-1"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={custom.end.slice(0, 10)}
            onChange={(e) => {
              const c = { ...custom, end: e.target.value };
              setCustom(c);
              onChange({ preset: "custom", custom: { start: new Date(c.start).toISOString(), end: new Date(c.end).toISOString() } });
            }}
            className="rounded-full border px-3 py-1"
          />
        </div>
      )}
    </div>
  );
}
