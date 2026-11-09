"use client";

import * as React from "react";

import { formatMoney, type BreakdownLine, type InvoiceModel } from "@/lib/booking-invoice";
import { cn } from "@/lib/utils";

function amountText(l: BreakdownLine) {
  if (l.freeWhenZero && l.amount === 0) return "Free";
  return l.amount < 0 ? `−${formatMoney(Math.abs(l.amount))}` : formatMoney(l.amount);
}

/** The itemised price table, used on the booking page and on the printed invoice. */
export function BreakdownTable({ lines, className }: { lines: BreakdownLine[]; className?: string }) {
  return (
    <div className={cn("text-sm", className)}>
      {lines.map((l, i) => {
        if (l.kind === "section") {
          return (
            <div key={i} className="text-muted-foreground mt-4 border-b pb-1 text-[11px] font-semibold tracking-wider uppercase">
              {l.label}
            </div>
          );
        }
        return (
          <div
            key={i}
            className={cn(
              "flex items-start justify-between gap-4 py-1.5",
              l.kind === "subtotal" && "mt-2 border-t pt-2",
              l.kind === "total" && "mt-1 border-t-2 pt-2 text-base font-bold",
              l.kind === "discount" && "text-emerald-700",
            )}
          >
            <div className="min-w-0">
              <div className={cn(!l.kind || l.kind === "charge" ? "" : "font-medium")}>{l.label}</div>
              {l.detail && <div className="text-muted-foreground text-xs break-words">{l.detail}</div>}
            </div>
            <div className={cn("shrink-0 tabular-nums", l.freeWhenZero && l.amount === 0 && "text-muted-foreground")}>{amountText(l)}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Payments received, what is still to pay, and the refundable deposit. */
export function PaymentSummary({ model, className }: { model: InvoiceModel; className?: string }) {
  return (
    <div className={cn("text-sm", className)}>
      <div className="text-muted-foreground border-b pb-1 text-[11px] font-semibold tracking-wider uppercase">Payments</div>
      {model.payments.length === 0 ? (
        <div className="text-muted-foreground py-2 text-xs">No payment received yet.</div>
      ) : (
        model.payments.map((p, i) => (
          <div key={i} className="flex items-start justify-between gap-4 py-1.5">
            <div>
              <div>{p.type === "ADVANCE" ? "Advance" : p.type === "FULL" ? "Full payment" : p.type.charAt(0) + p.type.slice(1).toLowerCase()} · {p.method}</div>
              <div className="text-muted-foreground text-xs">
                {p.status.replace(/_/g, " ")}
                {p.date ? ` · ${new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </div>
            </div>
            <div className="tabular-nums">{formatMoney(p.amount)}</div>
          </div>
        ))
      )}
      <div className="mt-1 flex justify-between border-t pt-2">
        <span className="text-muted-foreground">Total paid</span>
        <span className="tabular-nums">{formatMoney(model.paidTotal)}</span>
      </div>
      <div className="mt-1 flex justify-between text-base font-bold">
        <span>Balance to pay at pickup</span>
        <span className="tabular-nums">{formatMoney(model.balanceDue)}</span>
      </div>
      {model.securityDeposit != null && (
        <div className="text-muted-foreground mt-2 flex justify-between text-xs">
          <span>Refundable security deposit (collected at pickup)</span>
          <span className="tabular-nums">{formatMoney(model.securityDeposit)}</span>
        </div>
      )}
      {model.quotedAtCheckout != null && (
        <div className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          The customer was shown {formatMoney(model.quotedAtCheckout)} at checkout; the saved price snapshot above is {formatMoney(model.grandTotal)}.
        </div>
      )}
    </div>
  );
}
