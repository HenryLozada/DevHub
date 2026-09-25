# CLAUDE.md

## Estilo de respuesta
- Responde en español, breve y directo. Sin relleno ni resúmenes largos.
- No explores todo el repo: lee solo los archivos necesarios para la tarea.
- No uses subagentes salvo que se pida explícitamente.

## Proyecto
PersonalHub (DevHub): dashboard personal (finanzas/cashflow, tareas/chores, calendario/eventos, DevHub de recursos y credenciales, DevBot IA vía Groq). PWA con recordatorios locales.

## Stack
Astro 7 (`output: 'server'`, adapter Vercel) + React 19 + Tailwind 4 + shadcn (`components/ui`). Supabase para auth y sync; `localStorage` como persistencia local.

## Comandos
- `npm run dev`: servidor local (http://localhost:4321)
- `npm run build`: build de producción
- `npm run check`: typecheck (ejecútalo después de cambiar código)
- No hay tests ni linter configurados.

## Estructura
- `src/pages/index.astro`: entrada; `src/pages/api/`: endpoints (`/api/chat`, `/api/metadata`)
- `components/<modulo>/`: cada módulo con `index.tsx`, `store.ts`, `types.ts` y `components/`
- `lib/`: utilidades compartidas (`supabase.ts`, `local-store.ts`, `auth-store.tsx`, `ai.ts`, `notifications.ts`)
- `supabase-schema.sql`: esquema con RLS y `updated_at`

## Reglas
- `GROQ_API_KEY` es solo de servidor: nunca con prefijo `PUBLIC_` ni enviada al cliente.
- DevBot no debe enviar contraseñas ni API keys al modelo.
- El PIN y el código de recuperación se guardan hasheados (SHA-256); no romper eso.
- Commits con estilo conventional (`feat:`, `fix:`).
