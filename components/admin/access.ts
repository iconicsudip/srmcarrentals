import { DASHBOARD_ITEM, NAV_GROUPS, type NavGroup, type NavLeaf } from "@/components/admin/nav-config";

export interface Access {
  role: string;
  permissions: string[];
}

/** Super admins can do everything; everyone else needs the permission their role was given. */
export function canAccess(access: Access, permission?: string): boolean {
  return !permission || access.role === "SUPER_ADMIN" || access.permissions.includes(permission);
}

/** The menu a person actually gets: only the screens their role allows, and no empty groups. */
export function visibleNav(access: Access): { dashboard: NavLeaf | null; groups: NavGroup[] } {
  return {
    dashboard: canAccess(access, DASHBOARD_ITEM.permission) ? DASHBOARD_ITEM : null,
    groups: NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(access, i.permission)) })).filter((g) => g.items.length > 0),
  };
}

/** The menu entry that owns a page address (the longest matching one), so its permission can be checked. */
export function ownerOf(pathname: string): NavLeaf | null {
  const all = [DASHBOARD_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];
  const hits = all.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return hits.sort((a, b) => b.href.length - a.href.length)[0] ?? null;
}
