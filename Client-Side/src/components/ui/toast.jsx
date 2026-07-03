import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

// Bottom-right desktop, bottom-center mobile — editorial atelier rhythm.
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed z-[100] flex max-h-screen w-full flex-col-reverse gap-3 p-4",
      "bottom-0 left-1/2 -translate-x-1/2", // mobile bottom-center
      "sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 sm:max-w-[400px]", // desktop bottom-right
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// Editorial toast — hairline frame, dark surface, 3px coloured left rule.
// The colour rule is the signature: gold (default), coral (destructive),
// emerald (success). No rounded corners — sharp editorial edges.
const toastVariants = cva(
  cn(
    "se-toast group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden",
    "border bg-page text-ink-2",
    "p-4 pl-5 pr-10",
    "shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
    "transition-all",
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[swipe=end]:animate-out",
    "data-[state=closed]:fade-out-80",
    "data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-bottom-full",
    "sm:data-[state=open]:slide-in-from-right-full"
  ),
  {
    variants: {
      variant: {
        default: "se-toast-default border-line",
        destructive: "se-toast-destructive border-danger-ink/30",
        success: "se-toast-success border-success-ink/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Toast = React.forwardRef(({ className, variant = "default", children, ...props }, ref) => {
  const accent =
    variant === "destructive" ? "#ffb4ab" : variant === "success" ? "#a8d8b6" : "#f2ca50";
  const eyebrow =
    variant === "destructive" ? "Note · Issue" : variant === "success" ? "Note · Done" : "Note";
  const Glyph =
    variant === "destructive" ? AlertCircle : variant === "success" ? CheckCircle2 : Info;

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {/* 3px left accent rule — the editorial signature */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: accent }}
      />

      {/* Glyph */}
      <span
        aria-hidden="true"
        className="mt-0.5 shrink-0"
        style={{ color: accent }}
      >
        <Glyph size={16} strokeWidth={1.75} />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <span
          className="se-label text-[9px] tracking-[0.32em] block mb-1"
          style={{ color: accent }}
        >
          {eyebrow}
        </span>
        {children}
      </div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "mt-2 inline-flex h-9 shrink-0 items-center justify-center gap-2 px-4",
      "border border-line hover:border-muted hover:bg-card",
      "se-label text-[10px] tracking-[0.18em] text-ink-2",
      "transition-colors se-focus disabled:pointer-events-none disabled:opacity-50",
      "group-[.se-toast-destructive]:border-danger-ink/40 group-[.se-toast-destructive]:hover:border-danger-ink group-[.se-toast-destructive]:text-danger-ink",
      "group-[.se-toast-success]:border-success-ink/40 group-[.se-toast-success]:hover:border-success-ink group-[.se-toast-success]:text-success-ink",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center",
      "text-muted hover:text-ink-2 transition-colors",
      "opacity-0 group-hover:opacity-100 focus:opacity-100",
      "se-focus",
      "group-[.se-toast-destructive]:text-danger-ink/70 group-[.se-toast-destructive]:hover:text-danger-ink",
      "group-[.se-toast-success]:text-success-ink/70 group-[.se-toast-success]:hover:text-success-ink",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" strokeWidth={1.75} />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "se-headline text-base text-ink-2 leading-tight [&+div]:mt-1.5",
      className
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "se-body text-xs md:text-[13px] text-cream leading-relaxed",
      className
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
