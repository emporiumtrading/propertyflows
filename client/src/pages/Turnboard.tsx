import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { TurnTask, Property, Unit } from "@shared/schema";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["cleaning", "painting", "repairs", "inspection", "hvac", "plumbing", "electrical", "flooring", "appliances", "landscaping"]),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).default("pending"),
  unitId: z.string().optional(),
  notes: z.string().optional(),
});
type CreateTaskForm = z.infer<typeof createTaskSchema>;

export default function Turnboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TurnTask | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<TurnTask[]>({
    queryKey: ["/api/turn-tasks", filter],
    queryFn: async () => {
      const url = filter === "all" 
        ? "/api/turn-tasks"
        : `/api/turn-tasks?status=${filter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return await res.json();
    },
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: !!user?.id,
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    enabled: !!user?.id,
  });

  const filteredUnits = selectedPropertyId
    ? units.filter(unit => unit.propertyId === selectedPropertyId)
    : units;

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      type: "cleaning",
      status: "pending",
      unitId: "",
      notes: "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskForm) => {
      const payload = {
        ...data,
        unitId: data.unitId?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };
      return apiRequest("POST", "/api/turn-tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turn-tasks"], refetchType: "all" });
      toast({ title: "Success", description: "Turn task created successfully" });
      setCreateDialogOpen(false);
      setSelectedPropertyId("");
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create turn task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<TurnTask> }) =>
      apiRequest("PATCH", `/api/turn-tasks/${data.id}`, data.updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/turn-tasks"], refetchType: "all" });
      toast({ title: "Success", description: "Task updated successfully" });
    },
  });

  const handleSubmit = (data: CreateTaskForm) => {
    createTaskMutation.mutate(data);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { status: newStatus as any },
    });
  };

  const handleEditTask = (task: TurnTask) => {
    setSelectedTask(task);
    form.reset({
      title: task.title,
      type: task.type,
      status: task.status,
      unitId: task.unitId || "",
      notes: task.notes || "",
    });
    
    if (task.unitId) {
      const unit = units.find(u => u.id === task.unitId);
      if (unit) {
        setSelectedPropertyId(unit.propertyId);
      }
    }
    
    setEditDialogOpen(true);
  };

  const handleUpdateTask = (data: CreateTaskForm) => {
    if (!selectedTask) return;
    
    const payload = {
      ...data,
      unitId: data.unitId?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };
    
    updateTaskMutation.mutate(
      {
        id: selectedTask.id,
        updates: payload,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedTask(null);
          setSelectedPropertyId("");
          form.reset();
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      in_progress: "bg-blue-500",
      completed: "bg-green-500",
      blocked: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const groupedTasks = {
    pending: tasks.filter((t) => t.status === "pending"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed: tasks.filter((t) => t.status === "completed"),
    blocked: tasks.filter((t) => t.status === "blocked"),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Turnboard" subtitle="Unit turnover task management" user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog 
                open={createDialogOpen} 
                onOpenChange={(open) => {
                  setCreateDialogOpen(open);
                  if (!open) {
                    setSelectedPropertyId("");
                    form.reset();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button data-testid="button-create-task">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Turn Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Turn Task</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cleaning">Cleaning</SelectItem>
                                <SelectItem value="painting">Painting</SelectItem>
                                <SelectItem value="repairs">Repairs</SelectItem>
                                <SelectItem value="inspection">Inspection</SelectItem>
                                <SelectItem value="hvac">HVAC</SelectItem>
                                <SelectItem value="plumbing">Plumbing</SelectItem>
                                <SelectItem value="electrical">Electrical</SelectItem>
                                <SelectItem value="flooring">Flooring</SelectItem>
                                <SelectItem value="appliances">Appliances</SelectItem>
                                <SelectItem value="landscaping">Landscaping</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <div>
                          <FormLabel>Property</FormLabel>
                          <Select 
                            value={selectedPropertyId} 
                            onValueChange={(value) => {
                              setSelectedPropertyId(value);
                              form.setValue("unitId", "");
                            }}
                          >
                            <SelectTrigger data-testid="select-property">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.address}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <FormField
                          control={form.control}
                          name="unitId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit (Optional)</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={!selectedPropertyId}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-unit">
                                    <SelectValue placeholder={selectedPropertyId ? "Select unit" : "Select a property first"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredUnits.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                      Unit {unit.unitNumber}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} data-testid="textarea-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" data-testid="button-submit">
                        Create Task
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog 
                open={editDialogOpen} 
                onOpenChange={(open) => {
                  setEditDialogOpen(open);
                  if (!open) {
                    setSelectedTask(null);
                    setSelectedPropertyId("");
                    form.reset();
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Turn Task</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateTask)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-edit-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-edit-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cleaning">Cleaning</SelectItem>
                                <SelectItem value="painting">Painting</SelectItem>
                                <SelectItem value="repairs">Repairs</SelectItem>
                                <SelectItem value="inspection">Inspection</SelectItem>
                                <SelectItem value="hvac">HVAC</SelectItem>
                                <SelectItem value="plumbing">Plumbing</SelectItem>
                                <SelectItem value="electrical">Electrical</SelectItem>
                                <SelectItem value="flooring">Flooring</SelectItem>
                                <SelectItem value="appliances">Appliances</SelectItem>
                                <SelectItem value="landscaping">Landscaping</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <div>
                          <FormLabel>Property</FormLabel>
                          <Select 
                            value={selectedPropertyId} 
                            onValueChange={(value) => {
                              setSelectedPropertyId(value);
                              form.setValue("unitId", "");
                            }}
                          >
                            <SelectTrigger data-testid="select-edit-property">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.address}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <FormField
                          control={form.control}
                          name="unitId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit (Optional)</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={!selectedPropertyId}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-edit-unit">
                                    <SelectValue placeholder={selectedPropertyId ? "Select unit" : "Select a property first"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredUnits.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                      Unit {unit.unitNumber}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} data-testid="textarea-edit-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" data-testid="button-edit-submit">
                        Update Task
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(groupedTasks).map(([status, statusTasks]) => (
                <Card key={status}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {status === "pending" && <Clock className="h-4 w-4" />}
                      {status === "in_progress" && <Clock className="h-4 w-4 text-blue-500" />}
                      {status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {status === "blocked" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {status.replace("_", " ").toUpperCase()} ({statusTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {statusTasks.map((task) => (
                      <Card key={task.id} className="p-3" data-testid={`task-card-${task.id}`}>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm" data-testid={`task-title-${task.id}`}>
                                {task.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEditTask(task)}
                                data-testid={`button-edit-${task.id}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Badge className={getStatusColor(task.status)} data-testid={`task-badge-${task.id}`}>
                                {task.type}
                              </Badge>
                            </div>
                          </div>
                          {task.notes && (
                            <p className="text-xs text-muted-foreground" data-testid={`task-notes-${task.id}`}>
                              {task.notes}
                            </p>
                          )}
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task.id, value)}
                          >
                            <SelectTrigger className="h-7 text-xs" data-testid={`select-status-${task.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
