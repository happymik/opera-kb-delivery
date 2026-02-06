# Opera Knowledge Base

A Retrieval-Augmented Generation (RAG) system that indexes 125+ Opera product documents and provides an intelligent chat interface for querying them. The system combines Google Gemini File Search for document retrieval, n8n workflow automation for ingestion pipelines, and a React-based frontend for end-user access.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Chat UI     │────▶│  n8n Webhook     │────▶│  Gemini 2.5 Flash    │
│  (React 19)  │◀────│  (Agent + RAG)   │◀────│  + File Search API   │
└──────────────┘     └──────────────────┘     └──────────────────────┘
                              │                         │
                     ┌────────┴────────┐       ┌────────┴────────┐
                     │  Google Sheets  │       │  Document Store  │
                     │  (QA tracking)  │       │  (125 docs,     │
                     └─────────────────┘       │   266.9 MB)     │
                                               └─────────────────┘
```

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Document Store** | Google Gemini File Search API | Stores and indexes 125 documents (266.9 MB) for retrieval |
| **Automation** | n8n workflow platform | Orchestrates ingestion, chat agent, and QA testing |
| **Chat Interface** | React 19, Vite, TypeScript | Password-protected frontend for querying the knowledge base |
| **AI Model** | Gemini 2.5 Flash | Generates answers grounded in retrieved document context |
| **Source Documents** | Google Drive | Hosts the original Opera product files |

## Repository Structure

```
opera-kb-delivery/
├── index.html              # Built frontend entry point (GitHub Pages)
├── assets/                 # Production-bundled JS/CSS
├── chat-interface/         # Frontend source code
│   ├── src/
│   │   ├── App.tsx             # Main app with auth and chat state
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── components/         # ChatInterface, Spinner, icons
│   │   └── services/           # API service (webhook communication)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── n8n-workflows/          # Exported n8n workflow definitions
    ├── workflows-index.json    # Index of all workflows with metadata
    ├── local-drafts/           # Development-stage workflow drafts
    └── *.json                  # Production workflow exports
```

## Chat Interface

The frontend is a single-page React application deployed via GitHub Pages.

**Features:**

- Password-protected access
- Market filtering: Brazil, Germany, Turkey, France, English, or All
- Product filtering: Desktop, Mobile, Air, Neon, Spotify, General, or All
- Markdown-rendered responses with source citations
- Expandable source text snippets from retrieved documents
- Session-based conversation memory (agent mode)
- Rotating example question suggestions

**Tech stack:** React 19, TypeScript, Vite 6, Tailwind CSS, react-markdown

## n8n Workflows

All workflows are exported as JSON in `n8n-workflows/`. The `workflows-index.json` file contains the full inventory.

### Production Workflows (exported from server)

| Workflow | Description |
|----------|-------------|
| **Opera KB Agent (Webhook + Chat)** | Main chat agent. Receives questions via webhook, queries the Gemini File Search store, and returns grounded answers with source citations. Active in production. |
| **Opera Knowledge Base - Ingestion Pipeline v3** | Full batch ingestion pipeline. Processes documents from Google Drive, uploads them to the Gemini File Search store, and tracks progress. |
| **Opera KB - Pre-Ingestion Intelligence** | Analyzes documents before ingestion. Evaluates file types, sizes, and content to prepare optimal ingestion parameters. |
| **Opera KB - Simplified Ingestion** | Streamlined ingestion for uploading pre-processed files directly to the Gemini store. |
| **Opera KB - Single File Upload (Webhook)** | Upload individual documents to the knowledge base via webhook trigger. |
| **Opera KB - QA Generator** | Generates test questions from the document corpus for automated quality assurance testing. |
| **Opera KB - QA Executor** | Runs generated test questions against the RAG system and records results for quality tracking. |
| **Gemini Knowledge Base - Cleanup** | Maintenance workflow for removing outdated or duplicate documents from the Gemini store. |

### Local Drafts

The `local-drafts/` directory contains earlier development versions of the Pre-Ingestion Intelligence, Simplified Ingestion, QA Generator, and QA Executor workflows.

## Gemini File Search API

The system uses the Google Gemini File Search API for document storage and retrieval.

**Store:** `fileSearchStores/opera-knowledge-base-gls9v6ztisdg`

- 125 active documents indexed
- 266.9 MB total document size
- Supports PDF, DOCX, PPTX, XLSX, and other common formats

**Key API operations:**

```
# List documents in the store
GET generativelanguage.googleapis.com/v1beta/fileSearchStores/{store}/documents

# Query the store (used by the chat agent)
POST generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
  → with fileSearchStore tool configuration

# Upload a document
POST generativelanguage.googleapis.com/v1beta/fileSearchStores/{store}/documents:upload
```

Refer to the [Gemini File Search API documentation](https://ai.google.dev/gemini-api/docs/file-search) for full details.

## QA Testing

The QA pipeline validates RAG accuracy using automated test suites:

1. **QA Generator** creates 200+ test questions derived from the indexed documents, covering different markets and products.
2. **QA Executor** runs each question against the RAG agent and records the response, sources, and timing.
3. Results are tracked in Google Sheets for review and regression testing.

## Development

### Prerequisites

- Node.js 18+
- npm

### Build the frontend

```bash
cd chat-interface
npm install
npm run build
```

The build output is written to `chat-interface/dist/`. To deploy, copy `index.html` and `assets/` to the repository root.

### Run locally

```bash
cd chat-interface
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Importing workflows to n8n

Workflow JSON files in `n8n-workflows/` can be imported into any n8n instance via the n8n UI (Settings > Import Workflow) or the n8n REST API. Credentials and webhook URLs will need to be reconfigured for the target environment.
