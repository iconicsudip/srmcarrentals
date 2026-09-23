"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function NotificationsDropdown() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && <span className="text-muted-foreground text-xs">{unreadCount} unread</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {isLoading && <p className="text-muted-foreground p-4 text-sm">Loading...</p>}
          {!isLoading && notifications.length === 0 && (
            <p className="text-muted-foreground p-4 text-sm">You&apos;re all caught up.</p>
          )}
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-0.5 whitespace-normal"
              onSelect={(e) => {
                e.preventDefault();
                if (!notification.isRead) markRead.mutate(notification.id);
              }}
            >
              <Link
                href={notification.link ?? "#"}
                className="flex w-full flex-col gap-0.5"
              >
                <span className="flex w-full items-center gap-2 text-sm font-medium">
                  {!notification.isRead && <span className="bg-primary size-1.5 shrink-0 rounded-full" />}
                  {notification.title}
                </span>
                <span className="text-muted-foreground text-xs">{notification.message}</span>
                <span className="text-muted-foreground text-[11px]">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
