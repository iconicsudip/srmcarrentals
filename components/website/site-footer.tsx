import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { FacebookIcon, InstagramIcon, LinkedInIcon, TelegramIcon, XIcon, YouTubeIcon } from "@/components/website/social-icons";

import type { CompanyContent, SiteText } from "@/modules/settings/site-content.schemas";

export interface FooterBranch {
  city: string;
  phone?: string;
  address: string;
  mapUrl?: string;
}

export function SiteFooter({ company, branches = [], text }: { company: CompanyContent; branches?: FooterBranch[]; text: SiteText["footer"] }) {
  const sl = company.socialLinks;
  const socials = [
    { icon: InstagramIcon, href: sl.instagram, label: "Instagram" },
    { icon: FacebookIcon, href: sl.facebook, label: "Facebook" },
    { icon: YouTubeIcon, href: sl.youtube, label: "YouTube" },
    { icon: LinkedInIcon, href: sl.linkedin, label: "LinkedIn" },
    { icon: XIcon, href: sl.twitter, label: "X" },
    { icon: TelegramIcon, href: sl.telegram, label: "Telegram" },
  ].filter((s) => s.href);

  const columns = [
    { title: "Services", links: company.footerLinks.services },
    { title: "Cars & Brands", links: company.footerLinks.carsAndBrands },
    { title: "Company", links: company.footerLinks.company },
  ].filter((col) => col.links.length > 0);

  const phoneDigits = company.phone?.replace(/[^0-9]/g, "") ?? "";
  const whatsappHref = company.socialLinks.whatsapp || (phoneDigits ? `https://wa.me/${phoneDigits}` : "");
  const brandWord = company.name.split(" ")[0]?.toUpperCase() ?? "SRM";

  return (
    <footer className="relative overflow-hidden bg-neutral-950 text-white lg:[clip-path:polygon(0_56px,100%_0,100%_100%,0_100%)]">
      {/* glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[60rem] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.22),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent lg:hidden" />

      <div className="relative mx-auto max-w-[1520px] px-4 pt-16 sm:px-6 lg:px-8 lg:pt-28">
        {/* ── CTA band ── */}
        <div className="flex flex-col gap-8 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-7 backdrop-blur-sm sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="text-[11px] font-bold tracking-[0.28em] text-amber-300 uppercase">{text.ctaEyebrow}</span>
            <h2 className="mt-3 text-3xl leading-[1.05] font-black tracking-tight uppercase sm:text-5xl">
              {text.ctaTitle} <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">{text.ctaHighlight}</span>
              <span className="text-orange-500">.</span>
            </h2>
            <p className="mt-3 text-sm text-white/60">{text.ctaSubtitle}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {company.phone && (
              <a
                href={`tel:${company.phone.replace(/\s/g, "")}`}
                className="shimmer-sheen relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/30 transition hover:shadow-orange-500/50"
              >
                <Phone className="size-4" /> {text.callLabel} {company.phone}
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#25D366]/50 bg-[#25D366]/15 px-7 py-3.5 text-sm font-black text-[#5be28d] transition hover:bg-[#25D366] hover:text-white"
              >
                <MessageCircle className="size-4" /> {text.whatsappLabel}
              </a>
            )}
          </div>
        </div>

        {/* ── Link grid ── */}
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <Link
              href="/"
              aria-label={`${company.name} — home`}
              className="inline-flex items-center rounded-2xl bg-white px-4 py-2 shadow-xl shadow-black/30 ring-1 ring-amber-300/60"
            >
              <Image src="/images/srm-logo.webp" alt={company.name} width={477} height={199} className="h-14 w-auto" />
            </Link>
            {company.description && <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">{company.description}</p>}
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2.5">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:-translate-y-0.5 hover:border-amber-400/70 hover:bg-amber-400/10 hover:text-amber-300"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="mb-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] text-amber-300 uppercase">
                <span className="h-px w-5 bg-amber-400/70" />
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-white/65 transition-colors hover:text-white"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-amber-400 transition-all duration-300 group-hover:w-full" />
                      </span>
                      <ArrowUpRight className="size-3 -translate-x-1 text-amber-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 lg:col-span-2">
            <h4 className="mb-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] text-amber-300 uppercase">
              <span className="h-px w-5 bg-amber-400/70" />
              {text.conciergeTitle}
            </h4>
            <ul className="flex flex-col gap-4 text-sm text-white/65">
              {company.phone && (
                <li>
                  <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 transition hover:text-white">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-amber-300">
                      <Phone className="size-3.5" />
                    </span>
                    {company.phone}
                  </a>
                </li>
              )}
              {company.email && (
                <li>
                  <a href={`mailto:${company.email}`} className="flex items-center gap-3 break-all transition hover:text-white">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-amber-300">
                      <Mail className="size-3.5" />
                    </span>
                    {company.email}
                  </a>
                </li>
              )}
              {company.address && branches.length === 0 && (
                <li className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-amber-300">
                    <MapPin className="size-3.5" />
                  </span>
                  <span className="leading-relaxed">{company.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ── Offices ── */}
        {branches.length > 0 && (
          <div className="mt-14">
            <h4 className="mb-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] text-amber-300 uppercase">
              <span className="h-px w-5 bg-amber-400/70" />
              {text.officesTitle}
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {branches.slice(0, 3).map((b) => (
                <div
                  key={b.city}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 transition hover:border-amber-400/40"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                      <MapPin className="size-4" />
                    </span>
                    <span className="text-sm font-black tracking-wide text-white uppercase">{b.city}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{b.address}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold">
                    {b.phone && (
                      <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-white/80 transition hover:text-amber-300">
                        <Phone className="size-3.5 text-amber-300" /> {b.phone}
                      </a>
                    )}
                    {b.mapUrl && (
                      <a href={b.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-300 transition hover:text-amber-200">
                        Directions <ArrowUpRight className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Giant outlined wordmark ── */}
        <div aria-hidden className="pointer-events-none mt-14 -mb-4 overflow-hidden text-center select-none sm:-mb-8">
          <span className="block text-[26vw] leading-[0.8] font-black tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.12)] lg:text-[17rem]">
            {brandWord}
          </span>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative border-t border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-[1520px] flex-col items-center justify-between gap-4 px-4 py-5 text-xs text-white/50 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {company.name}. {text.copyright}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="transition-colors hover:text-amber-300">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="transition-colors hover:text-amber-300">
              Terms of Service
            </Link>
            <a
              href="#top"
              aria-label="Back to top"
              className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-amber-400 hover:text-amber-300"
            >
              <ArrowUp className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
