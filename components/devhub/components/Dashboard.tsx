import React, { useState, useEffect } from "react";
import { getDevItems, deleteDevItem } from "../store";
import { DevItem } from "../types";
import { ItemCard } from "./ItemCard";
import { ItemModal } from "./ItemModal";
import { DevBotChat } from "./DevBotChat";
import {
  Search,
  Plus,
  Terminal,
  Lock,
  Layers,
  Key,
} from "lucide-react";
import { FaGithub } from "@/components/icons";
import { sileo } from "sileo";

export function Dashboard() {
  const [items, setItems] = useState<DevItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DevItem | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8 space-y-4 md:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="text-[#76b900] font-bold">#</span> DEVHUB
          </h1>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
            Developer Toolbox & Credentials Locker
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-900 dark:bg-[#76b900] dark:hover:bg-[#86cb10] text-white dark:text-black font-bold font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border border-transparent"
        >
          <Plus className="w-4 h-4" /> Añadir Recurso
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Items */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 md:p-5 rounded-none overflow-hidden select-none">
          <div className="corner-square" />
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest truncate">
                Total Items
              </p>
              <h3 className="text-xl md:text-3xl font-mono font-bold text-zinc-900 dark:text-white mt-1 md:mt-2 tabular-nums">
                {totalCount}
              </h3>
            </div>
            <Layers className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 dark:text-zinc-600 shrink-0" />
          </div>
        </div>

        {/* Tools */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 md:p-5 rounded-none overflow-hidden select-none">
          <div className="corner-square" />
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest truncate">
                Herramientas
              </p>
              <h3 className="text-xl md:text-3xl font-mono font-bold text-[#76b900] mt-1 md:mt-2 tabular-nums">
                {toolsCount}
              </h3>
            </div>
            <Terminal className="w-4 h-4 md:w-5 md:h-5 text-[#76b900]/70 shrink-0" />
          </div>
        </div>

        {/* Repositories */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 md:p-5 rounded-none overflow-hidden select-none">
          <div className="corner-square" />
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest truncate">
                Repositorios
              </p>
              <h3 className="text-xl md:text-3xl font-mono font-bold text-zinc-900 dark:text-white mt-1 md:mt-2 tabular-nums">
                {reposCount}
              </h3>
            </div>
            <FaGithub className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
          </div>
        </div>

        {/* Credentials / API Keys */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 md:p-5 rounded-none overflow-hidden select-none">
          <div className="corner-square" />
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest truncate">
                Seguridad / API
              </p>
              <h3 className="text-xl md:text-3xl font-mono font-bold text-zinc-900 dark:text-white mt-1 md:mt-2 tabular-nums">
                {secureCount}
              </h3>
            </div>
            <div className="flex gap-1 text-zinc-500 dark:text-zinc-400 shrink-0">
              <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <Key className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* DevBot Chat */}
      <DevBotChat onItemAdded={refreshItems} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Category/Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none select-none">
          {[
            { id: "All", label: "Todos" },
            { id: "tool", label: "Herramientas" },
            { id: "repo", label: "Repos" },
            { id: "youtube", label: "YouTube" },
            { id: "note", label: "Notas" },
            { id: "credentials_apis", label: "Credenciales/APIs" },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-[#76b900] text-black border-[#76b900]"
                    : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, descripción, categoría..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] font-sans text-xs transition-colors"
          />
        </div>
      </div>

      {/* Grid Layout of Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
          <Layers className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            No se encontraron elementos
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-sans">
            Comienza agregando un nuevo recurso utilizando el botón superior.
          </p>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <ItemModal
          item={selectedItem}
          onClose={() => setIsModalOpen(false)}
          onSaved={refreshItems}
        />
      )}
    </div>
  );
}
