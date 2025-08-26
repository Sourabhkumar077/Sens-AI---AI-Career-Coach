import { Suspense } from "react";
import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import { LoadingCard } from "@/components/ui/loading";

// Loading component for dashboard
function DashboardLoading() {
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
      <LoadingCard className="h-[400px]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LoadingCard />
        <LoadingCard />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  // If not onboarded, redirect to onboarding page
  // Skip this check if already on the onboarding page
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="container mx-auto">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

// Separate component for the main content
async function DashboardContent() {
  const insights = await getIndustryInsights();
  return <DashboardView insights={insights} />;
}
