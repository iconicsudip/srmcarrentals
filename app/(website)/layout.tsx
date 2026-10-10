import { AmbientBackground } from "@/components/website/ambient-background";
import { CartDrawer } from "@/components/website/cart-drawer";
import { SiteFooter } from "@/components/website/site-footer";
import { SiteHeader } from "@/components/website/site-header";
import { WhatsAppFloat } from "@/components/website/whatsapp-float";
import { getAboutPageContent, getCompanyContent, getSiteText, getAvailableServices, listActiveLocations } from "@/modules/website/public-content.service";

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const [company, services, locations, about, siteText] = await Promise.all([
    getCompanyContent(),
    getAvailableServices(),
    listActiveLocations(),
    getAboutPageContent(),
    getSiteText(),
  ]);
  const cities = Array.from(new Set((locations as { city?: string }[]).map((l) => l.city?.trim()).filter((c): c is string => Boolean(c))));

  return (
    <div className="relative min-h-svh bg-[#FAFAFC] text-neutral-900 selection:bg-orange-500 selection:text-white">
      <AmbientBackground />
      <SiteHeader companyName={company.name} phone={company.phone} services={services} text={siteText.header} />
      <main className="relative z-0">{children}</main>
      <SiteFooter company={company} branches={about.branches} text={siteText.footer} />
      <CartDrawer phone={company.phone} />
      <WhatsAppFloat cities={cities} text={siteText.floatingWhatsApp} />
    </div>
  );
}
