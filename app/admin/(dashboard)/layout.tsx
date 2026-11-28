import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { PermissionGuard } from "@/components/admin/permission-guard";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SiteHeader } from "@/components/admin/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const access = { role: session.role, permissions: session.permissions };

  return (
    <SidebarProvider>
      <AppSidebar access={access} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6"><PermissionGuard access={access}>{children}</PermissionGuard></div>
      </SidebarInset>
    </SidebarProvider>
  );
}
