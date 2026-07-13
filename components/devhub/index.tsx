import React from "react";
import { Terminal } from "lucide-react";
import { ModuleNav } from "@/components/module-nav";
import { Dashboard } from "./components/Dashboard";

export function DevHubApp() {
  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      <ModuleNav
        icon={<Terminal className="w-4 h-4 text-[#76b900]" />}
        title="DevHub"
        subtitle="NVIDIA GEOMETRY ACTIVE"
      />

      {/* Main Dashboard view */}
      <Dashboard />
    </div>
  );
}
