"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";

import { usePermissions } from "@/hooks/use-roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PermissionsPage() {
  const { data: permissions, isLoading } = usePermissions();

  const grouped = React.useMemo(() => {
    const groups = new Map<string, typeof permissions>();
    for (const p of permissions ?? []) {
      const list = groups.get(p.group) ?? [];
      list.push(p);
      groups.set(p.group, list);
    }
    return groups;
  }, [permissions]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground text-sm">
          Every permission key in the system, grouped by module. Assign these to roles under User Management &gt; Roles.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(grouped.entries()).map(([group, perms]) => (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="text-sm tracking-wide uppercase">{group}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {perms?.map((p) => (
                  <span key={p.id} className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <KeyRound className="size-3.5 shrink-0" /> {p.key}
                  </span>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
