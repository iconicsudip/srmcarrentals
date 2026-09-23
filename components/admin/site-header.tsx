import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { GlobalSearch } from "@/components/admin/global-search";
import { NotificationsDropdown } from "@/components/admin/notifications-dropdown";
import { UserNav } from "@/components/admin/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <AdminBreadcrumbs />

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <NotificationsDropdown />
          <ModeToggle />
          <Separator orientation="vertical" className="h-6" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
