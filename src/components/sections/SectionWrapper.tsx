import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Reusable skeleton pulse block for loading states
 */
export const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-muted ${className}`} />
);

/**
 * Standard skeleton for a card-based list section
 */
export const SectionSkeleton = ({ cards = 4, showSummary = true }: { cards?: number; showSummary?: boolean }) => (
  <div className="space-y-4">
    {showSummary && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-4 space-y-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )}
    <SkeletonBlock className="h-10 w-full" />
    <div className="space-y-2">
      {[...Array(cards)].map((_, i) => (
        <Card key={i} className="border">
          <CardContent className="p-4 flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-48" />
            </div>
            <SkeletonBlock className="h-6 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

/**
 * Standard skeleton for table-style sections
 */
export const TableSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="space-y-3">
    <SkeletonBlock className="h-10 w-full rounded-lg" />
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
        <SkeletonBlock className="h-4 w-4 rounded" />
        <SkeletonBlock className="h-4 flex-1" />
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-4 w-12" />
      </div>
    ))}
  </div>
);

/**
 * Empty state component
 */
export const EmptyState = ({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-muted-foreground/50">{icon}</div>}
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
  </div>
);
