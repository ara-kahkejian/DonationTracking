import { Sidebar } from "./sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useLanguage } from "@/contexts/LanguageContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isRtl } = useLanguage();

  return (
    <div className={`min-h-screen bg-background ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto max-h-screen">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
