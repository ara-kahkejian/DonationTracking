import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";

interface ProgressInitiativeProps {
  title: string;
  percentage: number;
}

export function ProgressInitiative({ title, percentage }: ProgressInitiativeProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
