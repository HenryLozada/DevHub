import { saveDevItem, deleteDevItem, updateDevItem } from "@/components/devhub/store";
import type { DevItemType } from "@/components/devhub/types";
import { saveChore, deleteChore, updateChore } from "@/components/chores/store";
import { saveExpense, deleteExpense } from "@/components/budgeted/store";
import { readStore, writeStore } from "@/lib/local-store";

type DevHubSave = {
  title: string;
  typeField: DevItemType;
  url?: string;
  category?: string;
  content?: string;
  description?: string;
};

type DevHubUpdate = {
  id: string;
  title?: string;
  typeField?: DevItemType;
  url?: string;
  category?: string;
  content?: string;
  description?: string;
};

type ChoreSave = {
  title: string;
  dueDate?: string;
  color?: string;
  description?: string;
};

type ChoreUpdate = {
  id: string;
  title?: string;
  status?: string;
  dueDate?: string;
  color?: string;
};

type CashflowSave = {
  concepto: string;
  monto: number;
  tipo: "ingreso" | "egreso";
  recurrencia: "mensual" | "semanal";
  diaDelMes?: number;
  diaSemana?: number;
};

type ExpenseSave = {
  amount: number;
  description: string;
  category: string;
  date: string;
  paidStatus?: "paid" | "unpaid" | "partial";
};

interface ActionPayload {
  saveDevHub?: DevHubSave;
  updateDevHub?: DevHubUpdate;
  deleteDevHub?: { id: string };
  saveChore?: ChoreSave;
  updateChore?: ChoreUpdate;
  completeChore?: { id: string };
  deleteChore?: { id: string };
  saveCashflow?: CashflowSave;
  deleteCashflow?: { id: string };
  saveExpense?: ExpenseSave;
  deleteExpense?: { id: string };
}

const ACTION_RE = /\|ACTION\|\s*(\{[\s\S]*?\})\s*\|END\|/gi;
const EVT_NAME = "ph:update";

function notify() {
  window.dispatchEvent(new CustomEvent(EVT_NAME));
}

export function parseActions(text: string): { cleanText: string; results: string[] } {
  const results: string[] = [];
  const cleanText = text.replace(ACTION_RE, (_match, jsonRaw) => {
    try {
      const payload: ActionPayload = JSON.parse(jsonRaw.trim());

      if (payload.saveDevHub) {
        const d = payload.saveDevHub;
        const item = saveDevItem({
          title: d.title || "Sin título",
          type: d.typeField || "note",
          url: d.url || "",
          content: d.content || "",
          category: d.category || "General",
          description: d.description || "",
        });
        notify();
        results.push(`✅ Guardado en DevHub: **${item.title}**`);
        return "";
      }

      if (payload.updateDevHub) {
        const d = payload.updateDevHub;
        updateDevItem(d.id, {
          title: d.title,
          type: d.typeField,
          url: d.url,
          content: d.content,
          category: d.category,
          description: d.description,
        });
        notify();
        results.push(`✏️ Editado en DevHub: **${d.title || d.id}**`);
        return "";
      }

      if (payload.deleteDevHub) {
        deleteDevItem(payload.deleteDevHub.id);
        notify();
        results.push(`🗑️ Eliminado de DevHub`);
        return "";
      }

      if (payload.saveChore) {
        const d = payload.saveChore;
        const chore = saveChore({
          title: d.title,
          description: d.description || "",
          status: "pending",
          dueDate: d.dueDate || undefined,
          color: d.color || undefined,
        });
        notify();
        results.push(`✅ Tarea creada: **${chore.title}**`);
        return "";
      }

      if (payload.updateChore) {
        const d = payload.updateChore;
        updateChore(d.id, {
          title: d.title,
          status: d.status as any,
          dueDate: d.dueDate,
          color: d.color,
        });
        notify();
        results.push(`✏️ Tarea actualizada: **${d.title || d.id}**`);
        return "";
      }

      if (payload.completeChore) {
        updateChore(payload.completeChore.id, { status: "done" });
        notify();
        results.push(`✅ Tarea completada`);
        return "";
      }

      if (payload.deleteChore) {
        deleteChore(payload.deleteChore.id);
        notify();
        results.push(`🗑️ Tarea eliminada`);
        return "";
      }

      if (payload.saveCashflow) {
        const d = payload.saveCashflow;
        const rules = readStore<any[]>("cashflow_rules", []);
        const newRule = { id: crypto.randomUUID(), ...d };
        writeStore("cashflow_rules", [...rules, newRule]);
        notify();
        results.push(`✅ Regla creada: **${d.concepto}** ($${d.monto})`);
        return "";
      }

      if (payload.deleteCashflow) {
        const id = payload.deleteCashflow.id;
        const rules = readStore<any[]>("cashflow_rules", []).filter((r: any) => r.id !== id);
        writeStore("cashflow_rules", rules);
        notify();
        results.push(`🗑️ Regla de flujo eliminada`);
        return "";
      }

      if (payload.saveExpense) {
        const d = payload.saveExpense;
        saveExpense({
          amount: d.amount,
          description: d.description,
          category: d.category,
          date: d.date,
          paidStatus: d.paidStatus || "unpaid",
        });
        notify();
        results.push(`✅ Gasto registrado: **${d.description}** ($${d.amount})`);
        return "";
      }

      if (payload.deleteExpense) {
        deleteExpense(payload.deleteExpense.id);
        notify();
        results.push(`🗑️ Gasto eliminado`);
        return "";
      }

      results.push(`⚠️ Acción no reconocida`);
      return "";
    } catch {
      results.push(`⚠️ Error al ejecutar acción`);
      return "";
    }
  });
  return { cleanText, results };
}
