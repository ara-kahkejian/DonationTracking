import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryCard } from "@/components/categories/category-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Category } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function CategoriesPage() {
  const { t, isRtl } = useLanguage();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch categories data
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Filter categories by search term
  const filteredCategories = categories.filter((category: Category) => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t("categories")}</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-full max-w-xs bg-muted rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("categories")}</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addCategory")}
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className={`absolute ${isRtl ? 'right-2' : 'left-2'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
        <Input
          placeholder={t("searchCategories")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${isRtl ? 'pr-8' : 'pl-8'}`}
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category: Category) => (
            <CategoryCard key={category.id} category={category} />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchTerm ? t("No results found") : t("No categories available")}
          </div>
        )}
      </div>

      <CategoryForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
