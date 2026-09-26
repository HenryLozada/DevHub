import { getDevItems, saveDevItem, deleteDevItem, updateDevItem } from "@/components/devhub/store";
import type { DevItemType } from "@/components/devhub/types";
import { getChores, saveChore, deleteChore, updateChore } from "@/components/chores/store";
import { getExpenses, saveExpense, deleteExpense } from "@/components/budgeted/store";
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

/** Destructive action proposed by the model; only runs after the user confirms it in the UI. */
export interface PendingAction {
  label: string;
  run: () => string;
}

function isValidDate(v: unknown): v is string {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}

export function parseActions(text: string): { cleanText: string; results: string[]; pending: PendingAction[] } {
  const results: string[] = [];
  const pending: PendingAction[] = [];
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
        const id = String(payload.deleteDevHub.id);
        const item = getDevItems().find((i) => i.id === id);
        if (!item) { results.push(`⚠️ Ítem de DevHub no encontrado`); return ""; }
        pending.push({
          label: `Eliminar de DevHub: ${item.title}`,
          run: () => { deleteDevItem(id); notify(); return `🗑️ Eliminado de DevHub: **${item.title}**`; },
        });
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
        const id = String(payload.deleteChore.id);
        const chore = getChores().find((c) => c.id === id);
        if (!chore) { results.push(`⚠️ Tarea no encontrada`); return ""; }
        pending.push({
          label: `Eliminar tarea: ${chore.title}`,
          run: () => { deleteChore(id); notify(); return `🗑️ Tarea eliminada: **${chore.title}**`; },
        });
        return "";
      }

      if (payload.saveCashflow) {
        const d = payload.saveCashflow;
        if (
          typeof d.concepto !== "string" || !d.concepto.trim() ||
          typeof d.monto !== "number" || !Number.isFinite(d.monto) || d.monto <= 0 ||
          (d.tipo !== "ingreso" && d.tipo !== "egreso") ||
          (d.recurrencia !== "mensual" && d.recurrencia !== "semanal")
        ) {
          results.push(`⚠️ Regla de flujo inválida, no se guardó`);
          return "";
        }
        const rules = readStore<any[]>("cashflow_rules", []);
        const newRule = { id: crypto.randomUUID(), ...d };
        writeStore("cashflow_rules", [...rules, newRule]);
        notify();
        results.push(`✅ Regla creada: **${d.concepto}** ($${d.monto})`);
        return "";
      }

      if (payload.deleteCashflow) {
        const id = String(payload.deleteCashflow.id);
        const rule = readStore<any[]>("cashflow_rules", []).find((r: any) => r.id === id);
        if (!rule) { results.push(`⚠️ Regla de flujo no encontrada`); return ""; }
        pending.push({
          label: `Eliminar regla de flujo: ${rule.concepto ?? id}`,
          run: () => {
            writeStore("cashflow_rules", readStore<any[]>("cashflow_rules", []).filter((r: any) => r.id !== id));
            notify();
            return `🗑️ Regla de flujo eliminada`;
          },
        });
        return "";
      }

      if (payload.saveExpense) {
        const d = payload.saveExpense;
        if (
          typeof d.amount !== "number" || !Number.isFinite(d.amount) || d.amount <= 0 ||
          typeof d.description !== "string" || !d.description.trim() ||
          !isValidDate(d.date)
        ) {
          results.push(`⚠️ Gasto inválido, no se guardó`);
          return "";
        }
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
        const id = String(payload.deleteExpense.id);
        const expense = getExpenses().find((e) => e.id === id);
        if (!expense) { results.push(`⚠️ Gasto no encontrado`); return ""; }
        pending.push({
          label: `Eliminar gasto: ${expense.description} ($${expense.amount})`,
          run: () => { deleteExpense(id); notify(); return `🗑️ Gasto eliminado`; },
        });
        return "";
      }

      results.push(`⚠️ Acción no reconocida`);
      return "";
    } catch {
      results.push(`⚠️ Error al ejecutar acción`);
      return "";
    }
  });
  return { cleanText, results, pending };
}
