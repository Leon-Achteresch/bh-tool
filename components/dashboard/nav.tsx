"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  BookOpenText, 
  Calendar, 
  FileText, 
  Home, 
  Settings, 
  User, 
  Users 
} from "lucide-react";

interface DashboardNavProps {
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DashboardNav({ setIsOpen }: DashboardNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="mr-2 h-4 w-4" />,
      exact: true
    },
    {
      href: "/dashboard/reports",
      label: "Berichte",
      icon: <FileText className="mr-2 h-4 w-4" />
    },
    {
      href: "/dashboard/templates",
      label: "Vorlagen",
      icon: <BookOpenText className="mr-2 h-4 w-4" />
    },
    {
      href: "/dashboard/calendar",
      label: "Kalender",
      icon: <Calendar className="mr-2 h-4 w-4" />
    },
    {
      href: "/dashboard/settings",
      label: "Einstellungen",
      icon: <Settings className="mr-2 h-4 w-4" />
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="space-y-1">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          onClick={() => setIsOpen && setIsOpen(false)}
        >
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive(route.href, route.exact) && "bg-muted"
            )}
          >
            {route.icon}
            {route.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}