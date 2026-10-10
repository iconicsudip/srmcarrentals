import Link from "next/link";
import { ArrowLeft, CarFront } from "lucide-react";

import { getSiteText } from "@/modules/website/public-content.service";
import { ErrorScreen, ghostBtn, primaryBtn } from "@/components/errors/error-screen";

export default async function NotFound() {
  const { errors } = await getSiteText();
  return (
    <ErrorScreen
      code="404"
      title={errors.notFoundTitle}
      message={errors.notFoundMessage}
      actions={
        <>
          <Link href="/" className={primaryBtn}>
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <Link href="/cars" className={ghostBtn}>
            <CarFront className="size-4" /> Browse cars
          </Link>
        </>
      }
    />
  );
}
