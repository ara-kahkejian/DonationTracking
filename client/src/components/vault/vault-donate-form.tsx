import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Define form schema
const formSchema = z.object({
  initiative_id: z.number({
    required_error: "Please select an initiative",
  }),
  amount: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().positive().min(0.01, {
      message: "Amount must be greater than 0",
    })
  ),
});

type DonateFormValues = z.infer<typeof formSchema>;

interface VaultDonateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

export function VaultDonateForm({
  open,
  onOpenChange,
  currentBalance,
}: VaultDonateFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openInitiativeSelect, setOpenInitiativeSelect] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<any>(null);

  // Fetch initiatives
  const { data: initiatives = [] } = useQuery({
    queryKey: ['/api/initiatives'],
  });

  // Filter active initiatives
  const activeInitiatives = initiatives.filter(
    (initiative: any) => initiative.status === 'active'
  );

  // Filter by search term
  const filteredInitiatives = activeInitiatives.filter((initiative: any) => {
    return initiative.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const form = useForm<DonateFormValues>({
    resolver: zodResolver(formSchema.refine(
      (data) => data.amount <= currentBalance,
      {
        message: "Amount cannot exceed current vault balance",
        path: ["amount"],
      }
    )),
    defaultValues: {
      initiative_id: undefined,
      amount: undefined,
    },
  });

  // When initiative is selected, update the form and selected initiative
  const onInitiativeSelect = (initiativeId: number) => {
    form.setValue("initiative_id", initiativeId);
    const initiative = initiatives.find((i: any) => i.id === initiativeId);
    if (initiative) {
      setSelectedInitiative(initiative);
      setOpenInitiativeSelect(false);
    }
  };

  const donateMutation = useMutation({
    mutationFn: async (data: any) => {
      const transaction = {
        type: "donation",
        amount: data.amount.toString(), // Convert to string to satisfy schema
        description: `Donation to initiative: ${selectedInitiative.title}`,
        initiative_id: data.initiative_id,
      };
      
      const res = await apiRequest("POST", "/api/vault/transactions", transaction);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: t("Donation successful"),
      });
      
      // Invalidate vault balance and transactions
      queryClient.invalidateQueries({ queryKey: ['/api/vault/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vault/transactions'] });
      
      // Invalidate initiatives list
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      
      // Invalidate the specific initiative and its members if one was selected
      if (selectedInitiative) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/initiatives/${selectedInitiative.id}`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/initiatives/${selectedInitiative.id}/members`] 
        });
      }
      
      form.reset();
      setSelectedInitiative(null);
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

  const onSubmit = (data: DonateFormValues) => {
    setIsSubmitting(true);
    donateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("donateToInitiative")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="initiative_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("Select initiative")}</FormLabel>
                  <Popover open={openInitiativeSelect} onOpenChange={setOpenInitiativeSelect}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? initiatives.find((i: any) => i.id === field.value)?.title
                            : t("Select initiative")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder={t("searchInitiative")}
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>{t("No initiatives found")}</CommandEmpty>
                          <CommandGroup>
                            {filteredInitiatives.map((initiative: any) => (
                              <CommandItem
                                key={initiative.id}
                                value={initiative.id.toString()}
                                onSelect={() => onInitiativeSelect(initiative.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === initiative.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {initiative.title}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedInitiative && (
              <div className="bg-muted p-3 rounded space-y-1 text-sm">
                <h4 className="font-medium mb-2">{t("initiativeDetails")}</h4>
                <p><span className="text-muted-foreground">{t("ID")}:</span> {selectedInitiative.id}</p>
                <p><span className="text-muted-foreground">{t("category")}:</span> {selectedInitiative.category_name}</p>
                <p><span className="text-muted-foreground">{t("donationsGoal")}:</span> {formatCurrency(selectedInitiative.donations_goal)}</p>
                <p><span className="text-muted-foreground">{t("totalDonations")}:</span> {formatCurrency(selectedInitiative.total_donations || 0)}</p>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("donationAmount")}</FormLabel>
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
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("Processing...") : t("donate")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
