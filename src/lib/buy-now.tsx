import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BuyNowItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type BuyNowContextValue = {
  item: BuyNowItem | null;
  setItem: (item: BuyNowItem) => void;
  clear: () => void;
};

const BuyNowContext =
  createContext<BuyNowContextValue | null>(null);

export function BuyNowProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [item, setItem] = useState<BuyNowItem | null>(null);

  const value = useMemo(
    () => ({
      item,
      setItem,
      clear: () => setItem(null),
    }),
    [item],
  );

  return (
    <BuyNowContext.Provider value={value}>
      {children}
    </BuyNowContext.Provider>
  );
}

export function useBuyNow() {
  const ctx = useContext(BuyNowContext);

  if (!ctx) {
    return {
      item: null,
      setItem: () => {},
      clear: () => {},
    };
  }

  return ctx;
}