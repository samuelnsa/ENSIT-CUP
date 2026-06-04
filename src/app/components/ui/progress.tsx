"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

const PROGRESS_STEP_CLASSES = new Map(
  Array.from({ length: 21 }, (_, index) => {
    const percent = index * 5;
    return [percent, `progress-offset-${100 - percent}`];
  }),
);

function getProgressClass(value?: number) {
  const normalized = Math.max(0, Math.min(100, Math.round((value ?? 0) / 5) * 5));
  return PROGRESS_STEP_CLASSES.get(normalized) ?? 'progress-offset-100';
}

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary h-full w-full flex-1 transition-all",
          getProgressClass(value),
        )}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
