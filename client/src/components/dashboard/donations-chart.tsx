import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { VaultTransaction } from "@shared/schema";
import { useMemo } from "react";

export function DonationsChart() {
  const { t } = useLanguage();
  
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/vault/transactions'],
  });

  const { data: initiatives = [] } = useQuery({
    queryKey: ['/api/initiatives'],
  });

  // Process transactions data for monthly donations chart
  const monthlyDonationsData = useMemo(() => {
    if (!transactions.length) return [];
    
    const donationsByMonth: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      donationsByMonth[monthKey] = 0;
    }
    
    // Fill with actual data
    transactions.forEach((tx: VaultTransaction) => {
      if (tx.type !== 'donation') return;
      
      const date = new Date(tx.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (donationsByMonth[monthKey] !== undefined) {
        donationsByMonth[monthKey] += parseFloat(tx.amount.toString());
      }
    });
    
    // Convert to chart data format
    return Object.entries(donationsByMonth).map(([month, amount]) => {
      const [year, monthNum] = month.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
      
      return {
        month: monthName,
        amount: amount
      };
    });
  }, [transactions]);
  
  // Process data for initiatives chart
  const initiativesData = useMemo(() => {
    if (!initiatives.length) return [];
    
    return initiatives
      .filter((initiative: any) => initiative.status === 'active')
      .slice(0, 5)
      .map((initiative: any) => ({
        name: initiative.title,
        goal: parseFloat(initiative.donations_goal),
        current: parseFloat(initiative.total_donations || 0),
        percentage: Math.min(
          100, 
          Math.round((parseFloat(initiative.total_donations || 0) / parseFloat(initiative.donations_goal)) * 100)
        )
      }));
  }, [initiatives]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("donationsOverview")}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-full h-full animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("donationsOverview")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyDonationsData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value) => [`$${value}`, t("donations")]}
                labelFormatter={(label) => `${label} ${new Date().getFullYear()}`}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary)/0.2)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {initiativesData.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium mb-4">{t("currentInitiatives")}</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={initiativesData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, ""]}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Bar name={t("current")} dataKey="current" fill="hsl(var(--primary))" />
                  <Bar name={t("goal")} dataKey="goal" fill="hsl(var(--muted-foreground)/0.3)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
