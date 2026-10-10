import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ErrorScreen, primaryBtn } from "@/components/errors/error-screen";

export default function Forbidden() {
  return (
    <ErrorScreen
      code="403"
      title="Access denied"
      message="You don't have permission to view this page. If you think this is a mistake, please contact us."
      actions={
        <Link href="/" className={primaryBtn}>
          <ArrowLeft className="size-4" /> Back to home
        </Link>
      }
    />
  );
}
