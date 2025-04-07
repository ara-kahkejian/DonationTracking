import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ProgressInitiative } from "@/components/dashboard/progress-initiative";
import { TopDonors } from "@/components/dashboard/top-donors";
import { DonationsChart } from "@/components/dashboard/donations-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InitiativeView } from "@shared/schema";
import { calculatePercentage } from "@/lib/utils";

export default function Dashboard() {
  const { t } = useLanguage();

  // Fetch necessary data
  const { data: members = [] } = useQuery({
    queryKey: ['/api/members'],
  });

  const { data: initiatives = [] } = useQuery({
    queryKey: ['/api/initiatives'],
  });

  const { data: vaultData } = useQuery({
    queryKey: ['/api/vault/balance'],
  });

  // Calculate active initiatives
  const activeInitiatives = initiatives.filter(
    (initiative: InitiativeView) => initiative.status === 'active'
  ).slice(0, 4);

  // Extract top 4 active initiatives by percentage of goal reached
  const topActiveInitiatives = [...activeInitiatives]
    .sort((a: InitiativeView, b: InitiativeView) => {
      const aPercentage = calculatePercentage(Number(a.total_donations || 0), Number(a.donations_goal));
      const bPercentage = calculatePercentage(Number(b.total_donations || 0), Number(b.donations_goal));
      return bPercentage - aPercentage;
    })
    .slice(0, 4);

  // Calculate totals for KPIs
  const totalMembers = members.length;
  const totalDonations = initiatives.reduce(
    (sum: number, initiative: InitiativeView) => sum + Number(initiative.total_donations || 0), 
    0
  );
  const totalBeneficiaries = initiatives.reduce(
    (sum: number, initiative: InitiativeView) => sum + Number(initiative.total_beneficiaries || 0), 
    0
  );
  const vaultBalance = vaultData?.balance || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("dashboard")}</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="totalMembers" 
          value={totalMembers} 
          change={{ value: 12, isPositive: true, text: "+12% from last month" }}
        />
        <KPICard 
          title="totalDonations" 
          value={`$${totalDonations.toFixed(2)}`} 
          change={{ value: 5, isPositive: true, text: "+5% from last month" }}
        />
        <KPICard 
          title="totalBeneficiaries" 
          value={totalBeneficiaries} 
          change={{ value: 8, isPositive: true, text: "+8% from last month" }}
        />
        <KPICard 
          title="vaultBalance" 
          value={`$${vaultBalance.toFixed(2)}`} 
          change={{ value: 3, isPositive: false, text: "-3% from last month" }}
        />
      </div>

      {/* Current Initiatives and Top Donors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Initiatives */}
        <Card>
          <CardHeader>
            <CardTitle>{t("currentInitiatives")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topActiveInitiatives.length > 0 ? (
              topActiveInitiatives.map((initiative: InitiativeView) => {
                const percentage = calculatePercentage(
                  Number(initiative.total_donations || 0), 
                  Number(initiative.donations_goal)
                );
                
                return (
                  <ProgressInitiative 
                    key={initiative.id}
                    title={initiative.title}
                    percentage={percentage}
                  />
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t("No active initiatives available")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Donors */}
        <TopDonors />
      </div>

      {/* Donations Overview */}
      <DonationsChart />
    </div>
  );
}
