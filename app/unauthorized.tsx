import Link from "next/link";
import { LogIn } from "lucide-react";

import { ErrorScreen, ghostBtn, primaryBtn } from "@/components/errors/error-screen";

export default function Unauthorized() {
  return (
    <ErrorScreen
      code="401"
      title="Please sign in"
      message="You need to sign in to view this page."
      actions={
        <>
          <Link href="/admin/login" className={primaryBtn}>
            <LogIn className="size-4" /> Sign in
          </Link>
          <Link href="/" className={ghostBtn}>
            Back to home
          </Link>
        </>
      }
    />
  );
}
