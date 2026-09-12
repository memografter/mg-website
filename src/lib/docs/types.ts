export type DocCodeBlock = {
  code: string;
  label: string;
  language?: string;
};

export type DocSection = {
  title: string;
  body?: string[];
  bullets?: string[];
  warning?: {
    title: string;
    body: string;
  };
  links?: DocRelatedLink[];
  code?: DocCodeBlock[];
  table?: { headers: string[]; rows: string[][] };
  diagram?:
    | "memory-hierarchy"
    | "external-chat-flow"
    | "durable-ingestion-flow"
    | "intro-graph"
    | "memory-graph"
    | "invoke-flow"
    | "ingestion-flow"
    | "graft-flow"
    | "lifecycle-flow"
    | "recall-graft-flow"
    | "scope-flow"
    | "streaming-flow"
    | "fleet-flow"
    | "reentry-flow"
    | "example-chatbot-flow"
    | "example-support-flow"
    | "example-assistant-flow"
    | "example-journal-flow"
    | "example-research-flow"
    | "example-multi-agent-flow";
};

export type DocGuideMeta = {
  time: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  prerequisites?: DocRelatedLink[];
};

export type DocRelatedLink = {
  label: string;
  href: string;
  description?: string;
};

export type DocPage = {
  title: string;
  description: string;
  eyebrow: string;
  slug: string;
  guideMeta?: DocGuideMeta;
  sections: DocSection[];
};

export type DocNavGroup = {
  title: string;
  items: DocNavNode[];
};

export type DocNavPage = {
  type?: "page";
  href: string;
  label: string;
  icon: DocNavIcon;
};

export type DocNavFolder = {
  type: "group";
  id: string;
  label: string;
  items: DocNavNode[];
};

export type DocNavNode = DocNavPage | DocNavFolder;

export type DocNavIcon =
  | "archive"
  | "binary"
  | "blocks"
  | "book-open"
  | "bot"
  | "box"
  | "braces"
  | "calendar-check"
  | "circle-alert"
  | "combine"
  | "cpu"
  | "database"
  | "download"
  | "eye"
  | "file-plus"
  | "gauge"
  | "gem"
  | "git-branch"
  | "headphones"
  | "history"
  | "key-round"
  | "microscope"
  | "monitor-play"
  | "network"
  | "notebook-pen"
  | "package"
  | "panels"
  | "play"
  | "plug"
  | "radio"
  | "refresh"
  | "scan-text"
  | "scissors"
  | "search"
  | "search-check"
  | "search-code"
  | "settings"
  | "sliders"
  | "sparkles"
  | "split"
  | "square-terminal"
  | "table"
  | "tags"
  | "timer"
  | "trash"
  | "users"
  | "workflow"
  | "wrench"
  | "zap";
