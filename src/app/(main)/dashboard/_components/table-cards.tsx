"use client";

import { Download, Phone, MessageSquare, User, CheckSquare } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardAction } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { recentActivityColumns } from "./columns.crm";
import { recentActivityData } from "./crm.config";

export function TableCards() {
  const table = useDataTableInstance({
    data: recentActivityData,
    columns: recentActivityColumns,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Track your latest calls, messages, and AI interactions.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Phone />
                <span className="hidden lg:inline">Make Call</span>
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare />
                <span className="hidden lg:inline">Send Message</span>
              </Button>
              <Button variant="outline" size="sm">
                <User />
                <span className="hidden lg:inline">Add Contact</span>
              </Button>
              <Button variant="outline" size="sm">
                <CheckSquare />
                <span className="hidden lg:inline">View Tasks</span>
              </Button>
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm">
                <Download />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          <div className="overflow-hidden rounded-md border">
            <DataTable table={table} columns={recentActivityColumns} />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}
