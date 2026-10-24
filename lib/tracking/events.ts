"use client";

/** Fire a marketing event on the visitor's browser (Meta Pixel + Google Analytics) when those tags are on the page. */
type Win = Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  __srmTracking?: { pixelEvents?: Record<string, boolean> };
};

type PixelEvent = "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | "Contact";

const FLAG: Record<PixelEvent, string> = {
  ViewContent: "viewContent",
  AddToCart: "addToCart",
  InitiateCheckout: "initiateCheckout",
  Purchase: "purchase",
  Contact: "contact",
};

const GA_NAME: Record<PixelEvent, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
  Contact: "generate_lead",
};

export function trackEvent(event: PixelEvent, params: { value?: number; currency?: string; contentName?: string; contentId?: string; transactionId?: string } = {}) {
  if (typeof window === "undefined") return;
  const w = window as Win;
  try {
    const enabled = w.__srmTracking?.pixelEvents?.[FLAG[event]] !== false;
    const currency = params.currency ?? "INR";
    if (w.fbq && enabled) {
      w.fbq("track", event, {
        ...(params.value != null ? { value: params.value, currency } : {}),
        ...(params.contentName ? { content_name: params.contentName } : {}),
        ...(params.contentId ? { content_ids: [params.contentId], content_type: "product" } : {}),
      });
    }
    if (w.gtag) {
      w.gtag("event", GA_NAME[event], {
        ...(params.value != null ? { value: params.value, currency } : {}),
        ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
        ...(params.contentId ? { items: [{ item_id: params.contentId, item_name: params.contentName }] } : {}),
      });
    }
  } catch {
    /* tracking must never break the page */
  }
}
