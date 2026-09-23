"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { DASHBOARD_ITEM, NAV_GROUPS, type NavLeaf } from "@/components/admin/nav-config";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Crumb {
  label: string;
  href?: string;
}

function humanize(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Best-effort breadcrumb trail: exact matches against the sidebar nav config
 * for known routes, falling back to humanized path segments for dynamic
 * routes (e.g. /admin/cars/[id]/edit) that aren't in the static nav tree. */
function buildTrail(pathname: string): Crumb[] {
  if (pathname === DASHBOARD_ITEM.href) {
    return [{ label: "Dashboard" }];
  }

  const allLeaves: (NavLeaf & { group: string })[] = NAV_GROUPS.flatMap((g) =>
    g.items.map((item) => ({ ...item, group: g.label })),
  );

  const exact = allLeaves.find((leaf) => leaf.href === pathname);
  if (exact) {
    return [
      { label: "Dashboard", href: DASHBOARD_ITEM.href },
      { label: exact.group },
      { label: exact.title },
    ];
  }

  // Longest-prefix match, e.g. /admin/cars/123/edit under /admin/cars
  const prefixMatch = allLeaves
    .filter((leaf) => pathname.startsWith(leaf.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);

  if (prefixMatch) {
    const remaining = pathname.slice(prefixMatch.href.length).split("/").filter(Boolean);
    return [
      { label: "Dashboard", href: DASHBOARD_ITEM.href },
      { label: prefixMatch.group },
      { label: prefixMatch.title, href: remaining.length ? prefixMatch.href : undefined },
      ...remaining.map((seg) => ({ label: humanize(seg) })),
    ];
  }

  return [
    { label: "Dashboard", href: DASHBOARD_ITEM.href },
    ...segments.map((seg) => ({ label: humanize(seg) })),
  ];
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const trail = React.useMemo(() => buildTrail(pathname), [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
