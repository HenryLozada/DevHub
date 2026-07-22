export interface ModuleInfo {
  id: string
  label: string
  file: string
  description: string
}

export const MODULES: ModuleInfo[] = [
  {
    id: "calendar",
    label: "Calendario",
    file: "components/cashflow-calendar.tsx",
    description: "Vista principal del calendario mensual con flujo de caja",
  },
  {
    id: "budgeted",
    label: "Gastos",
    file: "components/budgeted/components/Dashboard.tsx",
    description: "Dashboard de gastos con lista filtrable y totales",
  },
  {
    id: "chores",
    label: "Tareas",
    file: "components/chores/components/Dashboard.tsx",
    description: "Kanban de tareas con urgencia y progreso",
  },
  {
    id: "devhub",
    label: "DevHub",
    file: "components/devhub/components/Dashboard.tsx",
    description: "Toolbox y gestor de credenciales del desarrollador",
  },
]

export function getModuleIntegration(moduleId: string, componentId: string, componentName: string): string {
  switch (moduleId) {
    case "calendar":
      return `// 1. Importar en components/cashflow-calendar.tsx:
import { ${componentName} } from "@/components/ui/${componentId}"

// 2. Usar como fondo del calendario (dentro del main):
<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 relative">
  <${componentName} className="absolute inset-0 z-0" />
  <div className="relative z-10">
    {/* contenido existente */}
  </div>
</main>`

    case "budgeted":
      return `// 1. Importar en components/budgeted/components/Dashboard.tsx:
import { ${componentName} } from "@/components/ui/${componentId}"

// 2. Como decoración del header o fondo de stats:
<div className="relative overflow-hidden">
  <${componentName} className="absolute inset-0 opacity-20" />
  <div className="relative z-10">
    {/* tus stats existentes */}
  </div>
</div>`

    case "chores":
      return `// 1. Importar en components/chores/components/Dashboard.tsx:
import { ${componentName} } from "@/components/ui/${componentId}"

// 2. Como fondo del kanban (dentro del div principal):
<div className="h-[calc(100vh-7.5rem)] flex flex-col px-4 py-4 max-w-6xl mx-auto relative">
  <${componentName} className="absolute inset-0 opacity-10 pointer-events-none" />
  {/* contenido existente */}
</div>`

    case "devhub":
      return `// 1. Importar en components/devhub/components/Dashboard.tsx:
import { ${componentName} } from "@/components/ui/${componentId}"

// 2. Como fondo del DevHub (en el contenedor principal):
<div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8 space-y-4 relative overflow-hidden">
  <${componentName} className="absolute inset-0 opacity-10 pointer-events-none" />
  <div className="relative z-10">
    {/* contenido existente */}
  </div>
</div>`

    default:
      return `// Integración genérica en cualquier componente:
import { ${componentName} } from "@/components/ui/${componentId}"

<${componentName} className="..." />`
  }
}
