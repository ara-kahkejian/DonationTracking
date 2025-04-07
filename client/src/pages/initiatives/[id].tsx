import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { InitiativeCard } from "@/components/initiatives/initiative-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InitiativeDetailsPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const initiativeId = parseInt(id);

  // Fetch initiative details
  const { data: initiative, isLoading: isInitiativeLoading, error: initiativeError } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}`],
    enabled: !isNaN(initiativeId),
  });

  // Fetch initiative members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/members`],
    enabled: !isNaN(initiativeId),
  });

  if (isNaN(initiativeId)) {
    return <div className="text-center p-6">{t("Invalid initiative ID")}</div>;
  }

  if (isInitiativeLoading || isMembersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("initiativeDetails")}</h2>
        </div>
        <Skeleton className="w-full h-[200px] rounded-lg" />
        <h3 className="text-xl font-semibold mt-6">{t("initiativeMembers")}</h3>
        <Skeleton className="w-full h-[400px] rounded-lg" />
      </div>
    );
  }

  if (initiativeError || !initiative) {
    return <div className="text-center p-6">{t("Initiative not found")}</div>;
  }

  return <InitiativeCard initiative={initiative} members={members} />;
}
