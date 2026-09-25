"use client";

import * as React from "react";

export interface CartItem {
  id: string;
  carId: string;
  carName: string;
  carSlug?: string;
  carImage?: string;
  rentalMode: "DAILY" | "HOURLY";
  dailyPrice: number;
  hourlyPrice?: number | null;
  pickup: string;
  drop: string;
  durationText: string;
  durationHours: number;
  durationDays: number;
  deliveryType: "BRANCH" | "AIRPORT" | "DOORSTEP";
  locationName?: string;
  pickupLocationId?: string;
  dropLocationId?: string;
  pickupAirportId?: string;
  dropAirportId?: string;
  insurance?: { id: string; name: string; price: number } | null;
  extraServices: { id: string; name: string; price: number }[];
  couponCode?: string;
  discount: number;
  basePrice: number;
  tax: number;
  total: number;
  createdAt: number;
}

const STORAGE_KEY = "srm_cart_items";
const EVENT_NAME = "srm_cart_updated";
const OPEN_DRAWER_EVENT = "srm_cart_open_drawer";

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    // Strip out stale/malformed items (missing total, NaN total, or unparseable dates)
    return parsed.filter(
      (item) =>
        item &&
        typeof item.carId === "string" &&
        typeof item.total === "number" &&
        Number.isFinite(item.total) &&
        !isNaN(new Date(item.pickup).getTime()) &&
        !isNaN(new Date(item.drop).getTime()),
    );
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (err) {
    console.error("Failed to save cart items to localStorage", err);
  }
}

export function addToCart(item: Omit<CartItem, "id" | "createdAt">): CartItem {
  const current = getCartItems();
  // Sanitize: ensure total is always a finite number
  const safeTotal = Number.isFinite(item.total) ? item.total : 0;
  const newItem: CartItem = {
    ...item,
    total: safeTotal,
    id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  // Append item to cart (or replace if exact car + dates already exists)
  const filtered = current.filter(
    (c) => !(c.carId === item.carId && c.pickup === item.pickup && c.drop === item.drop),
  );
  saveCartItems([...filtered, newItem]);
  openCartDrawer();
  return newItem;
}

export function removeFromCart(id: string): void {
  const current = getCartItems();
  saveCartItems(current.filter((c) => c.id !== id));
}

export function clearCart(): void {
  saveCartItems([]);
}

export function openCartDrawer(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_DRAWER_EVENT));
}

export function useCart() {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    setItems(getCartItems());

    const handleUpdate = () => {
      setItems(getCartItems());
    };

    const handleOpen = () => {
      setIsDrawerOpen(true);
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener(OPEN_DRAWER_EVENT, handleOpen);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener(OPEN_DRAWER_EVENT, handleOpen);
    };
  }, []);

  const total = React.useMemo(
    () => items.reduce((sum, item) => sum + (item.total ?? 0), 0),
    [items],
  );
  const count = items.length;

  return {
    items,
    count,
    total,
    isDrawerOpen,
    openCart: () => setIsDrawerOpen(true),
    closeCart: () => setIsDrawerOpen(false),
    addItem: addToCart,
    removeItem: removeFromCart,
    clear: clearCart,
  };
}
