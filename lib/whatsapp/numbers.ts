import { getSetting } from "@/modules/settings/settings.service";
import { getCompanyContent } from "@/modules/website/public-content.service";
import { digitsOnly, toWaNumber, type WhatsAppNumbers } from "@/lib/whatsapp/pick";

export const WHATSAPP_SETTING_KEY = "system.whatsapp";

interface WhatsAppSetting {
  businessPhoneNumber?: string;
  cityNumbers?: { city?: string; number?: string }[];
}

/** Public-safe view of the WhatsApp routing config (never exposes API tokens). */
export async function getWhatsAppNumbers(): Promise<WhatsAppNumbers> {
  const [setting, company] = await Promise.all([getSetting<WhatsAppSetting>(WHATSAPP_SETTING_KEY), getCompanyContent()]);
  const fallback = toWaNumber(setting?.businessPhoneNumber) || toWaNumber(company.phone);
  const cities = (setting?.cityNumbers ?? [])
    .map((c) => ({ city: (c.city ?? "").trim(), number: digitsOnly(c.number) }))
    .filter((c) => c.city && c.number);
  return { defaultNumber: fallback, cities };
}
