import Script from "next/script";

import { RouteTracker } from "@/components/website/route-tracker";
import { getTrackingConfig } from "@/modules/website/public-content.service";
import { cleanGaId, cleanPixelId, parseSearchConsoleCode } from "@/lib/tracking/ids";

/** Adds the tags switched on in Admin → Settings → Integrations: Search Console verification, Google Analytics and Meta Pixel. */
export async function TrackingScripts() {
  const cfg = await getTrackingConfig();
  const verification = parseSearchConsoleCode(cfg.searchConsole.verification);
  const gaId = cleanGaId(cfg.googleAnalytics.measurementId);
  const pixelId = cfg.metaPixel.enabled ? cleanPixelId(cfg.metaPixel.pixelId) : "";

  const anyTag = Boolean(gaId || pixelId);

  return (
    <>
      {anyTag && <RouteTracker />}
      {verification && <meta name="google-site-verification" content={verification} />}

      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}</Script>
        </>
      )}

      {pixelId && (
        <>
          <Script id="meta-pixel-flags" strategy="afterInteractive">{`
            window.__srmTracking = { pixelEvents: ${JSON.stringify(cfg.metaPixel.events)} };
          `}</Script>
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}</Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
    </>
  );
}
