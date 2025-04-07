import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberView } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export function TopDonors() {
  const { t, isRtl } = useLanguage();
  
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['/api/members'],
  });

  const topDonors = members
    .filter((member: MemberView) => member.total_donations && member.total_donations > 0)
    .sort((a: MemberView, b: MemberView) => 
      (b.total_donations || 0) - (a.total_donations || 0)
    )
    .slice(0, 4);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("topDonors")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div className={`${isRtl ? 'mr-3' : 'ml-3'}`}>
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-3 w-16 bg-muted rounded mt-1"></div>
                  </div>
                </div>
                <div className="h-4 w-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topDonors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("topDonors")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t("No donor data available yet")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topDonors")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topDonors.map((donor: MemberView) => {
            const initials = `${donor.first_name.charAt(0)}${donor.last_name.charAt(0)}`.toUpperCase();
            
            // Calculate the number of donations (could be fetched from the API if available)
            // For now, using a placeholder
            
            return (
              <div key={donor.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`${isRtl ? 'mr-3' : 'ml-3'}`}>
                    <p className="font-medium">{`${donor.first_name} ${donor.last_name}`}</p>
                    {/* This would come from actual data */}
                    <p className="text-sm text-muted-foreground">
                      {t("donations", { count: donor.initiatives_count || 0 })}
                    </p>
                  </div>
                </div>
                <span className="font-bold">${donor.total_donations?.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
