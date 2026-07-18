import { Award, Gem, Sparkles, Truck } from "lucide-react";

const ITEMS = [
  {
    Icon: Gem,
    title: "Handcrafted",
    subtitle: "In small batches",
  },
  {
    Icon: Award,
    title: "BIS Hallmark",
    subtitle: "Where applicable",
  },
  {
    Icon: Truck,
    title: "Free Shipping",
    subtitle: "Orders above ₹999",
  },
  {
    Icon: Sparkles,
    title: "Easy Returns",
    subtitle: "7-day happiness",
  },
];

export function TrustStrip() {
  return (
    <section className="border-b border-border/60 bg-blush/40">
      <div className="mx-auto max-w-7xl overflow-x-auto">
        <div className="grid grid-cols-4 gap-2 px-3 py-4">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-2"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-gradient text-primary-foreground shadow-soft">
                <item.Icon className="h-5 w-5" />
              </div>

              <div>
                <h4 className="font-serif text-sm font-medium leading-tight">
                  {item.title}
                </h4>

                <p className="text-[10px] leading-tight text-muted-foreground">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}