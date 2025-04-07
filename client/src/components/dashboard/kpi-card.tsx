import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
    text: string;
  };
}

export function KPICard({ title, value, change }: KPICardProps) {
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">{t(title)}</h3>
        <p className="text-3xl font-bold text-primary mt-2">{value}</p>
        
        {change && (
          <div className={`flex items-center text-sm mt-2 ${change.isPositive ? 'text-green-600' : 'text-orange-600'}`}>
            {change.isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
            <span>{change.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
