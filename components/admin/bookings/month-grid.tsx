"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface MonthGridProps {
  year: number;
  month: number; // 0-indexed
  onNavigate: (year: number, month: number) => void;
  renderDay: (date: Date) => React.ReactNode;
}

/** Generic month-grid calendar shell — Booking Calendar and Availability
 * Calendar both render their own per-day content into this frame. */
export function MonthGrid({ year, month, onNavigate, renderDay }: MonthGridProps) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    onNavigate(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  }
  function nextMonth() {
    onNavigate(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <h2 className="text-lg font-semibold">
          {firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-center text-xs font-medium">
          {WEEKDAYS.map((d) => (
            <div key={d} className="bg-muted text-muted-foreground py-2">
              {d}
            </div>
          ))}
          {cells.map((date, i) => (
            <div key={i} className="bg-card min-h-24 p-1.5 text-left">
              {date && (
                <>
                  <div className="text-muted-foreground mb-1 text-xs">{date.getDate()}</div>
                  {renderDay(date)}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
