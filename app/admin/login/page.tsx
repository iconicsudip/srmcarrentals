import { Suspense } from "react";

import { LoginForm } from "@/app/admin/login/login-form";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
