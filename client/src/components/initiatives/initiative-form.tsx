import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInitiativeSchema } from "@shared/schema";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the schema with validation
const formSchema = insertInitiativeSchema.extend({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters long",
  }),
  donations_goal: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().positive().min(0.01, {
      message: "Donations goal must be greater than 0",
    })
  ),
  starting_date: z.string(), // Accept string format from inputs
  ending_date: z.string(),   // Accept string format from inputs
});

type InitiativeFormValues = z.infer<typeof formSchema>;

interface InitiativeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<InitiativeFormValues>;
  mode: "add" | "edit";
  id?: number;
}

export function InitiativeForm({
  open,
  onOpenChange,
  initialData = {},
  mode,
  id,
}: InitiativeFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const form = useForm<InitiativeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      category_id: initialData.category_id || undefined,
      description: initialData.description || "",
      starting_date: initialData.starting_date 
        ? new Date(initialData.starting_date).toISOString().slice(0, 10) 
        : "",
      ending_date: initialData.ending_date 
        ? new Date(initialData.ending_date).toISOString().slice(0, 10) 
        : "",
      donations_goal: initialData.donations_goal || undefined,
    },
  });

  const addInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormValues) => {
      const res = await apiRequest("POST", "/api/initiatives", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: t("Initiative added successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("Error"),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormValues) => {
      const res = await apiRequest("PUT", `/api/initiatives/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: t("Initiative updated successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      }
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("Error"),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: InitiativeFormValues) => {
    setIsSubmitting(true);
    if (mode === "add") {
      addInitiativeMutation.mutate(data);
    } else if (id) {
      updateInitiativeMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? t("addInitiative") : t("editInitiative")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select a category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-[0.8rem] text-muted-foreground">
                    {t("Optional")}
                  </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donations_goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("donationsGoal")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="starting_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("startingDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ending_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("endingDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
