"use client";

import Link from "next/link";
import {
  Car,
  CarFront,
  ClipboardList,
  Hourglass,
  IndianRupee,
  PlusCircle,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { useDashboardOverview } from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

const STATS = [
  {
    key: "totalBookings" as const,
    label: "Total Bookings",
    icon: ClipboardList,
    format: (v: number) => v,
    tint: "bg-primary/10 text-primary",
  },
  {
    key: "activeRentals" as const,
    label: "Active Rentals",
    icon: Wallet,
    format: (v: number) => v,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "pendingBookings" as const,
    label: "Pending Bookings",
    icon: Hourglass,
    format: (v: number) => v,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "revenueThisMonth" as const,
    label: "Revenue (This Month)",
    icon: IndianRupee,
    format: formatInr,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "totalCars" as const,
    label: "Total Cars",
    icon: Car,
    format: (v: number) => v,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    key: "activeCars" as const,
    label: "Active Cars",
    icon: CarFront,
    format: (v: number) => v,
    tint: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    key: "totalCustomers" as const,
    label: "Customers",
    icon: UserRound,
    format: (v: number) => v,
    tint: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    key: "totalDrivers" as const,
    label: "Drivers",
    icon: Users,
    format: (v: number) => v,
    tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
];

const QUICK_ACTIONS = [
  { label: "New Booking", href: "/admin/bookings", icon: ClipboardList },
  { label: "Add Car", href: "/admin/cars/new", icon: Car },
  { label: "Customers", href: "/admin/customers", icon: UserRound },
  { label: "Booking Calendar", href: "/admin/bookings/calendar", icon: Hourglass },
];

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboardOverview();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your car rental operations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button key={action.href} variant="outline" size="sm" asChild>
              <Link href={action.href}>
                <action.icon className="size-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.key} className="gap-3 py-5">
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-5">
              <CardTitle className="text-muted-foreground text-sm font-medium">{stat.label}</CardTitle>
              <div className={cn("flex size-9 items-center justify-center rounded-lg", stat.tint)}>
                <stat.icon className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent className="px-5">
              {isLoading || !data ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold tracking-tight">{stat.format(data[stat.key])}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          <PlusCircle className="text-muted-foreground/60 size-6" />
          Booking trends and recent activity charts land here as more data comes in.
        </CardContent>
      </Card>
    </div>
  );
}
