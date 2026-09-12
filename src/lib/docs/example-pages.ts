import type { DocPage, DocRelatedLink, DocSection } from "./types";

const installAndQuickStart: DocRelatedLink[] = [
  { label: "Installation", href: "/docs/installation" },
  { label: "Quick Start", href: "/docs/quick-start" },
];

const related = (label: string, href: string, description: string): DocRelatedLink => ({
  label,
  href,
  description,
});

function example(
  slug: string,
  title: string,
  description: string,
  time: string,
  difficulty: "Beginner" | "Intermediate" | "Advanced",
  prerequisites: DocRelatedLink[],
  sections: DocSection[],
): DocPage {
  return {
    slug: `examples/${slug}`,
    title,
    description,
    eyebrow: "Example",
    guideMeta: { time, difficulty, prerequisites },
    sections,
  };
}

const agentImports = `import "dotenv/config";

import {
  MemoGrafterAgent,
  OpenAIEmbedAdapter,
  OpenAILLMAdapter,
} from "memo-grafter";

const agent = new MemoGrafterAgent({
  db: { connectionString: process.env.DATABASE_URL! },
  llm: new OpenAILLMAdapter("gpt-4o"),
  embedder: new OpenAIEmbedAdapter("text-embedding-3-small"),
});

await agent.initialize();`;

export const examplePages: DocPage[] = [
  example(
    "simple-chatbot",
    "Simple chatbot",
    "Build a complete server-side chatbot that remembers a user’s name and response preference during an active conversation.",
    "7 minutes",
    "Beginner",
    [
      ...installAndQuickStart,
      { label: "Chatbot Memory", href: "/docs/guides/chatbot-memory" },
    ],
    [
      {
        title: "Overview",
        body: [
          "This example uses one `MemoGrafterAgent` to handle recall, model invocation, conversation history, and incremental ingestion. The agent learns a name and response preference, then recalls both on a later turn.",
          "`MemoGrafterAgent` generates its own session ID. Reuse the same instance for the active conversation instead of constructing one per request.",
        ],
      },
      {
        title: "What this demonstrates",
        bullets: [
          "Automatic memory recall through `invoke()`.",
          "Automatic ingestion after a completed user and assistant exchange.",
          "A bounded recent-history window combined with graph-backed long-term memory.",
          "Inspecting the generated session ID, chat history, topics, and memories.",
          "Graceful resource shutdown.",
        ],
      },
      {
        title: "Architecture",
        diagram: "example-chatbot-flow",
        body: [
          "The first turn may have no graph memory to recall. Once ingestion creates topic and memory nodes, later turns can retrieve relevant facts before the LLM responds.",
        ],
      },
      {
        title: "Project structure",
        code: [
          {
            label: "files",
            code: `.env
package.json
src/
  chatbot.ts`,
          },
        ],
        body: [
          "The example stays in one file because one agent owns one active conversation. Larger applications can separate agent construction, request handling, and shutdown.",
        ],
      },
      {
        title: "Environment",
        code: [
          {
            label: ".env",
            code: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/memo_grafter
OPENAI_API_KEY=...`,
          },
          {
            label: "terminal",
            code: `npx memo-grafter init
npx memo-grafter migrate`,
          },
        ],
      },
      {
        title: "Step 1: Create the agent",
        body: [
          "Construct and initialize MemoGrafter only in server-side Node.js code. The database must already be migrated.",
        ],
        code: [{ label: "src/chatbot.ts", language: "ts", code: agentImports }],
      },
      {
        title: "Step 2: Run the conversation",
        code: [
          {
            label: "src/chatbot.ts",
            language: "ts",
            code: `console.log(await agent.invoke("My name is Alice."));
console.log(await agent.invoke("I prefer concise answers."));
console.log(
  await agent.invoke("What is my name, and how should you answer?"),
);`,
          },
        ],
        body: [
          "Do not call another ingestion method for these messages. `invoke()` already records the completed exchange and schedules it for incremental ingestion.",
        ],
      },
      {
        title: "Step 3: Inspect and close",
        code: [
          {
            label: "src/chatbot.ts",
            language: "ts",
            code: `console.log("Session:", agent.getSessionId());
console.log("History:", agent.getHistory());
console.log("Topics:", await agent.getActiveNodes());

await agent.close();`,
          },
        ],
      },
      {
        title: "Complete example",
        code: [
          {
            label: "src/chatbot.ts",
            language: "ts",
            code: `${agentImports}

try {
  console.log(await agent.invoke("My name is Alice."));
  console.log(await agent.invoke("I prefer concise answers."));
  console.log(
    await agent.invoke("What is my name, and how should you answer?"),
  );

  const snapshot = await agent.getGraphSnapshot();
  console.log({
    sessionId: snapshot.sessionId,
    topics: snapshot.nodes.length,
    memories: snapshot.memories.length,
  });
} finally {
  await agent.close();
}`,
          },
          {
            label: "terminal",
            code: `npx tsx --env-file=.env src/chatbot.ts`,
          },
        ],
      },
      {
        title: "Expected interaction",
        bullets: [
          "User: “My name is Alice.”",
          "User: “I prefer concise answers.”",
          "User: “What is my name, and how should you answer?”",
          "Expected result: the response identifies Alice and follows or acknowledges the concise-answer preference.",
        ],
        body: [
          "Exact model wording can vary. The important result is that the later answer uses facts extracted from earlier turns.",
        ],
      },
      {
        title: "What gets stored",
        bullets: [
          "Completed user and assistant messages in the session message buffer.",
          "Topic segments produced by drift detection.",
          "Topic nodes containing historical labels and summaries.",
          "Atomic memory nodes such as the user’s name and response preference when extraction identifies them.",
          "Temporal, semantic, or reentry graph edges when applicable.",
          "The incremental ingest cursor used to avoid rebuilding unchanged message ranges.",
        ],
      },
      {
        title: "Inspect it in Studio",
        bullets: [
          "Run `npx memo-grafter studio` against the same database.",
          "Find the session ID printed by the example.",
          "Open Graph View and select the identity or preference topic.",
          "Inspect its attached atomic memories and source information.",
          "Run “What is my name?” in Prompt Preview and compare the included facts.",
        ],
      },
      {
        title: "Production considerations",
        bullets: [
          "Keep the agent and all provider credentials on the server.",
          "Reuse the active agent rather than creating one per message.",
          "Use the lower-level `MemoGrafter` API when the application must reopen explicit session IDs across process lifetimes.",
          "Call `close()` during graceful shutdown.",
          "Measure ingestion lag before assuming a newly completed exchange is available to recall.",
        ],
      },
      {
        title: "Common mistakes",
        bullets: [
          "Creating a new agent on each HTTP request and unintentionally creating a new session.",
          "Manually ingesting turns that already passed through `invoke()`.",
          "Expecting useful recall before graph ingestion has produced memory nodes.",
          "Treating exact model output as deterministic.",
          "Exposing MemoGrafter in browser code.",
        ],
      },
      {
        title: "Extensions",
        bullets: [
          "Add session tags for project or domain filtering.",
          "Use direct `recall()` to show the evidence behind a response.",
          "Add a user-directed forgetting workflow.",
          "Move ingestion to a queue when extraction affects response latency.",
        ],
      },
      {
        title: "Related documentation",
        links: [
          related("Chatbot Memory", "/docs/guides/chatbot-memory", "Understand the invoke lifecycle and recommended agent ownership."),
          related("invoke()", "/docs/api-reference/memo-grafter-agent/invoke", "Review the high-level chat operation."),
          related("Inspecting & Reviewing Memory", "/docs/guides/inspecting-reviewing-memory", "Trace extracted and recalled memory."),
          related("Prompt Preview", "/docs/studio/prompt-preview", "Inspect the exact generated memory prompt."),
        ],
      },
    ],
  ),

  example(
    "customer-support",
    "Customer support",
    "Build a support fleet that keeps customer conversation memory local while sharing approved policy knowledge across workers.",
    "12 minutes",
    "Intermediate",
    [
      ...installAndQuickStart,
      { label: "Fleet & Shared Memory", href: "/docs/guides/fleet-shared-memory" },
    ],
    [
      {
        title: "Overview",
        body: [
          "This example uses `MemoGrafterFleet` to separate customer-specific context from shared support policy. A support worker uses memory mode `both`, allowing it to recall its own conversation and the fleet’s shared policy session.",
        ],
      },
      {
        title: "What this demonstrates",
        bullets: [
          "Shared fleet policy ingestion.",
          "Worker-local customer conversation memory.",
          "The `local`, `fleet`, and `both` memory scopes.",
          "A response that combines customer context with company policy.",
          "Why shared recall is different from copying or grafting memory.",
        ],
      },
      {
        title: "Architecture",
        diagram: "example-support-flow",
        body: [
          "Customer facts remain attached to the support worker. Approved policies live in the fleet’s synthetic shared session and are available to workers configured to use fleet memory.",
        ],
      },
      {
        title: "Memory design",
        bullets: [
          "Local worker memory: case details, communication preferences, and conversation history.",
          "Shared fleet memory: refund rules, support procedures, and approved product policy.",
          "Application database: customer identity, authorization, case status, and ticket ownership.",
          "Tags: policy source and version metadata for review—not authorization.",
        ],
      },
      {
        title: "Project structure",
        code: [
          {
            label: "files",
            code: `src/
  memory-config.ts
  support-fleet.ts
  support-example.ts
.env`,
          },
        ],
      },
      {
        title: "Step 1: Configure the fleet",
        code: [
          {
            label: "src/memory-config.ts",
            language: "ts",
            code: `import {
  OpenAIEmbedAdapter,
  OpenAILLMAdapter,
  type MemoGrafterConfig,
} from "memo-grafter";

export const config: MemoGrafterConfig = {
  db: { connectionString: process.env.DATABASE_URL! },
  llm: new OpenAILLMAdapter("gpt-4o"),
  embedder: new OpenAIEmbedAdapter("text-embedding-3-small"),
};`,
          },
        ],
      },
      {
        title: "Step 2: Ingest shared policy",
        code: [
          {
            label: "src/support-fleet.ts",
            language: "ts",
            code: `const fleet = new MemoGrafterFleet(config, {
  id: "support-fleet",
  name: "Customer Support",
  defaultWorkerMemory: "both",
});

await fleet.initialize();

await fleet.ingestToFleet(
  "Refund policy: customers may request a refund within 30 days.",
  {
    tags: ["policy", "policy:refund", "version:2026-07"],
    source: "support-handbook",
  },
);`,
          },
        ],
      },
      {
        title: "Step 3: Create a support worker",
        code: [
          {
            label: "src/support-example.ts",
            language: "ts",
            code: `const support = await fleet.createWorker({
  color: "case-42",
  memory: "both",
});

await support.invoke(
  "The customer prefers email updates and purchased the item 12 days ago.",
);

const answer = await support.invoke(
  "Is the customer eligible for a refund, and how should we contact them?",
);

console.log(answer);`,
          },
        ],
      },
      {
        title: "Complete example",
        code: [
          {
            label: "src/support-example.ts",
            language: "ts",
            code: `import "dotenv/config";

import {
  MemoGrafterFleet,
  OpenAIEmbedAdapter,
  OpenAILLMAdapter,
} from "memo-grafter";

const fleet = new MemoGrafterFleet(
  {
    db: { connectionString: process.env.DATABASE_URL! },
    llm: new OpenAILLMAdapter("gpt-4o"),
    embedder: new OpenAIEmbedAdapter("text-embedding-3-small"),
  },
  { id: "support-fleet", defaultWorkerMemory: "both" },
);

await fleet.initialize();

try {
  await fleet.ingestToFleet(
    "Refund policy: customers may request a refund within 30 days.",
    { tags: ["policy:refund"], source: "support-handbook" },
  );

  const support = await fleet.createWorker({
    color: "case-42",
    memory: "both",
  });

  await support.invoke(
    "The customer prefers email and purchased the item 12 days ago.",
  );

  console.log(
    await support.invoke(
      "Is the customer eligible for a refund, and how should we contact them?",
    ),
  );
} finally {
  await fleet.close();
}`,
          },
        ],
      },
      {
        title: "Expected interaction",
        bullets: [
          "Local memory contributes the purchase timing and email preference.",
          "Fleet memory contributes the 30-day refund rule.",
          "Expected result: the assistant identifies likely eligibility and recommends email contact.",
          "Exact wording varies, and the application remains responsible for final policy enforcement.",
        ],
      },
      {
        title: "What gets stored",
        bullets: [
          "Policy topics and memories in the synthetic shared fleet session.",
          "Customer conversation topics and memories in the worker’s local session.",
          "Fleet and worker metadata used to preserve scope and color identity.",
          "No automatic copy of shared policy into the worker graph; the worker reads both scopes at response time.",
        ],
      },
      {
        title: "Inspect it in Studio",
        bullets: [
          "Inspect the fleet shared session to confirm the refund policy and source tags.",
          "Inspect the `case-42` worker session for purchase timing and contact preference.",
          "Use Prompt Preview against each scope when debugging missing context.",
          "Confirm private customer facts were not written to shared fleet memory.",
        ],
      },
      {
        title: "Production considerations",
        bullets: [
          "Create separate authorized worker/session boundaries for unrelated customers.",
          "Keep policy changes versioned and review them before ingestion.",
          "Do not treat worker colors or tags as access-control mechanisms.",
          "Use application code to validate eligibility and execute refunds.",
          "Close the fleet once; avoid independently closing its underlying core.",
        ],
      },
      {
        title: "Common mistakes",
        bullets: [
          "Putting customer-specific private facts into shared fleet memory.",
          "Using the reserved `conductor` worker color.",
          "Assuming `both` copies fleet memories into the local worker graph.",
          "Using one worker for unrelated customers without an application isolation policy.",
          "Allowing generated text to make final financial decisions without deterministic checks.",
        ],
      },
      {
        title: "Extensions",
        bullets: [
          "Add billing and technical workers with different local scopes.",
          "Use a conductor to transfer selected case context during escalation.",
          "Add conflict/version maintenance for policy changes.",
          "Add user-directed lifecycle controls for incorrect customer memory.",
        ],
      },
      {
        title: "Related documentation",
        links: [
          related("Fleet & Shared Memory", "/docs/guides/fleet-shared-memory", "Understand workers, conductors, and memory modes."),
          related("MemoGrafterFleet", "/docs/api-reference/fleet-memory/memo-grafter-fleet-index", "Review fleet construction and methods."),
          related("Conflict Detection & Versioning", "/docs/advanced/conflict-detection-versioning", "Manage changing shared policy facts."),
          related("Multi-agent Memory", "/docs/examples/multi-agent-memory", "Transfer selected knowledge between specialized workers."),
        ],
      },
    ],
  ),

  example(
    "personal-assistant",
    "Personal assistant",
    "Build an assistant that remembers preferences and routines, recalls only relevant context, and forgets an outdated fact on request.",
    "10 minutes",
    "Intermediate",
    [
      ...installAndQuickStart,
      { label: "Tags & Memory Scope", href: "/docs/guides/tags-memory-scope" },
    ],
    [
      {
        title: "Overview",
        body: [
          "This example stores explicit preferences with `remember()`, organizes the active assistant session with tags, recalls scheduling context, and demonstrates user-directed forgetting.",
          "MemoGrafter supplies memory; calendar scheduling, reminders, tool execution, and task completion remain application responsibilities.",
        ],
      },
      {
        title: "What this demonstrates",
        bullets: [
          "Storing natural-language preferences without an assistant turn.",
          "Organizing an active session with normalized tags.",
          "Targeted recall for a planning request.",
          "Resolving an exact memory ID before forgetting it.",
          "Verifying that forgotten memory leaves active recall but remains auditable.",
        ],
      },
      {
        title: "Architecture",
        diagram: "example-assistant-flow",
      },
      {
        title: "Memory design",
        bullets: [
          "Preferences: meeting time, answer style, and dietary choices.",
          "Routines: stable patterns the assistant may use during planning.",
          "Tasks: remembered context, not executable scheduled jobs.",
          "Tags: broad assistant and planning organization within the current session.",
        ],
      },
      {
        title: "Step 1: Tag the assistant session",
        code: [
          {
            label: "assistant.ts",
            language: "ts",
            code: `await agent.setSessionTags([
  "assistant",
  "planning",
  "user:alice",
]);`,
          },
        ],
        body: [
          "Tags are normalized and applied to existing and future topic and memory rows in the current agent session.",
        ],
      },
      {
        title: "Step 2: Store preferences",
        code: [
          {
            label: "assistant.ts",
            language: "ts",
            code: `await agent.remember(
  "Alice prefers meetings after 9:30 in the morning.",
  { label: "Scheduling preference", source: "profile-settings" },
);

await agent.remember(
  "Alice prefers concise planning summaries.",
  { label: "Response preference", source: "profile-settings" },
);`,
          },
        ],
      },
      {
        title: "Step 3: Recall relevant context",
        code: [
          {
            label: "assistant.ts",
            language: "ts",
            code: `const context = await agent.recall("Schedule a planning call", {
  tags: ["assistant", "planning"],
  scope: "session-and-tags",
  limit: 5,
});

console.log(context.facts);`,
          },
        ],
      },
      {
        title: "Step 4: Forget an outdated preference",
        code: [
          {
            label: "assistant.ts",
            language: "ts",
            code: `const preferences = await agent.recall("meeting time preference", {
  
});

const outdated = preferences.facts.find((fact) =>
  fact.value.includes("9:30"),
);

if (outdated) {
  await agent.forget(outdated.id);
}`,
          },
        ],
      },
      {
        title: "Complete example",
        code: [
          {
            label: "src/personal-assistant.ts",
            language: "ts",
            code: `${agentImports}

try {
  await agent.setSessionTags(["assistant", "planning", "user:alice"]);
  await agent.remember(
    "Alice prefers meetings after 9:30 in the morning.",
    { label: "Scheduling preference", source: "profile-settings" },
  );
  await agent.remember(
    "Alice prefers concise planning summaries.",
    { label: "Response preference", source: "profile-settings" },
  );

  const context = await agent.recall("Plan a morning project meeting", {
    tags: ["assistant", "planning"],
    scope: "session-and-tags",
    limit: 5,
  });

  console.log(context.facts);
  console.log(await agent.invoke("Suggest a time for a planning meeting."));
} finally {
  await agent.close();
}`,
          },
        ],
      },
      {
        title: "Expected behavior",
        bullets: [
          "Recall returns the meeting-time preference when extraction created a matching memory.",
          "The assistant recommends a time after 9:30 and keeps the answer concise.",
          "After the exact meeting preference is forgotten, active recall no longer includes that memory.",
          "Snapshots and history can still display the forgotten row for audit.",
        ],
      },
      {
        title: "What gets stored",
        bullets: [
          "Natural-language profile facts processed through the same extraction pipeline as raw text.",
          "Topic and memory nodes carrying the normalized assistant tags.",
          "Source metadata identifying profile settings.",
          "A forgotten lifecycle flag and timestamp when the user retires a preference.",
        ],
      },
      {
        title: "Inspect it in Studio",
        bullets: [
          "Open the agent session and inspect the scheduling topic.",
          "Confirm the meeting-time fact, tags, quality, and source.",
          "Use Prompt Preview for “Plan a morning meeting.”",
          "After forgetting the preference, confirm the lifecycle state remains visible while active preview excludes it.",
        ],
      },
      {
        title: "Common mistakes",
        bullets: [
          "Treating `remember()` as a deterministic row insert rather than LLM-backed extraction.",
          "Assuming MemoGrafter schedules or executes calendar actions.",
          "Forgetting a memory without resolving and authorizing its exact ID.",
          "Using tags as an authentication boundary.",
          "Expecting forgotten memory to be physically deleted.",
        ],
      },
      {
        title: "Extensions",
        bullets: [
          "Add separate planning and wellness tags.",
          "Use memory history for preferences that change over time.",
          "Graft selected preferences into another specialized assistant.",
          "Add a privacy review surface before lifecycle actions.",
        ],
      },
      {
        title: "Related documentation",
        links: [
          related("remember()", "/docs/api-reference/memo-grafter-agent/remember", "Store an explicit natural-language memory."),
          related("Tags & Memory Scope", "/docs/guides/tags-memory-scope", "Organize and filter session memory."),
          related("Forgetting & Privacy", "/docs/guides/forgetting-privacy", "Implement a reviewed forgetting workflow."),
          related("Memory history", "/docs/api-reference/memo-grafter-agent/get-memory-history", "Inspect a changing fact lineage."),
        ],
      },
    ],
  ),

  example(
    "journal-memory",
    "Journal memory",
    "Import dated journal entries, preserve source metadata, retrieve themes across entries, and review private extracted memory.",
    "12 minutes",
    "Intermediate",
    [
      ...installAndQuickStart,
      { label: "Ingesting & Extracting Memory", href: "/docs/guides/ingesting-extracting-memory" },
    ],
    [
      {
        title: "Overview",
        body: [
          "This example uses the session-oriented `MemoGrafter` ingestion API to attach distinct date tags to each entry. A `MemoGrafterAgent` then performs explicit cross-session tagged recall over the authorized journal collection.",
        ],
      },
      {
        title: "What this demonstrates",
        bullets: [
          "Raw-text ingestion without generating assistant responses.",
          "Per-entry date, journal, and user tags.",
          "Source metadata for provenance.",
          "Theme recall across several entry sessions.",
          "The distinction between topic summaries and exact atomic memories.",
        ],
      },
      {
        title: "Architecture",
        diagram: "example-journal-flow",
      },
      {
        title: "Memory design",
        bullets: [
          "One explicit ingestion session per journal entry.",
          "Tags such as `journal`, `user:alice`, and `date:2026-07-21`.",
          "Source metadata pointing to the application’s journal entry ID.",
          "Topic summaries for broad entry themes and memory nodes for exact activities, feelings, or observations.",
        ],
      },
      {
        title: "Project structure",
        code: [
          {
            label: "files",
            code: `src/
  memory-config.ts
  ingest-entry.ts
  recall-themes.ts
  journal-example.ts`,
          },
        ],
      },
      {
        title: "Step 1: Ingest dated entries",
        code: [
          {
            label: "src/ingest-entry.ts",
            language: "ts",
            code: `await memo.ingestText(
  "A morning walk and an hour of focused writing made me feel energized.",
  "journal-entry-2026-07-21",
  {
    label: "Journal entry: 2026-07-21",
    source: "journal:entry-184",
    tags: ["journal", "user:alice", "date:2026-07-21"],
  },
);

await memo.ingestText(
  "Back-to-back late meetings left me drained, but cooking helped me reset.",
  "journal-entry-2026-07-22",
  {
    label: "Journal entry: 2026-07-22",
    source: "journal:entry-185",
    tags: ["journal", "user:alice", "date:2026-07-22"],
  },
);`,
          },
        ],
      },
      {
        title: "Step 2: Recall themes across entries",
        code: [
          {
            label: "src/recall-themes.ts",
            language: "ts",
            code: `const themes = await reader.recall(
  "Which activities consistently increase Alice's energy?",
  {
    tags: ["journal", "user:alice"],
    tagMode: "all",
    scope: "tagged",
    limit: 10,
    
  },
);

console.log(themes.facts);`,
          },
        ],
        body: [
          "`scope: tagged` intentionally searches matching active memories across sessions. The application must authorize the journal owner before making this query.",
        ],
      },
      {
        title: "Complete example",
        code: [
          {
            label: "src/journal-example.ts",
            language: "ts",
            code: `import "dotenv/config";

import {
  MemoGrafter,
  MemoGrafterAgent,
  OpenAIEmbedAdapter,
  OpenAILLMAdapter,
} from "memo-grafter";

const config = {
  db: { connectionString: process.env.DATABASE_URL! },
  llm: new OpenAILLMAdapter("gpt-4o"),
  embedder: new OpenAIEmbedAdapter("text-embedding-3-small"),
};

const memo = new MemoGrafter(config);
const reader = new MemoGrafterAgent(config);
await memo.initialize();
await reader.initialize();

try {
  await memo.ingestText(
    "A morning walk and focused writing made me feel energized.",
    "journal-entry-2026-07-21",
    {
      source: "journal:entry-184",
      tags: ["journal", "user:alice", "date:2026-07-21"],
    },
  );

  await memo.ingestText(
    "Late meetings left me drained, but cooking helped me reset.",
    "journal-entry-2026-07-22",
    {
      source: "journal:entry-185",
      tags: ["journal", "user:alice", "date:2026-07-22"],
    },
  );

  const themes = await reader.recall("What increases Alice's energy?", {
    tags: ["journal", "user:alice"],
    scope: "tagged",
    tagMode: "all",
    
  });

  console.log(themes.facts);
} finally {
  await Promise.all([memo.close(), reader.close()]);
}`,
          },
        ],
      },
      {
        title: "Expected behavior",
        bullets: [
          "The first entry can yield memories about walking, writing, and increased energy.",
          "The second can yield memories about meeting fatigue and cooking as recovery.",
          "Cross-session tagged recall can surface walking, focused writing, or cooking as relevant patterns.",
          "Exact extracted wording varies with the configured LLM.",
        ],
      },
      {
        title: "What gets stored",
        bullets: [
          "Each entry’s raw text in its explicit entry session.",
          "One or more topic segments when an entry changes subject.",
          "Topic summaries carrying source and date tags.",
          "Atomic memories representing activities, observations, questions, or insights.",
          "No public conversational history because the entries use text ingestion.",
        ],
      },
      {
        title: "Inspect it in Studio",
        bullets: [
          "Open each journal entry session separately.",
          "Inspect topic boundaries in multi-topic entries.",
          "Confirm source values and normalized date tags.",
          "Use Prompt Preview with the same theme query and tagged scope.",
          "Review private lifecycle actions carefully before forgetting memory.",
        ],
      },
      {
        title: "Privacy considerations",
        bullets: [
          "Authorize the journal owner before using cross-session tagged recall.",
          "Treat tags as filters, never access controls.",
          "Avoid logging raw entries or prompts by default.",
          "Define policies for graph rows, application records, backups, exports, and provider retention.",
          "Use exact reviewed memory IDs for user-directed forgetting.",
        ],
      },
      {
        title: "Common mistakes",
        bullets: [
          "Using one rolling summary and losing source-level provenance.",
          "Applying date tags to an existing agent with `setSessionTags()`, which replaces tags across that whole session.",
          "Assuming topic summaries and atomic memories contain identical information.",
          "Using `scope: tagged` before tenant and user authorization.",
          "Promising exact extracted themes without evaluation.",
        ],
      },
      {
        title: "Extensions",
        bullets: [
          "Add mood, project, or activity tags during entry ingestion.",
          "Build a reviewed theme dashboard from graph snapshots.",
          "Compare weekly themes while keeping source entries traceable.",
          "Add a user-directed privacy workflow for exact extracted memories.",
        ],
      },
      {
        title: "Related documentation",
        links: [
          related("ingestText()", "/docs/api-reference/memo-grafter/ingest-text", "Ingest raw text into an explicit session."),
          related("Tags & Memory Scope", "/docs/guides/tags-memory-scope", "Use cross-session tagged recall safely."),
          related("Inspecting & Reviewing Memory", "/docs/guides/inspecting-reviewing-memory", "Review topics, facts, and lifecycle state."),
          related("Forgetting & Privacy", "/docs/guides/forgetting-privacy", "Design user-directed memory controls."),
        ],
      },
    ],
  ),

  example(
    "research-assistant",
    "Research assistant",
    "Import several sources with provenance, retrieve precise evidence, and graft broader research context for synthesis.",
    "15 minutes",
    "Advanced",
    [
      ...installAndQuickStart,
      { label: "Recall & Memory Injection", href: "/docs/guides/recall-memory-injection" },
      { label: "Grafting Memory", href: "/docs/guides/grafting-memory" },
    ],
    [
      {
        title: "Overview",
        body: [
          "This example ingests each research source into its own explicit session with source and project tags. It uses tagged recall for precise evidence and `graftByRelevance()` for broader context from a selected source session.",
        ],
      },
      {
        title: "What this demonstrates",
        bullets: [
          "Source-scoped document ingestion.",
          "Project-wide tagged evidence retrieval.",
          "Precise fact recall versus broader topic grafting.",
          "Source provenance and conflicting claims.",
          "Token and similarity controls for research prompts.",
        ],
      },
      {
        title: "Architecture",
        diagram: "example-research-flow",
      },
      {
        title: "Memory design",
        bullets: [
          "One explicit session per source document.",
          "Stable tags such as `project:retrieval-study` and `source:paper-42`.",
          "Source metadata using the application’s canonical source ID.",
          "Memory types for claims, insights, questions, tasks, and references.",
          "Application-owned citation metadata outside generated model prose.",
        ],
      },
      {
        title: "Project structure",
        code: [
          {
            label: "files",
            code: `src/
  config.ts
  ingest-source.ts
  recall-evidence.ts
  build-context.ts
  research-example.ts`,
          },
        ],
      },
      {
        title: "Step 1: Ingest sources",
        code: [
          {
            label: "src/ingest-source.ts",
            language: "ts",
            code: `await memo.ingestText(paperText, "paper-42", {
  label: "Paper 42",
  source: "doi:10.1000/example-42",
  tags: ["project:retrieval-study", "source:paper-42"],
});

await memo.ingestText(reportText, "report-17", {
  label: "Industry report 17",
  source: "report:17",
  tags: ["project:retrieval-study", "source:report-17"],
});`,
          },
        ],
      },
      {
        title: "Step 2: Recall precise evidence",
        code: [
          {
            label: "src/recall-evidence.ts",
            language: "ts",
            code: `const evidence = await reader.recall(
  "What evidence describes retrieval quality?",
  {
    tags: ["project:retrieval-study"],
    scope: "tagged",
    limit: 12,
    
    tokenBudget: 1400,
  },
);

console.table(
  evidence.facts.map((fact) => ({
    value: fact.value,
    source: fact.source,
    quality: fact.quality,
    similarity: fact.similarity,
  })),
);`,
          },
        ],
      },
      {
        title: "Step 3: Build broader source context",
        code: [
          {
            label: "src/build-context.ts",
            language: "ts",
            code: `const paperContext = await memo.graftByRelevance(
  "paper-42",
  "retrieval evaluation method and limitations",
  {
    topK: 4,
    minSimilarity: 0.55,
    hopDepth: 1,
  },
);

console.log(paperContext.systemPrompt);`,
          },
        ],
        body: [
          "Recall searches atomic memories across authorized tagged sources. Grafting operates on broader topic context within the explicit source session passed to the core API.",
        ],
      },
      {
        title: "Complete example",
        code: [
          {
            label: "src/research-example.ts",
            language: "ts",
            code: `import "dotenv/config";

import {
  MemoGrafter,
  MemoGrafterAgent,
  OpenAIEmbedAdapter,
  OpenAILLMAdapter,
} from "memo-grafter";

const llm = new OpenAILLMAdapter("gpt-4o");
const config = {
  db: { connectionString: process.env.DATABASE_URL! },
  llm,
  embedder: new OpenAIEmbedAdapter("text-embedding-3-small"),
};

const memo = new MemoGrafter(config);
const reader = new MemoGrafterAgent(config);
await memo.initialize();
await reader.initialize();

const paperText = [
  "Confidence-weighted retrieval improved precision in the evaluation.",
  "The study used a small benchmark and requires broader validation.",
].join(" ");
const reportText = [
  "The industry report found lower latency with cached vector search.",
  "Its results did not measure answer quality.",
].join(" ");

try {
  await memo.ingestText(paperText, "paper-42", {
    source: "doi:10.1000/example-42",
    tags: ["project:retrieval-study", "source:paper-42"],
  });
  await memo.ingestText(reportText, "report-17", {
    source: "report:17",
    tags: ["project:retrieval-study", "source:report-17"],
  });

  const evidence = await reader.recall("evidence about retrieval quality", {
    tags: ["project:retrieval-study"],
    scope: "tagged",
    limit: 12,
    tokenBudget: 1400,
  });

  const synthesis = await llm.complete(
    [{ role: "user", content: "Summarize the evidence and disagreements." }],
    evidence.systemPrompt,
  );
  console.log(synthesis);
} finally {
  await Promise.all([memo.close(), reader.close()]);
}`,
          },
        ],
      },
      {
        title: "Expected behavior",
        bullets: [
          "Each source produces independently traceable topics and memories.",
          "Tagged recall can return relevant active facts from both authorized source sessions.",
          "The synthesis prompt contains bounded fact blocks rather than entire source documents.",
          "Conflicting extracted claims can remain visible until maintenance or application review classifies them.",
        ],
      },
      {
        title: "What gets stored",
        bullets: [
          "Raw source text in its explicit source session.",
          "Topic labels and historical summaries for source sections.",
          "Atomic claims, insights, questions, tasks, or references.",
          "Embedding vectors used for topic and memory similarity.",
          "Source metadata and project tags on created graph records.",
        ],
      },
      {
        title: "Citations and provenance",
        body: [
          "MemoGrafter preserves source metadata, but the application remains responsible for mapping recalled facts to authoritative citations and displaying them accurately. Do not ask the model to invent citation details from memory text.",
        ],
        bullets: [
          "Store canonical source IDs in application data and ingestion metadata.",
          "Carry source IDs alongside recalled facts.",
          "Open the original source before quoting or making a high-stakes claim.",
          "Treat generated summaries as navigation aids, not primary evidence.",
        ],
      },
      {
        title: "Inspect it in Studio",
        bullets: [
          "Open each source session and review its topic segmentation.",
          "Confirm source metadata and project tags on topic and memory nodes.",
          "Use Prompt Preview for the evidence query.",
          "Inspect conflicting or superseded memory edges when sources disagree.",
          "Compare included evidence with the original source before tuning thresholds.",
        ],
      },
      {
        title: "Common mistakes",
        bullets: [
          "Ingesting every source into one undifferentiated session.",
          "Using generated summaries as verbatim citations.",
          "Increasing `limit` without respecting the token budget.",
          "Ignoring source and tenant authorization during tagged recall.",
          "Assuming two different claims are automatically resolved by recency.",
        ],
      },
      {
        title: "Extensions",
        bullets: [
          "Add a source-review UI backed by graph snapshots.",
          "Run crawler maintenance to annotate explicit updates and conflicts.",
          "Graft selected research topics into a separate writing agent.",
          "Evaluate retrieval precision against a labeled research-question set.",
        ],
      },
      {
        title: "Related documentation",
        links: [
          related("Recall & Memory Injection", "/docs/guides/recall-memory-injection", "Choose precise fact retrieval or topic context."),
          related("Retrieval Tuning", "/docs/advanced/retrieval-tuning", "Evaluate thresholds, ranking, and prompt budgets."),
          related("Conflict Detection & Versioning", "/docs/advanced/conflict-detection-versioning", "Understand competing and updated claims."),
          related("graftByRelevance()", "/docs/api-reference/memo-grafter/graft-by-relevance", "Build topic context from an explicit source session."),
        ],
      },
    ],
  ),

  example(
    "multi-agent-memory",
    "Multi-agent memory",
    "Build a fleet where research and writing workers keep local context, read shared knowledge, and transfer selected memory through a conductor.",
    "15 minutes",
    "Advanced",
    [
      ...installAndQuickStart,
      { label: "Fleet & Shared Memory", href: "/docs/guides/fleet-shared-memory" },
      { label: "Grafting Memory", href: "/docs/guides/grafting-memory" },
    ],
    [
      {
        title: "Overview",
        body: [
          "This example creates a research worker, a writing worker, shared fleet guidance, and a conductor. Research remains local until the conductor deliberately transfers selected context into the writer.",
        ],
      },
      {
        title: "What this demonstrates",
        bullets: [
          "Worker-local and shared fleet memory.",
          "Worker memory modes.",
          "Conductor-led semantic transfer.",
          "Transferred-memory provenance.",
          "The difference between shared reads and copied grafts.",
        ],
      },
      {
        title: "Architecture",
        diagram: "example-multi-agent-flow",
      },
      {
        title: "Memory design",
        bullets: [
          "Research worker: source findings and unresolved questions.",
          "Writing worker: outline decisions, tone, and draft-specific context.",
          "Shared fleet memory: editorial policy or project-wide constraints.",
          "Conductor: explicit selection and transfer between worker graphs.",
          "Graft registry: source session and source node provenance for copied topics.",
        ],
      },
      {
        title: "Step 1: Create the fleet and workers",
        code: [
          {
            label: "fleet.ts",
            language: "ts",
            code: `const fleet = new MemoGrafterFleet(config, {
  id: "research-fleet",
  name: "Research and Writing",
});

await fleet.initialize();

const conductor = fleet.createConductor();
const researcher = await fleet.createWorker({
  color: "research",
  memory: "both",
});
const writer = await fleet.createWorker({
  color: "writer",
  memory: "both",
});`,
          },
        ],
      },
      {
        title: "Step 2: Add shared guidance",
        code: [
          {
            label: "shared-memory.ts",
            language: "ts",
            code: `await fleet.ingestToFleet(
  "Editorial rule: distinguish sourced claims from interpretation.",
  {
    tags: ["editorial-policy"],
    source: "editorial-handbook",
  },
);`,
          },
        ],
      },
      {
        title: "Step 3: Build research memory",
        code: [
          {
            label: "research.ts",
            language: "ts",
            code: `await researcher.invoke(
  "The study compares retrieval precision across candidate limits.",
);
await researcher.invoke(
  "Its main limitation is a small evaluation set.",
);`,
          },
        ],
      },
      {
        title: "Step 4: Transfer selected context",
        code: [
          {
            label: "transfer.ts",
            language: "ts",
            code: `const copied = await conductor.graftByPrompt(
  "retrieval findings and limitations",
  writer,
  {
    minSimilarity: 0.55,
    limit: 4,
  },
);

console.log("Copied topics:", copied.length);`,
          },
        ],
      },
      {
        title: "Step 5: Write with local and shared memory",
        code: [
          {
            label: "write.ts",
            language: "ts",
            code: `const answer = await writer.invoke(
  "Draft a concise paragraph describing the result and its limitation.",
);

console.log(answer);`,
          },
        ],
      },
      {
        title: "Complete example",
        code: [
          {
            label: "src/multi-agent-memory.ts",
            language: "ts",
            code: `import "dotenv/config";

import {
  MemoGrafterFleet,
  OpenAIEmbedAdapter,
  OpenAILLMAdapter,
} from "memo-grafter";

const config = {
  db: { connectionString: process.env.DATABASE_URL! },
  llm: new OpenAILLMAdapter("gpt-4o"),
  embedder: new OpenAIEmbedAdapter("text-embedding-3-small"),
};

const fleet = new MemoGrafterFleet(config, { id: "research-fleet" });
await fleet.initialize();

try {
  const conductor = fleet.createConductor();
  const researcher = await fleet.createWorker({
    color: "research",
    memory: "both",
  });
  const writer = await fleet.createWorker({
    color: "writer",
    memory: "both",
  });

  await fleet.ingestToFleet(
    "Editorial rule: distinguish sourced claims from interpretation.",
    { tags: ["editorial-policy"], source: "editorial-handbook" },
  );

  await researcher.invoke(
    "The study compares precision across candidate limits.",
  );
  await researcher.invoke(
    "Its main limitation is a small evaluation set.",
  );

  await conductor.graftByPrompt(
    "retrieval findings and limitations",
    writer,
    { minSimilarity: 0.55, limit: 4 },
  );

  console.log(
    await writer.invoke(
      "Draft a concise paragraph describing the result and limitation.",
    ),
  );
} finally {
  await fleet.close();
}`,
          },
        ],
      },
      {
        title: "Expected behavior",
        bullets: [
          "The researcher’s original conversation remains in its local worker session.",
          "The writer receives only topics selected by the conductor prompt.",
          "The writer can also read the shared editorial policy because its memory mode is `both`.",
          "The response should mention the retrieval result and limitation while following the shared editorial rule.",
        ],
      },
      {
        title: "Shared recall versus grafting",
        bullets: [
          "Shared fleet recall reads knowledge from the synthetic fleet session without copying it into the worker.",
          "Conductor grafting copies selected topic and active memory nodes into the target worker.",
          "Copied nodes receive fresh IDs and registry provenance.",
          "Use shared memory for common knowledge and grafting for deliberate worker-to-worker transfer.",
        ],
      },
      {
        title: "What gets stored",
        bullets: [
          "Fleet metadata and registered worker identities.",
          "Shared editorial policy in the fleet session.",
          "Research conversation and extracted memory in the research worker session.",
          "Copied research topics and active memories in the writer session.",
          "Graft registry entries and grafted edges preserving source provenance.",
        ],
      },
      {
        title: "Inspect it in Studio",
        bullets: [
          "Inspect the shared fleet session for the editorial policy.",
          "Inspect the research worker for the original findings.",
          "Inspect the writer for copied topics and graft provenance.",
          "Use Prompt Preview on the writer’s draft query.",
          "Confirm inactive source memories were not copied.",
        ],
      },
      {
        title: "Production considerations",
        bullets: [
          "Authorize cross-worker transfer before conductor operations.",
          "Keep private worker context out of shared fleet memory.",
          "Use deliberate worker colors; `conductor` is reserved.",
          "Monitor ingestion completion before initiating transfer.",
          "Close the fleet once during graceful shutdown.",
        ],
      },
      {
        title: "Common mistakes",
        bullets: [
          "Assuming all worker memory is automatically shared.",
          "Using a fleet policy session for private task context.",
          "Confusing a shared read with a copied graft.",
          "Transferring all research topics without preview or relevance limits.",
          "Ignoring registry provenance after transfer.",
        ],
      },
      {
        title: "Extensions",
        bullets: [
          "Add a reviewer worker with shared editorial memory.",
          "Transfer only source-verified findings to the writer.",
          "Inspect and remove a graft after the writing task.",
          "Add project tags and separate fleets for tenant isolation.",
        ],
      },
      {
        title: "Related documentation",
        links: [
          related("Fleet & Shared Memory", "/docs/guides/fleet-shared-memory", "Understand worker and shared-memory behavior."),
          related("Grafting Memory", "/docs/guides/grafting-memory", "Inspect selection, copying, and provenance."),
          related("Conductor graftByPrompt()", "/docs/api-reference/fleet-memory/conductor-agent-graft-by-prompt", "Review the conductor transfer API."),
          related("Fleet graph", "/docs/api-reference/fleet-memory/memo-grafter-fleet-get-graph", "Inspect fleet topology."),
        ],
      },
    ],
  ),
];
