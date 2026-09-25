"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  Building,
  ClipboardCheck,
  CreditCard,
  Layers,
  Mail,
  MessageCircle,
  MessageSquare,
  Receipt,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  { label: "General", href: "/admin/settings/general", icon: Settings },
  { label: "Available Services", href: "/admin/settings/services", icon: Layers },
  { label: "Company", href: "/admin/settings/company", icon: Building },
  { label: "Checkout Form", href: "/admin/settings/checkout", icon: ClipboardCheck },
  { label: "Tax", href: "/admin/settings/tax", icon: Receipt },
  { label: "Payment", href: "/admin/settings/payment", icon: CreditCard },
  { label: "Email", href: "/admin/settings/email", icon: Mail },
  { label: "SMS", href: "/admin/settings/sms", icon: MessageSquare },
  { label: "WhatsApp", href: "/admin/settings/whatsapp", icon: MessageCircle },
  { label: "Notifications", href: "/admin/settings/notifications", icon: BellRing },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-3 scrollbar-none">
      {SETTINGS_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <tab.icon className="size-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
