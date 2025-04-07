import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  Tag,
  Briefcase,
  Vault,
  FileText
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { t, isRtl } = useLanguage();

  const menuItems = [
    { href: "/", icon: <BarChart3 className="h-5 w-5" />, label: "dashboard" },
    { href: "/members", icon: <Users className="h-5 w-5" />, label: "members" },
    { href: "/categories", icon: <Tag className="h-5 w-5" />, label: "categories" },
    { href: "/initiatives", icon: <Briefcase className="h-5 w-5" />, label: "initiatives" },
    { href: "/vault", icon: <Vault className="h-5 w-5" />, label: "vault" },
    { href: "/reports", icon: <FileText className="h-5 w-5" />, label: "reports" },
  ];

  return (
    <aside className="w-64 bg-background border-r min-h-screen flex flex-col">
      <div className="h-16 border-b flex items-center justify-center px-4">
        <h1 className="text-xl font-medium text-primary">
          {t("Charity Tracking")}
        </h1>
      </div>

      <nav className="flex-1 py-4 flex flex-col">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <Button 
                  variant={location === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    location === item.href ? "bg-secondary text-secondary-foreground" : ""
                  )}
                >
                  <span className={cn(isRtl ? "ml-2" : "mr-2")}>{item.icon}</span>
                  {t(item.label)}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <LanguageToggle />
      </div>
    </aside>
  );
}
