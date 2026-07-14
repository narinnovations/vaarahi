import { MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/site-settings";

export function WhatsAppFab() {
  const { whatsapp } = useSettings();
  if (!whatsapp.enabled) return null;
  const message = encodeURIComponent(whatsapp.greeting);
  return (
    <a
      href={`https://wa.me/${whatsapp.phone}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-luxe transition hover:scale-105"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" />
      <MessageCircle className="relative h-6 w-6" />
    </a>
  );
}
