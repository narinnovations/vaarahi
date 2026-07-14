import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  component: InventoryLayout,
});

const tabs = [
  { to: "/admin/inventory", label: "Dashboard", exact: true },
  { to: "/admin/inventory/products", label: "Stock list" },
  { to: "/admin/inventory/low-stock", label: "Low stock" },
  { to: "/admin/inventory/history", label: "Stock history" },
  { to: "/admin/inventory/adjust", label: "Adjust stock" },
  { to: "/admin/inventory/suppliers", label: "Suppliers" },
  { to: "/admin/inventory/purchases", label: "Purchases" },
];

function InventoryLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");
          return (
            <Link
              key={t.to}
              to={t.to as never}
              className={`rounded-full px-4 py-1.5 text-xs transition ${
                active ? "bg-rose-gradient text-primary-foreground shadow-soft" : "border hover:bg-blush"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
