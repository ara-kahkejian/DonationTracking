import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { InitiativeForm } from "@/components/initiatives/initiative-form";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { InitiativeView } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function InitiativesPage() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch initiatives data
  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ['/api/initiatives'],
  });

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'upcoming': return 'secondary';
      case 'ended': return 'outline';
      default: return 'outline';
    }
  };

  // Initiative table columns
  const columns = [
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: (initiative: InitiativeView) => initiative.id,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "title",
      accessorKey: "title",
      header: "title",
      cell: (initiative: InitiativeView) => initiative.title,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "category",
      accessorKey: "category_name",
      header: "category",
      cell: (initiative: InitiativeView) => initiative.category_name,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "status",
      cell: (initiative: InitiativeView) => (
        <Badge variant={getStatusBadgeVariant(initiative.status)}>
          {t(initiative.status)}
        </Badge>
      ),
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "starting_date",
      accessorKey: "starting_date",
      header: "startingDate",
      cell: (initiative: InitiativeView) => formatDate(initiative.starting_date),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "ending_date",
      accessorKey: "ending_date",
      header: "endingDate",
      cell: (initiative: InitiativeView) => formatDate(initiative.ending_date),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "donations_goal",
      accessorKey: "donations_goal",
      header: "donationsGoal",
      cell: (initiative: InitiativeView) => formatCurrency(initiative.donations_goal),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "total_donations",
      accessorKey: "total_donations",
      header: "totalDonations",
      cell: (initiative: InitiativeView) => formatCurrency(initiative.total_donations || 0),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "total_beneficiaries",
      accessorKey: "total_beneficiaries",
      header: "totalBeneficiaries",
      cell: (initiative: InitiativeView) => initiative.total_beneficiaries || 0,
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "actions",
      accessorKey: "id",
      header: "actions",
      cell: (initiative: InitiativeView) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/initiatives/${initiative.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableFiltering: false,
    }
  ];

  // Calculate totals for the footer
  const initiativesCount = initiatives.length;
  const activeInitiativesCount = initiatives.filter(
    (initiative: InitiativeView) => initiative.status === 'active'
  ).length;
  const totalDonations = initiatives.reduce(
    (sum: number, initiative: InitiativeView) => sum + Number(initiative.total_donations || 0), 
    0
  );
  const totalBeneficiaries = initiatives.reduce(
    (sum: number, initiative: InitiativeView) => sum + Number(initiative.total_beneficiaries || 0), 
    0
  );

  // Table footer with totals
  const footerContent = (
    <div className="flex flex-wrap justify-between items-center text-sm">
      <div>
        <span className="font-medium">{t("initiatives")}: </span>
        <span className="font-bold">{initiativesCount}</span>
      </div>
      <div>
        <span className="font-medium">{t("activeInitiatives")}: </span>
        <span className="font-bold">{activeInitiativesCount}</span>
      </div>
      <div>
        <span className="font-medium">{t("totalDonations")}: </span>
        <span className="font-bold">{formatCurrency(totalDonations)}</span>
      </div>
      <div>
        <span className="font-medium">{t("totalBeneficiaries")}: </span>
        <span className="font-bold">{totalBeneficiaries}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("initiatives")}</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addInitiative")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={initiatives}
        searchable={true}
        searchPlaceholder="searchInitiatives"
        initialSortColumn="starting_date"
        initialSortDirection="desc"
        onRowClick={(initiative) => navigate(`/initiatives/${initiative.id}`)}
        footerContent={footerContent}
      />

      <InitiativeForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        mode="add"
      />
    </div>
  );
}
