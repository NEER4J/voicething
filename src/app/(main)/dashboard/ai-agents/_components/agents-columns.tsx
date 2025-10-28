"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BUSINESS_TYPES, LANGUAGES, TONES, type Agent } from "@/types/agents";

interface AgentsColumnsProps {
  onView: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}

export function createAgentsColumns({
  onView,
  onEdit,
  onDelete,
}: AgentsColumnsProps): ColumnDef<Agent>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          {row.original.vapi_assistant_id && (
            <span className="text-muted-foreground text-xs">ID: {row.original.vapi_assistant_id.slice(0, 8)}...</span>
          )}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "business_type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Business Type" />,
      cell: ({ row }) => {
        const businessType = BUSINESS_TYPES.find((bt) => bt.value === row.original.business_type);
        return <span>{businessType?.label ?? row.original.business_type}</span>;
      },
    },
    {
      accessorKey: "language",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Language" />,
      cell: ({ row }) => {
        const language = LANGUAGES.find((l) => l.value === row.original.language);
        return <Badge variant="outline">{language?.label ?? row.original.language}</Badge>;
      },
    },
    {
      accessorKey: "voice_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Voice" />,
      cell: ({ row }) => <span>{row.original.voice_name}</span>,
    },
    {
      accessorKey: "tone",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tone" />,
      cell: ({ row }) => {
        const tone = TONES.find((t) => t.value === row.original.tone);
        return <Badge variant="secondary">{tone?.label ?? row.original.tone}</Badge>;
      },
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "outline"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        try {
          return <span className="tabular-nums">{format(new Date(row.original.created_at), "MMM d, yyyy")}</span>;
        } catch {
          return <span>-</span>;
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const agent = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(agent)}>
                <Eye className="mr-2 size-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(agent)}>
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(agent)} className="text-destructive">
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

