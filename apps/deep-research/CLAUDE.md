# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbopack (preferred)
- `pnpm build` - Build for production
- `pnpm build:standalone` - Build standalone version for Docker
- `pnpm build:export` - Build static export version
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint checks

### Package Management
- Uses `pnpm` as the primary package manager
- Lock file: `pnpm-lock.yaml`
- Node.js >= 18.18.0 required

## Project Architecture

### Framework & Stack
- **Next.js 15** with App Router
- **TypeScript** with strict mode enabled
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Zustand** for state management
- **React 19** with React Compiler enabled
- **PWA** support via Serwist

### Key Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes organized by provider
│   │   ├── ai/           # AI provider endpoints (anthropic, google, openai, etc.)
│   │   ├── search/       # Search provider endpoints (tavily, exa, etc.)
│   │   ├── mcp/          # Model Context Protocol server
│   │   └── sse/          # Server-Sent Events API
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Main application page
├── components/            # React components
│   ├── Internal/         # Internal UI components
│   ├── Knowledge/        # Knowledge base components
│   ├── Research/         # Research-related components
│   ├── Provider/         # Context providers
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── store/                # Zustand state stores
├── utils/                # Utility functions
│   ├── deep-research/    # Core research logic
│   └── parser/           # File parsing utilities
└── types.d.ts            # TypeScript type definitions
```

### State Management
Uses Zustand with multiple stores:
- `global.ts` - Global application state
- `history.ts` - Research history
- `knowledge.ts` - Knowledge base management
- `setting.ts` - Application settings
- `task.ts` - Task management

### API Architecture
- **Multi-provider AI support**: Anthropic, Google, OpenAI, DeepSeek, xAI, Mistral, Azure, OpenRouter, Ollama
- **Search providers**: Tavily, Firecrawl, Exa, Bocha, SearXNG
- **Proxy mode**: API rewrites in next.config.ts for CORS handling
- **SSE API**: Real-time research streaming at `/api/sse`
- **MCP Server**: Model Context Protocol support for AI integrations

### Environment Configuration
- Environment variables configured via `env.tpl` template
- Multi-key support for API providers (comma-separated)
- Build modes: `standalone`, `export`, or default
- Custom model lists via `NEXT_PUBLIC_MODEL_LIST`

### Internationalization
- i18next with browser language detection
- Locales: English, Chinese (Simplified), Spanish
- Files in `src/locales/`

### Key Features
- **Deep Research**: Multi-stage research process with thinking and task models
- **Knowledge Base**: Local file upload and processing (PDF, Office, text)
- **Real-time Streaming**: SSE for live research progress
- **PWA Support**: Progressive Web App capabilities
- **Privacy-focused**: Local data storage by default

### File Processing
- PDF parsing via pdfjs-dist
- Office document parsing
- Text extraction and processing
- Knowledge graph generation

### Development Notes
- Uses path aliases: `@/*` maps to `./src/*`
- React Compiler enabled for optimization
- Strict TypeScript configuration
- ESLint with Next.js config
- Turbopack for fast development builds