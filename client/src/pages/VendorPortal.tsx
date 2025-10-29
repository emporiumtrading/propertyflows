import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, DollarSign, FileCheck, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import VendorSidebar from "@/components/VendorSidebar";
import Header from "@/components/Header";
import { InteractiveTutorial, useTutorial, type TutorialStep } from "@/components/InteractiveTutorial";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function VendorPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showTutorial } = useTutorial("vendor-portal");

  const vendorTutorialSteps: TutorialStep[] = [
    {
      target: "card-active-jobs",
      title: "Your Active Jobs",
      description: "See all maintenance jobs currently assigned to you. Stay on top of your work queue!",
      position: "bottom",
      action: "Complete jobs quickly for better ratings",
    },
    {
      target: "card-pending-bids",
      title: "Pending Bids",
      description: "Track bids you've submitted that are awaiting property manager approval.",
      position: "bottom",
      action: "Submit competitive bids to win more jobs",
    },
    {
      target: "card-total-earnings",
      title: "Total Earnings",
      description: "Your earnings from all accepted bids. Get paid faster by completing work on time!",
      position: "bottom",
      action: "Maximize earnings with quality work",
    },
    {
      target: "button-view-jobs",
      title: "View All Jobs",
      description: "Click here to see available jobs, submit bids, and manage your active assignments.",
      position: "left",
      action: "Browse jobs and submit bids",
    },
    {
      target: "button-view-completed",
      title: "Completed Work",
      description: "Upload photos and documentation for finished jobs here to get paid!",
      position: "left",
      action: "Document your work for faster payment",
    },
  ];

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/vendor-jobs'],
  });

  const { data: bids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['/api/vendor-bids'],
  });

  const { data: completionDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['/api/work-completion-docs'],
  });

  const activeJobs = (jobs as any[]).filter((j: any) => j.status === 'in_progress' || j.status === 'open').length;
  const pendingBids = (bids as any[]).filter((b: any) => b.status === 'pending').length;
  const completedJobs = (completionDocs as any[]).length;
  const totalEarnings = (bids as any[])
    .filter((b: any) => b.status === 'accepted')
    .reduce((sum: number, b: any) => sum + parseFloat(b.bidAmount || '0'), 0);

  if (jobsLoading || bidsLoading || docsLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <VendorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading vendor portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {showTutorial && (
        <InteractiveTutorial
          steps={vendorTutorialSteps}
          tutorialKey="vendor-portal"
          onComplete={() => toast({
            title: "Tutorial Complete!",
            description: "Start winning jobs and growing your business!",
          })}
          onSkip={() => toast({
            title: "Tutorial Skipped",
            description: "You can restart it anytime from settings.",
          })}
        />
      )}
      <VendorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Vendor Dashboard" 
          subtitle="Manage your jobs, bids, and earnings"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card data-testid="card-active-jobs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeJobs}</div>
                <p className="text-sm text-muted-foreground mt-1">In progress</p>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-bids">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingBids}</div>
                <p className="text-sm text-muted-foreground mt-1">Awaiting response</p>
              </CardContent>
            </Card>

            <Card data-testid="card-completed-jobs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedJobs}</div>
                <p className="text-sm text-muted-foreground mt-1">Finished jobs</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-earnings">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalEarnings.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">Accepted bids</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-view-jobs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">My Jobs</CardTitle>
                    <p className="text-sm text-muted-foreground">{activeJobs} active</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/vendor-portal/jobs">
                  <Button className="w-full" data-testid="button-view-jobs">
                    View Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-view-bids">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">My Bids</CardTitle>
                    <p className="text-sm text-muted-foreground">{pendingBids} pending</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/vendor-portal/bids">
                  <Button className="w-full" variant="outline" data-testid="button-view-bids">
                    View Bids
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-view-completed">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <FileCheck className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Completed Work</CardTitle>
                    <p className="text-sm text-muted-foreground">{completedJobs} jobs</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/vendor-portal/completed">
                  <Button className="w-full" variant="outline" data-testid="button-view-completed">
                    View Completed
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-total-jobs">
                    {(jobs as any[]).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bid Acceptance Rate</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-acceptance-rate">
                    {(bids as any[]).length > 0 
                      ? `${Math.round(((bids as any[]).filter((b: any) => b.status === 'accepted').length / (bids as any[]).length) * 100)}%`
                      : '0%'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Bid Amount</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-avg-bid">
                    ${(bids as any[]).length > 0 
                      ? ((bids as any[]).reduce((sum: number, b: any) => sum + parseFloat(b.bidAmount || '0'), 0) / (bids as any[]).length).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
