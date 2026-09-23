export type ValidationRuleType =
  | "none"
  | "name"
  | "indian_mobile"
  | "email"
  | "indian_dl"
  | "gstin"
  | "flight_no"
  | "regex";

export interface CheckoutFieldConfig {
  id: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  type: "text" | "tel" | "email" | "select" | "textarea" | "checkbox" | "number";
  options?: string[];
  required: boolean;
  enabled: boolean;
  isSystem: boolean;
  validationRule: ValidationRuleType;
  customRegex?: string;
  customErrorMessage?: string;
  category: "personal" | "verification" | "delivery" | "business" | "custom";
}

export interface CheckoutFormSettings {
  allowGuestCheckout: boolean;
  allowLoginToCheckout: boolean;
  requireLicenseConfirmation: boolean;
  requireAgeConfirmation: boolean;
  minimumDriverAge: number;
  requireTermsAgreement: boolean;
  enableGstBilling: boolean;
  fields: CheckoutFieldConfig[];
}

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutFormSettings = {
  allowGuestCheckout: true,
  allowLoginToCheckout: true,
  requireLicenseConfirmation: true,
  requireAgeConfirmation: true,
  minimumDriverAge: 21,
  requireTermsAgreement: true,
  enableGstBilling: true,
  fields: [
    {
      id: "firstName",
      label: "First Name",
      placeholder: "e.g. Rohan",
      helpText: "Primary renter legal first name",
      type: "text",
      required: true,
      enabled: true,
      isSystem: true,
      validationRule: "name",
      category: "personal",
    },
    {
      id: "lastName",
      label: "Last Name",
      placeholder: "e.g. Sharma",
      helpText: "As displayed on Government ID",
      type: "text",
      required: true,
      enabled: true,
      isSystem: true,
      validationRule: "name",
      category: "personal",
    },
    {
      id: "phone",
      label: "WhatsApp Phone Number",
      placeholder: "+91 98765 43210",
      helpText: "Live trip updates and vehicle handover code will be sent here",
      type: "tel",
      required: true,
      enabled: true,
      isSystem: true,
      validationRule: "indian_mobile",
      category: "personal",
    },
    {
      id: "email",
      label: "Email Address (for GST Invoice)",
      placeholder: "rohan@example.com",
      helpText: "Official reservation voucher with tax invoice will be sent here",
      type: "email",
      required: true,
      enabled: true,
      isSystem: true,
      validationRule: "email",
      category: "personal",
    },
    {
      id: "licenseNumber",
      label: "Driving License (LMV) Number",
      placeholder: "e.g. RJ14 20220012345",
      helpText: "Original license must be presented at vehicle pickup",
      type: "text",
      required: false,
      enabled: true,
      isSystem: true,
      validationRule: "indian_dl",
      category: "verification",
    },
    {
      id: "emergencyPhone",
      label: "Alternate Emergency Contact",
      placeholder: "+91 98290 12345",
      helpText: "Family or co-passenger contact in case of emergency",
      type: "tel",
      required: false,
      enabled: true,
      isSystem: true,
      validationRule: "indian_mobile",
      category: "personal",
    },
    {
      id: "flightNumber",
      label: "Flight / Train Number & Arrival Time",
      placeholder: "e.g. 6E-243 arriving Udaipur 11:30 AM",
      helpText: "Delivery staff will track your arrival for seamless terminal handover",
      type: "text",
      required: false,
      enabled: true,
      isSystem: true,
      validationRule: "flight_no",
      category: "delivery",
    },
    {
      id: "deliveryAddress",
      label: "Hotel / Resort / Residence Address",
      placeholder: "e.g. The Oberoi Udaivilas, Haridas Ji Ki Magri, Udaipur",
      helpText: "Required for Doorstep / Hotel delivery",
      type: "text",
      required: false,
      enabled: true,
      isSystem: true,
      validationRule: "none",
      category: "delivery",
    },
    {
      id: "gstNumber",
      label: "Company GSTIN (for B2B Tax Credit)",
      placeholder: "08AAAAA0000A1Z5",
      helpText: "Leave blank if booking as individual / non-business",
      type: "text",
      required: false,
      enabled: true,
      isSystem: true,
      validationRule: "gstin",
      category: "business",
    },
    {
      id: "companyName",
      label: "Company Registered Name",
      placeholder: "e.g. SRM Tech Solutions Pvt Ltd",
      helpText: "Legal business name matching GSTIN",
      type: "text",
      required: false,
      enabled: true,
      isSystem: true,
      validationRule: "none",
      category: "business",
    },
    {
      id: "handoverNotes",
      label: "Handover Notes / Special Requests",
      placeholder: "e.g. Need child booster seat / Late night arrival",
      helpText: "Any special requirements for our operations team",
      type: "textarea",
      required: false,
      enabled: true,
      isSystem: true,
      validationRule: "none",
      category: "custom",
    },
  ],
};

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export function validateIndianMobile(phone: string): { valid: boolean; error?: string } {
  const digits = sanitizePhone(phone);
  // Accept 10 digits or 12 digits (with 91 country code)
  if (digits.length === 10) {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return { valid: false, error: "Must start with 6, 7, 8, or 9" };
    }
    return { valid: true };
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(local)) {
      return { valid: false, error: "Invalid 10-digit mobile number" };
    }
    return { valid: true };
  }
  return { valid: false, error: "Enter a valid 10-digit Indian mobile number" };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: "Email is required" };
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!regex.test(trimmed)) {
    return { valid: false, error: "Enter a valid email address (e.g. name@example.com)" };
  }
  // Common typo check
  if (/@(gamil|gmai|hotmial|yaho)\./i.test(trimmed)) {
    return { valid: false, error: "Check email domain spelling" };
  }
  return { valid: true };
}

export function validateIndianDL(dl: string): { valid: boolean; error?: string } {
  const clean = dl.trim().replace(/[\s-]/g, "").toUpperCase();
  if (clean.length < 10 || clean.length > 20) {
    return { valid: false, error: "DL should be 10–20 alphanumeric characters" };
  }
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{6,16}$/.test(clean)) {
    return { valid: false, error: "Format: State code (RJ) + RTO + Year/Number" };
  }
  return { valid: true };
}

export function validateGSTIN(gst: string): { valid: boolean; error?: string } {
  const clean = gst.trim().toUpperCase();
  if (clean.length !== 15) {
    return { valid: false, error: "GSTIN must be exactly 15 characters" };
  }
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(clean)) {
    return { valid: false, error: "Invalid GSTIN format (e.g. 08AAAAA0000A1Z5)" };
  }
  return { valid: true };
}

export function validateFlightNo(flight: string): { valid: boolean; error?: string } {
  const clean = flight.trim().toUpperCase();
  if (clean.length < 3) {
    return { valid: false, error: "Enter valid flight code (e.g. 6E-243)" };
  }
  return { valid: true };
}

export function validateFieldValue(
  field: CheckoutFieldConfig,
  value: any,
): { valid: boolean; error?: string } {
  const strVal = String(value ?? "").trim();

  // If empty and not required, it's valid
  if (!strVal) {
    if (field.required) {
      return { valid: false, error: `${field.label} is required` };
    }
    return { valid: true };
  }

  switch (field.validationRule) {
    case "name":
      if (strVal.length < 2) return { valid: false, error: "Must be at least 2 characters" };
      if (!/^[A-Za-z\s.'-]+$/.test(strVal)) return { valid: false, error: "Only letters allowed" };
      return { valid: true };

    case "indian_mobile":
      return validateIndianMobile(strVal);

    case "email":
      return validateEmail(strVal);

    case "indian_dl":
      return validateIndianDL(strVal);

    case "gstin":
      return validateGSTIN(strVal);

    case "flight_no":
      return validateFlightNo(strVal);

    case "regex":
      if (field.customRegex) {
        try {
          const reg = new RegExp(field.customRegex);
          if (!reg.test(strVal)) {
            return {
              valid: false,
              error: field.customErrorMessage || "Invalid input format",
            };
          }
        } catch {
          return { valid: true };
        }
      }
      return { valid: true };

    case "none":
    default:
      return { valid: true };
  }
}
