import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Category } from "@shared/schema";
import { Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useLanguage();
  
  // Get initiatives count for this category
  const { data: initiatives = [] } = useQuery({
    queryKey: ['/api/initiatives'],
  });
  
  const initiativesCount = initiatives.filter(
    (initiative: any) => initiative.category_id === category.id
  ).length;

  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{category.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("initiativesCount", { count: initiativesCount })}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardContent>
    </Card>
  );
}
