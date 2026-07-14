import { Sparkles } from "lucide-react";
import { useSettings } from "@/lib/site-settings";

export function AnnouncementBar() {
  const { announcement } = useSettings();
  if (!announcement.enabled || !announcement.items.length) return null;
  const items = announcement.items;
  const speed = Math.max(10, Number(announcement.speed_seconds) || 40);
  const bg = announcement.bg_color || "#1a1a1a";
  const fg = announcement.text_color || "#f7f1e8";
  return (
    <div
      className="overflow-hidden py-2 text-xs tracking-wide print:hidden"
      style={{ background: bg, color: fg }}
    >
      <div
        className="flex whitespace-nowrap gap-12"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {[...items, ...items, ...items].map((text, i) => (
          <span key={i} className="inline-flex items-center gap-2 uppercase">
            <Sparkles className="h-3.5 w-3.5" style={{ color: fg, opacity: 0.7 }} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
