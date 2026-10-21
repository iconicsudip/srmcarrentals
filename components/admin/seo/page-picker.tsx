"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface PickerPage {
  path: string;
  title: string;
  group: string;
}

/** Searchable, grouped page chooser: type a name, URL or group to find a page quickly. */
export function SeoPagePicker({
  pages,
  value,
  onChange,
  disabled,
  loading,
}: {
  pages: PickerPage[];
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = pages.find((p) => p.path === value);

  const groups = React.useMemo(() => {
    const map = new Map<string, PickerPage[]>();
    for (const p of pages) (map.get(p.group) ?? map.set(p.group, []).get(p.group)!).push(p);
    return [...map.entries()];
  }, [pages]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="pagePicker"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="bg-background h-10 w-full justify-between gap-2 font-normal md:w-[520px]"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">{selected.group}</span>
              <span className="truncate font-medium">{selected.title}</span>
              <span className="text-muted-foreground hidden truncate font-mono text-xs sm:inline">{selected.path}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{loading ? "Loading pages…" : "Search a page to optimize…"}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search by name or URL…" />
          <CommandList className="max-h-[380px]">
            <CommandEmpty>No page found.</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group} heading={`${group} (${items.length})`}>
                {items.map((p) => (
                  <CommandItem
                    key={p.path}
                    value={`${p.title} ${p.path} ${p.group}`}
                    onSelect={() => {
                      onChange(p.path);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check className={cn("size-4 shrink-0", p.path === value ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                    <span className="text-muted-foreground max-w-[45%] shrink-0 truncate font-mono text-xs">{p.path}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
