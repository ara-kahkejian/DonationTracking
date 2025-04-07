import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberView, MemberInitiativeView } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useState } from "react";
import { Edit, ArrowLeft } from "lucide-react";
import { MemberForm } from "./member-form";
import { Link } from "wouter";

interface MemberCardProps {
  member: MemberView;
  initiatives: MemberInitiativeView[];
}

export function MemberCard({ member, initiatives }: MemberCardProps) {
  const { t } = useLanguage();
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Calculate totals
  const totalInitiatives = initiatives.length;
  const totalDonations = initiatives
    .filter(i => i.role === 'donor')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalBeneficiaries = initiatives
    .filter(i => i.role === 'beneficiary')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const initiativeColumns = [
    {
      id: "id",
      accessorKey: "initiative_id",
      header: "ID",
      cell: (initiative: MemberInitiativeView) => initiative.initiative_id,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "title",
      accessorKey: "initiative_title",
      header: "initiativeTitle",
      cell: (initiative: MemberInitiativeView) => initiative.initiative_title,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "category",
      accessorKey: "category_name",
      header: "category",
      cell: (initiative: MemberInitiativeView) => initiative.category_name,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "role",
      accessorKey: "role",
      header: "role",
      cell: (initiative: MemberInitiativeView) => (
        <Badge variant={initiative.role === 'donor' ? "default" : "secondary"}>
          {t(initiative.role)}
        </Badge>
      ),
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: "amount",
      cell: (initiative: MemberInitiativeView) => `$${Number(initiative.amount).toFixed(2)}`,
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "date",
      accessorKey: "participation_date",
      header: "participationDate",
      cell: (initiative: MemberInitiativeView) => formatDate(initiative.participation_date),
      enableSorting: true,
      enableFiltering: false,
    }
  ];

  const footerContent = (
    <div className="flex flex-wrap justify-between items-center text-sm">
      <div>
        <span className="font-medium">{t("totalInitiatives")}: </span>
        <span className="font-bold">{totalInitiatives}</span>
      </div>
      <div>
        <span className="font-medium">{t("totalDonations")}: </span>
        <span className="font-bold">${totalDonations.toFixed(2)}</span>
      </div>
      <div>
        <span className="font-medium">{t("totalBeneficiaries")}: </span>
        <span className="font-bold">${totalBeneficiaries.toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">{t("memberDetails")}</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setEditModalOpen(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          {t("edit")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{`${member.first_name} ${member.last_name}`}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("ID")}</h3>
            <p className="mt-1">{member.id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("phoneNumber")}</h3>
            <p className="mt-1">{member.phone_number}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("address")}</h3>
            <p className="mt-1">{member.address || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("createdDate")}</h3>
            <p className="mt-1">{formatDate(member.created_at)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("totalDonations")}</h3>
            <p className="mt-1 font-medium text-primary">${member.total_donations?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("totalBeneficiaries")}</h3>
            <p className="mt-1 font-medium text-secondary">${member.total_beneficiaries?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("mostRecentRole")}</h3>
            <p className="mt-1">
              {member.most_recent_role ? (
                <Badge variant={member.most_recent_role === 'donor' ? "default" : "secondary"}>
                  {t(member.most_recent_role)}
                </Badge>
              ) : "-"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("initiatives")}</h3>
            <p className="mt-1">{member.initiatives_count || 0}</p>
          </div>
        </CardContent>
      </Card>

      <h3 className="text-xl font-semibold mt-6">{t("memberInitiatives")}</h3>
      <DataTable
        columns={initiativeColumns}
        data={initiatives}
        searchable={true}
        searchPlaceholder="searchInitiatives"
        initialSortColumn="participation_date"
        initialSortDirection="desc"
        footerContent={footerContent}
      />

      <MemberForm
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={member}
        mode="edit"
        id={member.id}
      />
    </div>
  );
}
