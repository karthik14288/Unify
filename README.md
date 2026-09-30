# Unify — A Cross-Modal AI Understanding Platform

Unify is an end-to-end, general-purpose cross-modal Retrieval-Augmented Generation (RAG) platform. It unifies fragmented information formats—audio recordings, scanned images, drone orthomosaics, diagrams, and native PDF documents—into a shared 768-dimensional vector space, reasoning across them simultaneously and providing exact, clickable citations back to the source file, timestamp (`[MM:SS]`), or page number.

---

## 🌟 Architecture & Key Features

- **Multimodal Ingestion Pipeline**: Ingests `.mp3`, `.mp4`, `.png`, `.jpg`, `.pdf`, and `.txt` files directly into Supabase Storage.
- **AI-Powered Multimodal Processing**: Uses **Gemini 2.5 Pro** via `@google/genai` to transcribe audio with timestamps, perform OCR on scanned files, and extract diagram structures.
- **Shared Vector Space**: Uses Google's **`text-embedding-004`** model to project all content modalities into a unified 768-dimensional vector space.
- **PostgreSQL pgvector & HNSW**: Stores embeddings in PostgreSQL `document_chunks` indexed with Hierarchical Navigable Small World (`hnsw`) vector cosine ops.
- **Domain Lenses**:
  - 🌾 **Agriculture**: Farmer voice notes, soil sensor telemetry, and drone aerial photos (diagnoses nitrogen deficiency, soil compaction).
  - 🩺 **Healthcare**: Clinical voice dictations, metabolic panels, ECG scans, and vitals.
  - 🎓 **Education**: Lecture recordings, textbook handouts, and whiteboard derivations.
- **Interactive Citations**: RAG outputs return structured citations mapped into inline `[1]`, `[2]` badges that open an interactive **Citation Drawer** displaying the exact quote, source file, modality, and timestamp/page.
- **Enterprise Security**: Row Level Security (RLS) on PostgreSQL tables, JWT verification middleware via `@supabase/supabase-js`, and rate limiting on reasoning APIs.

---

## 🏗️ Repository Structure

```
/MULTIMODAL
  ├── /client                 # React 19 + Vite + Tailwind CSS + Lucide
  │   ├── /src
  │   │   ├── /components     # CitationBadge, CitationDrawer, MessageBubble, FileUploader, Layout, etc.
  │   │   ├── /pages          # LandingPage (/), DashboardPage (/dashboard), IngestPage (/ingest), ChatPage (/chat)
  │   │   ├── /hooks          # useAuth, useLens
  │   │   └── /lib            # api.ts, supabase.ts
  │   ├── package.json
  │   └── .env
  ├── /server                 # Node.js + Express + TypeScript
  │   ├── /src
  │   │   ├── /controllers    # upload.controller.ts, chat.controller.ts, sources.controller.ts
  │   │   ├── /services       # genai.service.ts, vector.service.ts
  │   │   ├── /middlewares    # auth.middleware.ts, rateLimiter.ts
  │   │   ├── /schemas        # api.schemas.ts (Zod)
  │   │   ├── /config         # env.ts (Zod)
  │   │   └── index.ts        # Express entry point (port 8080)
  │   ├── package.json
  │   └── .env
  ├── /database
  │   └── schema.sql          # PostgreSQL schema with pgvector, HNSW, RLS, and match_chunks RPC
  └── package.json            # Root workspace orchestrator
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
Execute the SQL script located in [`database/schema.sql`](file:///c:/Users/karth/MULTIMODAL/database/schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard/project/eqtapthujqoonvpwipgv/sql).

This initializes:
- `vector` extension
- `sources` table with RLS
- `document_chunks` table (`embedding vector(768)`) with HNSW index
- `match_chunks` similarity search RPC function

### 2. Environment Configuration

**Frontend (`client/.env`)**:
```env
VITE_SUPABASE_URL=https://eqtapthujqoonvpwipgv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_rBt3VP0s5tAkbFie2yVshA_021DhOXM
VITE_API_URL=http://localhost:8080
```

**Backend (`server/.env`)**:
```env
PORT=8080
SUPABASE_URL=https://eqtapthujqoonvpwipgv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_HqAOBOSpP7uh6S7Dq04ykw_pqUL0YuM
SUPABASE_JWKS_URL=https://eqtapthujqoonvpwipgv.supabase.co/auth/v1/.well-known/jwks.json
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(You can also set or override your Gemini API Key directly inside the web UI under System & Diagnostics Settings).*

### 3. Running the Platform

To run the backend and frontend dev servers:

```bash
# Start backend server (port 8080)
npm run server:dev

# Start frontend Vite client (port 5173)
npm run client:dev
```

Visit **`http://localhost:5173`** in your browser.
- Click **"Explore as Demo Researcher (1-Click)"** for immediate sandbox exploration, or sign in/up with your email.
- Toggle between **Education**, **Healthcare**, and **Agriculture** lenses.
- Ingest files or use the **1-Click Multimodal Sample Suite** on the Ingest page.
- Ask questions in the Reasoning Interface and click citations to inspect the exact ground truth snippet and timestamp/page.
