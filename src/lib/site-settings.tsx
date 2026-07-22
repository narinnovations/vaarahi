import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import vaarahiLogo from "@/assets/vaarahi-logo.png";


export type StoreSettings = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  gstin?: string;
  logo_url?: string;
  favicon_url?: string;
};

export type AnnouncementSettings = {
  enabled: boolean;
  items: string[];
  speed_seconds?: number;
  bg_color?: string;
  text_color?: string;
};
export type WhatsAppSettings = { enabled: boolean; phone: string; greeting: string };
export type ReelsSectionSettings = { enabled: boolean; title: string; subtitle: string };
export type FooterSettings = { about: string; maps_url?: string; facebook?: string; youtube?: string };
export type InvoiceSettings = {
  footer_message?: string;
  return_policy?: string;
  terms?: string;
  signature_text?: string;
  invoice_prefix?: string;
};

export type AllSettings = {
  store: StoreSettings;
  announcement: AnnouncementSettings;
  whatsapp: WhatsAppSettings;
  reels_section: ReelsSectionSettings;
  footer: FooterSettings;
  invoice: InvoiceSettings;
};

export const DEFAULT_SETTINGS: AllSettings = {
  store: {
    name: "VAARAHI",
    tagline: "Jewellery · Fashion · Accessories",
    address:
      "Masjid Centre, Mantripragada Vari Street, Beside Maharaja Kitchen, Suryanarayana Puram, Andhra Pradesh – 533001",
    phone: "+91 89194 92504",
    whatsapp: "918919492504",
    instagram: "sri_sai_womensworld",
    email: "narinnovations@gmail.com",
    gstin: "",
    logo_url: "",
    favicon_url: "",
  },
  announcement: {
    enabled: true,
    items: [
      "🚚 Free Shipping on Orders Above ₹999",
      "💯 100% Genuine Products",
      "💳 100% Secure Payments",
      "⭐ Premium Quality Handcrafted",
      "🎉 Festival Offers Available",
    ],
    speed_seconds: 40,
    bg_color: "#1a1a1a",
    text_color: "#f7f1e8",
  },
  whatsapp: {
    enabled: true,
    phone: "918919492504",
    greeting: "Hello! Welcome to VAARAHI. How may we help you today?",
  },
  reels_section: {
    enabled: true,
    title: "From Our Instagram",
    subtitle: "Follow @sri_sai_womensworld for daily inspiration",
  },
  footer: { about: "A curated house of luxury jewellery, cosmetics and gifting — crafted for the modern Indian woman.", maps_url: "", facebook: "", youtube: "" },
  invoice: {
    footer_message: "Thank you for shopping with VAARAHI. We hope you cherish your purchase.",
    return_policy: "Easy 7-day return on unused items in original packaging. Custom & sale items are non-returnable.",
    terms: "Goods once sold will be taken back or exchanged as per our return policy. Subject to local jurisdiction.",
    signature_text: "For VAARAHI",
    invoice_prefix: "VAA",
  },
};

export function useSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<AllSettings> => {
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, unknown> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return {
        store: { ...DEFAULT_SETTINGS.store, ...(map.store as object) } as StoreSettings,
        announcement: { ...DEFAULT_SETTINGS.announcement, ...(map.announcement as object) } as AnnouncementSettings,
        whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...(map.whatsapp as object) } as WhatsAppSettings,
        reels_section: { ...DEFAULT_SETTINGS.reels_section, ...(map.reels_section as object) } as ReelsSectionSettings,
        footer: { ...DEFAULT_SETTINGS.footer, ...(map.footer as object) } as FooterSettings,
        invoice: { ...DEFAULT_SETTINGS.invoice, ...(map.invoice as object) } as InvoiceSettings,
      };
    },
    staleTime: 60_000,
  });
  return data ?? DEFAULT_SETTINGS;
}

export function useLogo(): string {
  const s = useSettings();
  return s.store.logo_url && s.store.logo_url.length > 0 ? s.store.logo_url : vaarahiLogo;
}
