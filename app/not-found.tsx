import Link from "next/link";
import { ArrowLeft, CarFront } from "lucide-react";

import { ErrorScreen, ghostBtn, primaryBtn } from "@/components/errors/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="Wrong turn"
      message="The page you're looking for doesn't exist or has moved. Let's get you back on the road."
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
