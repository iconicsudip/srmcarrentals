"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown, MessageSquare, Phone, HelpCircle } from "lucide-react";
import type { FaqPageContent } from "@/modules/settings/site-content.schemas";
import { SectionHeading } from "@/components/website/section-heading";

const DEFAULT_FAQS = [
  {
    id: "what-is-srm",
    question: "What is SRM Car Rentals?",
    answer:
      "SRM Car Rentals is a premier self-drive car rental service offering hourly, daily, and weekly rentals across Udaipur, Jaipur, and Navsari. Transparent pricing, modern fleet, and instant confirmation.",
  },
  {
    id: "how-to-book",
    question: "How can I book a car?",
    answer:
      "Select your preferred car, pick your rental dates and delivery location (City Branch or Airport), review your instant live price calculation, and reserve with a 15-minute temporary hold in under 2 minutes!",
  },
  {
    id: "documents-required",
    question: "What documents are required to rent a car?",
    answer:
      "A valid Indian Driving License (LMV, min 1+ years old) and a government-issued photo ID (Aadhaar Card or Passport). Digital KYC verification takes only 15 minutes before vehicle handover.",
  },
  {
    id: "security-deposit",
    question: "Is a security deposit required?",
    answer:
      "Yes, a fully refundable security deposit (₹3,000–₹5,000 depending on vehicle class) is collected upon car inspection and returned directly to your bank/UPI within 24 to 48 business hours after drop-off.",
  },
  {
    id: "intercity-travel",
    question: "Can I use the car for outstation or interstate travel?",
    answer:
      "Yes! All SRM vehicles carry valid commercial permits for travel across Rajasthan, Gujarat, and neighboring states. Highway tolls and any inter-state border taxes are borne by the customer.",
  },
  {
    id: "hourly-rental",
    question: "Are hourly rentals available?",
    answer:
      "Yes! SRM Car Rentals offers flexible hourly rates alongside standard 24-hour daily rates. You can toggle between Daily and Hourly pricing right on each car card.",
  },
  {
    id: "cancellation",
    question: "What is the cancellation policy?",
    answer:
      "Enjoy 100% free cancellation up to 48 hours before pickup. Cancellations within 24–48 hours incur a nominal fee, while notice under 2 hours is non-refundable.",
  },
  {
    id: "fuel-policy",
    question: "What is the fuel policy?",
    answer:
      "We operate a simple same-to-same fuel policy. The car is handed over with recorded fuel and returned with the same level. Excess fuel is non-refundable.",
  },
];

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { id: string; question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="h-fit overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 transition-all hover:border-white/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-bold text-white pr-4">{faq.question}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-orange-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="border-t border-white/5 px-5 pb-5 pt-3 text-xs leading-relaxed text-white/60">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection({ data }: { data?: FaqPageContent }) {
  const [openId, setOpenId] = React.useState<string | null>("what-is-srm");

  const badge = data?.badge || "FAQ";
  const title = data?.title || "FREQUENTLY ASKED QUESTIONS.";
  const subtitle =
    data?.subtitle || "Everything you need to know about renting a self-drive car with SRM Car Rentals.";
  const items = data?.faqs && data.faqs.length > 0 ? data.faqs : DEFAULT_FAQS;

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  // Split items evenly into two columns for wide desktop layout
  const col1 = items.filter((_, i) => i % 2 === 0);
  const col2 = items.filter((_, i) => i % 2 !== 0);

  return (
    <section id="faq" className="relative overflow-hidden border-t border-white/5 bg-black">
      {/* Background road image */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-10"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Section Heading matching website standard */}
        <SectionHeading badge={badge} title={title} subtitle={subtitle} center />

        {/* 2-Column Responsive FAQ Grid spanning full max-w-7xl width */}
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {col1.map((faq) => (
              <FaqItem
                key={faq.id}
                faq={faq}
                isOpen={openId === faq.id}
                onToggle={() => toggle(faq.id)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {col2.map((faq) => (
              <FaqItem
                key={faq.id}
                faq={faq}
                isOpen={openId === faq.id}
                onToggle={() => toggle(faq.id)}
              />
            ))}
          </div>
        </div>

        {/* Full-width Support CTA matching max-w-7xl width */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-6 text-center backdrop-blur sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Have a specific question or custom travel plan?</div>
              <p className="text-xs text-white/50">Our Udaipur dispatch team is on call 24/7 to help you.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://wa.me/919414551250?text=Hello%20SRM%20Car%20Rentals!%20I%20have%20a%20question%20about%20booking."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500"
            >
              <MessageSquare className="size-3.5" /> WhatsApp Desk
            </a>
            <a
              href="tel:+919414551250"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              <Phone className="size-3.5 text-orange-400" /> +91 9414551250
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
