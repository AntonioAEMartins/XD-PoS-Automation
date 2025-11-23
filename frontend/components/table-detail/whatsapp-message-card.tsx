"use client";

import { AlertCircle, MessageCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableMessage } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";

type WhatsAppMessageCardProps = {
  tableId: number;
};

export function WhatsAppMessageCard({ tableId }: WhatsAppMessageCardProps) {
  const { data, error, isLoading, mutate } = useTableMessage(tableId);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-secondary" />
          WhatsApp message
        </CardTitle>
        <CardDescription>
          Response from endpoint /tables/{tableId}/message/
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <MessageSkeleton />}
        {error && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load the message.</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => mutate()}
              className="text-destructive"
            >
              Try again
            </Button>
          </div>
        )}
        {!isLoading && !error && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm shadow-inner">
              <pre className="mono whitespace-pre-wrap text-xs leading-6 text-foreground">
                {data?.message ?? "Message not available right now."}
              </pre>
            </div>

            {data?.details?.orders && data.details.orders.length > 0 && (
              <div className="rounded-lg border bg-card/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Order summary
                </p>
                <ul className="space-y-1 text-sm">
                  {data.details.orders.map((order, index) => (
                    <li key={`${order.product_name}-${index}`} className="flex justify-between gap-2">
                      <span className="truncate">
                        {order.quantity}x {order.product_name}
                      </span>
                      <span className="font-semibold">{formatCurrency(order.total ?? 0)}</span>
                    </li>
                  ))}
                </ul>
                {typeof data.details.total === "number" && (
                  <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(data.details.total)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

