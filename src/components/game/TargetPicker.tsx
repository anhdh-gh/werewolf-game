"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PickableTarget {
  uid: string;
  name: string;
}

export function TargetPicker({
  targets,
  selected,
  onSelect,
  onSubmit,
  submitLabel,
  disabled,
  abstainLabel,
  hideSubmit,
}: {
  targets: PickableTarget[];
  /** undefined = nothing chosen yet, null = explicit abstain, string = uid. */
  selected: string | null | undefined;
  onSelect: (uid: string | null) => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
  /** When set, renders an extra "no target" choice (abstain vote, Witch
   * declining to act, Hunter shooting nobody) alongside the player list. */
  abstainLabel?: string;
  /** Skip the submit button — for a picker that's just step 1 of a
   * multi-step choice (Cupid picking the first of a pair). */
  hideSubmit?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {targets.map((target) => (
          <li key={target.uid}>
            <button
              type="button"
              onClick={() => onSelect(target.uid)}
              className={cn(
                "touch-manipulation w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                selected === target.uid
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {target.name}
            </button>
          </li>
        ))}
        {abstainLabel && (
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={cn(
                "touch-manipulation w-full rounded-lg border px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors",
                selected === null
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {abstainLabel}
            </button>
          </li>
        )}
      </ul>
      {!hideSubmit && (
        <Button
          onClick={onSubmit}
          disabled={disabled || selected === undefined}
          className="h-12 text-base"
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
}
