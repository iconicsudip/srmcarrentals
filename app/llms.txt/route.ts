import { getCompanyContent } from "@/modules/website/public-content.service";

export const dynamic = "force-dynamic";

/** /llms.txt — a short Markdown guide that tells AI assistants what this site is and where its main pages are. */
export async function GET(req: Request) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  let name = "SRM Car Rentals";
  let about = "Self-drive and chauffeur-driven car rentals, airport transfers and tours.";
  let phone = "";
  let email = "";
  try {
    const c = await getCompanyContent();
    name = c.name || name;
    about = c.description || c.tagline || about;
    phone = c.phone || "";
    email = c.email || "";
  } catch {
    /* use the defaults */
  }

  const body = `# ${name}

> ${about}

## Main pages
- [Self-drive cars](${base}/cars): the full fleet, with prices per day and per kilometre plan
- [Taxi & chauffeur](${base}/car-rental): chauffeur-driven cars and airport transfers
- [Tours](${base}/tours): curated tour packages
- [Blog](${base}/blog): travel guides and car guides
- [Reviews](${base}/reviews): customer reviews

## Company
- [About us](${base}/about-us)
- [Contact](${base}/contact-us)${phone ? `\n- Phone: ${phone}` : ""}${email ? `\n- Email: ${email}` : ""}

## Policies
- [Frequently asked questions](${base}/faq)
- [Terms & conditions](${base}/terms-and-conditions)
- [Privacy policy](${base}/privacy-policy)

## Optional
- [Sitemap](${base}/sitemap.xml)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
