"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CreditCard,
  FileText,
  Percent,
  Undo2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FINANCE_TABS = [
  { label: "Payments", href: "/admin/finance/payments", icon: CreditCard },
  { label: "Razorpay & Smart Links", href: "/admin/finance/razorpay", icon: Zap },
  { label: "Transactions", href: "/admin/finance/transactions", icon: ArrowLeftRight },
  { label: "Refunds", href: "/admin/finance/refunds", icon: Undo2 },
  { label: "Invoices", href: "/admin/finance/invoices", icon: FileText },
  { label: "Taxes", href: "/admin/finance/taxes", icon: Percent },
];

export function FinanceNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-3 scrollbar-none">
      {FINANCE_TABS.map((tab) => {
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
