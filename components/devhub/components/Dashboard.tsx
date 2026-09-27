import React, { useState, useEffect } from "react";
import { getDevItems, deleteDevItem } from "../store";
import { DevItem } from "../types";
import { ItemCard } from "./ItemCard";
import { ItemModal } from "./ItemModal";
import { DevBotChat } from "./DevBotChat";
import { RippleButton } from "@/components/ui/ripple-button";
import { CountUp } from "@/components/ui/count-up";
import { InjectionSlot } from "@/components/playground/InjectionSlot";
import {
  Search,
  Plus,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { sileo } from "sileo";
import { PasswordSecurityDialog } from "./PasswordSecurityDialog";

export function Dashboard() {
  const [items, setItems] = useState<DevItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DevItem | null>(null);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);

  const refreshItems = () => {
    setItems(getDevItems());
  };

  useEffect(() => {
    refreshItems();
  }, []);

  useEffect(() => {
    const handler = () => refreshItems();
    window.addEventListener("ph:update", handler);
    return () => window.removeEventListener("ph:update", handler);
  }, []);

  const handleDelete = (id: string) => {
    deleteDevItem(id);
    refreshItems();
    sileo.info({
      title: "Elemento eliminado",
      description: "El elemento ha sido eliminado correctamente del DevHub.",
    });
  };

  const handleEdit = (item: DevItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };


  // Calculate statistics
  const totalCount = items.length;
  const toolsCount = items.filter((i) => i.type === "tool").length;
  const reposCount = items.filter((i) => i.type === "repo").length;
  const secureCount = items.filter((i) => i.type === "credential" || i.type === "api").length;

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    if (filterType === "All") return matchesSearch;
    if (filterType === "tool") return item.type === "tool" && matchesSearch;
    if (filterType === "repo") return item.type === "repo" && matchesSearch;
    if (filterType === "youtube") return item.type === "youtube" && matchesSearch;
    if (filterType === "note") return item.type === "note" && matchesSearch;
    if (filterType === "credentials_apis") {
      return (item.type === "credential" || item.type === "api") && matchesSearch;
    }
    return matchesSearch;
  });

  const stats = [
    { label: "Total", value: totalCount, color: "var(--color-brand)" },
    { label: "Herramientas", value: toolsCount, color: "var(--color-brand)" },
    { label: "Repos", value: reposCount, color: "var(--color-violet)" },
    { label: "Bóveda", value: secureCount, color: "var(--color-cyan)" },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-f21 px-f13 py-f21 md:px-f34 md:py-f34 relative">
      <InjectionSlot moduleId="devhub" className="absolute inset-0 pointer-events-none" />

      {/* Resumen */}
      <section className="panel relative z-10 flex flex-wrap items-center justify-between gap-f21 p-f21">
        <div className="flex flex-wrap items-end gap-f34">
          {stats.map((st) => (
            <div key={st.label} className="cal-chip pl-f13" style={{ "--neon": st.color } as React.CSSProperties}>
              <p className="eyebrow tracking-[0.2em]">{st.label}</p>
              <p className="font-mono text-3xl font-light leading-none tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-100">
                <CountUp value={st.value} />
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-f8">
          <button onClick={() => setSecurityDialogOpen(true)} className="flex h-9 items-center gap-f5 rounded-full border border-zinc-200 px-f13 text-xs text-zinc-600 transition-colors hover:border-brand hover:text-brand dark:border-white/10 dark:text-zinc-300">
            <ShieldCheck className="size-4" /> Seguridad
          </button>
          <RippleButton onClick={handleAddNew} rippleColor="#000000" duration="600ms"
            className="flex h-9 items-center gap-f5 overflow-hidden rounded-full bg-brand px-f13 text-xs font-semibold text-black transition-colors hover:bg-brand-hi">
            <Plus className="size-4" /> Recurso
          </RippleButton>
        </div>
      </section>

      {/* Contenido 62% · DevBot 38% */}
      <div className="relative z-10 grid gap-f21 xl:grid-cols-[1.618fr_1fr] xl:items-start">
        <div className="flex min-w-0 flex-col gap-f21">
          {/* Filtros + búsqueda */}
          <div className="flex flex-col gap-f13 md:flex-row md:items-center md:justify-between">
            <div className="no-scrollbar inline-flex max-w-full overflow-x-auto rounded-full border border-zinc-200 p-f3 dark:border-white/10">
              {[
                { id: "All", label: "Todos" },
                { id: "tool", label: "Tools" },
                { id: "repo", label: "Repos" },
                { id: "youtube", label: "YouTube" },
                { id: "note", label: "Notas" },
                { id: "credentials_apis", label: "Bóveda" },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setFilterType(tab.id)}
                  className={`shrink-0 rounded-full px-f13 py-f5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    filterType === tab.id ? "bg-zinc-900 text-white dark:bg-white/10 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative md:w-[233px]">
              <Search className="absolute left-f13 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…"
                className="w-full rounded-full border border-zinc-200 bg-transparent py-f8 pl-f34 pr-f13 text-xs text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-brand focus:outline-none dark:border-white/10 dark:text-white" />
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-f21 md:grid-cols-2 stagger">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="rounded-f21 border border-dashed border-zinc-300 px-f21 py-f55 text-center dark:border-white/10">
              <Layers className="mx-auto mb-f8 size-5 text-zinc-400" />
              <p className="eyebrow">Sin resultados</p>
              <p className="mt-f5 text-sm text-zinc-500">Agrega un recurso o cambia el filtro.</p>
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-[89px]">
          <DevBotChat onItemAdded={refreshItems} />
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <ItemModal
          item={selectedItem}
          onClose={() => setIsModalOpen(false)}
          onSaved={refreshItems}
        />
      )}
      {securityDialogOpen && <PasswordSecurityDialog mode="settings" onClose={() => setSecurityDialogOpen(false)} />}
    </div>
  );
}
