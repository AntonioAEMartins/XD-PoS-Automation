"use client";

import { AlertCircle, ShoppingBag } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

import type { TableDetailQueryState } from "./types";

type TableItemsPanelProps = {
  query: TableDetailQueryState;
};

export function TableItemsPanel({ query }: TableItemsPanelProps) {
  const table = query.data?.table;
  const isLoading = query.isLoading && !table;
  const hasError = !!query.error && !table;

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Table items
          </CardTitle>
          <CardDescription>
            {table
              ? `Total value ${formatCurrency(table.total)}`
              : "Last per-item refresh"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <ItemsSkeleton />}
        {hasError && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Unable to load table items.</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => query.mutate()}
              className="text-destructive"
            >
              Try again
            </Button>
          </div>
        )}
        {!isLoading && !hasError && table && (
          <>
            {table.content.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items recorded right now.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.content.map(line => (
                      <TableRow key={line.guid}>
                        <TableCell className="font-medium">
                          {line.itemName ?? line.itemId}
                        </TableCell>
                        <TableCell className="text-sm">{line.quantity}</TableCell>
                        <TableCell className="text-sm">
                          {formatCurrency(line.price)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {formatCurrency(line.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <dl className="mt-4 grid gap-4 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-semibold">{table.tableLocation ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Global discount</dt>
                <dd className="font-semibold">
                  {table.globalDiscount
                    ? formatCurrency(table.globalDiscount)
                    : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Active items</dt>
                <dd className="font-semibold">{table.content.length}</dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ItemsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-2">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

