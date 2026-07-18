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
        <div className="flex min-w-max gap-8 px-4 py-5 sm:justify-between sm:px-6 lg:px-8">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex min-w-[220px] items-center gap-3"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-rose-gradient text-primary-foreground shadow-soft">
                <item.Icon className="h-5 w-5" />
              </div>

              <div>
                <h4 className="font-serif text-lg font-medium">
                  {item.title}
                </h4>

                <p className="text-sm text-muted-foreground">
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