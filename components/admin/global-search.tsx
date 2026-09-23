"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { DASHBOARD_ITEM, NAV_GROUPS } from "@/components/admin/nav-config";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

/** Global "⌘K" search over the admin nav tree. Swap the static nav search
 * for a real cross-entity search (cars, bookings, customers...) by widening
 * this to call an API route once search endpoints exist. */
export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground relative h-8 w-full justify-start gap-2 sm:w-56 md:w-72"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search anything...</span>
        <span className="sm:hidden">Search</span>
        <CommandShortcut className="hidden sm:inline">⌘K</CommandShortcut>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Global Search" description="Jump to any admin page">
        <CommandInput placeholder="Type a page name..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="General">
            <CommandItem onSelect={() => runCommand(() => router.push(DASHBOARD_ITEM.href))}>
              <DASHBOARD_ITEM.icon />
              <span>{DASHBOARD_ITEM.title}</span>
            </CommandItem>
          </CommandGroup>
          {NAV_GROUPS.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem key={item.href} onSelect={() => runCommand(() => router.push(item.href))}>
                  <item.icon />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
