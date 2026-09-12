import type { DocPage } from "./types";
import { docsNavItems } from "./nav";
import {
  initCode,
  installCode,
  migrateCode,
  minimalAgentCode,
  studioCode,
} from "./examples";
import { expandedDocsPages } from "./expanded-pages";
import { apiReferencePages } from "./api-reference";
import { guidePages } from "./guide-pages";
import { additionalAdvancedPages } from "./advanced-pages";
import { memoryPages } from "./memory-pages";
import { examplePages } from "./example-pages";
import { contributorPages } from "./contributor-pages";

const existingDocsPages: DocPage[] = [
  {
    slug: "",
    eyebrow: "Developer docs",
    title: "Structured memory for TypeScript chatbots.",
    description:
      "MemoGrafter records conversations as graph-backed memory, recalls relevant facts later, and can graft useful memory between sessions or agents.",
    sections: [
      {
        title: "What MemoGrafter is",
        body: [
          "MemoGrafter is a server-side TypeScript memory framework for chatbot applications. It stores message buffers, topic segments, topic nodes, memory nodes, graph edges, and graft provenance so applications can recall and transfer context without stuffing every old message into the prompt.",
        ],
      },
      {
        title: "Why MemoGrafter",
        body: [
          "Chatbot memory becomes hard to manage when every session is treated as a flat transcript. MemoGrafter turns conversation history into structured graph memory so applications can recall relevant facts, preserve provenance, and move useful context between sessions without replaying everything.",
        ],
        diagram: "intro-graph",
      },
    ],
  },
  {
    slug: "quick-start",
    eyebrow: "Quick start",
    title: "Add memory to a TypeScript chatbot in 5 minutes.",
    description:
      "Install MemoGrafter, initialize the project files, migrate the database, and run a minimal MemoGrafterAgent.",
    sections: [
      {
        title: "Minimal agent",
        body: [
          "Use `MemoGrafterAgent` when you want the simplest chatbot-facing API. It handles invoke-time recall, response generation, and background ingestion.",
        ],
        code: [{ label: "src/index.ts", code: minimalAgentCode }],
      },
      {
        title: "What happens",
        diagram: "invoke-flow",
        bullets: [
          "`invoke()` answers the current user message using recent raw history and any available recalled memory.",
          "Background ingestion turns conversation turns into topic segments, topic nodes, memory nodes, and graph edges.",
          "`recall()` retrieves relevant atomic facts later by meaning, evidence quality, lifecycle state, and token budget.",
        ],
      },
{
  "title": "When you already own the model call",
  "body": [
    "Use MemoGrafter.context before generating the answer and analyzeDetailed after the completed exchange. This gives your application an explicit session ID, durable receipt, and idempotency key."
  ],
  "links": [
    {
      "label": "Existing chatbot integration",
      "href": "/docs/guides/existing-chatbot"
    }
  ]
}
],
  },
  {
    slug: "database-setup-with-docker",
    eyebrow: "Getting started",
    title: "Database setup with Docker",
    description:
      "Run a local PostgreSQL database with pgvector for MemoGrafter using a minimal Docker Compose setup.",
    sections: [
      {
        title: "Prerequisites",
        bullets: [
          "Docker Desktop, or Docker Engine with the Compose plugin.",
          "A free local port for PostgreSQL. This guide uses `5432`.",
        ],
      },
      {
        title: "Compose file without Redis",
        body: [
          "For normal package usage, create `compose.yml` in your application directory with only PostgreSQL and pgvector. Redis is optional and is not required to run MemoGrafter.",
        ],
        code: [
          {
            label: "compose.yml",
            language: "yaml",
            code: `services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: memografter
      POSTGRES_PASSWORD: memografter
      POSTGRES_DB: memografter
    ports:
      - "5432:5432"
    volumes:
      - memografter_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U memografter -d memografter"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  memografter_postgres_data:`,
          },
        ],
      },
      {
        title: "Compose file with Redis",
        body: [
          "Contributors, or package users testing queue mode and the optional recall cache, can use this expanded `compose.yml`. It keeps the same PostgreSQL setup and adds Redis.",
          "Set `REDIS_URL=redis://localhost:6379` only when enabling a Redis-backed MemoGrafter feature.",
        ],
        code: [
          {
            label: "compose.yml",
            language: "yaml",
            code: `services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: memografter
      POSTGRES_PASSWORD: memografter
      POSTGRES_DB: memografter
    ports:
      - "5432:5432"
    volumes:
      - memografter_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U memografter -d memografter"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - memografter_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  memografter_postgres_data:
  memografter_redis_data:`,
          },
        ],
      },
      {
        title: "Start PostgreSQL",
        body: [
          "Start the container in the background. Docker downloads the image automatically the first time.",
        ],
        code: [{ label: "terminal", language: "bash", code: "docker compose up -d" }],
      },
      {
        title: "Configure MemoGrafter",
        body: [
          "Set `DATABASE_URL` in your server environment. Its username, password, port, and database name must match the Compose file.",
        ],
        code: [
          {
            label: ".env",
            code: "DATABASE_URL=postgresql://memografter:memografter@localhost:5432/memografter",
          },
        ],
      },
      {
        title: "Initialize and migrate",
        body: [
          "Initialize MemoGrafter, then create or update its database schema. The migration manages MemoGrafter-owned tables and enables required PostgreSQL extensions, including `vector`.",
        ],
        code: [
          {
            label: "terminal",
            language: "bash",
            code: `npx memo-grafter init
npx memo-grafter migrate`,
          },
        ],
      },
      {
        title: "Verify the setup",
        body: [
          "Run the doctor command to check the configuration and database connection.",
        ],
        code: [{ label: "terminal", language: "bash", code: "npx memo-grafter doctor" }],
      },
      {
        title: "Common Docker commands",
        code: [
          {
            label: "terminal",
            language: "bash",
            code: `# Show container status
docker compose ps

# Follow PostgreSQL logs
docker compose logs -f postgres

# Stop and remove the containers
docker compose down`,
          },
        ],
      },
      {
        title: "Reset the local database",
        warning: {
          title: "This permanently deletes your local database data",
          body: "The `-v` flag removes the named PostgreSQL volume, including every MemoGrafter table and all locally stored memory. This cannot be undone unless you have a backup.",
        },
        body: [
          "Use this only when you intentionally want a completely fresh local database, for example after changing the configured PostgreSQL credentials.",
        ],
        code: [{ label: "terminal", language: "bash", code: "docker compose down -v" }],
      },
      {
        title: "Common failures",
        bullets: [
          "Port `5432` already in use: stop the other PostgreSQL service or map another host port, such as `5433:5432`, and use that port in `DATABASE_URL`.",
          "Docker daemon not running: start Docker Desktop or the Docker Engine service, then retry `docker compose up -d`.",
          "PostgreSQL container unhealthy: run `docker compose ps` and `docker compose logs postgres`; wait for startup to finish and check the environment values and available disk space.",
          "`DATABASE_URL` mismatch: make its username, password, host port, and database name match `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and the Compose port mapping.",
          "pgvector extension permission problem: run migrations as the database owner created by Compose. A restricted database user may not have permission to run `CREATE EXTENSION vector`.",
          "Existing Docker volume with old credentials: PostgreSQL applies `POSTGRES_*` values only when initializing an empty data directory. Reuse the original credentials, or intentionally reset the volume after backing up any data you need.",
        ],
      },
      {
        title: "Package users and contributors",
        body: [
          "Package users should start with the PostgreSQL-only Compose file. It contains everything required for ordinary MemoGrafter usage.",
          "The PostgreSQL-and-Redis Compose file is intended for contributors and users testing queue mode, caching, and integrations. Adding Redis does not make it mandatory for the rest of MemoGrafter.",
        ],
      },
    ],
  },
  {
    slug: "installation",
    eyebrow: "Setup",
    title: "Install MemoGrafter and prepare the database.",
    description:
      "MemoGrafter runs server-side on Node.js and uses PostgreSQL with pgvector for the built-in storage backend.",
    sections: [
      {
        title: "Requirements",
        bullets: [
          "Node.js 18 or newer.",
          "TypeScript or modern JavaScript using ES modules.",
          "PostgreSQL with the `pgvector` extension for the built-in `PostgresGraphStore`.",
          "An LLM adapter and an embedding adapter.",
          "Redis only when enabling queue mode or the optional recall cache.",
        ],
      },
      {
        title: "Install the package",
        body: [
          "Install MemoGrafter from npm in the server-side package where your chatbot or memory workflow runs.",
        ],
        code: [{ label: "terminal", code: installCode }],
      },
      {
        title: "Initialize project files",
        body: [
          "Create the generated MemoGrafter config and schema files. These files live under `src/memo-grafter/` so they are easy to review, keep separate from your application code, and commit with the rest of your project.",
        ],
        code: [{ label: "terminal", code: initCode }],
      },
      {
        title: "Generated files overview",
        bullets: [
          "`src/memo-grafter/mg.config.ts` contains project-level MemoGrafter settings, including the database connection and optional feature configuration.",
          "`src/memo-grafter/mg-schema.ts` defines the MemoGrafter-managed database schema used by migration and other CLI tooling.",
        ],
        body: [
          "Review both generated files after initialization. Keep secrets in environment variables rather than committing credentials in `mg.config.ts`.",
        ],
        links: [
          {
            label: "MemoGrafter schema",
            href: "/docs/advanced/schema",
            description: "Explore the generated schema, PostgreSQL extensions, managed tables, indexes, and migration boundary.",
          },
          {
            label: "Environment setup",
            href: "/docs/environment-setup",
            description: "Configure the generated mg.config.ts file and its environment variables.",
          },
        ],
      },
      {
        title: "Create the database schema",
        body: [
          "Run the migration command after setting `DATABASE_URL`. MemoGrafter owns only its `mg_*` tables and required PostgreSQL extensions.",
        ],
        code: [{ label: "terminal", code: migrateCode }],
      },
      {
        title: "Verify the installation",
        body: [
          "Run Doctor after migration to verify the installed package, configuration, PostgreSQL connection, pgvector extension, migration state, and required MemoGrafter tables. Doctor performs read-only diagnostics and does not change your configuration or database.",
        ],
        code: [{ label: "terminal", language: "bash", code: "npx memo-grafter doctor" }],
        links: [
          {
            label: "Doctor command reference",
            href: "/docs/cli/doctor",
            description: "Review every check, database resolution order, exit codes, and troubleshooting guidance.",
          },
        ],
      },
      {
        title: "Migration boundary",
        body: [
          "`memo-grafter migrate` manages only MemoGrafter-owned `mg_*` tables and PostgreSQL extensions. Application tables remain in your existing Prisma, Drizzle, SQL, or custom migration workflow.",
        ],
      },
{
  "title": "Upgrade readiness",
  "body": [
    "Run init to regenerate src/memo-grafter/mg-schema.ts, then migrate and doctor. Existing mg.config.ts is preserved. Provider SDKs are optional; install the SDK used by each configured adapter. Current topic-domain migrations require PostgreSQL 15 or newer."
  ],
  "links": [
    {
      "label": "Memory quality migration",
      "href": "/docs/guides/memory-quality-migration"
    },
    {
      "label": "Errors and readiness",
      "href": "/docs/guides/errors-and-readiness"
    }
  ]
}
],
  },
  {
    slug: "environment-setup",
    eyebrow: "Setup",
    title: "Configure database, model, embedding, and optional Redis settings.",
    description:
      "MemoGrafter resolves database and Studio settings from CLI flags, environment variables, and generated config.",
    sections: [
      {
        title: "Environment variables",
        code: [
          {
            label: ".env",
            code: `# MemoGrafter stores graph memory in PostgreSQL.
DATABASE_URL=postgres://postgres:postgres@localhost:5432/memo_grafter
# Add only the providers your adapters use.
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
# Required only for queue mode or recall caching.
REDIS_URL=redis://localhost:6379`,
          },
        ],
      },
      {
        title: "Generated mg.config.ts",
        body: [
          "`npx memo-grafter init` creates `src/memo-grafter/mg.config.ts`. The CLI loads this project-local file for database access, embeddings, and optional Redis-backed features.",
          "The generated configuration reads credentials from the server environment. Commit the configuration structure, but never place database passwords, provider keys, or Redis credentials directly in the file.",
        ],
        code: [
          {
            label: "src/memo-grafter/mg.config.ts",
            language: "ts",
            code: `declare const process: {
  env: {
    DATABASE_URL?: string;
    OPENAI_API_KEY?: string;
    MEMO_GRAFTER_EMBEDDING_MODEL?: string;
    REDIS_URL?: string;
  };
};
const embeddingModel =
  process.env.MEMO_GRAFTER_EMBEDDING_MODEL ?? "text-embedding-3-small";
export default {
  db: {
    connectionString: process.env.DATABASE_URL,
  },
  // Optional recall cache. Falls back to PostgreSQL if Redis is unavailable.
  // cache: process.env.REDIS_URL
  //   ? { connectionString: process.env.REDIS_URL }
  //   : undefined,
  // Optional Redis-backed ingestion; failed enqueues do not retry synchronously.
  // queue: process.env.REDIS_URL
  //   ? { redisUrl: process.env.REDIS_URL }
  //   : undefined,
  // Set OPENAI_API_KEY or replace this object with your own embedder.
  embedder: process.env.OPENAI_API_KEY
    ? {
        async embed(text: string): Promise<number[]> {
          const response = await fetch(
            "https://api.openai.com/v1/embeddings",
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
              },
              body: JSON.stringify({
                model: embeddingModel,
                input: text,
              }),
            },
          );
          if (!response.ok) {
            throw new Error(
              \`OpenAI embeddings request failed: \${response.status} \${await response.text()}\`,
            );
          }
          const body = (await response.json()) as {
            data?: Array<{ embedding?: number[] }>;
          };
          const embedding = body.data?.[0]?.embedding;
          if (!embedding) {
            throw new Error(
              "OpenAI embeddings response did not include an embedding.",
            );
          }
          return embedding;
        },
      }
    : undefined,
};`,
          },
        ],
      },
      {
        title: "Configuration options",
        bullets: [
          "`db.connectionString` selects the PostgreSQL database used by migration, Doctor, Studio, and the built-in store.",
          "`embedder` supplies the embeddings used for topic and memory similarity search. The generated example calls OpenAI only when `OPENAI_API_KEY` is available.",
          "`MEMO_GRAFTER_EMBEDDING_MODEL` overrides the generated default embedding model, `text-embedding-3-small`.",
          "`cache.connectionString` optionally enables the Redis recall cache. Recall falls back to PostgreSQL when Redis is unavailable.",
          "`queue.redisUrl` optionally enables Redis-backed ingestion. Queue acceptance and retry behavior should be monitored separately from foreground responses.",
        ],
      },
      {
        title: "Resolution order",
        bullets: [
          "A supported CLI option such as `--db` takes precedence.",
          "The project `.env` file or process environment is checked next.",
          "The generated `src/memo-grafter/mg.config.ts` supplies project defaults and optional integrations.",
          "Doctor, migration, and Studio follow the same database resolution order.",
        ],
        links: [
          {
            label: "CLI configuration reference",
            href: "/docs/cli/config",
            description: "Review configuration discovery and CLI precedence rules.",
          },
        ],
      },
{
  "title": "Readiness and optional services",
  "body": [
    "Setting REDIS_URL alone does not enable caching or queueing. Opt in through cache.connectionString or queue.redisUrl in the configuration. Doctor treats optional cache failure as a warning and configured queue failure as required. MemoGrafter.create validates local SDK and environment readiness before storage initialization."
  ],
  "links": [
    {
      "label": "Errors & readiness",
      "href": "/docs/guides/errors-and-readiness"
    },
    {
      "label": "Topic domains",
      "href": "/docs/guides/topic-domains"
    }
  ]
}
],
  },
  {
    slug: "concepts/how-it-works",
    eyebrow: "Core concepts",
    title: "How it works",
    description:
      "MemoGrafter turns conversation history into structured graph memory, then retrieves only the context an agent needs.",
    sections: [
{
  "title": "Two application flows",
  "body": [
    "Use MemoGrafterAgent.invoke when MemoGrafter owns the chat call. If your application already generates responses, call context before generation and analyze or analyzeDetailed after a completed exchange."
  ],
  "diagram": "external-chat-flow"
},
{
  "title": "Memory hierarchy",
  "body": [
    "Sessions contain stable topics, optionally organized into domains. Bounded episodes preserve events; canonical atomic memories retain immutable evidence. Returning to a subject can reuse its stable topic without losing each episode."
  ],
  "diagram": "memory-hierarchy"
},
{
  "title": "Write and read boundaries",
  "body": [
    "The initialized PostgreSQL durable path accepts messages and a run before provider work. Preparation validates provenance and quality; the required graph, evidence, cursor, and run completion commit together. Queue acceptance does not imply searchable memory."
  ]
},
{
  "title": "Selection and lifecycle",
  "body": [
    "Recall searches memory, topic, and episode vectors. Similarity determines rank, evidence quality breaks ties, and adaptive selection respects candidate, topic, fact, and token limits. Inactive memories are filtered. Pins provide separately budgeted required context; clusters only organize topics."
  ],
  "links": [
    {
      "label": "Durable ingestion",
      "href": "/docs/guides/durable-ingestion"
    },
    {
      "label": "Memory quality",
      "href": "/docs/concepts/memory-quality"
    }
  ]
}
],
  },
  {
    slug: "concepts/messages",
    eyebrow: "Core concepts",
    title: "Messages are the raw source of conversation memory.",
    description:
      "A message is one system, user, or assistant turn that can be stored in the message buffer and used for segmentation.",
    sections: [
      {
        title: "Why messages matter",
        body: [
          "Messages are the only part of the system that exactly mirrors the chat transcript. MemoGrafter keeps them as source material, then derives more durable graph memory from them in the background.",
          "A developer usually touches messages through `invoke()`, `getHistory()`, or direct ingestion tests. Most long-term behavior comes from the graph records created from these turns, not from replaying every raw message forever.",
        ],
      },
      {
        title: "Shape",
        code: [
          {
            label: "types.ts",
            code: `// Messages preserve the original chat turn before graph memory is derived.
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}`,
          },
        ],
      },
      {
        title: "How MemoGrafter uses messages",
        body: [
          "The message buffer acts like an append-only staging area. The ingestion cursor records which ranges have already been processed so queue retries and repeated invokes do not duplicate graph memory.",
        ],
        bullets: [
          "`MemoGrafterAgent` keeps public chat history for the current session.",
          "Ingestion stores messages in `mg_message_buffer`.",
          "The ingest cursor tracks which message ranges have already produced graph memory.",
          "Invoke-time prompts use recalled facts plus a recent raw history window.",
        ],
      },
    ],
  },
  {
    slug: "concepts/segments",
    eyebrow: "Core concepts",
    title: "Segments split long history into topical units.",
    description:
      "MemoGrafter detects topic drift and stores contiguous message ranges as topic segments.",
    sections: [
      {
        title: "Why segments exist",
        body: [
          "A segment is a range of messages that belong to one topic. It keeps long conversations from becoming one undifferentiated memory blob.",
          "Think of segments as the boundary between raw chat and graph memory. They preserve where a topic started and ended, which makes later recall, Studio inspection, and graft provenance easier to explain.",
        ],
        code: [{ label: "example", code: `messages 0-4 -> Japan travel planning
messages 5-8 -> cover letter writing` }],
      },
      {
        title: "Drift signals",
        body: [
          "MemoGrafter uses embedding distance and optional intent signals to decide when a conversation has moved to a new topic. Short acknowledgements and filler turns are dampened so they do not accidentally create noisy segments.",
        ],
        bullets: [
          "Embedding distance from the current topic.",
          "Structural phrases like `by the way` or `going back to`.",
          "Short-message dampening for filler turns.",
          "Optional LLM ambiguity detection and reentry detection.",
        ],
      },
{
  "title": "Segments, episodes, and stable topics",
  "body": [
    "A segment identifies a bounded message range. Each newly processed segment produces an episode assigned to a stable topic. Several episodes may reuse the same topic; do not assume one segment always creates one new topic."
  ],
  "links": [
    {
      "label": "Stable topics & episodes",
      "href": "/docs/concepts/episodes"
    }
  ]
}
],
  },
  {
    slug: "concepts/topic-nodes",
    eyebrow: "Core concepts",
    title: "Topic nodes are the graph backbone.",
    description:
      "Each topic node summarizes a segment, carries an embedding, and participates in topic-level recall and grafting.",
    sections: [
{
  "title": "Stable topic identity",
  "body": [
    "TopicNode is the session-owned subject that can accumulate multiple episodes. Topic assignment reuses an active topic when the episode embedding meets the configured reuse threshold (default 0.82)."
  ]
},
{
  "title": "Aggregate metadata",
  "body": [
    "A stable topic carries its label, aggregate summary, normalized embedding centroid, source range, tags, activity timestamps, episode count, last episode ID, and revision. Earlier bounded summaries live on episodes, so reuse does not erase the original event."
  ]
},
{
  "title": "Organization and required context",
  "body": [
    "A topic can have an optional session-owned cluster and a persistent pin. Cluster membership does not affect retrieval. A pin adds active topic context independently of query relevance, subject to its own budget. Suppression excludes active context without deleting the topic."
  ],
  "links": [
    {
      "label": "Episodes",
      "href": "/docs/concepts/episodes"
    },
    {
      "label": "Topic domains",
      "href": "/docs/guides/topic-domains"
    },
    {
      "label": "Pinning",
      "href": "/docs/guides/topic-pinning"
    },
    {
      "label": "TopicNode contract",
      "href": "/docs/api-reference/types/topic-node"
    }
  ]
}
],
  },
  {
    slug: "concepts/memory-nodes",
    eyebrow: "Core concepts",
    title: "Memory nodes are atomic recall facts.",
    description:
      "Memory nodes hold extracted facts, insights, tasks, questions, and references attached to topic nodes.",
    sections: [
{
  "title": "Durable, supported state",
  "body": [
    "Atomic memories represent user-authored or user-confirmed preferences, constraints, profile facts, goals, decisions, commitments, corrections, and important unresolved goals. Assistant suggestions and generated content are not durable user state unless adopted by a user. Documents use document ownership."
  ]
},
{
  "title": "Identity and evidence",
  "body": [
    "MemoryNode retains subject, predicate, value, type, source, tags, canonical identity, provenance, lifecycle state, and structured quality. Equivalent observations reinforce the canonical memory through immutable evidence rather than duplicate facts."
  ]
},
{
  "title": "Quality and retrieval",
  "body": [
    "quality contains explicitness, sourceReliability, stability, and salience. Unknown dimensions default to 0.5. Semantic similarity determines retrieval rank; evidence quality only breaks ties. Stability and salience influence persistence, not query relevance."
  ]
},
{
  "title": "Historical and inactive memory",
  "body": [
    "Forgotten, decayed, superseded, and suppressed-topic memories do not participate in ordinary active recall. History and diff retain structural changes. Conflicting active claims remain visible until sufficient evidence supports resolution."
  ],
  "links": [
    {
      "label": "Canonical memory",
      "href": "/docs/concepts/canonical-memory"
    },
    {
      "label": "Memory quality",
      "href": "/docs/concepts/memory-quality"
    },
    {
      "label": "MemoryNode contract",
      "href": "/docs/api-reference/types/memory-node"
    }
  ]
}
],
  },
  {
    slug: "concepts/graph-edges",
    eyebrow: "Core concepts",
    title: "Graph edges preserve context and provenance.",
    description:
      "Topic and memory edges link related, temporal, reentry, grafted, conflicting, and updated memories.",
    sections: [
      {
        title: "Why edges exist",
        body: [
          "Edges explain how memories relate over time and meaning. They connect adjacent topics, similar topics, returned topics, grafted memory, conflicting facts, and updated facts.",
          "Without edges, recall would be a bag of matching rows. With edges, MemoGrafter can expand context, preserve provenance, and show why a fact traveled from one session into another.",
        ],
      },
      {
        title: "Topic edges",
        bullets: [
          "`temporal` edges connect adjacent topic nodes.",
          "`semantic` edges connect similar topic nodes.",
          "`reentry` edges connect a returned topic to an earlier matching topic.",
          "`grafted` edges preserve copied-memory provenance.",
        ],
      },
      {
        title: "Memory edges",
        bullets: [
          "Semantic memory edges link related facts inside a topic.",
          "Maintenance edges mark conflicts and updates.",
          "History and diff reads use existing rows and edges rather than a separate event store.",
        ],
      },
    ],
  },
  {
    slug: "concepts/grafting",
    eyebrow: "Core concepts",
    title: "Grafting moves useful memory between sessions.",
    description:
      "Grafting assembles prompt-ready context from selected topic nodes or copies active memory into another session with provenance.",
    sections: [
      {
        title: "When grafting helps",
        body: [
          "Grafting is for moving relevant memory into a new working context without copying an entire transcript. It is useful when a user changes sessions, a worker needs shared context, or an assistant needs only the parts of a graph that match a task.",
          "Every grafted path should remain explainable. MemoGrafter keeps provenance so Studio and debugging tools can show where copied memory came from.",
        ],
      },
      {
        title: "Two paths",
        bullets: [
          "Explicit grafting selects known topic IDs and formats them into a prompt.",
          "Semantic grafting finds topic seeds by query similarity before assembling the prompt.",
          "Absorption copies active topic nodes and active memory nodes into a target session.",
        ],
      },
      {
        title: "Graft flow",
        diagram: "graft-flow",
      },
    ],
  },
  {
    slug: "concepts/lifecycle",
    eyebrow: "Core concepts",
    title: "Lifecycle controls are soft-state memory management.",
    description:
      "MemoGrafter can forget memories, suppress topics, restore topics, and annotate memory quality without deleting graph rows by default.",
    sections: [
      {
        title: "Why lifecycle is soft state",
        body: [
          "Memory can be useful, outdated, suppressed, or wrong without needing to disappear from the database. MemoGrafter keeps lifecycle as state on records so recall can stay clean while Studio and audits still have history.",
          "Developers touch lifecycle controls when users ask to forget something, when a topic should stop appearing in active context, or when maintenance passes annotate low-quality memory.",
        ],
        diagram: "lifecycle-flow",
      },
      {
        title: "Controls",
        bullets: [
          "`forget(memoryId)` marks a memory inactive for recall, grafting, absorption, and maintenance.",
          "`forgetMany(memoryIds)` performs a bulk forget.",
          "`suppressTopic(topicId)` hides a topic from active reads and graph expansion.",
          "`restoreTopic(topicId)` makes a suppressed topic active again.",
        ],
      },
      {
        title: "Why soft state",
        body: [
          "Snapshots and Studio can still inspect inactive rows, which is important for audit, lifecycle display, memory history, and debugging.",
        ],
      },
    ],
  },
  {
    slug: "guides/chatbot-memory",
    eyebrow: "Guide",
    title: "Build a chatbot with memory.",
    description:
      "Use MemoGrafterAgent to recall relevant memory before an LLM call and ingest new turns afterward.",
    sections: [
      {
        title: "Use MemoGrafterAgent",
        code: [{ label: "agent.ts", code: minimalAgentCode }],
      },
      {
        title: "Invoke path",
        bullets: [
          "Checks whether the session already has topic nodes.",
          "Recalls relevant memory for the new user message.",
          "Calls the LLM with memory context and recent raw history.",
          "Schedules ingestion after the response.",
        ],
      },
    ],
  },
  {
    slug: "guides/ingest-text",
    eyebrow: "Guide",
    title: "Ingest text and documents without an assistant response.",
    description:
      "Use ingestText for editor content, document imports, transcripts, and notes.",
    sections: [
      {
        title: "Text ingestion",
        code: [
          {
            label: "ingest.ts",
            code: `// Ingest text directly when there is no assistant response to generate.
await agent.ingestText(editorContent, {
  // Replace previous imported content from the same source when re-syncing.
  replace: true,
  // Label and source make Studio/audits easier to read later.
  label: "Morning entry",
  source: "classic-editor",
});`,
          },
        ],
      },
      {
        title: "Behavior",
        bullets: [
          "Text is split into internal chunks by line, sentence, and max-size boundaries.",
          "The same drift detector and extraction pipeline creates topic and memory nodes.",
          "Raw text does not appear in `getHistory()` and does not trigger assistant generation.",
          "`remember(text)` is a convenience wrapper for explicit natural-language facts.",
        ],
      },
    ],
  },
  {
    slug: "guides/recall-facts",
    eyebrow: "Guide",
    title: "Recall relevant facts by meaning.",
    description:
      "Targeted recall searches memory nodes, filters inactive facts, ranks by similarity, using evidence quality only to break ties, and returns a prompt-ready memory block.",
    sections: [
      {
        title: "Recall",
        code: [
          {
            label: "recall.ts",
            code: `// Search graph memory for facts related to the current task.
const result = await agent.recall("deployment config", {
  limit: 8,
  
  // Keep the generated memory prompt within your model budget.
  tokenBudget: 1000,
  tags: ["project:memo-grafter"],
});

// facts are structured records; systemPrompt is ready to inject into an LLM call.
console.log(result.facts);
console.log(result.systemPrompt);`,
          },
        ],
      },
      {
        title: "Result",
        bullets: [
          "`facts`: matching memory nodes with similarity scores.",
          "`nodes`: parent topic nodes for included facts.",
          "`systemPrompt`: formatted memory context.",
          "`tokenCount` and `tokenBudget`: prompt size controls.",
        ],
      },
    ],
  },
  {
    slug: "guides/graft-memory",
    eyebrow: "Guide",
    title: "Graft memory between sessions.",
    description:
      "Preview topic memory as prompt context or copy active memory into another chatbot/session.",
    sections: [
      {
        title: "Preview a graft",
        code: [
          {
            label: "graft.ts",
            code: `// Preview transferable memory as prompt context.
const graft = await agent.graft();
console.log(graft.systemPrompt);

// Narrow the graft to topics relevant to a specific handoff.
const selected = await agent.graftByRelevance("authentication discussion", {
  topK: 5,
  minSimilarity: 0.6,
  hopDepth: 1,
});`,
          },
        ],
      },
      {
        title: "Absorb from another agent",
        code: [
          {
            label: "absorb.ts",
            code: `// Copy selected active memory from one agent/session into another.
await targetAgent.absorbFromAgent(sourceAgent, {
  query: "travel preferences",
  topK: 3,
});`,
          },
        ],
      },
    ],
  },
  {
    slug: "guides/studio",
    eyebrow: "Guide",
    title: "Use Studio to inspect graph memory.",
    description:
      "Studio is local developer tooling for sessions, graph inspection, table browsing, prompt preview, and supported lifecycle actions.",
    sections: [
      {
        title: "Launch Studio",
        body: [
          "Studio is intentionally separate from installation. Start it when you want to inspect sessions, graph memory, tables, and prompt previews during development.",
        ],
        code: [{ label: "terminal", code: studioCode }],
      },
      {
        title: "What Studio shows",
        bullets: [
          "Session list first, then on-demand tab data for the selected session.",
          "Graph tab with topic nodes as the backbone and memories for the selected topic.",
          "Tables tab for read-only `mg_*` table inspection.",
          "Prompt Preview for read-only graft or recall simulation.",
          "Supported lifecycle action: topic suppression.",
        ],
      },
    ],
  },
  {
    slug: "guides/queue-mode",
    eyebrow: "Guide",
    title: "Use queue mode for asynchronous ingestion.",
    description:
      "Queue mode moves ingestion work behind BullMQ and Redis while keeping the same incremental ingest contract.",
    sections: [
      {
        title: "Configure queue mode",
        code: [
          {
            label: "agent.ts",
            code: `const agent = new MemoGrafterAgent({
  db: { connectionString: process.env.DATABASE_URL! },
  llm,
  embedder,
  // Queue mode moves ingestion work to Redis/BullMQ.
  queue: {
    redisUrl: process.env.REDIS_URL!,
    // Keep queues tidy after each job settles.
    removeOnComplete: true,
    removeOnFail: true,
  },
});`,
          },
        ],
      },
      {
        title: "Operational notes",
        bullets: [
          "Queue mode is useful when ingestion becomes too slow to run inline.",
          "Optional cache failures degrade retrieval; configured queue failures must be inspected and recovered through durable ingestion state.",
          "The ingest cursor prevents queue retries from duplicating topic nodes for the same message range.",
        ],
      },
    ],
  },
  {
    slug: "guides/fleet-memory",
    eyebrow: "Guide",
    title: "Use shared fleet memory across workers.",
    description:
      "Fleets group color-scoped worker chatbots and let a conductor graft memory across workers.",
    sections: [
      {
        title: "Shared fleet memory",
        code: [
          {
            label: "fleet.ts",
            code: `// A fleet shares memory between related worker agents.
const fleet = new MemoGrafterFleet(config, {
  id: "support-fleet",
  defaultWorkerMemory: "both",
});

await fleet.initialize();
// Store a shared fact once so multiple workers can recall it.
await fleet.ingestToFleet("Refund policy: customers can request a refund within 30 days.");

const support = await fleet.createWorker({ color: "support" });
// Workers can search local memory, shared memory, or both.
const recall = await support.recall("refund policy", { memory: "both" });`,
          },
        ],
      },
      {
        title: "Fleet concepts",
        bullets: [
          "Shared fleet memory lives in a synthetic shared session.",
          "Workers can use local, shared, or combined memory modes.",
          "Conductors coordinate memory transfer between workers.",
        ],
      },
    ],
  },
  {
    slug: "guides/custom-adapters",
    eyebrow: "Guide",
    title: "Use custom LLM and embedder adapters.",
    description:
      "MemoGrafter core depends on adapter interfaces, not a single model provider.",
    sections: [
      {
        title: "Custom adapters",
        code: [
          {
            label: "adapters.ts",
            code: `import type { EmbedAdapter, LLMAdapter, Message } from "memo-grafter";

// Implement this interface to route completions to your provider of choice.
class MyLLMAdapter implements LLMAdapter {
  async complete(messages: Message[], system?: string): Promise<string> {
    return "Assistant response";
  }
}

// Embeddings must return vectors compatible with your storage backend.
class MyEmbedAdapter implements EmbedAdapter {
  async embed(text: string): Promise<number[]> {
    return [];
  }
}`,
          },
        ],
      },
    ],
  },
  {
    slug: "guides/production",
    eyebrow: "Guide",
    title: "Production setup notes.",
    description:
      "MemoGrafter is experimental. Treat it as a starting point for prototypes and evaluation before user-facing production use.",
    sections: [
      {
        title: "Checklist",
        bullets: [
          "Keep secrets in environment variables and never expose provider keys to browser code.",
          "Run `memo-grafter migrate` outside request handling.",
          "Tune `tokenBudget` to control prompt size and cost.",
          "Use queue mode if ingestion becomes slow.",
          "Use lifecycle APIs for user-controlled memory management.",
          "Store your own user/session mapping outside MemoGrafter.",
          "Call `close()` during graceful shutdown.",
          "Run your own evaluation before trusting memory transfer behavior in user-facing flows.",
        ],
      },
    ],
  },
  {
    slug: "api-reference/configuration",
    eyebrow: "Reference",
    title: "Configuration reference.",
    description:
      "The common configuration object wires database, adapters, drift, graph expansion, injection, queue, and cache behavior.",
    sections: [
      {
        title: "Shape",
        code: [
          {
            label: "config.ts",
            code: `const agent = new MemoGrafterAgent({
  db: { connectionString: process.env.DATABASE_URL! },
  llm,
  embedder,
  // Drift controls when a run of messages becomes a new topic segment.
  drift: {
    mode: "intent",
    driftSensitivity: "medium",
    minSegmentMessages: 3,
    reentryDetection: true,
  },
  // Graph expansion decides how far recall/grafting can walk related topics.
  graph: { topK: 5, hopDepth: 2 },
  // Injection controls how much memory is placed into the LLM prompt.
  inject: {
    bufferSize: 4,
    tokenBudget: 1500,
    recentWindowSize: 20,
    recallLimit: 6,
    recallMinSimilarity: 0.55,
  },
});`,
          },
        ],
      },
    ],
  },
  {
    slug: "api-reference/public-api",
    eyebrow: "Reference",
    title: "Public API overview.",
    description:
      "MemoGrafter exports high-level agent APIs, lower-level pipelines, storage contracts, provider adapters, fleet APIs, and maintenance APIs.",
    sections: [
      {
        title: "Main exports",
        bullets: [
          "`MemoGrafterAgent`, `MemoGrafter`, `MemoGrafterFleet`, `WorkerAgent`, `ConductorAgent`.",
          "`OpenAILLMAdapter`, `OpenAIEmbedAdapter`, `GeminiLLMAdapter`, `GeminiEmbedAdapter`, `AnthropicLLMAdapter`.",
          "`PostgresGraphStore`, `GraphStore`.",
          "`MemoGrafterCrawler`, `ConflictDetectionPass`, `DecayScoringPass`, `VersioningPass`.",
          "`GrafterPipeline`, `IngestPipeline`, `RetrieverPipeline`.",
        ],
      },
    ],
  },
  {
    slug: "api-reference/cli",
    eyebrow: "Reference",
    title: "CLI reference.",
    description:
      "The MemoGrafter CLI provides explicit setup, migration, and local Studio workflows.",
    sections: [
      {
        title: "Commands",
        bullets: [
          "`memo-grafter init`: creates `src/memo-grafter/mg-schema.ts` and `src/memo-grafter/mg.config.ts`.",
          "`memo-grafter migrate`: creates or updates MemoGrafter-owned `mg_*` database infrastructure.",
          "`memo-grafter studio`: verifies schema and starts local Studio on `localhost:2891` or the next available port.",
        ],
        code: [{ label: "terminal", code: `${initCode}
${migrateCode}
${studioCode}` }],
      },
    ],
  },
  {
    slug: "api-reference/data-model",
    eyebrow: "Reference",
    title: "Data model reference.",
    description:
      "MemoGrafter stores raw turns, topic segments, topic nodes, memory nodes, topic edges, memory edges, graph snapshots, and lifecycle metadata.",
    sections: [
      {
        title: "Core records",
        bullets: [
          "`Message`: raw chat turn.",
          "`TopicSegment`: contiguous message range for one topic.",
          "`TopicNode`: graph-level topic summary and embedding.",
          "`MemoryNode`: atomic structured memory attached to a topic.",
          "`TopicEdge`: temporal, semantic, reentry, or grafted topic relationship.",
          "`MemoryEdge`: semantic, conflict, update, or related memory relationship.",
          "`GraphSnapshot`: inspection shape for graph and lifecycle views.",
        ],
      },
    ],
  },
  {
    slug: "api-reference/storage-schema",
    eyebrow: "Reference",
    title: "Storage schema reference.",
    description:
      "The built-in PostgreSQL store manages MemoGrafter-owned tables and pgvector indexes.",
    sections: [
      {
        title: "Managed tables",
        bullets: [
          "`mg_message_buffer`",
          "`mg_segments`",
          "`mg_topic_nodes`",
          "`mg_topic_edges`",
          "`mg_memory_nodes`",
          "`mg_memory_edges`",
          "`mg_session_ingest_state`",
          "`mg_graft_registry`",
          "`mg_fleets`",
          "`mg_fleet_agents`",
        ],
      },
      {
        title: "Important boundary",
        body: [
          "The CLI migration command is the recommended setup path. Direct `PostgresGraphStore.migrate()` remains an advanced fallback for CI, deploy, test, or constrained tooling.",
        ],
      },
    ],
  },
  {
    slug: "api-reference/troubleshooting",
    eyebrow: "Reference",
    title: "Troubleshooting.",
    description:
      "Common setup, ingestion, recall, grafting, Redis, and browser-runtime issues.",
    sections: [
      {
        title: "Common fixes",
        bullets: [
          "`DATABASE_URL is not reachable`: confirm PostgreSQL, connection string, and `pgvector`.",
          "No topic nodes: check conversation length, drift settings, adapters, and queue completion.",
          "Absorb copies zero nodes: check source session, lifecycle state, and semantic thresholds.",
          "Recall returns zero facts: inspect candidate limits and adaptive selection, confirm ingestion finished, and inspect memory nodes in Studio.",
          "Duplicate topics: verify incremental ingest cursor behavior and queue retries.",
          "Redis: cache failures are optional warnings; configured queue connectivity is required.",
        ],
      },
    ],
  },
  {
    slug: "architecture",
    eyebrow: "Internals",
    title: "How MemoGrafter works.",
    description:
      "A shorter public architecture guide for the main runtime layers and flows.",
    sections: [
      {
        title: "Runtime layers",
        bullets: [
          "`MemoGrafterAgent` is the common chatbot-facing API.",
          "`MemoGrafter` wires storage, pipelines, adapters, queueing, and recall cache.",
          "`IngestPipeline` turns history or raw text into graph records.",
          "`RetrieverPipeline` and `GrafterPipeline` turn graph records back into prompt-ready memory.",
          "`GraphStore` is the persistence boundary; `PostgresGraphStore` is the built-in implementation.",
          "`MemoGrafterCrawler` annotates memory quality over time.",
        ],
      },
      {
        title: "Main flow",
        code: [{ label: "architecture", code: `user / assistant messages or raw text
-> message buffer
-> topic drift detection
-> topic segments
-> topic nodes
-> atomic memory nodes
-> graph edges
-> recall, injection, or grafting` }],
      },
    ],
  },
  {
    slug: "internals/ingestion-pipeline",
    eyebrow: "Internals",
    title: "Ingestion pipeline internals.",
    description:
      "Contributor-level notes for incremental graph construction, topic drift detection, segment processing, and queue-backed ingestion.",
    sections: [
      {
        title: "Main responsibilities",
        bullets: [
          "Save message buffers and ingest cursors.",
          "Embed new messages with a small overlap window.",
          "Detect topic segments and optional reentry matches.",
          "Persist topic segments, topic nodes, memory nodes, and edges.",
          "Update ingest cursor only after graph writes complete.",
        ],
      },
    ],
  },
  {
    slug: "internals/retrieval-and-grafting",
    eyebrow: "Internals",
    title: "Retrieval and grafting internals.",
    description:
      "Contributor-level notes for fact recall, semantic grafting, graph expansion, prompt assembly, and token budgets.",
    sections: [
      {
        title: "Recall path",
        bullets: [
          "Embed query.",
          "Search active memory-node vectors.",
          "Filter decayed, superseded, forgotten, and suppressed-topic memories.",
          "Rank by similarity, using evidence quality only to break ties.",
          "Group facts by parent topic node and format under token budget.",
        ],
      },
      {
        title: "Graft path",
        bullets: [
          "Select explicit or semantic seed topic nodes.",
          "Optionally expand through graph neighbours.",
          "Load source message context and active memory facts.",
          "Include maintenance notes when active facts supersede historical summaries.",
          "Trim to token budget.",
        ],
      },
    ],
  },
  {
    slug: "internals/storage-and-migrations",
    eyebrow: "Internals",
    title: "Storage and migrations internals.",
    description:
      "Contributor-level notes for GraphStore, PostgreSQL/pgvector, schema declarations, migrations, lifecycle filtering, and graft provenance.",
    sections: [
      {
        title: "Storage contract",
        bullets: [
          "`GraphStore` covers initialization, message buffers, ingest cursors, topic/memory records, lifecycle, vector search, graph traversal, graft registry, fleet metadata, and cleanup.",
          "`PostgresGraphStore` maps database rows into core types and owns pgvector SQL details.",
          "Schema changes require migration, schema declarations, tests, and docs updates.",
        ],
      },
    ],
  },
  {
    slug: "internals/maintenance-crawler",
    eyebrow: "Internals",
    title: "Maintenance crawler internals.",
    description:
      "Contributor-level notes for conflict detection, versioning, decay scoring, lifecycle semantics, memory history, and diff reads.",
    sections: [
      {
        title: "Passes",
        bullets: [
          "`ConflictDetectionPass` marks competing memory facts as conflicts.",
          "`VersioningPass` marks explicit replacements and supersession.",
          "`DecayScoringPass` observes by default; explicit enforce mode can retire memories without changing quality.",
          "Passes annotate rows and edges; they do not physically delete graph data.",
        ],
      },
    ],
  },
  {
    slug: "internals/fleet-cli-studio",
    eyebrow: "Internals",
    title: "Fleet, CLI, and Studio internals.",
    description:
      "Contributor-level notes for multi-agent memory workflows, CLI setup, local Studio, examples, and DevEx ownership.",
    sections: [
      {
        title: "Owned areas",
        bullets: [
          "`MemoGrafterFleet`, `WorkerAgent`, `ConductorAgent`, and `FleetStore`.",
          "CLI commands: `init`, `migrate`, and `studio`.",
          "Studio local API, repository helpers, dependency-free frontend, and Prompt Preview service.",
          "Examples and onboarding docs.",
        ],
      },
    ],
  },
  {
    slug: "internals/tests",
    eyebrow: "Internals",
    title: "Testing guide.",
    description:
      "Contributor-level map of unit, core, fleet, and manual smoke tests.",
    sections: [
      {
        title: "Commands",
        bullets: [
          "`npm test`: Vitest default mode.",
          "`npm run test:run`: Vitest once.",
          "`npm run test:core`: integration-style core scripts with `.env`.",
          "`npm run test:fleet`: integration-style fleet scripts with `.env`.",
        ],
      },
      {
        title: "When to run what",
        bullets: [
          "Run unit tests for isolated API, pipeline, crawler, store, and CLI behavior.",
          "Run core tests when changing store, ingest, grafting, queue mode, or end-to-end agent flow.",
          "Run fleet tests when changing fleet store methods, cross-session search, or absorption behavior.",
          "Run manual provider tests only when validating live provider integrations.",
        ],
      },
    ],
  },
];

const lockedSlugs = new Set([
  "",
  "installation",
  "database-setup-with-docker",
  "quick-start",
  "environment-setup",
  "concepts/how-it-works",
  "concepts/messages",
  "concepts/segments",
  "concepts/topic-nodes",
  "concepts/memory-nodes",
  "concepts/graph-edges",
  "concepts/grafting",
  "concepts/lifecycle",
]);

export const docsPages: DocPage[] = [
  ...existingDocsPages.filter((page) => lockedSlugs.has(page.slug)),
  ...expandedDocsPages.filter((page) =>
    !page.slug.startsWith("api-reference/")
    && !page.slug.startsWith("guides/")
    && !page.slug.startsWith("examples/")
  ),
  ...guidePages,
  ...examplePages,
  ...contributorPages,
  ...additionalAdvancedPages,
  ...apiReferencePages,
  ...memoryPages,
];

const docPages = new Map(docsPages.map((page) => [page.slug, page]));

export function getDocPage(slug: string) {
  return docPages.get(slug);
}

export function getDocSlugs() {
  return docsPages.filter((page) => page.slug).map((page) => page.slug);
}

export function validateDocs() {
  const pageSlugs = new Set(docsPages.map((page) => page.slug));
  const navSlugs = docsNavItems.map((item) => item.href.replace(/^\/docs\/?/, ""));

  return navSlugs.filter((slug) => !pageSlugs.has(slug));
}

export function getAdjacentDocs(slug: string) {
  const orderedSlugs = docsNavItems.map((item) => item.href.replace(/^\/docs\/?/, ""));
  const index = orderedSlugs.indexOf(slug);

  return {
    previous: index > 0 ? docsNavItems[index - 1] : undefined,
    next: index >= 0 && index < docsNavItems.length - 1 ? docsNavItems[index + 1] : undefined,
  };
}
