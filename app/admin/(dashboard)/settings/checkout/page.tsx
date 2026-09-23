"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckoutFieldConfig,
  CheckoutFormSettings,
  DEFAULT_CHECKOUT_SETTINGS,
} from "@/lib/checkout/checkout-form-settings";

export default function CheckoutSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<CheckoutFormSettings>(DEFAULT_CHECKOUT_SETTINGS);

  // Custom Field Modal
  const [customFieldOpen, setCustomFieldOpen] = React.useState(false);
  const [newField, setNewField] = React.useState<Partial<CheckoutFieldConfig>>({
    label: "",
    type: "text",
    required: false,
    enabled: true,
    helpText: "",
    placeholder: "",
    validationRule: "none",
    category: "custom",
  });

  // Load existing settings
  React.useEffect(() => {
    let cancelled = false;
    apiFetch<CheckoutFormSettings>("/settings/checkout.form", { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled && data && data.fields) {
          // Merge with defaults to ensure all system fields exist
          const mergedFields = [...DEFAULT_CHECKOUT_SETTINGS.fields];
          for (const customF of data.fields) {
            const idx = mergedFields.findIndex((f) => f.id === customF.id);
            if (idx !== -1) {
              mergedFields[idx] = { ...mergedFields[idx], ...customF };
            } else {
              mergedFields.push(customF);
            }
          }
          setSettings({ ...DEFAULT_CHECKOUT_SETTINGS, ...data, fields: mergedFields });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/settings/checkout.form", {
        method: "PUT",
        body: settings,
      });
      toast.success("Checkout form configuration & validation rules saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save checkout settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (confirm("Reset all checkout fields and validation rules to factory defaults?")) {
      setSettings(DEFAULT_CHECKOUT_SETTINGS);
      toast.info("Form reset to defaults. Remember to click Save.");
    }
  };

  // Toggle Field Enabled
  const handleToggleFieldEnabled = (id: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, enabled } : f)),
    }));
  };

  // Toggle Field Required
  const handleToggleFieldRequired = (id: string, required: boolean) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, required } : f)),
    }));
  };

  // Add Custom Field
  const handleAddCustomField = () => {
    if (!newField.label?.trim()) {
      toast.error("Please enter a field label");
      return;
    }

    const id = `custom_${Date.now()}_${newField.label.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const fieldToAdd: CheckoutFieldConfig = {
      id,
      label: newField.label.trim(),
      type: newField.type || "text",
      placeholder: newField.placeholder?.trim() || "",
      helpText: newField.helpText?.trim() || "",
      required: Boolean(newField.required),
      enabled: true,
      isSystem: false,
      validationRule: newField.validationRule || "none",
      category: "custom",
    };

    setSettings((prev) => ({
      ...prev,
      fields: [...prev.fields, fieldToAdd],
    }));

    setCustomFieldOpen(false);
    setNewField({
      label: "",
      type: "text",
      required: false,
      enabled: true,
      helpText: "",
      placeholder: "",
      validationRule: "none",
      category: "custom",
    });
    toast.success(`Custom field "${fieldToAdd.label}" added!`);
  };

  // Delete Custom Field
  const handleDeleteField = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
    }));
    toast.success("Field removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading checkout configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checkout Form & Validations</h1>
          <p className="text-sm text-muted-foreground">
            Configure dynamic checkout fields, validation rules (Indian Mobile, DL, GSTIN), and custom renter requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} className="text-xs">
            <RotateCcw className="size-3.5 mr-1" /> Reset Defaults
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
            Save Form Settings
          </Button>
        </div>
      </div>

      <SettingsNav />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Master Policy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Master Checkout Policies</CardTitle>
            <CardDescription>Global verification gates and authentication toggles applied during checkout.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 border-t pt-4">
            <div className="flex items-center justify-between rounded-xl border p-3.5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Allow Guest Checkout</Label>
                <p className="text-[11px] text-muted-foreground">Frictionless booking without requiring password</p>
              </div>
              <Switch
                checked={settings.allowGuestCheckout}
                onCheckedChange={(checked) => setSettings({ ...settings, allowGuestCheckout: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3.5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Allow Login to Checkout</Label>
                <p className="text-[11px] text-muted-foreground">Returning members sign in for 1-click pre-fill</p>
              </div>
              <Switch
                checked={settings.allowLoginToCheckout}
                onCheckedChange={(checked) => setSettings({ ...settings, allowLoginToCheckout: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3.5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Mandatory Driving License</Label>
                <p className="text-[11px] text-muted-foreground">Enforce valid Indian LMV Driving License check</p>
              </div>
              <Switch
                checked={settings.requireLicenseConfirmation}
                onCheckedChange={(checked) => setSettings({ ...settings, requireLicenseConfirmation: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3.5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Rental Terms & Policy Check</Label>
                <p className="text-[11px] text-muted-foreground">Require agreement to speed limits & deposit policy</p>
              </div>
              <Switch
                checked={settings.requireTermsAgreement}
                onCheckedChange={(checked) => setSettings({ ...settings, requireTermsAgreement: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3.5">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">B2B GST Invoicing Option</Label>
                <p className="text-[11px] text-muted-foreground">Show optional GSTIN / Company billing section</p>
              </div>
              <Switch
                checked={settings.enableGstBilling}
                onCheckedChange={(checked) => setSettings({ ...settings, enableGstBilling: checked })}
              />
            </div>

            <div className="rounded-xl border p-3.5 space-y-1.5">
              <Label className="text-xs font-semibold">Minimum Driver Age</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={18}
                  max={30}
                  value={settings.minimumDriverAge}
                  onChange={(e) => setSettings({ ...settings, minimumDriverAge: Number(e.target.value) || 21 })}
                  className="h-8 text-xs w-24"
                />
                <span className="text-xs text-muted-foreground">Years old</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Fields Configuration Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Checkout Fields & Validation Rules</CardTitle>
              <CardDescription>
                Toggle field visibility, enforce requirement, and specify real-time validation formats.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomFieldOpen(true)}
              className="text-xs"
            >
              <Plus className="size-3.5 mr-1 text-orange-500" /> Add Custom Field
            </Button>
          </CardHeader>

          <CardContent className="p-0 border-t">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 text-left">Field Label</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Validation Rule</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-center">Required</th>
                    <th className="px-4 py-3 text-center">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {settings.fields.map((field) => (
                    <tr key={field.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{field.label}</div>
                        <div className="text-[11px] text-muted-foreground">{field.helpText || "No helper text"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {field.type}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                        >
                          {field.validationRule === "indian_mobile" && "📱 10-Digit Mobile (+91)"}
                          {field.validationRule === "email" && "✉️ RFC Email & Typo Check"}
                          {field.validationRule === "indian_dl" && "🪪 Indian DL Format"}
                          {field.validationRule === "gstin" && "🏢 15-Digit GSTIN"}
                          {field.validationRule === "flight_no" && "✈️ Flight Code (6E-243)"}
                          {field.validationRule === "name" && "👤 Name Characters"}
                          {field.validationRule === "none" && "None (Free Text)"}
                          {field.validationRule === "regex" && "Custom Regex"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {field.category}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => handleToggleFieldRequired(field.id, checked)}
                          disabled={field.id === "firstName" || field.id === "phone" || field.id === "email"}
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={(checked) => handleToggleFieldEnabled(field.id, checked)}
                          disabled={field.id === "firstName" || field.id === "phone" || field.id === "email"}
                        />
                      </td>

                      <td className="px-4 py-3 text-right">
                        {!field.isSystem ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteField(field.id)}
                            className="size-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">System</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Live Form Preview Accordion */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Eye className="size-4 text-orange-500" /> Live Customer Checkout Preview
            </CardTitle>
            <CardDescription>
              Preview how active fields and validation rules render on the public checkout page.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t pt-4">
            <div className="rounded-2xl border border-border bg-neutral-950 p-6 text-white max-w-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  1. Contact Details Preview
                </span>
                <span className="text-[10px] text-white/50">Live Preview</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                {settings.fields
                  .filter((f) => f.enabled)
                  .map((field) => (
                    <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                      <Label className="text-[11px] font-semibold text-white/80">
                        {field.label} {field.required ? "*" : "(Optional)"}
                      </Label>
                      <Input
                        disabled
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="mt-1 rounded-xl border-white/10 bg-black/60 text-xs text-white placeholder:text-white/30 h-9"
                      />
                      {field.helpText && (
                        <p className="text-[9px] text-white/40 mt-0.5">{field.helpText}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
            Save Checkout Configuration
          </Button>
        </div>
      </form>

      {/* Add Custom Field Dialog */}
      <Dialog open={customFieldOpen} onOpenChange={setCustomFieldOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="size-4 text-orange-500" /> Add Custom Checkout Field
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new dynamic question or requirement to the customer checkout flow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold">Field Label *</Label>
              <Input
                placeholder="e.g. Baby Child Seat Required"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Field Type</Label>
                <Select
                  value={newField.type}
                  onValueChange={(val: any) => setNewField({ ...newField, type: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="tel">Phone / Tel</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="textarea">Textarea / Notes</SelectItem>
                    <SelectItem value="checkbox">Yes / No Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Validation Rule</Label>
                <Select
                  value={newField.validationRule}
                  onValueChange={(val: any) => setNewField({ ...newField, validationRule: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Optional)</SelectItem>
                    <SelectItem value="indian_mobile">Indian Mobile (10-digit)</SelectItem>
                    <SelectItem value="email">Email Address</SelectItem>
                    <SelectItem value="name">Name / Alphabetic Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Placeholder Text</Label>
              <Input
                placeholder="e.g. Yes (Infant under 2 years)"
                value={newField.placeholder}
                onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Helper / Explanatory Text</Label>
              <Input
                placeholder="e.g. Complies with ISOFIX safety standards"
                value={newField.helpText}
                onChange={(e) => setNewField({ ...newField, helpText: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <Label className="text-xs font-semibold">Mandatory / Required Field</Label>
              <Switch
                checked={newField.required}
                onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomFieldOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomField}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
            >
              Add Field to Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
