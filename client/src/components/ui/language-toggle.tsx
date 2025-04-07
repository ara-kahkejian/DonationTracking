import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 w-full"
      onClick={toggleLanguage}
    >
      <Globe className="h-4 w-4" />
      <span>{t('language')}</span>
    </Button>
  );
}
