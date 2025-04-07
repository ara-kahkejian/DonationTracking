import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import * as Excel from 'exceljs';
import { saveAs } from 'file-saver';
import { Category, Initiative, MemberView } from "@shared/schema";

interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  initiativeId?: number;
  categoryId?: number;
  memberId?: number;
  minAmount?: number;
  maxAmount?: number;
  role?: string;
  status?: string;
}

interface DonationReportItem {
  donation_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  initiative_title: string;
  category_name: string;
  amount: string;
  participation_date: string;
}

interface BeneficiaryReportItem {
  beneficiary_record_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  initiative_title: string;
  category_name: string;
  amount: string;
  participation_date: string;
}

interface InitiativeReportItem {
  id: number;
  title: string;
  category_name: string;
  status: string;
  starting_date: string;
  ending_date: string;
  donations_goal: string;
  total_donors: number;
  total_donations: string;
  total_beneficiaries: number;
}

interface MemberReportItem {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  total_donations: string;
  total_benefits: string;
  donation_count: number;
  benefit_count: number;
}

type ReportItem = DonationReportItem | BeneficiaryReportItem | InitiativeReportItem | MemberReportItem;

export default function ReportsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("donations");
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: undefined,
    endDate: undefined,
    initiativeId: undefined,
    categoryId: undefined,
    memberId: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    role: undefined,
    status: undefined
  });

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Fetch initiatives for filter dropdown
  const { data: initiatives = [] } = useQuery<Initiative[]>({
    queryKey: ['/api/initiatives'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Fetch members for filter dropdown
  const { data: members = [] } = useQuery<MemberView[]>({
    queryKey: ['/api/members'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Query reference to allow manual refetching
  const reportsQuery = useQuery({
    queryKey: ['/api/reports', activeTab, filters],
    queryFn: async () => {
      const data = await apiRequest(`/api/reports/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      return data as ReportItem[];
    },
    enabled: activeTab !== '',
  });

  // Setting the report data and loading state from the query
  const reportData = reportsQuery.data || [];
  const isLoading = reportsQuery.isLoading;

  // Handle form submission
  const applyFilters = () => {
    reportsQuery.refetch();
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      initiativeId: undefined,
      categoryId: undefined,
      memberId: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      role: undefined,
      status: undefined
    });
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!reportData.length) return;

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(t(activeTab));

    // Define columns based on report type
    let columns;
    if (activeTab === 'donations') {
      columns = [
        { header: t('ID'), key: 'donation_id', width: 10 },
        { header: t('firstName'), key: 'first_name', width: 20 },
        { header: t('lastName'), key: 'last_name', width: 20 },
        { header: t('phoneNumber'), key: 'phone_number', width: 20 },
        { header: t('initiativeTitle'), key: 'initiative_title', width: 30 },
        { header: t('category'), key: 'category_name', width: 20 },
        { header: t('amount'), key: 'amount', width: 15 },
        { header: t('date'), key: 'participation_date', width: 20 },
      ];
    } else if (activeTab === 'beneficiaries') {
      columns = [
        { header: t('ID'), key: 'beneficiary_record_id', width: 10 },
        { header: t('firstName'), key: 'first_name', width: 20 },
        { header: t('lastName'), key: 'last_name', width: 20 },
        { header: t('phoneNumber'), key: 'phone_number', width: 20 },
        { header: t('address'), key: 'address', width: 30 },
        { header: t('initiativeTitle'), key: 'initiative_title', width: 30 },
        { header: t('category'), key: 'category_name', width: 20 },
        { header: t('amount'), key: 'amount', width: 15 },
        { header: t('date'), key: 'participation_date', width: 20 },
      ];
    } else if (activeTab === 'initiatives') {
      columns = [
        { header: t('ID'), key: 'id', width: 10 },
        { header: t('title'), key: 'title', width: 30 },
        { header: t('category'), key: 'category_name', width: 20 },
        { header: t('status'), key: 'status', width: 15 },
        { header: t('startingDate'), key: 'starting_date', width: 20 },
        { header: t('endingDate'), key: 'ending_date', width: 20 },
        { header: t('donationsGoal'), key: 'donations_goal', width: 15 },
        { header: t('donorsCount'), key: 'total_donors', width: 15 },
        { header: t('totalDonations'), key: 'total_donations', width: 15 },
        { header: t('beneficiariesCount'), key: 'total_beneficiaries', width: 15 },
      ];
    } else {
      columns = [
        { header: t('ID'), key: 'id', width: 10 },
        { header: t('firstName'), key: 'first_name', width: 20 },
        { header: t('lastName'), key: 'last_name', width: 20 },
        { header: t('phoneNumber'), key: 'phone_number', width: 20 },
        { header: t('address'), key: 'address', width: 30 },
        { header: t('totalDonations'), key: 'total_donations', width: 15 },
        { header: t('totalBeneficiaries'), key: 'total_benefits', width: 15 },
        { header: t('donations'), key: 'donation_count', width: 15 },
        { header: t('beneficiaries'), key: 'benefit_count', width: 15 },
      ];
    }
    
    worksheet.columns = columns;

    // Format and add data
    const formattedData = reportData.map(item => {
      const row = { ...item };
      // Format dates
      for (const key in row) {
        if (typeof row[key] === 'string' && row[key].match(/^\d{4}-\d{2}-\d{2}T/)) {
          row[key] = formatDate(new Date(row[key]));
        }
      }
      return row;
    });

    worksheet.addRows(formattedData);

    // Generate and save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${t(activeTab)}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Table columns for different report types
  const donationsColumns = [
    {
      accessorKey: "first_name",
      header: t("firstName"),
    },
    {
      accessorKey: "last_name",
      header: t("lastName"),
    },
    {
      accessorKey: "phone_number",
      header: t("phoneNumber"),
    },
    {
      accessorKey: "initiative_title",
      header: t("initiativeTitle"),
    },
    {
      accessorKey: "category_name",
      header: t("category"),
    },
    {
      accessorKey: "amount",
      header: t("amount"),
      cell: ({ row }) => `$${Number(row.original.amount).toFixed(2)}`,
    },
    {
      accessorKey: "participation_date",
      header: t("date"),
      cell: ({ row }) => formatDate(row.original.participation_date),
    },
  ];

  const beneficiariesColumns = [
    {
      accessorKey: "first_name",
      header: t("firstName"),
    },
    {
      accessorKey: "last_name",
      header: t("lastName"),
    },
    {
      accessorKey: "phone_number",
      header: t("phoneNumber"),
    },
    {
      accessorKey: "address",
      header: t("address"),
    },
    {
      accessorKey: "initiative_title",
      header: t("initiativeTitle"),
    },
    {
      accessorKey: "amount",
      header: t("amount"),
      cell: ({ row }) => `$${Number(row.original.amount).toFixed(2)}`,
    },
    {
      accessorKey: "participation_date",
      header: t("date"),
      cell: ({ row }) => formatDate(row.original.participation_date),
    },
  ];

  const initiativesColumns = [
    {
      accessorKey: "title",
      header: t("title"),
    },
    {
      accessorKey: "category_name",
      header: t("category"),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => t(row.original.status),
    },
    {
      accessorKey: "starting_date",
      header: t("startingDate"),
      cell: ({ row }) => formatDate(row.original.starting_date),
    },
    {
      accessorKey: "ending_date",
      header: t("endingDate"),
      cell: ({ row }) => formatDate(row.original.ending_date),
    },
    {
      accessorKey: "donations_goal",
      header: t("donationsGoal"),
      cell: ({ row }) => `$${Number(row.original.donations_goal).toFixed(2)}`,
    },
    {
      accessorKey: "total_donors",
      header: t("donorsCount"),
    },
    {
      accessorKey: "total_donations",
      header: t("totalDonations"),
      cell: ({ row }) => `$${Number(row.original.total_donations).toFixed(2)}`,
    },
    {
      accessorKey: "total_beneficiaries",
      header: t("beneficiariesCount"),
    },
  ];

  const membersColumns = [
    {
      accessorKey: "first_name",
      header: t("firstName"),
    },
    {
      accessorKey: "last_name",
      header: t("lastName"),
    },
    {
      accessorKey: "phone_number",
      header: t("phoneNumber"),
    },
    {
      accessorKey: "address",
      header: t("address"),
    },
    {
      accessorKey: "total_donations",
      header: t("totalDonations"),
      cell: ({ row }) => `$${Number(row.original.total_donations).toFixed(2)}`,
    },
    {
      accessorKey: "total_benefits",
      header: t("totalBeneficiaries"),
      cell: ({ row }) => `$${Number(row.original.total_benefits).toFixed(2)}`,
    },
    {
      accessorKey: "donation_count",
      header: t("donations", { count: "" }),
    },
    {
      accessorKey: "benefit_count",
      header: t("beneficiaries", { count: "" }),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">{t("reports")}</h1>
      
      <Tabs defaultValue="donations" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="donations">{t("donor")}</TabsTrigger>
          <TabsTrigger value="beneficiaries">{t("beneficiary")}</TabsTrigger>
          <TabsTrigger value="initiatives">{t("initiatives")}</TabsTrigger>
          <TabsTrigger value="members">{t("members")}</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Date range filters */}
              <div className="space-y-2">
                <Label>{t("startingDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? (
                        format(filters.startDate, "PPP")
                      ) : (
                        <span>{t("selectDate")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => setFilters({...filters, startDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>{t("endingDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? (
                        format(filters.endDate, "PPP")
                      ) : (
                        <span>{t("selectDate")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => setFilters({...filters, endDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Initiative filter */}
              <div className="space-y-2">
                <Label>{t("initiative")}</Label>
                <Select
                  value={filters.initiativeId?.toString() || "all"}
                  onValueChange={(value) => setFilters({...filters, initiativeId: value !== "all" ? Number(value) : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectInitiative")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    {initiatives.map((initiative: any) => (
                      <SelectItem key={initiative.id} value={initiative.id.toString()}>
                        {initiative.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category filter */}
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Select
                  value={filters.categoryId?.toString() || "all"}
                  onValueChange={(value) => setFilters({...filters, categoryId: value !== "all" ? Number(value) : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Member filter */}
              <div className="space-y-2">
                <Label>{t("member")}</Label>
                <Select
                  value={filters.memberId?.toString() || "all"}
                  onValueChange={(value) => setFilters({...filters, memberId: value !== "all" ? Number(value) : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectMember")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    {members.map((member: any) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {`${member.first_name} ${member.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Amount range filters */}
              <div className="space-y-2">
                <Label>{t("minAmount")}</Label>
                <Input
                  type="number"
                  value={filters.minAmount || ""}
                  onChange={(e) => setFilters({...filters, minAmount: e.target.value ? Number(e.target.value) : undefined})}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("maxAmount")}</Label>
                <Input
                  type="number"
                  value={filters.maxAmount || ""}
                  onChange={(e) => setFilters({...filters, maxAmount: e.target.value ? Number(e.target.value) : undefined})}
                  min="0"
                />
              </div>
              
              {/* Status filter (only for initiatives) */}
              {activeTab === 'initiatives' && (
                <div className="space-y-2">
                  <Label>{t("status")}</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) => setFilters({...filters, status: value !== "all" ? value : undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all")}</SelectItem>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
                      <SelectItem value="ended">{t("ended")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Role filter (only for members) */}
              {activeTab === 'members' && (
                <div className="space-y-2">
                  <Label>{t("role")}</Label>
                  <Select
                    value={filters.role || "all"}
                    onValueChange={(value) => setFilters({...filters, role: value !== "all" ? value : undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all")}</SelectItem>
                      <SelectItem value="donor">{t("donor")}</SelectItem>
                      <SelectItem value="beneficiary">{t("beneficiary")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={resetFilters}>
                {t("reset")}
              </Button>
              <Button onClick={applyFilters}>
                {t("applyFilters")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold">{t("results")}</h2>
            <Button onClick={exportToExcel} disabled={!reportData.length}>
              {t("exportToExcel")}
            </Button>
          </div>
          
          <TabsContent value="donations">
            <DataTable
              columns={donationsColumns}
              data={reportData}
              noResultsMessage={t("No results found")}
              loading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="beneficiaries">
            <DataTable
              columns={beneficiariesColumns}
              data={reportData}
              noResultsMessage={t("No results found")}
              loading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="initiatives">
            <DataTable
              columns={initiativesColumns}
              data={reportData}
              noResultsMessage={t("No results found")}
              loading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="members">
            <DataTable
              columns={membersColumns}
              data={reportData}
              noResultsMessage={t("No results found")}
              loading={isLoading}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}