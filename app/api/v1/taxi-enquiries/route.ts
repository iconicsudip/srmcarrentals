import { requirePermission } from "@/lib/auth/rbac";
import { BadRequestError } from "@/lib/http/errors";
import { created, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSetting, setSetting } from "@/modules/settings/settings.service";
import {
  MAX_STORED_ENQUIRIES,
  TAXI_ENQUIRIES_SETTING_KEY,
  TAXI_FORM_SETTING_KEY,
  normalizeTaxiForm,
  type TaxiEnquiry,
  type TaxiFormConfig,
} from "@/lib/taxi-enquiry/form";

/** Admin: list collected enquiries. */
export const GET = withErrorHandling(async () => {
  await requirePermission("settings.manage");
  const rows = await getSetting<TaxiEnquiry[]>(TAXI_ENQUIRIES_SETTING_KEY);
  return ok(Array.isArray(rows) ? rows : []);
});

/** Public: submit an enquiry. Validated against the admin-managed form config. */
export const POST = withErrorHandling(async (req) => {
  const body = (await req.json()) as {
    serviceId?: string;
    serviceName?: string;
    serviceCategory?: string;
    values?: Record<string, unknown>;
  };

  if (!body?.serviceId || !body.serviceName || typeof body.values !== "object" || body.values === null) {
    throw new BadRequestError("Invalid enquiry payload");
  }

  const config: TaxiFormConfig = normalizeTaxiForm(await getSetting<TaxiFormConfig>(TAXI_FORM_SETTING_KEY));
  const values: Record<string, string> = {};
  const labels: Record<string, string> = {};

  for (const field of config.fields) {
    if (!field.enabled) continue;
    const raw = body.values[field.id];
    const value = typeof raw === "string" || typeof raw === "number" ? String(raw).trim().slice(0, 1000) : "";

    if (field.required && !value) {
      throw new BadRequestError(`${field.label} is required`);
    }
    if (value && field.type === "tel" && !/^[+()\-\s\d]{7,18}$/.test(value)) {
      throw new BadRequestError(`${field.label} is not a valid phone number`);
    }
    if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new BadRequestError(`${field.label} is not a valid email`);
    }
    if (value && field.type === "select" && field.options?.length && !field.options.includes(value)) {
      throw new BadRequestError(`${field.label} has an invalid option`);
    }
    if (value) {
      values[field.id] = value;
      labels[field.id] = field.label;
    }
  }

  const enquiry: TaxiEnquiry = {
    id: `enq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    serviceId: String(body.serviceId).slice(0, 100),
    serviceName: String(body.serviceName).slice(0, 200),
    serviceCategory: body.serviceCategory ? String(body.serviceCategory).slice(0, 100) : undefined,
    values,
    labels,
    status: "NEW",
    createdAt: new Date().toISOString(),
  };

  const existing = await getSetting<TaxiEnquiry[]>(TAXI_ENQUIRIES_SETTING_KEY);
  const next = [enquiry, ...(Array.isArray(existing) ? existing : [])].slice(0, MAX_STORED_ENQUIRIES);
  await setSetting(TAXI_ENQUIRIES_SETTING_KEY, next);

  return created({ id: enquiry.id });
});
