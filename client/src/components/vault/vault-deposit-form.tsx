import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Define form schema
const formSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().positive().min(0.01, {
      message: "Amount must be greater than 0",
    })
  ),
  description: z.string().optional(),
});

type DepositFormValues = z.infer<typeof formSchema>;

interface VaultDepositFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultDepositForm({
  open,
  onOpenChange,
}: VaultDepositFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      description: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormValues) => {
      const transaction = {
        type: "deposit",
        amount: data.amount.toString(), // Convert to string to satisfy schema
        description: data.description || "Manual deposit",
      };
      
      const res = await apiRequest("POST", "/api/vault/transactions", transaction);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: t("Deposit successful"),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vault/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vault/transactions'] });
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

  const onSubmit = (data: DepositFormValues) => {
    setIsSubmitting(true);
    depositMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("vaultDeposit")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("Optional")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={isSubmitting}>
                {isSubmitting ? t("Processing...") : t("deposit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
