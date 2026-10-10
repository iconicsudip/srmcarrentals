/**
 * Shared types + defaults for the dynamic chauffeur/taxi booking enquiry form.
 * Both the form configuration and the collected entries are stored in the
 * `Setting` table (keys below), so no DB migration is required.
 */

export const TAXI_FORM_SETTING_KEY = "taxi.enquiry_form";
export const TAXI_ENQUIRIES_SETTING_KEY = "taxi.enquiries";
export const MAX_STORED_ENQUIRIES = 2000;

export type TaxiFieldType = "text" | "tel" | "email" | "number" | "date" | "datetime-local" | "select" | "textarea";

export interface TaxiFormField {
  id: string;
  label: string;
  type: TaxiFieldType;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  /** Only for `select` fields. */
  options?: string[];
  /** Built-in fields can be hidden/edited but not deleted. */
  isSystem?: boolean;
}

export interface TaxiFormConfig {
  title: string;
  subtitle: string;
  submitLabel: string;
  successMessage: string;
  /** After saving, also open WhatsApp with the entry details. */
  openWhatsApp: boolean;
  fields: TaxiFormField[];
}

export const DEFAULT_TAXI_FORM: TaxiFormConfig = {
  title: "Book Your Chauffeur",
  subtitle: "Share your trip details and our team will confirm availability shortly.",
  submitLabel: "Submit Booking Request",
  successMessage: "Thank you! Your request is received. We will call you shortly.",
  openWhatsApp: true,
  fields: [
    { id: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true, enabled: true, isSystem: true },
    { id: "phone", label: "Mobile Number", type: "tel", placeholder: "10-digit mobile number", required: true, enabled: true, isSystem: true },
    { id: "email", label: "Email", type: "email", placeholder: "you@example.com", required: false, enabled: true, isSystem: true },
    { id: "pickupLocation", label: "Pickup Location", type: "text", placeholder: "Pickup address / airport / hotel", required: true, enabled: true, isSystem: true },
    { id: "dropLocation", label: "Drop Location", type: "text", placeholder: "Drop address / destination", required: false, enabled: true, isSystem: true },
    { id: "pickupAt", label: "Pickup Date & Time", type: "datetime-local", required: true, enabled: true, isSystem: true },
    { id: "passengers", label: "Passengers", type: "number", placeholder: "e.g. 4", required: false, enabled: true, isSystem: true },
    { id: "notes", label: "Special Requests", type: "textarea", placeholder: "Luggage, child seat, flight number…", required: false, enabled: true, isSystem: true },
  ],
};

export type TaxiEnquiryStatus = "NEW" | "CONTACTED" | "CONFIRMED" | "CANCELLED";

export interface TaxiEnquiry {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCategory?: string;
  /** field id → value, plus a label snapshot so history survives form edits. */
  values: Record<string, string>;
  labels: Record<string, string>;
  status: TaxiEnquiryStatus;
  createdAt: string;
}

/** Merge a stored config over defaults so new system fields/keys always exist. */
export function normalizeTaxiForm(stored: Partial<TaxiFormConfig> | null | undefined): TaxiFormConfig {
  if (!stored || typeof stored !== "object") return DEFAULT_TAXI_FORM;
  const fields = Array.isArray(stored.fields) && stored.fields.length > 0 ? stored.fields : DEFAULT_TAXI_FORM.fields;
  return { ...DEFAULT_TAXI_FORM, ...stored, fields };
}
