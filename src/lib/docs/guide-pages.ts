import type { DocPage, DocRelatedLink, DocSection } from "./types";

const setup: DocRelatedLink[] = [
  { label: "Installation", href: "/docs/installation" },
  { label: "Quick Start", href: "/docs/quick-start" },
];

const api = (label: string, href: string, description: string): DocRelatedLink => ({ label, href, description });

function guide(
  slug: string,
  title: string,
  description: string,
  time: string,
  difficulty: "Beginner" | "Intermediate" | "Advanced",
  sections: DocSection[],
  prerequisites: DocRelatedLink[] = setup,
): DocPage {
  return { slug: `guides/${slug}`, title, description, eyebrow: "Guide", guideMeta: { time, difficulty, prerequisites }, sections };
}

const agentSetup = `import {
  MemoGrafterAgent,
  OpenAIEmbedAdapter,
  OpenAILLMAdapter,
} from "memo-grafter";

const llm = new OpenAILLMAdapter("gpt-4o");
const embedder = new OpenAIEmbedAdapter("text-embedding-3-small");

const agent = new MemoGrafterAgent({
  db: { connectionString: process.env.DATABASE_URL! },
  llm,
  embedder,
});

await agent.initialize();`;

export const guidePages: DocPage[] = [
  guide("chatbot-memory", "Chatbot memory", "Give a server-side chatbot durable, relevant memory that is recalled before later responses and learned incrementally after each exchange.", "5 minutes", "Beginner", [
    { title: "Overview", body: ["`MemoGrafterAgent` combines conversational history with graph-backed long-term memory. Each call to `invoke()` can recall relevant active facts, send them to the configured language model, and schedule the completed exchange for incremental ingestion.", "The agent owns one generated session ID. Reuse the same agent instance for the active conversation; creating a new agent creates an independent session."] },
    { title: "When to use this", bullets: ["Remember preferences and facts mentioned earlier in an active conversation.", "Keep prompts bounded instead of replaying an ever-growing transcript.", "Allow relevant graph memory to influence later answers.", "Inspect and control retained memory through supported lifecycle APIs and Studio."] },
    { title: "What you’ll build", bullets: ["A server-side chatbot that recalls relevant memory before responding.", "Automatic incremental learning after completed user and assistant turns.", "A conversation that remembers a name and response preference on a later turn."] },
    { title: "Request lifecycle", diagram: "invoke-flow", body: ["The foreground response and write-side memory pipeline are connected but distinct. The first turn may have nothing to recall; later turns can use graph memory after ingestion has created it."] },
    { title: "Step 1: Create one agent", body: ["Construct the agent in server code and initialize it after the database has been migrated. Keep the instance alive for the active conversation."], code: [{ label: "chatbot.ts", language: "ts", code: agentSetup }] },
    { title: "Step 2: Send turns through invoke()", body: ["`invoke()` owns the normal chat path. Do not manually ingest the same user and assistant turns afterward; that exchange is already scheduled for ingestion."], code: [{ label: "chatbot.ts", language: "ts", code: `const first = await agent.invoke("My name is Alice.");
const second = await agent.invoke("I prefer concise answers.");
const answer = await agent.invoke("What is my name, and how should you answer?");

console.log(answer);` }] },
    { title: "Step 3: Close cleanly", body: ["Close the agent during graceful shutdown. Reads that depend on memory state and `close()` wait for the agent’s pending ingestion work."], code: [{ label: "shutdown.ts", language: "ts", code: `process.once("SIGTERM", async () => {
  await agent.close();
  process.exit(0);
});` }] },
    { title: "Full example", code: [{ label: "chatbot-memory.ts", language: "ts", code: `${agentSetup}

try {
  console.log(await agent.invoke("My name is Alice."));
  console.log(await agent.invoke("I prefer concise answers."));
  console.log(await agent.invoke("What is my name, and how should you answer?"));
} finally {
  await agent.close();
}` }] },
    { title: "Expected conversation", body: ["Alice first supplies an identity fact, then a response preference. On a later question, the agent can retrieve those active memories and the assistant can answer that her name is Alice and that replies should be concise."], bullets: ["User: “My name is Alice.”", "User: “I prefer concise answers.”", "User: “What is my name, and how should you answer?”", "Assistant: “Your name is Alice, and I should answer concisely.”"] },
    { title: "How invoke() works", bullets: ["Checks whether the session already contains topic nodes; empty sessions skip recall.", "Recalls active memories related to the incoming user message.", "Prepends the memory prompt when matching facts exist, followed by recent raw history and the new message.", "Calls the configured LLM adapter and records both completed turns.", "Schedules incremental ingestion without clearing existing native or grafted graph memory.", "Logs recall failures and falls back to recent history so retrieval problems do not crash the foreground turn."] },
    { title: "Best practices", bullets: ["Reuse one `MemoGrafterAgent` for the active conversation.", "Keep MemoGrafter and provider credentials on the server.", "Inspect extracted memories in Studio before tuning thresholds.", "Call `close()` during graceful shutdown.", "Use `MemoGrafter` directly when the application must supply and reopen explicit session IDs."] },
    { title: "Common mistakes", bullets: ["Creating a new agent for every message, which creates a new independent session each time.", "Calling `ingestText()` for the same exchange after `invoke()`.", "Expecting recall on the first turn before graph memory exists.", "Exposing database or provider credentials to browser code.", "Assuming queued ingestion makes new memories visible immediately."] },
    { title: "Related documentation", links: [api("invoke()", "/docs/api-reference/memo-grafter-agent/invoke", "Exact invoke behavior and return value."), api("Recall & Memory Injection", "/docs/guides/recall-memory-injection", "Take control of retrieval and prompt construction."), api("Prompt Preview", "/docs/studio/prompt-preview", "Inspect the memory prompt for representative queries."), api("MemoGrafter", "/docs/api-reference/memo-grafter", "Manage explicit application-owned session IDs.")] },
  ]),

  guide("ingesting-extracting-memory", "Ingesting & extracting memory", "Turn conversations, documents, notes, and explicit natural-language facts into incremental topic and memory graphs.", "8 minutes", "Beginner", [
    { title: "Overview", body: ["MemoGrafter uses one write-side pipeline for conversational turns and raw text. It segments new material by topic, creates topic summaries, extracts atomic memories, embeds them, and appends graph edges without rebuilding prior memory."] },
    { title: "When to use this", bullets: ["Import notes, articles, handbooks, or journal entries without generating a chat response.", "Store an explicit preference through natural language.", "Understand when `invoke()` has already handled ingestion.", "Choose between appending content and intentionally replacing a session graph."] },
    { title: "What you’ll build", body: ["A document-memory flow that imports a handbook section, records source metadata and tags, waits for ingestion, and recalls a policy fact later."] },
    { title: "Memory construction pipeline", diagram: "ingestion-flow", body: ["Raw text is split into internal chunks. Topic drift detection can create several segments from one input, and each segment can produce one topic node and multiple atomic memory nodes."] },
    { title: "Step 1: Choose the write path", bullets: ["Use `invoke()` for a user/assistant exchange; it schedules ingestion automatically.", "Use `ingestText()` for documents or notes without a generated response.", "Use `remember()` for a concise natural-language fact or preference."] },
    { title: "Step 2: Ingest source text", code: [{ label: "import-handbook.ts", language: "ts", code: `${agentSetup}

await agent.setSessionTags(["project:support", "policy"]);
await agent.ingestText(handbookSection, {
  label: "Refund policy",
  source: "support-handbook:v3",
});` }], body: ["Text ingestion does not add material to `getHistory()` and does not call the response-generation path. The extraction LLM still summarizes segments and extracts structured memories."] },
    { title: "Step 3: Store an explicit fact", code: [{ label: "remember.ts", language: "ts", code: `await agent.remember("Refund requests are accepted within 30 days.", {
  label: "Refund window",
  source: "policy-settings",
});` }], body: ["`remember()` is a convenience wrapper around text ingestion. It is suitable for natural-language facts, not exact row-level inserts."] },
    { title: "Step 4: Verify the result", code: [{ label: "verify.ts", language: "ts", code: `const result = await agent.recall("How long can a customer request a refund?", {
  tags: ["policy"],
  scope: "session-and-tags",
});

console.log(result.facts);
console.log(result.systemPrompt);` }] },
    { title: "Full example", code: [{ label: "document-memory.ts", language: "ts", code: `${agentSetup}

try {
  await agent.setSessionTags(["project:support", "policy"]);
  await agent.ingestText(handbookSection, {
    label: "Support handbook",
    source: "handbook:v3",
  });

  const memory = await agent.recall("refund eligibility", {
    tags: ["policy"],
    scope: "session-and-tags",
    limit: 5,
  });
  console.log(memory.facts);
} finally {
  await agent.close();
}` }] },
    { title: "How incremental ingestion works", bullets: ["The session ingest cursor records the last processed message index.", "Repeated ingestion of an unchanged history is a graph no-op.", "New ranges use a small overlap window for topic context, then append nodes and edges.", "The cursor advances only after graph writes succeed.", "Normal ingestion preserves existing topics, memories, grafts, and provenance."] },
    { title: "Replace versus append", body: ["`ingestText()` appends by default. Use `replace: true` only when the input represents the complete current document and the stored session graph should be rebuilt."], bullets: ["Replacement removes stored messages, graph records, segments, grafts, and ingest state for the session.", "It does not change the generated agent session ID or clear public conversational history.", "Do not use replacement as a routine autosave shortcut without accepting its destructive scope."] },
    { title: "Best practices", bullets: ["Preserve a stable `source` value for provenance.", "Use normalized tags for project and document grouping.", "Split extremely large imports into meaningful bounded sources.", "Review extraction quality in Studio before changing drift settings.", "Wait for queue workers before expecting asynchronously ingested memory to appear."] },
    { title: "Common mistakes", bullets: ["Manually ingesting an exchange already processed through `invoke()`.", "Using `replace: true` when content should be appended.", "Expecting raw text to appear in public chat history.", "Treating `remember()` as a deterministic database insert.", "Changing embedding dimensions without migrating the vector schema."] },
    { title: "Related documentation", links: [api("ingestText()", "/docs/api-reference/memo-grafter-agent/ingest-text", "Raw-text ingestion contract."), api("remember()", "/docs/api-reference/memo-grafter-agent/remember", "Store an explicit natural-language fact."), api("Memory Pipeline", "/docs/advanced/memory-pipeline", "Understand the internal construction stages."), api("Inspecting & Reviewing Memory", "/docs/guides/inspecting-reviewing-memory", "Verify extracted topics and facts.")] },
{
  "title": "Selective extraction and reconciliation",
  "body": [
    "Provenance validation rejects unsupported speaker ownership and message references before quality admission and embedding. Canonical reconciliation records equivalent observations as evidence and commits required lifecycle relationships atomically.",
    "Durable completed-exchange ingestion through analyzeDetailed returns a receipt. Other ingestion APIs retain their own inline or queue completion contracts; do not assume every enqueue call returns durable run state."
  ],
  "links": [
    {
      "label": "Canonical memories",
      "href": "/docs/concepts/canonical-memory"
    },
    {
      "label": "Durable ingestion",
      "href": "/docs/guides/durable-ingestion"
    }
  ]
}
]),

  guide("recall-memory-injection", "Recall & memory injection", "Choose the correct read path for retrieving atomic facts, assembling broader topic context, or letting invoke() handle memory automatically.", "8 minutes", "Intermediate", [
    { title: "Overview", body: ["Recall and grafting both turn stored graph memory into useful context, but they operate at different levels. Recall ranks atomic memory facts; grafting assembles broader topic context and can expand through graph neighbours."] },
    { title: "When to use this", bullets: ["Build your own LLM request instead of using `invoke()`.", "Inspect the evidence behind a response.", "Choose explicit topics for a prompt.", "Decide whether memory should only be read or copied into another session."] },
    { title: "Choose the right operation", bullets: ["Use `invoke()` to recall, answer, and learn in one high-level chat operation.", "Use `recall()` for ranked atomic facts and prompt-ready context without an assistant completion.", "Use `graft()` when the application already knows the topic IDs to assemble.", "Use `graftByRelevance()` when a query should select topic seeds before assembly.", "Use `absorbFromAgent()` only when selected memory should be copied into another agent session."] },
    { title: "Read-path decision flow", diagram: "recall-graft-flow" },
    { title: "Step 1: Recall structured facts", code: [{ label: "recall.ts", language: "ts", code: `const result = await agent.recall("deployment preferences", {
  limit: 8,
  
  tokenBudget: 1000,
});

console.log(result.facts);
console.log(result.nodes);
console.log(result.systemPrompt);` }], body: ["Recall is side-effect free. It embeds the query, searches active memories, ranks facts, loads parent topics, and formats fact blocks until the token budget is reached."] },
    { title: "Step 2: Use recalled context in your LLM call", code: [{ label: "custom-chat.ts", language: "ts", code: `const memory = await agent.recall(userMessage);
const answer = await llm.complete(
  [{ role: "user", content: userMessage }],
  memory.systemPrompt,
);` }], body: ["Keep application policy separate and higher priority than recalled content. Memory is evidence, not trusted instruction text."] },
    { title: "Step 3: Assemble topic context", code: [{ label: "graft.ts", language: "ts", code: `const topics = await agent.getActiveNodes();
const context = await agent.graft([topics[0]!.id]);

console.log(context.nodes);
console.log(context.systemPrompt);` }], body: ["Explicit grafting preserves broader topic summaries and nearby source context. It is useful when a user or application has already selected topics."] },
    { title: "Full example", code: [{ label: "manual-memory-loop.ts", language: "ts", code: `${agentSetup}

try {
  await agent.remember("Deploy production services to the eu-west-1 region.");
  const memory = await agent.recall("Where should production be deployed?", {
    limit: 5,
    tokenBudget: 800,
  });

  const answer = await llm.complete(
    [{ role: "user", content: "Where should production be deployed?" }],
    memory.systemPrompt,
  );
  console.log(answer);
} finally {
  await agent.close();
}` }] },
    { title: "How filtering and ranking work", bullets: ["Normal recall excludes decayed, superseded, forgotten, and suppressed-topic memories.", "`minSimilarity` is deprecated for recall; use bounded candidates and adaptive selection.", "Returned facts are ranked by semantic similarity, with evidence quality breaking ties.", "Facts are grouped by parent topic and stopped at the token budget.", "Tag scope can keep recall session-local or intentionally search tagged memory across sessions."] },
    { title: "Common mistakes", bullets: ["Using grafting when only a few atomic facts are required.", "Copying memory into another session when a read-only preview is enough.", "Treating `systemPrompt` as application policy rather than untrusted memory context.", "Increasing `limit` without checking the token budget.", "Debugging thresholds before confirming ingestion and lifecycle state."] },
    { title: "Related documentation", links: [api("recall()", "/docs/api-reference/memo-grafter-agent/recall", "Retrieve ranked active memory facts."), api("graft()", "/docs/api-reference/memo-grafter-agent/graft", "Assemble context from selected topics."), api("Grafting Memory", "/docs/guides/grafting-memory", "Preview, expand, copy, and audit topic memory."), api("Retrieval Tuning", "/docs/advanced/retrieval-tuning", "Tune ranking and debug missing results.")] },
{
  "title": "Adaptive selection and episode context",
  "body": [
    "candidateLimit bounds nearest-neighbour candidates (default 40), while limit bounds returned facts (default 10). selection.maxTopics, relativeScoreFloor (default 0.75), and scoreGapThreshold (default 0.15) control topic selection. minSimilarity is deprecated for recall candidate generation.",
    "Episode candidates use independent defaults of 40 candidates, three episodes, and 300 episode tokens. Result metadata exposes topicMatches, selection, episodes, and query contextualization. Cluster metadata is loaded after selection without changing prompts.",
    "context() prepends active pinned topics and bypasses recall caching. Direct recall is query-driven; supplying recent messages enables optional query contextualization."
  ],
  "links": [
    {
      "label": "Topic pinning",
      "href": "/docs/guides/topic-pinning"
    },
    {
      "label": "RetrieverConfig",
      "href": "/docs/api-reference/types/retriever-config"
    }
  ]
}
]),

  guide("grafting-memory", "Grafting memory", "Select broader topic context, preview it as a prompt, and copy active memory into another agent with traceable provenance.", "10 minutes", "Intermediate", [
    { title: "Overview", body: ["Grafting works with topic nodes rather than only individual facts. You can assemble prompt context from explicit topics, find topics semantically, or absorb selected topic and memory nodes into another agent session."] },
    { title: "When to use this", bullets: ["A user selects topics to include in a new task.", "Another agent needs only a relevant subset of source memory.", "A prompt needs broad historical topic context rather than isolated facts.", "Transferred memory must retain source provenance."] },
    { title: "What you’ll build", body: ["Two agents: a research agent that learns travel preferences and a writing agent that absorbs only the relevant travel topics before composing a response."] },
    { title: "Grafting flow", diagram: "graft-flow", body: ["Previewing is read-only. Absorption copies active source topic nodes and their active memory rows into the target, assigns fresh IDs, and records their origin in the graft registry."] },
    { title: "Step 1: Preview explicit topics", code: [{ label: "explicit-graft.ts", language: "ts", code: `const topics = await sourceAgent.getActiveNodes();
const preview = await sourceAgent.graft([topics[0]!.id]);
console.log(preview.systemPrompt);` }] },
    { title: "Step 2: Select topics by meaning", code: [{ label: "semantic-graft.ts", language: "ts", code: `const preview = await sourceAgent.graftByRelevance(
  "Japan travel preferences",
  { topK: 5, minSimilarity: 0.6, hopDepth: 1, expansionStrategy: "graph" },
);` }], body: ["Use `expansionStrategy: none` to keep only the semantic seed nodes. Graph expansion can add related temporal, semantic, or reentry neighbours."] },
    { title: "Step 3: Absorb selected memory", code: [{ label: "absorb.ts", language: "ts", code: `const copied = await targetAgent.absorbFromAgent(sourceAgent, {
  prompt: "Japan travel preferences",
  minSimilarity: 0.6,
  limit: 3,
});

console.log("Copied topics:", copied.length);` }] },
    { title: "Step 4: Inspect provenance", code: [{ label: "provenance.ts", language: "ts", code: `const registry = await targetAgent.getGraftRegistry();
console.log(registry.map(({ nodeId, sourceSessionId, sourceNodeId }) => ({
  nodeId,
  sourceSessionId,
  sourceNodeId,
})));` }] },
    { title: "Full example", code: [{ label: "two-agent-graft.ts", language: "ts", code: `const research = new MemoGrafterAgent(config);
const writer = new MemoGrafterAgent(config);
await research.initialize();
await writer.initialize();

try {
  await research.invoke("I am planning a Japan trip.");
  await research.invoke("I prefer quiet towns, bookstores, and local cafes.");

  await writer.absorbFromAgent(research, {
    prompt: "Japan travel preferences",
    minSimilarity: 0.55,
    limit: 3,
  });

  console.log(await writer.invoke("Draft a short trip introduction."));
} finally {
  await Promise.all([research.close(), writer.close()]);
}` }] },
    { title: "What is copied", bullets: ["Selected active topic nodes receive fresh destination IDs.", "Active attached memory nodes are copied with existing embeddings.", "Grafted topic edges and registry rows preserve origin.", "Decayed, superseded, forgotten, and suppressed-topic memory is not copied.", "A topic with no extracted memory rows can be grafted, but it contributes no atomic facts to later recall."] },
    { title: "Removing a graft", code: [{ label: "remove-graft.ts", language: "ts", code: `const [entry] = await targetAgent.getGraftRegistry();
if (entry) await targetAgent.removeGraft(entry.nodeId);` }], body: ["`removeGraft()` is scoped to the current agent session and only accepts nodes registered as grafts there."] },
    { title: "Common mistakes", bullets: ["Confusing a read-only graft preview with absorption.", "Copying all source topics when a semantic selection would be safer.", "Ignoring provenance after cross-agent transfer.", "Expecting inactive source memory to be copied.", "Using high hop depth without inspecting prompt relevance and size."] },
    { title: "Related documentation", links: [api("graftByRelevance()", "/docs/api-reference/memo-grafter-agent/graft-by-relevance", "Select semantic seeds and assemble context."), api("absorbFromAgent()", "/docs/api-reference/memo-grafter-agent/absorb-from-agent", "Copy selected memory from another agent."), api("Multi-session Memory", "/docs/guides/multi-session-memory", "Design isolated source and destination sessions."), api("Graph Expansion & Topic Re-entry", "/docs/advanced/graph-expansion-topic-reentry", "Understand neighbours, hop depth, and reentry edges.")] },
{
  "title": "Quality and domains during transfer",
  "body": [
    "Graft and copy paths preserve quality, lifecycle state, and provenance. Topic domains belong to a session and are not graph edges: source domain membership is never reused as a destination cluster ID. SDK absorption can classify eligible copies; Studio/store-only copies can use bounded backfill."
  ]
}
]),

  guide("multi-session-memory", "Multi-session memory", "Keep conversations isolated and transfer only the context a destination session actually needs.", "10 minutes", "Intermediate", [
    { title: "Overview", body: ["Each `MemoGrafterAgent` owns an independent generated session. Separate sessions prevent accidental context mixing; explicit grafting and absorption provide controlled transfer with provenance."] },
    { title: "When to use this", bullets: ["Keep separate conversations or agents isolated.", "Move a selected project or preference context into a new workflow.", "Audit which source session contributed copied memory.", "Avoid inheriting a complete transcript when only a few topics matter."] },
    { title: "Step 1: Create independent agents", code: [{ label: "sessions.ts", language: "ts", code: `const source = new MemoGrafterAgent(config);
const target = new MemoGrafterAgent(config);
await source.initialize();
await target.initialize();

console.log(source.getSessionId() !== target.getSessionId()); // true` }] },
    { title: "Step 2: Select before transferring", code: [{ label: "select.ts", language: "ts", code: `const preview = await source.graftByRelevance("customer preferences", {
  topK: 5,
  minSimilarity: 0.55,
  expansionStrategy: "none",
});

console.log(preview.nodes);` }] },
    { title: "Step 3: Transfer with provenance", code: [{ label: "transfer.ts", language: "ts", code: `await target.absorbFromAgent(source, {
  topicIds: preview.nodes.map((node) => node.id),
});

console.log(await target.getGraftRegistry());` }] },
    { title: "Full example", code: [{ label: "multi-session.ts", language: "ts", code: `const support = new MemoGrafterAgent(config);
const followUp = new MemoGrafterAgent(config);
await support.initialize();
await followUp.initialize();

try {
  await support.invoke("I prefer email updates about case 42.");
  await followUp.absorbFromAgent(support, {
    prompt: "communication preference for case 42",
    limit: 3,
  });
  console.log(await followUp.invoke("How should I send the update?"));
} finally {
  await Promise.all([support.close(), followUp.close()]);
}` }] },
    { title: "Choose between scope mechanisms", bullets: ["Use separate sessions for independent conversations.", "Use tags when related memory should remain searchable without being copied.", "Use absorption when selected memory must become part of the destination graph.", "Use fleet shared memory for knowledge that every authorized worker should be able to query."] },
    { title: "Best practices", bullets: ["Keep the application’s user-to-session mapping outside MemoGrafter.", "Authorize both source and destination before transferring memory.", "Preview semantic selection before copying.", "Retain registry provenance in audit and user-facing inspection tools.", "Do not use session IDs or tags alone as authorization controls."] },
    { title: "Common mistakes", bullets: ["Sharing one agent instance across unrelated users.", "Copying an entire source graph by default.", "Losing the application-level mapping between users and sessions.", "Treating a generated agent session as a durable login identity.", "Using tags to bypass authorization checks."] },
    { title: "Related documentation", links: [api("Grafting Memory", "/docs/guides/grafting-memory", "Learn the complete selection and absorption workflow."), api("Tags & Memory Scope", "/docs/guides/tags-memory-scope", "Search related memory without copying it."), api("Fleet & Shared Memory", "/docs/guides/fleet-shared-memory", "Share common knowledge among workers."), api("Graft registry", "/docs/api-reference/memo-grafter-agent/get-graft-registry", "Inspect copied-memory provenance.")] },
  ]),

  guide("tags-memory-scope", "Tags & memory scope", "Organize memory with normalized tags and choose deliberately between session-local and cross-session retrieval.", "8 minutes", "Intermediate", [
    { title: "Overview", body: ["A session is MemoGrafter’s normal memory boundary. Tags are optional metadata for filtering or intentionally searching related memory across sessions; they do not replace sessions or application authorization."] },
    { title: "Scope model", diagram: "scope-flow" },
    { title: "Step 1: Set session tags", code: [{ label: "tags.ts", language: "ts", code: `await agent.setSessionTags([
  "tenant:acme",
  "project:memo-grafter",
  "planning",
]);

console.log(agent.getSessionTags());` }], body: ["Tags are trimmed, lowercased, deduplicated, and sorted. Setting session tags waits for pending ingestion, updates existing session topics and memories, and applies the tags to future ingestion."] },
    { title: "Step 2: Recall within the session", code: [{ label: "session-tags.ts", language: "ts", code: `const result = await agent.recall("deployment decisions", {
  tags: ["project:memo-grafter", "planning"],
  tagMode: "all",
  scope: "session-and-tags",
});` }] },
    { title: "Step 3: Search tagged memory across sessions", code: [{ label: "cross-session.ts", language: "ts", code: `const result = await agent.recall("deployment decisions", {
  tags: ["tenant:acme", "project:memo-grafter"],
  tagMode: "all",
  scope: "tagged",
  
});` }], body: ["`scope: tagged` is an explicit cross-session operation. Authorize the caller before issuing it."] },
    { title: "Full example", code: [{ label: "project-scope.ts", language: "ts", code: `${agentSetup}

try {
  await agent.setSessionTags(["tenant:acme", "project:apollo"]);
  await agent.remember("Apollo production deploys to eu-west-1.");

  const projectMemory = await agent.recall("production region", {
    tags: ["tenant:acme", "project:apollo"],
    tagMode: "all",
    scope: "session-and-tags",
  });
  console.log(projectMemory.facts);
} finally {
  await agent.close();
}` }] },
    { title: "Scope reference", bullets: ["`session`: search the current session without tag filtering.", "`session-and-tags`: search the current session and require the selected tag rule.", "`tagged`: search active memories across sessions that match the selected tags.", "`all`: require every requested tag.", "`any`: accept at least one requested tag."] },
    { title: "Security boundary", body: ["Tags filter memory but are not an authorization boundary. Resolve and authorize the tenant, user, project, and allowed sessions in application code before calling MemoGrafter."] },
    { title: "Common mistakes", bullets: ["Using a tag as a substitute for a session ID.", "Running `scope: tagged` without tenant authorization.", "Expecting differently cased tags to remain distinct after normalization.", "Using `any` when every project or tenant tag is required.", "Forgetting that repeated smoke tests can leave older tagged sessions in the database."] },
    { title: "Related documentation", links: [api("setSessionTags()", "/docs/api-reference/memo-grafter-agent/set-session-tags", "Apply normalized tags to current and future memory."), api("recall()", "/docs/api-reference/memo-grafter-agent/recall", "Configure tag filters and retrieval scope."), api("Multi-session Memory", "/docs/guides/multi-session-memory", "Design independent conversation graphs."), api("Scaling", "/docs/advanced/scaling", "Plan tenant isolation and distributed sessions.")] },
  ]),

  guide("streaming-responses", "Streaming responses", "Recall memory before a provider stream, deliver tokens immediately, and ingest only the completed exchange afterward.", "10 minutes", "Intermediate", [
    { title: "Overview", body: ["Streaming changes response delivery, not memory semantics. Recall must finish before the provider request, and ingestion should use the complete assistant text after the stream closes."] },
    { title: "When to use this", bullets: ["First-token latency matters to the user experience.", "The application already controls a provider streaming API.", "Memory recall should still influence the complete answer.", "Completed exchanges can be ingested after delivery."] },
    { title: "Streaming lifecycle", diagram: "streaming-flow" },
    { title: "Step 1: Recall before streaming", code: [{ label: "recall.ts", language: "ts", code: `const memory = await agent.recall(userMessage, {
  tokenBudget: 1000,
  limit: 6,
});` }] },
    { title: "Step 2: Stream and collect", code: [{ label: "stream.ts", language: "ts", code: `let completed = "";
const stream = provider.stream({
  system: memory.systemPrompt,
  message: userMessage,
});

for await (const chunk of stream) {
  completed += chunk;
  sendToClient(chunk);
}` }] },
    { title: "Step 3: Ingest the completed exchange", code: [{ label: "ingest.ts", language: "ts", code: `await memo.ingest(
  [
    { role: "user", content: userMessage },
    { role: "assistant", content: completed },
  ],
  sessionId,
);` }], body: ["Use the lower-level `MemoGrafter` API when the application owns the stream and explicit session ID. Do not ingest partial chunks as separate assistant turns."] },
    { title: "Full example", code: [{ label: "streaming-handler.ts", language: "ts", code: `const memory = await memo.graftByRelevance(sessionId, userMessage, {
  topK: 4,
});

let assistantText = "";
for await (const chunk of provider.stream({
  system: memory.systemPrompt,
  message: userMessage,
})) {
  assistantText += chunk;
  response.write(chunk);
}

await memo.enqueueIngest(
  [
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantText },
  ],
  sessionId,
);
response.end();` }] },
    { title: "Best practices", bullets: ["Start the provider stream only after memory selection is complete.", "Collect exactly the text delivered to the user.", "Define whether interrupted streams are discarded or stored with explicit status metadata.", "Use queue mode when post-stream extraction would delay request completion.", "Keep provider streaming and MemoGrafter execution on the server."] },
    { title: "Common mistakes", bullets: ["Ingesting every token or chunk as a separate message.", "Starting the stream before recall finishes.", "Calling `invoke()` and separately streaming the same response.", "Dropping the final assistant text before ingestion.", "Assuming an accepted queue job is already visible to recall."] },
    { title: "Related documentation", links: [api("Queued Ingestion", "/docs/advanced/queued-ingestion", "Move completed exchanges to background workers."), api("Recall & Memory Injection", "/docs/guides/recall-memory-injection", "Build the pre-stream memory context."), api("OpenAI adapter", "/docs/adapters/openai", "Configure supported provider behavior."), api("MemoGrafter.ingest()", "/docs/api-reference/memo-grafter/ingest", "Ingest an explicit message snapshot.")] },
  ]),

  guide("inspecting-reviewing-memory", "Inspecting & reviewing memory", "Trace what MemoGrafter retained, why a fact was recalled, its lifecycle state, and where transferred memory came from.", "7 minutes", "Beginner", [
    { title: "Overview", body: ["Review combines application reads with Studio. Start from the query that produced unexpected behavior, then move from retrieved facts to parent topics, lifecycle state, history, and provenance before changing thresholds."] },
    { title: "When to use this", bullets: ["Validate extraction before shipping a workflow.", "Explain why a memory appeared in a prompt.", "Debug a missing or stale result.", "Review forgotten, suppressed, conflicting, or superseded records.", "Trace memory copied from another session."] },
    { title: "Step 1: Reproduce recall", code: [{ label: "recall-debug.ts", language: "ts", code: `const result = await agent.recall("refund policy", {
  limit: 10,
  
});

console.table(result.facts.map((fact) => ({
  id: fact.id,
  value: fact.value,
  similarity: fact.similarity,
  quality: fact.quality,
})));` }] },
    { title: "Step 2: Inspect the graph snapshot", code: [{ label: "snapshot.ts", language: "ts", code: `const snapshot = await agent.getGraphSnapshot();
console.log(snapshot.snapshotNodes);
console.log(snapshot.snapshotMemories);
console.log(snapshot.memoryEdges);` }], body: ["Snapshots intentionally include inactive lifecycle rows so inspection tools can show what normal active reads omit."] },
    { title: "Step 3: Inspect history and change", code: [{ label: "history.ts", language: "ts", code: `const history = await agent.getMemoryHistory("user", "location");
const diff = await agent.getMemoryDiff(oldMemoryId, newMemoryId);

console.log(history.entries);
console.log(diff.changedFields);` }] },
    { title: "Step 4: Review in Studio", bullets: ["Open the session in Graph View and select the parent topic.", "Inspect memory quality, source, tags, lifecycle flags, and edges.", "Use Prompt Preview with the original query.", "Compare the exact generated prompt before adjusting retrieval settings.", "Apply supported lifecycle actions only after resolving the correct node."] },
    { title: "Full review workflow", code: [{ label: "review.ts", language: "ts", code: `const recall = await agent.recall(query, { limit: 10,  });
const snapshot = await agent.getGraphSnapshot();

for (const fact of recall.facts) {
  const lifecycle = snapshot.snapshotMemories.find(
    ({ memory }) => memory.id === fact.id,
  )?.lifecycle;
  console.log({ fact, lifecycle });
}` }] },
    { title: "Why memory may be missing", bullets: ["Ingestion has not completed yet.", "Extraction created a topic summary but no matching atomic memory.", "Adaptive selection excludes weak candidates or topic blocks.", "The fact was trimmed by `limit` or `tokenBudget`.", "The memory is decayed, superseded, forgotten, or attached to a suppressed topic.", "Tags or scope exclude the record."] },
    { title: "Best practices", bullets: ["Debug with the exact production query and scope.", "Record source metadata during ingestion.", "Review both similarity and evidence quality.", "Use history and diff for changing facts rather than reading only the newest row.", "Keep Studio local and do not expose its internal API publicly."] },
    { title: "Related documentation", links: [api("Graph Snapshot", "/docs/api-reference/memo-grafter-agent/get-graph-snapshot", "Read lifecycle-aware inspection data."), api("Memory history", "/docs/api-reference/memo-grafter-agent/get-memory-history", "Inspect a fact lineage."), api("Prompt Preview", "/docs/studio/prompt-preview", "See the exact prompt and token usage."), api("Retrieval Tuning", "/docs/advanced/retrieval-tuning", "Diagnose ranking and threshold behavior.")] },
  ]),

  guide("fleet-shared-memory", "Fleet & shared memory", "Give specialized workers local memory, shared fleet knowledge, and explicit conductor-led transfer between agents.", "12 minutes", "Advanced", [
    { title: "Overview", body: ["A fleet groups worker agents and a conductor around one core. Workers can read local memory, the fleet’s synthetic shared session, or both, while grafting remains available for deliberate cross-worker transfer."] },
    { title: "When to use this", bullets: ["Several specialized agents need isolated task memory.", "All workers need common policies or product knowledge.", "A conductor should transfer selected context between workers.", "Memory provenance and worker identity must remain visible."] },
    { title: "Fleet memory model", diagram: "fleet-flow" },
    { title: "Step 1: Create the fleet", code: [{ label: "fleet.ts", language: "ts", code: `const fleet = new MemoGrafterFleet(config, {
  id: "support-fleet",
  name: "Support Fleet",
  defaultWorkerMemory: "both",
});

await fleet.initialize();
const conductor = fleet.createConductor();
const billing = await fleet.createWorker({ color: "billing" });
const technical = await fleet.createWorker({ color: "technical" });` }] },
    { title: "Step 2: Add shared knowledge", code: [{ label: "shared.ts", language: "ts", code: `await fleet.ingestToFleet(
  "Refund requests are accepted within 30 days.",
  { tags: ["policy"], source: "support-handbook" },
);

const result = await fleet.recallFromFleet("refund policy");` }] },
    { title: "Step 3: Choose worker scope", code: [{ label: "memory-mode.ts", language: "ts", code: `const support = await fleet.createWorker({
  color: "support",
  memory: "both",
});

await support.recall("refund policy", { memory: "fleet" });
await support.recall("customer preference", { memory: "local" });` }] },
    { title: "Step 4: Transfer selected worker memory", code: [{ label: "conductor.ts", language: "ts", code: `await conductor.graftColorIntoAgent("billing", technical, { limit: 4 });
await conductor.graftByPrompt("invoice credit context", technical, {
  minSimilarity: 0.6,
  limit: 3,
});` }] },
    { title: "Full example", code: [{ label: "support-fleet.ts", language: "ts", code: `const fleet = new MemoGrafterFleet(config, { id: "support-fleet" });
await fleet.initialize();

try {
  await fleet.ingestToFleet("Refund window: 30 days.", { tags: ["policy"] });
  const billing = await fleet.createWorker({ color: "billing", memory: "both" });
  await billing.invoke("The customer prefers email updates.");
  console.log(await billing.invoke("What refund window and contact method apply?"));
} finally {
  await fleet.close();
}` }] },
    { title: "Memory modes", bullets: ["`local`: only the worker session.", "`fleet`: only the synthetic shared fleet session.", "`both`: local worker memory plus shared fleet memory.", "The default is `local` unless the fleet or worker overrides it."] },
    { title: "Common mistakes", bullets: ["Putting worker-specific private context into shared fleet memory.", "Using the reserved `conductor` color for a worker.", "Assuming shared recall copies memory into a worker graph.", "Skipping authorization before cross-worker transfer.", "Closing an underlying core independently when the fleet owns it."] },
    { title: "Related documentation", links: [api("MemoGrafterFleet", "/docs/api-reference/fleet-memory/memo-grafter-fleet-index", "Construct and manage a fleet."), api("Multi-agent example", "/docs/examples/multi-agent-memory", "See a practical worker workflow."), api("Grafting Memory", "/docs/guides/grafting-memory", "Understand copied-memory provenance."), api("Fleet types", "/docs/api-reference/types/memo-grafter-fleet-options", "Configure workers and memory modes.")] },
{
  "title": "Evidence and destination domains",
  "body": [
    "Fleet workers and shared memory retain explicit scope and graft provenance. Copied memories preserve structured quality. Absorption does not carry a source-session cluster ID into the destination; destination topics can be classified independently."
  ],
  "links": [
    {
      "label": "Topic domains",
      "href": "/docs/guides/topic-domains"
    }
  ]
}
]),

  guide("pruning", "Pruning memory safely", "Reduce noisy active memory through deliberate lifecycle policy without treating decay, suppression, forgetting, and deletion as interchangeable.", "8 minutes", "Intermediate", [
    { title: "Overview", body: ["MemoGrafter does not expose one universal prune operation. Pruning is an application review workflow that selects the correct lifecycle action for stale, obsolete, incorrect, or overly broad memory while preserving auditability by default."] },
    { title: "Choose the right state", bullets: ["Decay marks old or low-scoring memory inactive through maintenance policy.", "Supersession identifies an older version replaced by a newer explicit update.", "Conflict keeps competing active claims visible for resolution.", "Forgetting is a one-way public soft lifecycle action on a memory node.", "Suppression temporarily hides an entire topic and can be restored.", "Physical deletion is a separate storage and retention-policy decision."] },
    { title: "Lifecycle flow", diagram: "lifecycle-flow" },
    { title: "Step 1: Identify candidates", code: [{ label: "candidates.ts", language: "ts", code: `const snapshot = await agent.getGraphSnapshot();
const candidates = snapshot.snapshotMemories.filter(({ lifecycle }) =>
  lifecycle.decayed || lifecycle.hasConflict || lifecycle.supersededBy,
);` }] },
    { title: "Step 2: Review provenance and history", code: [{ label: "review.ts", language: "ts", code: `const history = await agent.getMemoryHistory(memoryId);
console.log(history.entries);
console.log(history.currentMemory);` }] },
    { title: "Step 3: Apply a bounded action", code: [{ label: "lifecycle.ts", language: "ts", code: `await agent.forget(memoryId);
// Or temporarily hide a whole topic:
await agent.suppressTopic(topicId);` }] },
    { title: "Step 4: Verify active recall", code: [{ label: "verify.ts", language: "ts", code: `const after = await agent.recall(originalQuery);
console.log(after.facts.some((fact) => fact.id === memoryId)); // false` }] },
    { title: "Best practices", bullets: ["Change memory in small reviewed batches.", "Keep application-level reasons and actor identity in your own audit system.", "Compare recall quality before and after policy changes.", "Use Studio and snapshots because active reads intentionally hide inactive rows.", "Treat hard deletion as a separate retention and privacy design."] },
    { title: "Common mistakes", bullets: ["Calling every inactive state ‘deleted’.", "Forgetting a memory when temporary topic suppression is intended.", "Physically deleting rows before reviewing provenance and edges.", "Pruning solely by age without considering evidence, stability, salience, or use case.", "Expecting suppression to restore independently forgotten memories."] },
    { title: "Related documentation", links: [api("Forgetting & Privacy", "/docs/guides/forgetting-privacy", "Implement a user-directed forget workflow."), api("Conflict Detection & Versioning", "/docs/advanced/conflict-detection-versioning", "Understand crawler lifecycle annotations."), api("Lifecycle Actions", "/docs/studio/lifecycle-actions", "Review supported actions in Studio."), api("suppressTopic()", "/docs/api-reference/memo-grafter-agent/suppress-topic", "Temporarily hide an entire topic.")] },
  ]),

  guide("forgetting-privacy", "Forgetting & privacy", "Remove selected memory from active use, verify the result, and distinguish soft forgetting from physical data deletion.", "6 minutes", "Intermediate", [
    { title: "Overview", body: ["`forget()` and `forgetMany()` mark exact memory rows as forgotten. Forgotten memory remains available to history and snapshot inspection but is excluded from active recall, grafting, absorption, memory-edge construction, and maintenance."] },
    { title: "When to use this", bullets: ["A user asks the application to stop using a retained fact.", "An extracted memory is incorrect or inappropriate for future retrieval.", "A reviewed batch of exact memory IDs should leave active recall.", "The application needs an auditable soft lifecycle action."] },
    { title: "Step 1: Resolve the exact memory", code: [{ label: "find-memory.ts", language: "ts", code: `const result = await agent.recall("food preference", {
  limit: 10,
  
});

const target = result.facts.find((fact) => fact.value.includes("mushrooms"));
if (!target) throw new Error("Memory not found");` }] },
    { title: "Step 2: Forget it", code: [{ label: "forget.ts", language: "ts", code: `const changed = await agent.forget(target.id);
console.log(changed); // true only when state changed` }] },
    { title: "Step 3: Verify active and audit views", code: [{ label: "verify.ts", language: "ts", code: `const active = await agent.recall("food preference");
const snapshot = await agent.getGraphSnapshot();

console.log(active.facts.some((fact) => fact.id === target.id)); // false
console.log(snapshot.memories.some((memory) => memory.id === target.id)); // true` }] },
    { title: "Full example", code: [{ label: "privacy-request.ts", language: "ts", code: `async function forgetApprovedMemories(agent: MemoGrafterAgent, ids: string[]) {
  const changed = await agent.forgetMany(ids);
  const snapshot = await agent.getGraphSnapshot();
  const statuses = ids.map((id) => ({
    id,
    forgotten: snapshot.snapshotMemories.find(
      ({ memory }) => memory.id === id,
    )?.lifecycle.forgotten,
  }));
  return { changed, statuses };
}` }] },
    { title: "Soft forgetting and hard deletion", body: ["MemoGrafter’s public forget API is intentionally one-way and soft. It does not expose `restoreMemory()`. If policy requires physical deletion, backups removal, or downstream erasure, implement that broader retention workflow at the application and storage layers."] },
    { title: "Privacy checklist", bullets: ["Authenticate and authorize the requester.", "Resolve exact memory IDs and scope them to the authorized user or session.", "Record the request and result in the application’s audit system.", "Verify active recall no longer returns the memory.", "Handle backups, exports, logs, caches, and external systems according to the application’s retention policy."] },
    { title: "Common mistakes", bullets: ["Calling `forget()` on an unverified ID.", "Claiming the database row was physically deleted.", "Expecting a public restore API.", "Suppressing a topic when only one memory should be forgotten.", "Ignoring data copies outside MemoGrafter’s graph store."] },
    { title: "Related documentation", links: [api("forget()", "/docs/api-reference/memo-grafter-agent/forget", "Soft-forget one exact memory."), api("forgetMany()", "/docs/api-reference/memo-grafter-agent/forget-many", "Apply the lifecycle change in a batch."), api("Memory history", "/docs/api-reference/memo-grafter-agent/get-memory-history", "Inspect retained lineage and status."), api("Pruning Memory Safely", "/docs/guides/pruning", "Choose among lifecycle policies.")] },
  ]),

  guide("conversation-summaries", "Conversation summaries", "Use topic summaries, atomic memories, and recent history together instead of maintaining one ever-growing transcript summary.", "8 minutes", "Intermediate", [
    { title: "Overview", body: ["MemoGrafter preserves several layers of context. Recent raw history supports immediate continuity, topic summaries preserve broad historical segments, atomic memories support precise recall, and grafting assembles selected topic context."] },
    { title: "When to use this", bullets: ["Conversations outgrow a practical raw-history window.", "The application needs broad decisions and exact facts.", "Older context should be retrieved by relevance rather than recency alone.", "Historical summaries must remain auditable when facts later change."] },
    { title: "Step 1: Ingest complete turns", body: ["Use `invoke()` for ordinary chat so completed turns enter public history and the incremental memory pipeline together. For imported transcripts, use the explicit session-oriented `MemoGrafter.ingest()` path."] },
    { title: "Step 2: Recall exact facts", code: [{ label: "facts.ts", language: "ts", code: `const facts = await agent.recall("decisions and open questions", {
  limit: 10,
  tokenBudget: 1000,
});` }] },
    { title: "Step 3: Graft broader context", code: [{ label: "summary-context.ts", language: "ts", code: `const context = await agent.graftByRelevance(
  "decisions and open questions",
  { topK: 4, hopDepth: 1 },
);` }] },
    { title: "Full example", code: [{ label: "long-conversation.ts", language: "ts", code: `await agent.invoke("We chose PostgreSQL for transactional storage.");
await agent.invoke("The remaining question is regional failover.");

const exact = await agent.recall("What storage decision did we make?");
const broad = await agent.graftByRelevance("architecture decisions and risks");

console.log(exact.facts);
console.log(broad.systemPrompt);` }] },
    { title: "Choose the right context layer", bullets: ["Recent history: immediate conversational continuity.", "Topic summaries: broad historical context for a segment.", "Memory nodes: exact facts, tasks, questions, insights, and references.", "Grafted context: selected topic summaries, active facts, nearby source context, and maintenance notes."] },
    { title: "Historical versus current facts", body: ["Topic summaries are historical and are not rewritten when a fact changes. Maintenance can mark memory nodes conflicting, superseded, or decayed; graft prompts then add deterministic notes and active facts so downstream models know what to prefer."] },
    { title: "Common mistakes", bullets: ["Treating one rolling summary as the only source of truth.", "Expecting old topic summaries to be rewritten after a correction.", "Using full transcript replay where targeted recall is sufficient.", "Ignoring token budgets when grafting many topics.", "Assuming a topic summary always has corresponding atomic memory rows."] },
    { title: "Related documentation", links: [api("Recall & Memory Injection", "/docs/guides/recall-memory-injection", "Choose precise facts or broader context."), api("Grafting Memory", "/docs/guides/grafting-memory", "Assemble topic-oriented history."), api("Conflict Detection & Versioning", "/docs/advanced/conflict-detection-versioning", "Understand current facts and historical summaries."), api("Prompt Design", "/docs/advanced/prompt-design", "Keep memory context bounded and subordinate to policy.")] },
  ]),
];
