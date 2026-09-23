import { SiteFooter } from "@/components/website/site-footer";
import { SiteHeader } from "@/components/website/site-header";
import { CartDrawer } from "@/components/website/cart-drawer";
import { getCompanyContent } from "@/modules/website/public-content.service";

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const company = await getCompanyContent();

  return (
    <div className="dark min-h-svh bg-black text-white">
      <SiteHeader companyName={company.name} phone={company.phone} />
      <main>{children}</main>
      <SiteFooter company={company} />
      <CartDrawer />
    </div>
  );
}
