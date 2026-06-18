import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE_SIZES = [10, 20, 50, 100];
const MIN_PAGE_SIZE = Math.min(...PAGE_SIZES);

export function usePagination<T>(data: T[], defaultPageSize = 50) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = pageIndex * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageData = useMemo(() => data.slice(start, end), [data, start, end]);

  const goNext = () => setPageIndex((p) => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setPageIndex((p) => Math.max(p - 1, 0));

  const changeSize = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
  };

  function PaginationBar() {
    if (total <= MIN_PAGE_SIZE) return null;

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm pt-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="hidden sm:inline">Rows per page</span>
          <span className="sm:hidden">Rows:</span>
          <Select value={String(pageSize)} onValueChange={(v) => changeSize(Number(v))}>
            <SelectTrigger className="h-8 w-16" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{total > 0 ? `${start + 1}–${end} of ${total}` : '0 rows'}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={goPrev} disabled={pageIndex === 0} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={goNext} disabled={pageIndex >= totalPages - 1} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return { pageData, PaginationBar, total };
}
