"use client";

import * as React from "react";
import { use } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { useBooking } from "@/hooks/use-bookings";
import { buildInvoiceModel } from "@/lib/booking-invoice";
import { BreakdownTable, PaymentSummary } from "@/components/admin/bookings/price-breakdown";
import { Button } from "@/components/ui/button";

interface Company {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

const dt = (v: string) => new Date(v).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Printable invoice. "Download PDF" opens the print dialog — choose "Save as PDF". */
export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: booking, isLoading, error } = useBooking(id);
  const [company, setCompany] = React.useState<Company>({ name: "SRM Car Rentals" });

  React.useEffect(() => {
    apiFetch<Company>("/settings/homepage.company", { skipAuthRedirect: true }).then(setCompany).catch(() => {});
  }, []);

  const model = booking ? buildInvoiceModel(booking) : null;

  React.useEffect(() => {
    if (model) document.title = model.invoiceNumber; // becomes the PDF file name
  }, [model]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center">
        <Loader2 className="text-primary mr-2 size-5 animate-spin" /> Loading invoice…
      </div>
    );
  }
  if (error || !model) {
    return <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">Could not load this booking. Please sign in to the admin and try again.</div>;
  }

  return (
    <div className="min-h-svh bg-neutral-100 py-6 print:bg-white print:py-0">
      <style>{`@media print { @page { size: A4; margin: 14mm; } .no-print { display: none !important; } body { background: #fff !important; } }`}</style>

      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between px-4">
        <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? window.history.back() : window.close())}>
          <ArrowLeft className="mr-1.5 size-4" /> Back
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Download className="mr-1.5 size-4" /> Download PDF
        </Button>
      </div>

      <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between gap-6 border-b pb-5">
          <div>
            <div className="text-xl font-black tracking-tight">{company.name}</div>
            {company.address && <div className="text-muted-foreground mt-1 max-w-xs text-xs">{company.address}</div>}
            <div className="text-muted-foreground mt-1 text-xs">{[company.phone, company.email].filter(Boolean).join(" · ")}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black tracking-tight text-orange-600">INVOICE</div>
            <div className="mt-1 text-xs">
              <div className="font-semibold">{model.invoiceNumber}</div>
              <div className="text-muted-foreground">Date: {new Date(model.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div className="text-muted-foreground">Status: {model.status.replace(/_/g, " ")}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b py-5 text-xs sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">Billed to</div>
            <div className="text-sm font-semibold">{model.customer.name}</div>
            <div className="text-muted-foreground">{model.customer.phone}</div>
            <div className="text-muted-foreground">{model.customer.email}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">Trip</div>
            <div className="text-sm font-semibold">{model.car}</div>
            <div className="text-muted-foreground">
              Pickup: {dt(model.pickup.when)} — {model.pickup.place}
            </div>
            <div className="text-muted-foreground">
              Drop: {dt(model.drop.when)} — {model.drop.place}
            </div>
            {model.duration && <div className="text-muted-foreground">Duration: {model.duration}</div>}
            {model.airportService && <div className="text-muted-foreground">Airport service: {model.airportService}</div>}
          </div>
        </div>

        <div className="py-5">
          <div className="mb-1 text-sm font-bold tracking-tight">Invoice breakdown</div>
          <BreakdownTable lines={model.lines} />
        </div>
        <div className="border-t py-5">
          <div className="mb-1 text-sm font-bold tracking-tight">Payment breakdown</div>
          <PaymentSummary model={model} />
        </div>

        <div className="text-muted-foreground border-t pt-4 text-center text-[11px]">
          Booking reference {model.reference}. Thank you for choosing {company.name}.
        </div>
      </div>
    </div>
  );
}
