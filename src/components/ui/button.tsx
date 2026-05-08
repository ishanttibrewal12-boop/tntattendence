import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import gsap from "gsap";

import { cn } from "@/lib/utils";
import { triggerRipple } from "@/lib/motion/gsapUtils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] will-change-transform",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-background text-foreground hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted text-foreground",
        link: "text-foreground underline-offset-4 hover:underline rounded-none",
        premium: "bg-accent text-accent-foreground font-medium hover:bg-accent/90",
        hero: "bg-primary text-primary-foreground font-medium hover:bg-primary/90",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-11 px-7",
        xl: "h-12 px-9 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disable cinematic magnetic + ripple FX (default: enabled). */
  noFx?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, noFx = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const innerRef = React.useRef<HTMLButtonElement | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLButtonElement);

    React.useEffect(() => {
      if (noFx) return;
      const el = innerRef.current;
      if (!el) return;
      const strength = 0.22;
      const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        if (r.width > 320) return; // skip very wide buttons (full-width forms)
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const onLeave = () => { xTo(0); yTo(0); };
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    }, [noFx]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!noFx) {
        try { triggerRipple(e); } catch { /* noop */ }
        const el = innerRef.current;
        if (el) gsap.fromTo(el, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,0.5)" });
      }
      onClick?.(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={innerRef as any}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
