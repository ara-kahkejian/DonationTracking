import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

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

type WithdrawFormValues = z.infer<typeof formSchema>;

interface VaultWithdrawFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

export function VaultWithdrawForm({
  open,
  onOpenChange,
  currentBalance,
}: VaultWithdrawFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(formSchema.refine(
      (data) => data.amount <= currentBalance,
      {
        message: "Amount cannot exceed current vault balance",
        path: ["amount"],
      }
    )),
    defaultValues: {
      amount: undefined,
      description: "",
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawFormValues) => {
      const transaction = {
        type: "withdraw",
        amount: data.amount.toString(), // Convert to string to satisfy schema
        description: data.description || "Manual withdrawal",
      };
      
      const res = await apiRequest("POST", "/api/vault/transactions", transaction);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: t("Withdrawal successful"),
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

  const onSubmit = (data: WithdrawFormValues) => {
    setIsSubmitting(true);
    withdrawMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("vaultWithdraw")}</DialogTitle>
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
                  <p className="text-[0.8rem] text-muted-foreground">
                    {t("Cannot exceed current vault balance")} ({formatCurrency(currentBalance)})
                  </p>
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
              <Button type="submit" variant="outline" disabled={isSubmitting}>
                {isSubmitting ? t("Processing...") : t("withdraw")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
