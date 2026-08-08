"use client";

import { useMediaQuery } from "@/src/shared/hooks/use-media-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/components/atoms/shadcn-ui/table";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";

export interface PortalDataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

export interface PortalDataTableProps<T> {
  columns: PortalDataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Test-only override; production callers rely on the viewport. */
  forceMobile?: boolean;
}

export function PortalDataTable<T>({ columns, rows, getRowKey, forceMobile }: PortalDataTableProps<T>) {
  const isMobileQuery = useMediaQuery("(max-width: 767px)");
  const isMobile = forceMobile ?? isMobileQuery;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={getRowKey(row)} className="p-4">
            <dl className="space-y-1.5">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{col.header}</dt>
                  <dd className="text-right font-medium">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
