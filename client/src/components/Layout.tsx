import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { User } from "@shared/schema";

interface LayoutProps {
  children: ReactNode;
  user?: User | null;
}

export default function Layout({ children, user }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header title="" subtitle="" user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
