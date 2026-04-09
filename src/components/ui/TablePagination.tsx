import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onGoToPage?: (page: number) => void;
  isLoading?: boolean;
}

const TablePagination = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  isLoading,
}: TablePaginationProps) => {
  const from = currentPage * pageSize + 1;
  const to = Math.min((currentPage + 1) * pageSize, totalCount);

  if (totalCount <= pageSize) return null;

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-xs text-muted-foreground">
        {from}–{to} of {totalCount.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!hasPrev || isLoading}
          onClick={onPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2">
          {currentPage + 1}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!hasNext || isLoading}
          onClick={onNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;
