import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useLanguage } from "@/contexts/LanguageContext";
import { InitiativeView, MemberInitiativeView } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Edit, ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import { InitiativeForm } from "./initiative-form";
import { MemberInitiativeForm } from "./member-initiative-form";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InitiativeCardProps {
  initiative: InitiativeView;
  members: MemberInitiativeView[];
}

export function InitiativeCard({ initiative, members }: InitiativeCardProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);

  // Calculate totals
  const totalMembers = members.length;
  const donorsCount = members.filter(m => m.role === 'donor').length;
  const donationsTotal = members
    .filter(m => m.role === 'donor')
    .reduce((sum, m) => sum + Number(m.amount), 0);
  const beneficiariesCount = members.filter(m => m.role === 'beneficiary').length;
  const beneficiariesTotal = members
    .filter(m => m.role === 'beneficiary')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/member-initiatives/${id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: t("Member removed from initiative"),
      });
      // Invalidate both the members list and the initiative details to refresh all metrics
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiative.id}`] });
      // Also refresh the initiative list to update dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
    },
    onError: (error: Error) => {
      toast({
        title: t("Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteMember = (id: number) => {
    setMemberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      deleteMemberMutation.mutate(memberToDelete);
    }
    setDeleteDialogOpen(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'upcoming': return 'secondary';
      case 'ended': return 'outline';
      default: return 'outline';
    }
  };

  const memberColumns = [
    {
      id: "id",
      accessorKey: "member_id",
      header: "ID",
      cell: (member: MemberInitiativeView) => member.member_id,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "first_name",
      accessorKey: "first_name",
      header: "firstName",
      cell: (member: MemberInitiativeView) => member.first_name,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "last_name",
      accessorKey: "last_name",
      header: "lastName",
      cell: (member: MemberInitiativeView) => member.last_name,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "phone_number",
      accessorKey: "phone_number",
      header: "phoneNumber",
      cell: (member: MemberInitiativeView) => member.phone_number,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "address",
      accessorKey: "address",
      header: "address",
      cell: (member: MemberInitiativeView) => member.address || "-",
      enableSorting: false,
      enableFiltering: true,
    },
    {
      id: "role",
      accessorKey: "role",
      header: "role",
      cell: (member: MemberInitiativeView) => (
        <Badge variant={member.role === 'donor' ? "default" : "secondary"}>
          {t(member.role)}
        </Badge>
      ),
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: "amount",
      cell: (member: MemberInitiativeView) => `$${Number(member.amount).toFixed(2)}`,
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "date",
      accessorKey: "participation_date",
      header: "participationDate",
      cell: (member: MemberInitiativeView) => formatDate(member.participation_date),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "actions",
      accessorKey: "id",
      header: "actions",
      cell: (member: MemberInitiativeView) => (
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={() => handleDeleteMember(member.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableFiltering: false,
    }
  ];

  const footerContent = (
    <div className="flex flex-wrap justify-between items-center text-sm">
      <div>
        <span className="font-medium">{t("totalMembers")}: </span>
        <span className="font-bold">{totalMembers}</span>
      </div>
      <div>
        <span className="font-medium">{t("donorsCount")}: </span>
        <span className="font-bold">{donorsCount}</span> | 
        <span className="font-medium ml-1">{t("totalDonations")}: </span>
        <span className="font-bold">${donationsTotal.toFixed(2)}</span>
      </div>
      <div>
        <span className="font-medium">{t("beneficiariesCount")}: </span>
        <span className="font-bold">{beneficiariesCount}</span> | 
        <span className="font-medium ml-1">{t("totalBeneficiaries")}: </span>
        <span className="font-bold">${beneficiariesTotal.toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/initiatives">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">{t("initiativeDetails")}</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setMemberModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t("connectMember")}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t("edit")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{initiative.title}</span>
            <Badge variant={getStatusBadgeVariant(initiative.status)}>
              {t(initiative.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("ID")}</h3>
            <p className="mt-1">{initiative.id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("category")}</h3>
            <p className="mt-1">{initiative.category_name}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t("description")}</h3>
            <p className="mt-1">{initiative.description || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("startingDate")}</h3>
            <p className="mt-1">{formatDate(initiative.starting_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("endingDate")}</h3>
            <p className="mt-1">{formatDate(initiative.ending_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("donationsGoal")}</h3>
            <p className="mt-1">${Number(initiative.donations_goal).toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("createdDate")}</h3>
            <p className="mt-1">{formatDate(initiative.created_at)}</p>
          </div>
          <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t("totalDonations")}</h3>
              <p className="mt-1 font-medium text-primary">
                ${Number(initiative.total_donations).toFixed(2)} 
                <span className="text-sm text-muted-foreground ml-1">
                  ({initiative.total_donors} {t("donors")})
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t("totalBeneficiaries")}</h3>
              <p className="mt-1 font-medium text-secondary">
                ${Number(initiative.total_beneficiaries_amount).toFixed(2)}
                <span className="text-sm text-muted-foreground ml-1">
                  ({initiative.total_beneficiaries} {t("beneficiaries")})
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h3 className="text-xl font-semibold mt-6">{t("initiativeMembers")}</h3>
      <DataTable
        columns={memberColumns}
        data={members}
        searchable={true}
        searchPlaceholder="searchMembers"
        initialSortColumn="participation_date"
        initialSortDirection="desc"
        footerContent={footerContent}
      />

      <InitiativeForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={initiative}
        mode="edit"
        id={initiative.id}
      />

      <MemberInitiativeForm
        open={memberModalOpen}
        onOpenChange={setMemberModalOpen}
        initiativeId={initiative.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Confirm Deletion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to remove this member from the initiative? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
