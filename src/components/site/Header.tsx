import { Link } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, ShieldCheck, LogIn, LogOut, Package, Info, Phone, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useSettings, useLogo } from "@/lib/site-settings";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchOverlay } from "@/components/site/SearchOverlay";

const nav = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop All", search: {} },
  { to: "/products", label: "Necklaces", search: { category: "necklaces" } },
  { to: "/products", label: "Earrings", search: { category: "earrings" } },
  { to: "/products", label: "Bangles", search: { category: "bangles" } },
  { to: "/products", label: "Rings", search: { category: "rings" } },
  { to: "/products", label: "Handbags", search: { category: "handbags" } },
  { to: "/products", label: "Cosmetics", search: { category: "cosmetics" } },
  { to: "/products", label: "Gifts", search: { category: "gifts" } },
];

export function Header() {
  const { count } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAdmin, signOut } = useAuth();
  const settings = useSettings();
  const logo = useLogo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const brandName = settings.store.name || "VAARAHI";
  const tagline = settings.store.tagline || "Jewellery · Fashion · Accessories";
  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="rounded-full p-2 text-foreground hover:bg-blush lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] max-w-sm overflow-y-auto p-6">
            <div className="mb-6 flex items-center gap-3">
              <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" />
              <span className="font-display text-xl font-semibold tracking-[0.15em]">{brandName}</span>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  search={item.search as never}
                  onClick={close}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-3 h-px bg-border/60" />
              <Link to="/wishlist" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                <>
                  <Heart className="h-4 w-4" />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                      {wishlistCount}
                    </span>
                  )}
                </>
              </Link>
              <Link to="/cart" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                <ShoppingBag className="h-4 w-4" /> Cart {count > 0 && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{count}</span>}
              </Link>
              {user ? (
                <>
                  <Link to="/account" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                    <Package className="h-4 w-4" /> Orders
                  </Link>
                  <Link to="/account" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-blush">
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => { await signOut(); close(); }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-blush"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                  <LogIn className="h-4 w-4" /> Login / Sign up
                </Link>
              )}
              <div className="my-3 h-px bg-border/60" />
              <Link to="/policies/$slug" params={{ slug: "about" }} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                <Info className="h-4 w-4" /> About
              </Link>
              <Link to="/policies/$slug" params={{ slug: "contact" }} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                <Phone className="h-4 w-4" /> Contact
              </Link>
              <Link to="/policies/$slug" params={{ slug: "terms" }} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blush">
                <FileText className="h-4 w-4" /> Policies
              </Link>
            </nav>
          </SheetContent>
        </Sheet>



        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <img
            src={logo}
            alt={brandName}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-champagne/40 sm:h-11 sm:w-11"
          />
          <div className="block min-w-0">
            <div className="truncate font-display text-base font-semibold leading-none tracking-[0.15em] sm:text-2xl">
              {brandName}
            </div>
            <div className="mt-1 hidden text-[10px] tracking-[0.25em] text-muted-foreground uppercase sm:block">
              {tagline}
            </div>
          </div>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 w-full max-w-md items-center rounded-full border border-border bg-blush/40 px-4 text-sm text-muted-foreground transition hover:bg-background hover:ring-2 hover:ring-rose-gold/20"
          >
            <Search className="mr-3 h-4 w-4" />
            Search jewellery, bangles, gifts...
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            className="rounded-full p-2 hover:bg-blush lg:hidden"
            aria-label="Search"
            onClick={() => {
              console.log("Mobile search clicked");
              setSearchOpen(true);
            }}
          >
            <Search className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>
          <Link
            to="/wishlist"
            className="relative inline-flex rounded-full p-2 hover:bg-blush"
            aria-label="Wishlist"
          >
            <Heart className="h-4.5 w-4.5 sm:h-5 sm:w-5" />

            {wishlistCount > 0 && (
              <span className="bg-rose-gradient text-primary-foreground absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold shadow-soft">
                {wishlistCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden rounded-full p-2 text-primary hover:bg-blush sm:inline-flex"
              aria-label="Admin"
              title="Admin panel"
            >
              <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            className="inline-flex rounded-full p-2 hover:bg-blush"
            aria-label={user ? "Account" : "Sign in"}
          >
            <User className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </Link>

          <Link
            to="/cart"
            className="relative rounded-full p-2 transition hover:bg-blush"
            aria-label={`Shopping bag with ${count} items`}
          >
            <ShoppingBag className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            {count > 0 && (
              <span className="bg-rose-gradient text-primary-foreground absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold shadow-soft">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-border/50 bg-blush/30 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-3 text-sm font-medium sm:px-6 lg:px-8">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search as never}
              className="relative text-charcoal/80 transition hover:text-primary [&.active]:text-primary"
              activeOptions={{ exact: item.label === "Home" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </header>
  );
}
