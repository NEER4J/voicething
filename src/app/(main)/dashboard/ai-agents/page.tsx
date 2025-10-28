"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardAction } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useAuth } from "@/lib/auth/use-auth";
import { getAgents, deleteAgent } from "@/server/agents-actions";
import type { Agent } from "@/types/agents";

import { createAgentsColumns } from "./_components/agents-columns";

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const loadAgents = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = await getAgents(user.id);
      setAgents(data);
    } catch (error) {
      console.error("Error loading agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAgents();
  }, [user?.id, loadAgents]);

  const handleView = (agent: Agent) => {
    router.push(`/dashboard/ai-agents/${agent.id}`);
  };

  const handleEdit = (agent: Agent) => {
    router.push(`/dashboard/ai-agents/${agent.id}`);
  };

  const handleDelete = async (agent: Agent) => {
    if (!user?.id) return;

    const confirmed = confirm(`Are you sure you want to delete "${agent.name}"?`);
    if (!confirmed) return;

    try {
      const result = await deleteAgent(user.id, agent.id);
      if (result.success) {
        toast.success("Agent deleted successfully");
        loadAgents(); // Reload the list
      } else {
        toast.error(result.error ?? "Failed to delete agent");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  const columns = createAgentsColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const table = useDataTableInstance({
    data: agents,
    columns,
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <Empty>
          <EmptyMedia variant="icon">
            <Bot />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No AI Agents Yet</EmptyTitle>
            <EmptyDescription>
              Create your first AI assistant to start handling calls and messages automatically.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.push("/dashboard/ai-agents/setup")}>
              <Plus />
              Create Your First Agent
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>AI Agents</CardTitle>
          <CardDescription>Manage your AI assistants for calls, messages, and automations.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push("/dashboard/ai-agents/setup")} size="sm">
                <Plus />
                <span className="hidden lg:inline">Create New Agent</span>
              </Button>
              <DataTableViewOptions table={table} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          <div className="overflow-hidden rounded-md border">
            <DataTable table={table} columns={columns} />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}

