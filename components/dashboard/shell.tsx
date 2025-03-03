import { DashboardNav } from "@/components/dashboard/nav";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-64 flex-col border-r bg-background">
        <div className="flex-1 overflow-auto py-8 px-4">
          <DashboardNav />
        </div>
      </div>
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">{children}</div>
      </main>
    </div>
  );
}