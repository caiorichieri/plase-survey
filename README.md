# PLASE Survey — Guida al Deploy

**Bidoc S.r.l. — Supervisione: Dr.ssa Laura De Clara**

Applicazione per la raccolta di 200+ risposte al questionario PLASE con analisi automatica del vettore Ψ(t).

---

## Architettura

| Componente | Tecnologia | Costo |
|---|---|---|
| Frontend + API | Next.js 14 su Vercel | Gratis |
| Database | Supabase (PostgreSQL) | Gratis fino a 500 MB |
| AI Analysis | Claude API (Anthropic) | ~$0.01 per risposta |

---

## Istruzioni passo per passo

### 1. Supabase — Crea il database

1. Vai su [supabase.com](https://supabase.com) e crea un account gratuito
2. Crea un nuovo **Project** (scegli un nome e una password per il DB)
3. Nella sidebar, vai su **SQL Editor**
4. Copia e incolla il contenuto del file `supabase/schema.sql` ed eseguilo con il tasto **Run**
5. Vai su **Project Settings → API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
    - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` **tieni questo segreto!)*

### 2. Anthropic — Ottieni la chiave API

1. Vai su [console.anthropic.com](https://console.anthropic.com)
2. Crea un API Key ‒ `ANTHROPIC_API_KEY`
3. Assicurati di avere credito nel conto (circa $5 bastano per 500 analisi)

### 3. Vercel — Deploy dell'applicazione

1. Installa Git sul tuo computer (se non ce l'hai)
2. Crea un account su [vercel.com](https://vercel.com) (gratuito)
3. Crea un account su [github.com](https://github.com) (gratuito)
4. Su Vercel → **New Project** and importa il repo GitHub
5. Aggiungi le **Environment Variables**:

   | Nome | Valore |
   |---|---|
   | `NETXT_PUBLIC_SUPABASE_URL` | URL Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Anon Key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key |
   | `ANTHROPIC_API_KEY`  | API Key Anthropic |
   | `ADMIN_PASSWORD`  | Password per la Dr. De Clara |
   | `JWT_SECRET` | Stringa casuale lunga |

6. Clicca **Deploy**
