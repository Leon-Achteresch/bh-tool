import { ReactNode } from "react";

interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
}

export function PageHeader({ heading, text, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
} 