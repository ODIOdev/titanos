"use client";

import * as React from "react";
import { clampQuantity } from "@/lib/utils";
import type { CartItem, Product } from "@/types";

const CART_STORAGE_KEY = "titan-cart";

export type CartProductSnapshot = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "sku"
  | "price"
  | "compare_at_price"
  | "inventory_quantity"
  | "image_url"
>;

export type CartLineInput = {
  product: CartProductSnapshot;
  quantity?: number;
  variant_id?: string | null;
};

type PersistedCart = {
  items: CartItem[];
  updatedAt: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (input: CartLineInput) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  mergeGuestCart: (serverItems?: CartItem[]) => void;
  subtotal: number;
  itemCount: number;
  isHydrated: boolean;
};

const CartContext = React.createContext<CartContextValue | null>(null);

function lineKey(productId: string, variantId?: string | null) {
  return `${productId}::${variantId ?? "default"}`;
}

function readStoredCart(): PersistedCart {
  if (typeof window === "undefined") {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as PersistedCart;
    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [], updatedAt: new Date().toISOString() };
    }
    return {
      items: parsed.items,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

function writeStoredCart(cart: PersistedCart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function mergeCartItems(guestItems: CartItem[], serverItems: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of serverItems) {
    map.set(lineKey(item.product_id, item.variant_id), { ...item });
  }

  for (const guest of guestItems) {
    const key = lineKey(guest.product_id, guest.variant_id);
    const existing = map.get(key);
    const inventory =
      guest.product?.inventory_quantity ??
      existing?.product?.inventory_quantity ??
      Number.MAX_SAFE_INTEGER;

    if (existing) {
      const quantity = clampQuantity(
        existing.quantity + guest.quantity,
        inventory
      );
      map.set(key, {
        ...existing,
        quantity,
        product: existing.product ?? guest.product,
      });
    } else {
      map.set(key, {
        ...guest,
        quantity: clampQuantity(guest.quantity, inventory),
      });
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = readStoredCart();
    React.startTransition(() => {
      setItems(stored.items);
      setIsHydrated(true);
    });
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStoredCart({ items, updatedAt: new Date().toISOString() });
  }, [items, isHydrated]);

  const addItem = React.useCallback((input: CartLineInput) => {
    const quantityToAdd = input.quantity ?? 1;
    const inventory = input.product.inventory_quantity;

    setItems((prev) => {
      const key = lineKey(input.product.id, input.variant_id);
      const existing = prev.find(
        (item) => lineKey(item.product_id, item.variant_id) === key
      );

      if (existing) {
        const nextQty = clampQuantity(existing.quantity + quantityToAdd, inventory);
        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                quantity: nextQty,
                product: {
                  ...item.product,
                  ...input.product,
                } as Product,
              }
            : item
        );
      }

      const newItem: CartItem = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        product_id: input.product.id,
        variant_id: input.variant_id ?? null,
        quantity: clampQuantity(quantityToAdd, inventory),
        product: input.product as Product,
      };

      return [...prev, newItem];
    });
  }, []);

  const removeItem = React.useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = React.useCallback(
    (itemId: string, quantity: number) => {
      setItems((prev) =>
        prev
          .map((item) => {
            if (item.id !== itemId) return item;
            const inventory =
              item.product?.inventory_quantity ?? Number.MAX_SAFE_INTEGER;
            if (quantity <= 0) return null;
            return {
              ...item,
              quantity: clampQuantity(quantity, inventory),
            };
          })
          .filter(Boolean) as CartItem[]
      );
    },
    []
  );

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  /** Stub merge after login — combines guest localStorage cart with optional server cart. */
  const mergeGuestCart = React.useCallback((serverItems: CartItem[] = []) => {
    setItems((guestItems) => {
      const merged = mergeCartItems(guestItems, serverItems);
      writeStoredCart({ items: merged, updatedAt: new Date().toISOString() });
      return merged;
    });
  }, []);

  const subtotal = React.useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = item.product?.price ?? 0;
        return sum + price * item.quantity;
      }, 0),
    [items]
  );

  const itemCount = React.useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = React.useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      mergeGuestCart,
      subtotal,
      itemCount,
      isHydrated,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      mergeGuestCart,
      subtotal,
      itemCount,
      isHydrated,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
