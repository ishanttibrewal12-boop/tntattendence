import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * MobileFriendlyDialog — full-screen modal on mobile, centered card on desktop.
 * Provides sticky header/footer slots and smooth touch scrolling.
 *
 * Usage:
 *   <MobileFriendlyDialog open={open} onOpenChange={setOpen} header={...} footer={...}>
 *     {form fields...}
 *   </MobileFriendlyDialog>
 */
interface MobileFriendlyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string; // default max-w-md
  preventOutsideClose?: boolean;
}

export const MobileFriendlyDialog = ({
  open,
  onOpenChange,
  children,
  header,
  footer,
  maxWidthClass = 'max-w-md',
  preventOutsideClose = true,
}: MobileFriendlyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'p-0 gap-0 flex flex-col overflow-hidden rounded-lg',
          'h-[100dvh] w-[calc(100vw-1rem)] sm:w-full sm:h-auto sm:max-h-[90vh]',
          maxWidthClass,
        )}
        onPointerDownOutside={preventOutsideClose ? (e) => e.preventDefault() : undefined}
      >
        {header && (
          <div className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
            {header}
          </div>
        )}
        <div
          className="flex-1 overflow-y-auto overflow-touch px-5 py-4 space-y-4"
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3 border-t border-border/50 shrink-0 safe-area-bottom bg-background">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MobileFriendlyDialog;
