import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Ticket,
  FileText,
  Settings as SettingsIcon,
  Menu,
  X,
  ArrowLeft,
  Images,
  Instagram,
  Boxes,
  Users,
  BarChart3,
  LineChart,
  Bell,
  Search,
  UserCog,
  ScrollText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLogo, useSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!data) throw redirect({ to: "/account" });
  },
  head: () => ({ meta: [{ title: "Admin — VAARAHI" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; icon: typeof Package; label: string; exact?: boolean };
type NavSection = { label?: string; items: NavItem[] };

const nav: NavSection[] = [
  { items: [{ to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true }] },
  { label: "Catalog", items: [
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/categories", icon: Package, label: "Categories" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/admin/coupons", icon: Ticket, label: "Coupons" },
  ]},
  { label: "Content", items: [
    { to: "/admin/banners", icon: Images, label: "Hero Banners" },
    { to: "/admin/reels", icon: Instagram, label: "Instagram Reels" },
    { to: "/admin/policies", icon: FileText, label: "Policies & Pages" },
    { to: "/admin/seo", icon: Search, label: "SEO" },
  ]},
  { label: "Operations", items: [
    { to: "/admin/inventory", icon: Boxes, label: "Inventory" },
    { to: "/admin/customers", icon: Users, label: "Customers" },
    { to: "/admin/notifications", icon: Bell, label: "Notifications" },
  ]},
  { label: "Insights", items: [
    { to: "/admin/reports", icon: BarChart3, label: "Reports" },
    { to: "/admin/analytics", icon: LineChart, label: "Analytics" },
  ]},
  { label: "System", items: [
    { to: "/admin/users", icon: UserCog, label: "Admin Users" },
    { to: "/admin/logs", icon: ScrollText, label: "Activity Logs" },
    { to: "/admin/settings", icon: SettingsIcon, label: "Store Settings" },
  ]},
];

function AdminLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const logo = useLogo();
  const settings = useSettings();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen bg-blush/20">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col overflow-y-auto border-r border-border/60 bg-background transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-9 w-9 rounded-full ring-1 ring-champagne/50 object-cover" />
            <div>
              <div className="font-display text-lg leading-none tracking-[0.15em]">{settings.store.name}</div>
              <div className="mt-0.5 text-[10px] tracking-widest uppercase text-muted-foreground">
                Admin
              </div>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-2 p-3 pb-24">
          {nav.map((section, si) => (
            <div key={si} className="space-y-1">
              {section.label && (
                <div className="px-3 pt-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </div>
              )}
              {section.items.map((n) => (
                <Link
                  key={n.to}
                  to={n.to as never}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    isActive(n.to, n.exact)
                      ? "bg-rose-gradient text-primary-foreground shadow-soft"
                      : "hover:bg-blush"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <Link
            to="/account"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-blush"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to storefront
          </Link>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-charcoal/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display tracking-[0.15em]">{settings.store.name} Admin</span>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
