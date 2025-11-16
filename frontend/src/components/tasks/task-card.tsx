"use client";

import { Task } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Clock,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { deleteTaskAction, toggleTaskAction } from "@/lib/actions/task.actions";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/lib/auth";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onUpdate: () => void;
}

export function TaskCard({ task, onEdit, onUpdate }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

  const handleTokenRefresh = (result: any) => {
    if ("needsLogin" in result && result.needsLogin) {
      clearTokens();
      toast.error("Session expired. Please login again.");
      router.push("/login");
      return false;
    }

    if ("newAccessToken" in result && result.newAccessToken) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        setTokens(result.newAccessToken, refreshToken);
      }
    }

    return true;
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!token || !refreshToken) {
      toast.error("Authentication required");
      router.push("/login");
      return;
    }

    try {
      const result = await deleteTaskAction(token, refreshToken, task.id);

      if (!handleTokenRefresh(result)) return;

      if (!result.success) {
        toast.error(result.error || "Failed to delete task");
        return;
      }

      toast.success("Task deleted successfully");
      onUpdate();
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!token || !refreshToken) {
      toast.error("Authentication required");
      router.push("/login");
      return;
    }

    try {
      const result = await toggleTaskAction(token, refreshToken, task.id);

      if (!handleTokenRefresh(result)) return;

      if (!result.success) {
        toast.error(result.error || "Failed to toggle task status");
        return;
      }

      toast.success("Task status updated");
      onUpdate();
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsToggling(false);
    }
  };

  const StatusIcon =
    task.status === "COMPLETED"
      ? Check
      : task.status === "IN_PROGRESS"
        ? Loader2
        : Clock;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="text-xs">
              Created {formatDate(task.createdAt)}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
                <Check className="mr-2 h-4 w-4" />
                {task.status === "COMPLETED"
                  ? "Mark Incomplete"
                  : "Mark Complete"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        <Badge variant="secondary" className={getStatusColor(task.status)}>
          <StatusIcon
            className={`mr-1 h-3 w-3 ${task.status === "IN_PROGRESS" ? "animate-spin" : ""}`}
          />
          {getStatusLabel(task.status)}
        </Badge>
      </CardContent>
    </Card>
  );
}
