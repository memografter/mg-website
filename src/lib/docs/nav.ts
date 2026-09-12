import type { DocNavGroup } from "./types";
import { apiReferenceNavItems } from "./api-reference";

export const docsNavGroups: DocNavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { href: "/docs", label: "Introduction", icon: "book-open" },
      { href: "/docs/installation", label: "Installation", icon: "download" },
      { href: "/docs/database-setup-with-docker", label: "Database setup with Docker", icon: "database" },
      { href: "/docs/quick-start", label: "Quick Start", icon: "zap" },
      { href: "/docs/environment-setup", label: "Environment Setup", icon: "settings" },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { href: "/docs/concepts/how-it-works", label: "How it works", icon: "workflow" },
      { href: "/docs/concepts/messages", label: "Messages", icon: "bot" },
      { href: "/docs/concepts/segments", label: "Segments", icon: "split" },
      { href: "/docs/concepts/topic-nodes", label: "Topic Nodes", icon: "tags" },
      { href: "/docs/concepts/episodes", label: "Stable Topics & Episodes", icon: "history" },
      { href: "/docs/concepts/memory-nodes", label: "Memory Nodes", icon: "binary" },
      { href: "/docs/concepts/canonical-memory", label: "Canonical Memory & Evidence", icon: "git-branch" },
      { href: "/docs/concepts/memory-quality", label: "Memory Quality", icon: "gauge" },
      { href: "/docs/concepts/graph-edges", label: "Graph Edges", icon: "git-branch" },
      { href: "/docs/concepts/grafting", label: "Grafting", icon: "combine" },
      { href: "/docs/concepts/lifecycle", label: "Lifecycle", icon: "refresh" },
    ],
  },
  {
    title: "Guides",
    items: [
      { href: "/docs/guides/chatbot-memory", label: "Chatbot Memory", icon: "bot" },
      { href: "/docs/guides/existing-chatbot", label: "Existing Chatbot Integration", icon: "plug" },
      { href: "/docs/guides/ingesting-extracting-memory", label: "Ingesting & Extracting Memory", icon: "scan-text" },
      { href: "/docs/guides/durable-ingestion", label: "Durable Ingestion & Recovery", icon: "database" },
      { href: "/docs/guides/memory-quality-migration", label: "Memory Quality Migration", icon: "refresh" },
      { href: "/docs/guides/recall-memory-injection", label: "Recall & Memory Injection", icon: "search" },
      { href: "/docs/guides/topic-pinning", label: "Topic Pinning", icon: "file-plus" },
      { href: "/docs/guides/topic-domains", label: "Topic Domains", icon: "tags" },
      { href: "/docs/guides/errors-and-readiness", label: "Errors & Readiness", icon: "circle-alert" },
      { href: "/docs/guides/grafting-memory", label: "Grafting Memory", icon: "combine" },
      { href: "/docs/guides/multi-session-memory", label: "Multi-session Memory", icon: "panels" },
      { href: "/docs/guides/tags-memory-scope", label: "Tags & Memory Scope", icon: "tags" },
      { href: "/docs/guides/streaming-responses", label: "Streaming Responses", icon: "radio" },
      { href: "/docs/guides/inspecting-reviewing-memory", label: "Inspecting & Reviewing Memory", icon: "search-check" },
      { href: "/docs/guides/fleet-shared-memory", label: "Fleet & Shared Memory", icon: "users" },
      { href: "/docs/guides/pruning", label: "Pruning", icon: "scissors" },
      { href: "/docs/guides/forgetting-privacy", label: "Forgetting & Privacy", icon: "trash" },
      { href: "/docs/guides/conversation-summaries", label: "Conversation Summaries", icon: "archive" },
    ],
  },
  {
    title: "API Reference",
    items: apiReferenceNavItems,
  },
  {
    title: "Adapters",
    items: [
      { href: "/docs/adapters/openai", label: "OpenAI", icon: "sparkles" },
      { href: "/docs/adapters/anthropic", label: "Anthropic", icon: "bot" },
      { href: "/docs/adapters/gemini", label: "Gemini", icon: "gem" },
      { href: "/docs/adapters/custom-adapter", label: "Custom Adapter", icon: "plug" },
      { href: "/docs/adapters/embeddings", label: "Embeddings", icon: "binary" },
      { href: "/docs/adapters/custom-llm", label: "Custom LLM", icon: "cpu" },
    ],
  },
  {
    title: "Studio",
    items: [
      { href: "/docs/studio/launching-studio", label: "Launching Studio", icon: "monitor-play" },
      { href: "/docs/studio/graph-view", label: "Graph View", icon: "network" },
      { href: "/docs/studio/memory-table", label: "Memory Table", icon: "table" },
      { href: "/docs/studio/prompt-preview", label: "Prompt Preview", icon: "eye" },
      { href: "/docs/studio/lifecycle-actions", label: "Lifecycle Actions", icon: "refresh" },
      { href: "/docs/studio/search", label: "Search", icon: "search" },
      { href: "/docs/studio/troubleshooting", label: "Troubleshooting", icon: "wrench" },
    ],
  },
  {
    title: "CLI",
    items: [
      { href: "/docs/cli/installation", label: "Installation", icon: "package" },
      { href: "/docs/cli/studio", label: "studio", icon: "square-terminal" },
      { href: "/docs/cli/init", label: "init", icon: "file-plus" },
      { href: "/docs/cli/migrate", label: "migrate", icon: "database" },
      { href: "/docs/cli/doctor", label: "doctor", icon: "search-check" },
      { href: "/docs/cli/config", label: "config", icon: "sliders" },
      { href: "/docs/cli/environment-variables", label: "Environment Variables", icon: "key-round" },
    ],
  },
  {
    title: "Examples",
    items: [
      { href: "/docs/examples/simple-chatbot", label: "Simple Chatbot", icon: "bot" },
      { href: "/docs/examples/customer-support", label: "Customer Support", icon: "headphones" },
      { href: "/docs/examples/personal-assistant", label: "Personal Assistant", icon: "calendar-check" },
      { href: "/docs/examples/journal-memory", label: "Journal Memory", icon: "notebook-pen" },
      { href: "/docs/examples/research-assistant", label: "Research Assistant", icon: "microscope" },
      { href: "/docs/examples/multi-agent-memory", label: "Multi-agent Memory", icon: "users" },
    ],
  },
  {
    title: "Contributing",
    items: [
      { href: "/docs/contributing", label: "Overview", icon: "book-open" },
      { href: "/docs/contributing/development-setup", label: "Development Setup", icon: "settings" },
      { href: "/docs/contributing/project-structure", label: "Project Structure", icon: "blocks" },
      { href: "/docs/contributing/creating-issues", label: "Creating Issues", icon: "circle-alert" },
      { href: "/docs/contributing/testing-and-pull-requests", label: "Testing & Pull Requests", icon: "git-branch" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { href: "/docs/advanced/architecture", label: "Architecture", icon: "blocks" },
      { href: "/docs/advanced/schema", label: "Schema", icon: "table" },
      { href: "/docs/advanced/memory-pipeline", label: "Memory Pipeline", icon: "workflow" },
      { href: "/docs/advanced/retrieval-pipeline", label: "Retrieval Pipeline", icon: "search-code" },
      { href: "/docs/advanced/long-running-agents", label: "Long-running Agents", icon: "timer" },
      { href: "/docs/advanced/conflict-detection-versioning", label: "Conflict Detection & Versioning", icon: "git-branch" },
      { href: "/docs/advanced/retrieval-tuning", label: "Retrieval Tuning", icon: "sliders" },
      { href: "/docs/advanced/graph-expansion-topic-reentry", label: "Graph Expansion & Topic Re-entry", icon: "network" },
      { href: "/docs/advanced/queued-ingestion", label: "Queued Ingestion", icon: "download" },
      { href: "/docs/advanced/performance", label: "Performance", icon: "gauge" },
      { href: "/docs/advanced/scaling", label: "Scaling", icon: "panels" },
      { href: "/docs/advanced/production-deployment", label: "Production Deployment", icon: "zap" },
      { href: "/docs/advanced/prompt-design", label: "Prompt Design", icon: "braces" },
      { href: "/docs/advanced/graph-store", label: "Graph Store", icon: "database" },
      { href: "/docs/advanced/custom-pipelines", label: "Custom Pipelines", icon: "workflow" },
    ],
  },
];

export const docsNavItems = docsNavGroups.flatMap((group) => flattenPages(group.items));

function flattenPages(items: DocNavGroup["items"]): Array<Extract<DocNavGroup["items"][number], { href: string }>> {
  return items.flatMap((item) => item.type === "group" ? flattenPages(item.items) : [item]);
}
