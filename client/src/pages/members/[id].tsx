import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberCard } from "@/components/members/member-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MemberDetailsPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const memberId = parseInt(id);

  // Fetch member details
  const { data: member, isLoading: isMemberLoading, error: memberError } = useQuery({
    queryKey: [`/api/members/${memberId}`],
    enabled: !isNaN(memberId),
  });

  // Fetch member initiatives
  const { data: initiatives = [], isLoading: isInitiativesLoading } = useQuery({
    queryKey: [`/api/members/${memberId}/initiatives`],
    enabled: !isNaN(memberId),
  });

  if (isNaN(memberId)) {
    return <div className="text-center p-6">{t("Invalid member ID")}</div>;
  }

  if (isMemberLoading || isInitiativesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("memberDetails")}</h2>
        </div>
        <Skeleton className="w-full h-[200px] rounded-lg" />
        <h3 className="text-xl font-semibold mt-6">{t("memberInitiatives")}</h3>
        <Skeleton className="w-full h-[400px] rounded-lg" />
      </div>
    );
  }

  if (memberError || !member) {
    return <div className="text-center p-6">{t("Member not found")}</div>;
  }

  return <MemberCard member={member} initiatives={initiatives} />;
}
