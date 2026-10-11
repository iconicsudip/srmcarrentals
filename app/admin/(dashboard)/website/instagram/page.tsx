"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InstagramFeedPage() {
  const [token, setToken] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{ connected: boolean; message: string } | null>(null);
  const [testing, setTesting] = React.useState(false);

  const test = React.useCallback(async () => {
    setTesting(true);
    try {
      setStatus(await apiFetch<{ connected: boolean; message: string }>("/integrations/instagram"));
    } catch {
      setStatus({ connected: false, message: "Could not check the connection." });
    } finally {
      setTesting(false);
    }
  }, []);

  React.useEffect(() => {
    apiFetch<{ accessToken?: string }>("/settings/integrations.instagram", { skipAuthRedirect: true })
      .then((v) => v?.accessToken && setToken(v.accessToken))
      .catch(() => {});
    void test();
  }, [test]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/settings/integrations.instagram", { method: "PUT", body: { accessToken: token.trim() } });
      toast.success("Saved — the homepage feed refreshes within an hour");
      await test();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instagram Feed</h1>
        <p className="text-sm text-muted-foreground">Show every post from your Instagram account in the homepage &ldquo;Follow the Journey&rdquo; section.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access token</CardTitle>
          <CardDescription>
            Instagram only shares a feed through its official API. Your account must be a Professional (Business or Creator) account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ig-token">Long-lived Instagram access token</Label>
            <Input id="ig-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="IGAA…" autoComplete="off" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />} Save token
            </Button>
            <Button variant="outline" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null} Test connection
            </Button>
            {status && (
              <span className={`flex items-center gap-1.5 text-sm font-medium ${status.connected ? "text-emerald-600" : "text-red-600"}`}>
                {status.connected ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />} {status.message}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to get the token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Switch your Instagram to a Professional account (Settings → Account type).</li>
            <li>
              In Meta for Developers, create an app and add the <strong>Instagram API with Instagram login</strong> product.
            </li>
            <li>Add your Instagram account as a tester, accept the invite in Instagram, then generate an access token for it.</li>
            <li>Paste the long-lived token above. Tokens last 60 days; generate a new one before it expires.</li>
          </ol>
          <p>Until a token is connected, the homepage keeps showing the photos from Admin → Website → Gallery.</p>
        </CardContent>
      </Card>
    </div>
  );
}
