import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberForm } from "@/components/members/member-form";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { MemberView } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function MembersPage() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch members data
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['/api/members'],
  });

  // Member table columns
  const columns = [
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: (member: MemberView) => member.id,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "first_name",
      accessorKey: "first_name",
      header: "firstName",
      cell: (member: MemberView) => member.first_name,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "last_name",
      accessorKey: "last_name",
      header: "lastName",
      cell: (member: MemberView) => member.last_name,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "phone_number",
      accessorKey: "phone_number",
      header: "phoneNumber",
      cell: (member: MemberView) => member.phone_number,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "address",
      accessorKey: "address",
      header: "address",
      cell: (member: MemberView) => member.address || "-",
      enableSorting: false,
      enableFiltering: true,
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: "createdDate",
      cell: (member: MemberView) => formatDate(member.created_at),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "total_donations",
      accessorKey: "total_donations",
      header: "totalDonations",
      cell: (member: MemberView) => formatCurrency(member.total_donations || 0),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: "most_recent_role",
      accessorKey: "most_recent_role",
      header: "mostRecentRole",
      cell: (member: MemberView) => {
        if (!member.most_recent_role) return "-";
        
        return (
          <Badge variant={member.most_recent_role === 'donor' ? "default" : "secondary"}>
            {t(member.most_recent_role)}
          </Badge>
        );
      },
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "actions",
      accessorKey: "id",
      header: "actions",
      cell: (member: MemberView) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/members/${member.id}`);
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
  const totalMembersCount = members.length;
  const totalDonationsAmount = members.reduce(
    (sum, member) => sum + (member.total_donations || 0), 
    0
  );
  const totalBeneficiariesAmount = members.reduce(
    (sum, member) => sum + (member.total_beneficiaries || 0), 
    0
  );

  // Table footer with totals
  const footerContent = (
    <div className="flex flex-wrap justify-between items-center text-sm">
      <div>
        <span className="font-medium">{t("totalMembers")}: </span>
        <span className="font-bold">{totalMembersCount}</span>
      </div>
      <div>
        <span className="font-medium">{t("totalDonations")}: </span>
        <span className="font-bold">{formatCurrency(totalDonationsAmount)}</span>
      </div>
      <div>
        <span className="font-medium">{t("totalBeneficiaries")}: </span>
        <span className="font-bold">{formatCurrency(totalBeneficiariesAmount)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("members")}</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addMember")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={members}
        searchable={true}
        searchPlaceholder="searchMembers"
        initialSortColumn="created_at"
        initialSortDirection="desc"
        onRowClick={(member) => navigate(`/members/${member.id}`)}
        footerContent={footerContent}
      />

      <MemberForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        mode="add"
      />
    </div>
  );
}
