"use client";

import * as React from "react";
import { useFieldArray, type Control, type FieldValues, type ArrayPath } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RepeatableListProps<T extends FieldValues> {
  control: Control<T>;
  name: ArrayPath<T>;
  emptyItem: Record<string, unknown>;
  addLabel?: string;
  renderItem: (index: number) => React.ReactNode;
}

/** Generic "add/remove rows" editor for the array fields inside the Homepage
 * Content settings (trust badges, stat tiles, feature cards, footer links, ...). */
export function RepeatableList<T extends FieldValues>({
  control,
  name,
  emptyItem,
  addLabel = "Add item",
  renderItem,
}: RepeatableListProps<T>) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
          <div className="grid flex-1 gap-2">{renderItem(index)}</div>
          <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove(index)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append(emptyItem as never)}
      >
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
