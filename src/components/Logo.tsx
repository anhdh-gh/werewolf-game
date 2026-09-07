import { cn } from "@/lib/utils";

export function Logo({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-background shadow-[0_0_36px_-6px_var(--color-primary)] ring-1 ring-primary/40",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        width={size * 0.68}
        height={size * 0.68}
        aria-hidden="true"
      >
        <circle cx="256" cy="256" r="160" fill="var(--color-primary)" />
        <circle cx="310" cy="220" r="150" fill="var(--color-background)" />
      </svg>
    </div>
  );
}
