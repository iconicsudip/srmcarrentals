"use client";

import * as React from "react";
import Link from "next/link";
import { CarFront, Menu, Phone, ShoppingBag, UserCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { openCartDrawer, useCart } from "@/lib/cart/cart-store";
import { useCurrentUser } from "@/hooks/use-auth";

const NAV_LINKS = [
  { label: "Self Drive", href: "/cars" },
  { label: "Taxi", href: "/car-rental" },
  { label: "Tours", href: "/tours" },
  { label: "About", href: "/about-us" },
  { label: "T&C", href: "/terms-and-conditions" },
  { label: "Contact", href: "/contact-us" },
];

export function SiteHeader({ companyName, phone }: { companyName: string; phone: string }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { count } = useCart();
  const { data: user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
            <CarFront className="size-5" />
          </span>
          <span className="text-lg font-black tracking-tight text-white">
            {companyName.split(" ")[0]?.toUpperCase()}
            <span className="ml-1.5 text-xs font-medium tracking-widest text-white/50">
              {companyName.split(" ").slice(1).join(" ").toUpperCase()}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-semibold tracking-widest text-white/70 transition-colors hover:text-white"
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-white/80 mr-1">
              <Phone className="size-4 text-orange-500" />
              {phone}
            </a>
          )}

          {user && (
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <UserCheck className="size-3" />
              </span>
              <span className="font-semibold text-white/90">{user.firstName}</span>
            </div>
          )}

          {/* Cart Icon Button */}
          <button
            type="button"
            onClick={openCartDrawer}
            aria-label="View shopping cart"
            className="relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/90 transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 active:scale-95"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-black text-white shadow-md shadow-orange-500/50 animate-in zoom-in">
                {count}
              </span>
            )}
          </button>

          <Button asChild className="bg-orange-500 font-semibold text-white hover:bg-orange-600">
            <Link href="/cars">Book Now →</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {/* Mobile Cart Button */}
          <button
            type="button"
            onClick={openCartDrawer}
            aria-label="View shopping cart"
            className="relative flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90"
          >
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="text-white p-1"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-white/10 lg:hidden", mobileOpen ? "block" : "hidden")}>
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="mt-2 bg-orange-500 font-semibold text-white hover:bg-orange-600">
            <Link href="/cars">Book Now</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
