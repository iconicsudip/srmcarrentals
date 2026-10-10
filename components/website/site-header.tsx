"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, ShoppingBag, UserCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { openCartDrawer, useCart } from "@/lib/cart/cart-store";
import { useCurrentUser } from "@/hooks/use-auth";
import type { AvailableServicesConfig, SiteText } from "@/modules/settings/site-content.schemas";

export function SiteHeader({
  companyName,
  phone,
  services = { cars: true, taxi: true, tours: true },
  text,
}: {
  companyName: string;
  phone: string;
  services?: AvailableServicesConfig;
  text: SiteText["header"];
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));
  const { data: user } = useCurrentUser();

  const filteredNavLinks = React.useMemo(() => {
    return [
      services.cars ? { label: text.navSelfDrive, href: "/cars" } : null,
      services.taxi ? { label: text.navTaxi, href: "/car-rental" } : null,
      services.tours ? { label: text.navTours, href: "/tours" } : null,
      { label: text.navBlog, href: "/blog" },
      { label: text.navAbout, href: "/about-us" },
      { label: text.navContact, href: "/contact-us" },
    ].filter(Boolean) as { label: string; href: string }[];
  }, [services, text]);

  const bookNowHref = services.cars ? "/cars" : services.taxi ? "/car-rental" : "/tours";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-neutral-950/85 text-white backdrop-blur-xl transition-shadow duration-300",
        scrolled ? "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]" : "shadow-none",
      )}
    >
      {/* Gold hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
      <div className={cn("mx-auto flex max-w-[1520px] items-center justify-between px-4 transition-[height] duration-300 sm:px-6 lg:px-8", scrolled ? "h-16" : "h-20")}>
        <Link
          href="/"
          aria-label={`${companyName} — home`}
          className="flex items-center rounded-xl bg-white px-2.5 py-1 shadow-lg shadow-black/30 ring-1 ring-amber-300/60 transition-transform duration-300 hover:scale-[1.03]"
        >
          <Image
            src="/images/srm-logo.webp"
            alt={companyName}
            width={477}
            height={199}
            priority
            className={cn("w-auto transition-[height] duration-300", scrolled ? "h-9" : "h-11")}
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
          {filteredNavLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-[11px] font-bold tracking-widest transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label.toUpperCase()}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              aria-label={`Call ${phone}`}
              title={`Call ${phone}`}
              className="group flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-amber-300 transition hover:border-amber-400 hover:bg-amber-400 hover:text-neutral-950"
            >
              <Phone className="size-4" />
            </a>
          )}

          {user && (
            <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                <UserCheck className="size-3" />
              </span>
              <span className="font-semibold text-white">{user.firstName}</span>
            </div>
          )}

          {/* Cart Icon Button */}
          <button
            type="button"
            onClick={openCartDrawer}
            aria-label="View shopping cart"
            className="relative flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-all hover:border-amber-400/60 hover:bg-white/10 hover:text-amber-300 active:scale-95"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-black text-white shadow-md shadow-orange-500/50 animate-in zoom-in">
                {count}
              </span>
            )}
          </button>

          <Button asChild className="shimmer-sheen relative overflow-hidden rounded-full bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 px-5 font-bold text-white shadow-lg shadow-orange-500/30 transition hover:from-orange-600 hover:to-amber-600">
            <Link href={bookNowHref}>{text.bookNowLabel} →</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {/* Mobile Cart Button */}
          <button
            type="button"
            onClick={openCartDrawer}
            aria-label="View shopping cart"
            className="relative flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white"
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
            className="p-1 text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-white/10 bg-neutral-950/95 backdrop-blur-xl lg:hidden", mobileOpen ? "block" : "hidden")}>
        <nav className="flex flex-col gap-1 px-4 py-3">
          {filteredNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn("rounded-lg px-3 py-2.5 text-sm font-semibold transition", isActive(link.href) ? "bg-orange-500/15 text-amber-300" : "text-white/80 hover:bg-white/10 hover:text-white")}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="mt-2 bg-gradient-to-r from-orange-500 to-amber-500 font-bold text-white hover:from-orange-600 hover:to-amber-600">
            <Link href={bookNowHref}>{text.bookNowLabel}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
