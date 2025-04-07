import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Search, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type ColumnDef<T> = {
  id: string;
  accessorKey: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
};

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  initialSortColumn?: string;
  initialSortDirection?: 'asc' | 'desc';
  footerContent?: React.ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  searchable = true,
  searchPlaceholder = "Search...",
  initialSortColumn,
  initialSortDirection = 'asc',
  footerContent
}: DataTableProps<T>) {
  const { t, isRtl } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | undefined>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((item) => {
      return columns.some((column) => {
        if (!column.enableFiltering) return false;
        const value = item[column.accessorKey as keyof T];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue < bValue ? -1 : 1;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: ColumnDef<T>) => {
    if (!column.enableSorting) return null;

    if (sortColumn === column.id) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="ml-1 h-4 w-4" />
      ) : (
        <ChevronDown className="ml-1 h-4 w-4" />
      );
    }

    return <ArrowUpDown className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="w-full">
      {searchable && (
        <div className="flex items-center py-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className={`absolute ${isRtl ? 'right-2' : 'left-2'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={t(searchPlaceholder)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${isRtl ? 'pr-8' : 'pl-8'}`}
            />
          </div>
        </div>
      )}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={column.enableSorting ? "cursor-pointer" : ""}
                  onClick={() => column.enableSorting && handleSort(column.id)}
                >
                  <div className="flex items-center">
                    {t(column.header)}
                    {column.enableSorting && renderSortIcon(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-32">
                  {searchTerm ? t("No results found") : t("No data available")}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, index) => (
                <TableRow
                  key={index}
                  className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {footerContent && (
          <div className="px-4 py-3 border-t bg-muted/20">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
