# AI Developer Assistant

A learning-first Agentic AI project built with the existing TypeScript/React/Node.js stack.

## Current milestone

- React + TypeScript chat UI
- Node.js + Express API
- OpenAI Responses API integration
- Tool calling loop
- `getWeather`
- `calculate`
- `searchDocs`
- Tool input validation and safe error handling
- Server-Sent Events for agent/tool progress
- Clean separation between model, tools and HTTP layer


## Run locally

```bash
npm install
cp .env.example .env
# Put your OpenAI API key in .env
npm run dev
```

Open the web app at the Vite URL shown in the terminal.

## Git

Current branch:

```bash
git branch --show-current
```

Expected:

```text
ai-developer-assistant
```

## Learning milestones

1. Raw LLM + tools (current)
2. Structured output
3. RAG + vector search
4. LangChain.js
5. LangGraph.js
6. Memory and persistence
7. MCP
8. Evaluation/observability
9. Durable execution / Vectorbea
10. Production architecture
