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
- `npm run lint`: ESLint (0 errores requerido)
- `npm test`: Vitest (`tests/`)

## Estructura
- `src/pages/index.astro`: entrada; `src/pages/api/`: endpoints (`/api/chat`, `/api/metadata`)
- `components/<modulo>/`: cada módulo con `index.tsx`, `store.ts`, `types.ts` y `components/`
- `lib/`: utilidades compartidas (`supabase.ts`, `local-store.ts` + `sync-merge.ts` para el sync, `auth-store.tsx`, `ai.ts` con `authFetch`, `notifications.ts`)
- `lib/server-auth.ts`, `lib/ip-safety.ts`: solo servidor (sesión, rate limit, SSRF)
- `components/devhub/security.ts` + `crypto.ts`: bóveda cifrada de credenciales
- `supabase-schema.sql`: esquema con RLS y `updated_at`

## Reglas
- `GROQ_API_KEY` es solo de servidor: nunca con prefijo `PUBLIC_` ni enviada al cliente.
- DevBot no debe enviar contraseñas ni API keys al modelo.
- Credenciales (`password`, `apiKey`) se guardan cifradas en `secretEnc` cuando hay PIN; usa `sealSecrets`/`openSecrets`, nunca en texto plano.
- Escribe datos sincronizados siempre con `writeStore` (estampa `updatedAt` y registra borrados), nunca con `localStorage.setItem`.
- Llamadas a `/api/*` desde el cliente con `authFetch` (envía el token de Supabase).
- Commits con estilo conventional (`feat:`, `fix:`).
