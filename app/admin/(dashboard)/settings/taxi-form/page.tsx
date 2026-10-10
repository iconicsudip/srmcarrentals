"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_TAXI_FORM,
  TAXI_FORM_SETTING_KEY,
  normalizeTaxiForm,
  type TaxiFieldType,
  type TaxiFormConfig,
  type TaxiFormField,
} from "@/lib/taxi-enquiry/form";

const FIELD_TYPES: { value: TaxiFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "tel", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "datetime-local", label: "Date & Time" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long text" },
];

const nativeSelect =
  "h-8 rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/30";

export default function TaxiFormSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [config, setConfig] = React.useState<TaxiFormConfig>(DEFAULT_TAXI_FORM);

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<TaxiFormConfig>(`/settings/${TAXI_FORM_SETTING_KEY}`, { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled) setConfig(normalizeTaxiForm(data));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (id: string, patch: Partial<TaxiFormField>) =>
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));

  const moveField = (index: number, dir: -1 | 1) =>
    setConfig((prev) => {
      const next = [...prev.fields];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...prev, fields: next };
    });

  const addField = () =>
    setConfig((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: `custom_${Date.now()}`,
          label: "New Field",
          type: "text",
          placeholder: "",
          required: false,
          enabled: true,
        },
      ],
    }));

  const removeField = (id: string) =>
    setConfig((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== id) }));

  const handleSave = async () => {
    if (config.fields.some((f) => !f.label.trim())) {
      toast.error("Every field needs a label");
      return;
    }
    if (config.fields.some((f) => f.type === "select" && !(f.options?.length ?? 0))) {
      toast.error("Dropdown fields need at least one option");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/settings/${TAXI_FORM_SETTING_KEY}`, { method: "PUT", body: config });
      toast.success("Taxi booking form saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading form…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Taxi Booking Form</h1>
          <p className="text-sm text-muted-foreground">
            The form customers fill when they click “Book Taxi” on a chauffeur card. Entries appear under
            Bookings → Taxi Enquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              if (confirm("Reset the form to defaults?")) {
                setConfig(DEFAULT_TAXI_FORM);
                toast.info("Reset. Remember to click Save.");
              }
            }}
          >
            <RotateCcw className="mr-1 size-3.5" /> Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 text-xs font-bold text-white hover:bg-orange-600"
          >
            {saving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Save className="mr-1.5 size-3.5" />}
            Save Form
          </Button>
        </div>
      </div>

      <SettingsNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Form Text & Behaviour</CardTitle>
          <CardDescription>Heading, button label and what happens after a customer submits.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Form title</Label>
            <Input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Submit button label</Label>
            <Input value={config.submitLabel} onChange={(e) => setConfig({ ...config, submitLabel: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Subtitle</Label>
            <Input value={config.subtitle} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Success message</Label>
            <Input
              value={config.successMessage}
              onChange={(e) => setConfig({ ...config, successMessage: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3.5 sm:col-span-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">Also open WhatsApp after submit</Label>
              <p className="text-[11px] text-muted-foreground">
                The entry is always saved. This also opens a pre-filled WhatsApp message to your company number.
              </p>
            </div>
            <Switch
              checked={config.openWhatsApp}
              onCheckedChange={(checked) => setConfig({ ...config, openWhatsApp: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Form Fields</CardTitle>
            <CardDescription>Edit, reorder, hide or add fields. Changes go live after saving.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={addField}>
            <Plus className="mr-1 size-3.5 text-orange-500" /> Add Field
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 border-t pt-4">
          {config.fields.map((field, index) => (
            <div key={field.id} className="rounded-xl border p-3.5 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveField(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, 1)}
                    disabled={index === config.fields.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>

                <Input
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  className="h-8 min-w-[180px] flex-1 text-xs font-semibold"
                  placeholder="Field label"
                />

                <select
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as TaxiFieldType })}
                  className={nativeSelect}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-1.5 text-[11px] font-medium">
                  <Switch checked={field.required} onCheckedChange={(v) => updateField(field.id, { required: v })} />
                  Required
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-medium">
                  <Switch checked={field.enabled} onCheckedChange={(v) => updateField(field.id, { enabled: v })} />
                  Visible
                </label>

                {field.isSystem ? (
                  <Badge variant="outline" className="text-[10px]">
                    Built-in
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-red-500 hover:bg-red-500/10"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  value={field.placeholder ?? ""}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  className="h-8 text-xs"
                  placeholder="Placeholder text (optional)"
                />
                {field.type === "select" && (
                  <Input
                    value={(field.options ?? []).join(", ")}
                    onChange={(e) =>
                      updateField(field.id, {
                        options: e.target.value
                          .split(",")
                          .map((o) => o.trim())
                          .filter(Boolean),
                      })
                    }
                    className="h-8 text-xs"
                    placeholder="Options, comma separated (e.g. One way, Round trip)"
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
