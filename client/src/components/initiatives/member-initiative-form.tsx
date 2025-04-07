import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMemberInitiativeSchema } from "@shared/schema";
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

// Extend the schema with validation
// Note: We use the schema from server but customize it slightly for client-side validation
const formSchema = z.object({
  initiative_id: z.number(),
  member_id: z.number(),
  role: z.enum(['donor', 'beneficiary']),
  // For the form we still use number validation for UX, but will convert to string before submission
  amount: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().positive().min(0.01, {
      message: "Amount must be greater than 0",
    })
  ),
});

type MemberInitiativeFormValues = z.infer<typeof formSchema>;

interface MemberInitiativeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: number;
}

export function MemberInitiativeForm({
  open,
  onOpenChange,
  initiativeId,
}: MemberInitiativeFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMemberSelect, setOpenMemberSelect] = useState(false);

  // Fetch members
  const { data: members = [] } = useQuery({
    queryKey: ['/api/members'],
  });

  // Filter members by search term
  const filteredMembers = members.filter((member: any) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const phone = member.phone_number.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || phone.includes(searchLower);
  });

  const form = useForm<MemberInitiativeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initiative_id: initiativeId,
      member_id: undefined,
      role: "donor",
      amount: undefined,
      // participation_date is not in the form as it's set defaultNow() on the server
    },
  });

  // When member is selected, fetch member details
  const onMemberSelect = (memberId: number) => {
    form.setValue("member_id", memberId);
    
    // Get selected member info
    const selectedMember = members.find((m: any) => m.id === memberId);
    if (selectedMember) {
      // Update form with member address or any other relevant info
      setOpenMemberSelect(false);
    }
  };

  const addMemberInitiativeMutation = useMutation({
    // Use any type for the mutationFn to bypass TypeScript checking
    // since we're explicitly handling the conversion in onSubmit
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/initiatives/${initiativeId}/members`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: t("Member connected to initiative successfully"),
      });
      // Invalidate both the members list and the initiative details to refresh all metrics
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`] });
      // Also refresh the initiative list to update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      form.reset({
        initiative_id: initiativeId,
        member_id: undefined,
        role: "donor",
        amount: undefined,
      });
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

  const onSubmit = (data: MemberInitiativeFormValues) => {
    setIsSubmitting(true);
    
    // Ensure amount is sent as a string (critical for PostgreSQL decimal type)
    const amount = data.amount ? data.amount.toString() : "0";
    
    // Only send the necessary data without any date fields
    // Let the database handle the participation_date with its default value
    const submissionData = {
      ...data,
      amount: amount // Explicitly convert to string
    };
    
    console.log("Submitting member initiative data:", submissionData);
    addMemberInitiativeMutation.mutate(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("connectMember")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="member_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("member")}</FormLabel>
                  <Popover open={openMemberSelect} onOpenChange={setOpenMemberSelect}>
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
                            ? members.find((m: any) => m.id === field.value)
                                ? `${members.find((m: any) => m.id === field.value).first_name} ${
                                    members.find((m: any) => m.id === field.value).last_name
                                  }`
                                : t("Select member")
                            : t("Select member")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder={t("searchMember")}
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>{t("No members found")}</CommandEmpty>
                          <CommandGroup>
                            {filteredMembers.map((member: any) => (
                              <CommandItem
                                key={member.id}
                                value={member.id.toString()}
                                onSelect={() => onMemberSelect(member.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === member.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {`${member.first_name} ${member.last_name} (${member.phone_number})`}
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
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("role")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select a role")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="donor">{t("donor")}</SelectItem>
                      <SelectItem value="beneficiary">{t("beneficiary")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
