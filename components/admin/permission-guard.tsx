"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { canAccess, ownerOf, visibleNav, type Access } from "@/components/admin/access";
import { Button } from "@/components/ui/button";

/** Shows a "no access" message instead of a page the person's role does not allow (the server refuses the data as well). */
export function PermissionGuard({ access, children }: { access: Access; children: React.ReactNode }) {
  const pathname = usePathname();
  const owner = ownerOf(pathname);

  if (owner && !canAccess(access, owner.permission)) {
    const nav = visibleNav(access);
    const first = nav.dashboard ?? nav.groups[0]?.items[0] ?? null;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <ShieldAlert className="size-10 text-amber-500" />
        <h1 className="text-xl font-semibold">You don&apos;t have access to this page</h1>
        <p className="text-muted-foreground text-sm">Your role does not include &quot;{owner.title}&quot;. Ask an administrator if you need it.</p>
        {first && (
          <Button asChild>
            <Link href={first.href}>Go to {first.title}</Link>
          </Button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
