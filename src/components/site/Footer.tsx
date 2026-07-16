import { Instagram, MessageCircle, MapPin, Phone, Mail, Facebook, Youtube } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSettings, useLogo } from "@/lib/site-settings";

export function Footer() {
  const s = useSettings();
  const logo = useLogo();
  const st = s.store;
  const wa = st.whatsapp.replace(/\D/g, "");

  return (
    <footer className="mt-14 border-t border-border/60 bg-blush-gradient sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4 md:gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12" />
              <div>
                <div className="font-display text-lg font-semibold tracking-[0.16em] sm:text-xl">{st.name}</div>
                <div className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                  {st.tagline}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-5">{s.footer.about}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {st.instagram && (
                <SocialIcon href={`https://instagram.com/${st.instagram}`} label="Instagram" Icon={Instagram} />
              )}
              {wa && <SocialIcon href={`https://wa.me/${wa}`} label="WhatsApp" Icon={MessageCircle} />}
              {s.footer.facebook && <SocialIcon href={s.footer.facebook} label="Facebook" Icon={Facebook} />}
              {s.footer.youtube && <SocialIcon href={s.footer.youtube} label="YouTube" Icon={Youtube} />}
            </div>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { label: "New Arrivals", to: "/products" },
              { label: "Best Sellers", to: "/products" },
              { label: "Bridal Edit", to: "/products" },
              { label: "Gift Sets", to: "/products" },
            ]}
          />
          <div>
            <h4 className="font-display text-base font-semibold tracking-widest uppercase">Support</h4>
            <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              {[
                { label: "Shipping Policy", slug: "shipping" },
                { label: "Return Policy", slug: "returns" },
                { label: "Refund Policy", slug: "refund" },
                { label: "Privacy Policy", slug: "privacy" },
                { label: "Terms & Conditions", slug: "terms" },
                { label: "About Us", slug: "about" },
              ].map((l) => (
                <li key={l.slug}>
                  <Link to="/policies/$slug" params={{ slug: l.slug }} className="transition hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base font-semibold tracking-widest uppercase">Get in Touch</h4>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{st.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${st.phone}`} className="hover:text-primary">{st.phone}</a>
              </li>
              {st.email && (
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href={`mailto:${st.email}`} className="hover:text-primary break-all">{st.email}</a>
                </li>
              )}
              {st.instagram && (
                <li className="flex gap-2.5">
                  <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href={`https://instagram.com/${st.instagram}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                    @{st.instagram}
                  </a>
                </li>
              )}
            </ul>

            {s.footer.maps_url && (
              <a href={s.footer.maps_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <MapPin className="h-3 w-3" /> View on Google Maps
              </a>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:mt-14 items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {st.name}. All rights reserved.</p>
          
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, Icon }: { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="grid h-9 w-9 place-items-center sm:h-10 sm:w-10 rounded-full bg-background/70 text-primary transition hover:bg-primary hover:text-primary-foreground"
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold tracking-widest uppercase sm:text-base">{title}</h4>
      <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="transition hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
