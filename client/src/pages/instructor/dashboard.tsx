import { useQuery } from "@tanstack/react-query";
import { Assessment } from "@shared/schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssessmentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

export default function InstructorDashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments/instructor"],
  });

  const form = useForm({
    resolver: zodResolver(insertAssessmentSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      // Log the data being sent
      console.log("Creating assessment with data:", data);

      await apiRequest("POST", "/api/assessments", {
        ...data,
        duration: parseInt(data.duration)
      });

      queryClient.invalidateQueries({ queryKey: ["/api/assessments/instructor"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Assessment created successfully",
      });
    } catch (error: any) {
      console.error("Failed to create assessment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assessment Management</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Assessment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Create
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {assessments?.map((assessment) => (
          <Card key={assessment.id}>
            <CardHeader>
              <CardTitle>{assessment.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {assessment.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      Duration: {assessment.duration} minutes
                    </span>
                    <span className="text-sm">
                      Status: {assessment.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Button
                    variant={assessment.active ? "destructive" : "default"}
                    onClick={async () => {
                      try {
                        await apiRequest("PATCH", `/api/assessments/${assessment.id}`, {
                          active: !assessment.active
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/assessments/instructor"] });
                        toast({
                          title: "Success",
                          description: `Assessment ${assessment.active ? "deactivated" : "activated"} successfully`
                        });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: "Failed to update assessment status",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    {assessment.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}