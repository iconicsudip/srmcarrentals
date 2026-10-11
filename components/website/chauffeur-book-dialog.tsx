"use client";

import * as React from "react";
import { CheckCircle2, Loader2, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { DateTimePicker } from "@/components/website/datetime-picker";
import {
  DEFAULT_TAXI_FORM,
  TAXI_FORM_SETTING_KEY,
  normalizeTaxiForm,
  type TaxiFormConfig,
  type TaxiFormField,
} from "@/lib/taxi-enquiry/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface TaxiBookingTarget {
  id: string;
  name: string;
  category: string;
  capacity: string;
  startingPrice: number;
  pricingUnit: "PER_TRIP" | "PER_KM";
}

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

const pad2 = (n: number) => String(n).padStart(2, "0");
function nowSlot(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TaxiFormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const common = {
    id: `taxi-field-${field.id}`,
    name: field.id,
    required: field.required,
    placeholder: field.placeholder,
    value,
    className: inputClass,
  };

  if (field.type === "textarea") {
    return <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "datetime-local" || field.type === "date") {
    return (
      <DateTimePicker
        label=""
        value={value}
        onChange={(val) => onChange(field.type === "date" ? val.slice(0, 10) : val)}
        minDateTime={nowSlot()}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select {...common} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return <input {...common} type={field.type} onChange={(e) => onChange(e.target.value)} />;
}

export function TaxiBookingDialog({
  service,
  phone,
  open,
  onOpenChange,
}: {
  service: TaxiBookingTarget;
  phone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [config, setConfig] = React.useState<TaxiFormConfig>(DEFAULT_TAXI_FORM);
  const [loadingConfig, setLoadingConfig] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDone(false);
    let cancelled = false;
    setLoadingConfig(true);
    apiFetch<TaxiFormConfig>(`/settings/${TAXI_FORM_SETTING_KEY}`, { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled) setConfig(normalizeTaxiForm(data));
      })
      .catch(() => {
        if (!cancelled) setConfig(DEFAULT_TAXI_FORM);
      })
      .finally(() => {
        if (!cancelled) setLoadingConfig(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const fields = config.fields.filter((f) => f.enabled);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiFetch("/taxi-enquiries", {
        method: "POST",
        body: {
          serviceId: service.id,
          serviceName: service.name,
          serviceCategory: service.category,
          values,
        },
      });

      setDone(true);
      toast.success(config.successMessage);

      if (config.openWhatsApp) {
        const number = phone.replace(/[^0-9]/g, "");
        const lines = fields
          .filter((f) => values[f.id])
          .map((f) => `• *${f.label}*: ${values[f.id]}`)
          .join("\n");
        const msg = encodeURIComponent(
          `Hello SRM Car Rentals! 👋\n\nI want to book a chauffeur taxi:\n\n` +
            `• *Service*: ${service.name} (${service.category})\n` +
            `• *Capacity*: ${service.capacity}\n` +
            `• *Starting Tariff*: ₹${service.startingPrice.toLocaleString("en-IN")} / ${
              service.pricingUnit === "PER_KM" ? "km" : "trip"
            }\n${lines ? `\n${lines}\n` : ""}\nPlease confirm availability!`,
        );
        window.open(`https://wa.me/${number}?text=${msg}`, "_blank", "noopener,noreferrer");
      }
      setValues({});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          // The calendar is portaled to <body>; don't treat taps inside it as "outside the dialog".
          if ((e.target as HTMLElement | null)?.closest?.("[data-picker-portal]")) e.preventDefault();
        }}
        className="max-h-[92vh] overflow-y-auto border-neutral-200 bg-white text-neutral-900 sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-neutral-950">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-neutral-500">{config.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50/50 px-4 py-3 text-sm">
          <div className="font-black text-neutral-950">{service.name}</div>
          <div className="text-xs text-neutral-500">
            {service.category} · {service.capacity} · from ₹{service.startingPrice.toLocaleString("en-IN")} /{" "}
            {service.pricingUnit === "PER_KM" ? "km" : "trip"}
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-12 text-emerald-500" />
            <p className="max-w-sm text-sm font-semibold text-neutral-800">{config.successMessage}</p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-2 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : loadingConfig ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
            <Loader2 className="mr-2 size-4 animate-spin text-orange-500" /> Loading form…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.id}
                className={field.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                <label
                  htmlFor={`taxi-field-${field.id}`}
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-600"
                >
                  {field.label}
                  {field.required && <span className="text-orange-600"> *</span>}
                </label>
                <FieldInput
                  field={field}
                  value={values[field.id] ?? ""}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <MessageSquare className="size-4" /> {config.submitLabel}
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Call Now / Book Now / WhatsApp actions for one chauffeur service. */
export function ChauffeurBookButton({ service, phone }: { service: TaxiBookingTarget; phone: string }) {
  const [open, setOpen] = React.useState(false);
  const digits = phone.replace(/[^0-9]/g, "");
  const waMsg = encodeURIComponent(
    `Hello SRM Car Rentals! 👋\n\nI'm interested in booking a chauffeur taxi:\n\n` +
      `• *Service*: ${service.name} (${service.category})\n` +
      `• *Capacity*: ${service.capacity}\n` +
      `• *Starting Tariff*: ₹${service.startingPrice.toLocaleString("en-IN")} / ${
        service.pricingUnit === "PER_KM" ? "km" : "trip"
      }\n\nPlease share availability & details.`,
  );
  const base =
    "flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-[11px] font-black uppercase tracking-wider text-white shadow-lg transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap";

  return (
    <>
      <div className="flex w-full flex-wrap gap-2">
        <a
          href={`tel:+${digits}`}
          className={`${base} border border-white/25 bg-white/15 backdrop-blur-md hover:bg-white/25`}
        >
          <Phone className="size-4" />
          <span>Call Now</span>
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${base} bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700`}
        >
          <MessageSquare className="size-4" />
          <span>Book Now</span>
        </button>
        <a
          href={`https://wa.me/${digits}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} bg-[#25D366] shadow-emerald-500/25 hover:bg-[#1ebe5a]`}
        >
          <MessageCircle className="size-4" />
          <span>WhatsApp</span>
        </a>
      </div>
      <TaxiBookingDialog service={service} phone={phone} open={open} onOpenChange={setOpen} />
    </>
  );
}
