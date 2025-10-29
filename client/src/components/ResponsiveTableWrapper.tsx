import { ReactNode } from "react";

interface ResponsiveTableWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveTableWrapper({ children, className = "" }: ResponsiveTableWrapperProps) {
  return (
    <div className={`overflow-x-auto -mx-4 md:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden md:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
