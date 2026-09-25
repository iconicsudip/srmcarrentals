import { AmbientBackground } from "@/components/website/ambient-background";
import { CartDrawer } from "@/components/website/cart-drawer";
import { SiteFooter } from "@/components/website/site-footer";
import { SiteHeader } from "@/components/website/site-header";
import { getCompanyContent, getAvailableServices } from "@/modules/website/public-content.service";

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const [company, services] = await Promise.all([
    getCompanyContent(),
    getAvailableServices(),
  ]);

  return (
    <div className="dark relative min-h-svh bg-black text-white selection:bg-orange-500 selection:text-white">
      <AmbientBackground />
      <SiteHeader companyName={company.name} phone={company.phone} services={services} />
      <main className="relative z-0">{children}</main>
      <SiteFooter company={company} />
      <CartDrawer phone={company.phone} />
    </div>
  );
}
