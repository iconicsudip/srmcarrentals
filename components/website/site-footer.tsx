import Link from "next/link";
import { Camera, CarFront, Mail, MapPin, MessageCircle, Phone, Share2, Video } from "lucide-react";

import type { CompanyContent } from "@/modules/settings/site-content.schemas";

export function SiteFooter({ company }: { company: CompanyContent }) {
  const socials = [
    { icon: Camera, href: company.socialLinks.instagram },
    { icon: Share2, href: company.socialLinks.facebook },
    { icon: Video, href: company.socialLinks.youtube },
    { icon: MessageCircle, href: company.socialLinks.whatsapp },
  ].filter((s) => s.href);

  const columns = [
    { title: "Services", links: company.footerLinks.services },
    { title: "Cars & Brands", links: company.footerLinks.carsAndBrands },
    { title: "Company", links: company.footerLinks.company },
  ].filter((col) => col.links.length > 0);

  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto max-w-[1520px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 shadow-xs">
                <CarFront className="size-5" />
              </span>
              <div>
                <div className="text-base font-black text-neutral-950">{company.name.toUpperCase()}</div>
                {company.tagline && <div className="text-xs font-bold tracking-widest text-orange-600">{company.tagline.toUpperCase()}</div>}
              </div>
            </div>
            {company.description && <p className="max-w-sm text-sm text-neutral-600 leading-relaxed">{company.description}</p>}
            {socials.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socials.map(({ icon: Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-500/40 transition shadow-xs"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-bold tracking-widest text-neutral-400 uppercase">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-neutral-600 hover:text-orange-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-4 text-xs font-bold tracking-widest text-neutral-400 uppercase">CONCIERGE DESK</h4>
            <ul className="flex flex-col gap-3 text-sm text-neutral-600">
              {company.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-orange-500" /> {company.phone}
                </li>
              )}
              {company.email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0 text-orange-500" /> {company.email}
                </li>
              )}
              {company.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-orange-500" /> {company.address}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-150 pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-orange-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-orange-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
