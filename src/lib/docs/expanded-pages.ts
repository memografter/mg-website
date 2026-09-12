import type { DocPage, DocSection } from "./types";

const page = (
  slug: string,
  title: string,
  description: string,
  eyebrow: string,
  sections: DocSection[],
): DocPage => ({ slug, title, description, eyebrow, sections });

const taskPage = (
  slug: string,
  title: string,
  description: string,
  outcome: string,
  steps: string[],
  code?: string,
): DocPage =>
  page(slug, title, description, "Guide", [
    { title: "Outcome", body: [outcome] },
    { title: "Implementation", bullets: steps, ...(code ? { code: [{ label: "example.ts", code }] } : {}) },
    { title: "Operational notes", bullets: ["Use stable application-level user and session identifiers.", "Inspect the resulting topics and memories in Studio before tuning thresholds.", "Keep provider secrets and all memory operations on the server."] },
    { title: "Related APIs", body: ["Use the method-level API Reference when you need exact call shapes, return values, and lifecycle behavior."] },
  ]);

const apiPage = (
  slug: string,
  title: string,
  description: string,
  signature: string,
  parameters: string[],
  returnType: string,
  example: string,
  notes: string[],
  related: string[],
): DocPage =>
  page(`api-reference/${slug}`, title, description, "API Reference", [
    { title: "Purpose", body: [description] },
    { title: "Signature", code: [{ label: "TypeScript", language: "ts", code: signature }] },
    { title: "Parameters", bullets: parameters },
    { title: "Return Type", body: [returnType] },
    { title: "Example", code: [{ label: "example.ts", language: "ts", code: example }] },
    { title: "Notes", bullets: notes },
    { title: "Related APIs", bullets: related },
  ]);

const providerPage = (slug: string, name: string, packages: string, notes: string[]): DocPage =>
  page(`adapters/${slug}`, `${name} adapter`, `Connect MemoGrafter to ${name} models.`, "Adapter", [
    { title: "Installation", code: [{ label: "terminal", code: packages }] },
    { title: "Configuration", code: [{ label: "adapter.ts", language: "ts", code: `const agent = new MemoGrafterAgent({\n  db: { connectionString: process.env.DATABASE_URL! },\n  llm: new ${name}LLMAdapter(),\n  embedder: new ${name === "Anthropic" ? "OpenAI" : name}EmbedAdapter(),\n});` }] },
    { title: "Supported capabilities", bullets: ["Chat completion for response generation and memory extraction.", "Embedding generation when the provider exposes a compatible embedding model.", "Server-side authentication through environment variables."] },
    { title: "Provider notes", bullets: notes },
    { title: "Troubleshooting", bullets: ["Confirm the API key is available to the server process.", "Verify the configured model supports the requested operation.", "Check rate limits when ingestion succeeds intermittently."] },
  ]);

const studioPage = (slug: string, title: string, description: string, bullets: string[]): DocPage =>
  page(`studio/${slug}`, title, description, "Studio", [
    { title: "Overview", body: [description] },
    { title: "Workflow", bullets },
    { title: "Current memory inspection", body: ["Inspect stable topics and bounded episodes, memory quality and provenance, and Clusters navigation with its Unclustered group. Domain metadata appears in topic details, snapshots, exports, and invocation previews without changing ranking or prompts.", "Invocation context distinguishes pinned topics, recalled facts, episode history, and recent messages. Pins require active context without changing quality or lifecycle. Studio inspects durable ingestion state; reconciliation repairs remain explicit runtime operations."], links: [{ label: "Topic domains", href: "/docs/guides/topic-domains" }, { label: "Memory quality", href: "/docs/concepts/memory-quality" }, { label: "Durable ingestion", href: "/docs/guides/durable-ingestion" }] },
    { title: "Safety", body: ["Studio is local developer tooling. Review lifecycle mutations carefully and avoid exposing the Studio server as a public application endpoint."] },
  ]);

const cliPage = (slug: string, title: string, description: string, command: string, bullets: string[]): DocPage =>
  page(`cli/${slug}`, title, description, "CLI", [
    { title: "Purpose", body: [description] },
    { title: "Command", code: [{ label: "terminal", code: command }] },
    { title: "Behavior", bullets },
    { title: "Troubleshooting", bullets: ["Run the command from the package that contains MemoGrafter.", "Confirm environment variables are loaded in the current shell.", "Use `--help` to inspect options supported by the installed version."] },
  ]);

const examplePage = (slug: string, title: string, description: string, code: string, flow: string[]): DocPage =>
  page(`examples/${slug}`, title, description, "Example", [
    { title: "Scenario", body: [description] },
    { title: "Memory design", bullets: flow },
    { title: "Core implementation", code: [{ label: "example.ts", language: "ts", code }] },
    { title: "Try next", body: ["Run the interaction more than once, inspect the graph in Studio, and then test recall from a fresh session."] },
  ]);

const advancedPage = (slug: string, title: string, description: string, sections: DocSection[]): DocPage =>
  page(`advanced/${slug}`, title, description, "Advanced", sections);

const commonAgent = `const agent = new MemoGrafterAgent({
  db: { connectionString: process.env.DATABASE_URL! },
  llm,
  embedder,
  sessionId: "session-123",
});`;

export const expandedDocsPages: DocPage[] = [
  taskPage("guides/chatbot-memory", "Chatbot memory", "Give a chatbot durable, relevant memory.", "The chatbot recalls useful facts before responding and ingests the new turn afterward.", ["Create one MemoGrafterAgent for the active session.", "Send each user turn through `invoke()`.", "Keep the same session identifier for related turns.", "Close the agent during graceful shutdown."], `${commonAgent}\nconst response = await agent.invoke("Remember that I prefer concise answers.");`),
  taskPage("guides/long-running-agents", "Long-running agents", "Keep an agent useful across long jobs without replaying its entire transcript.", "The agent retrieves only task-relevant memory while older turns are converted into graph-backed facts.", ["Use a durable job or agent identifier as the memory session.", "Ingest checkpoints, decisions, and results as work progresses.", "Recall before each planning cycle with a strict token budget.", "Run lifecycle maintenance outside the critical response path."], `await agent.ingest("Checkpoint: indexing completed for 42 documents.");\nconst context = await agent.recall("What remains to be indexed?", { tokenBudget: 800 });`),
  taskPage("guides/knowledge-extraction", "Knowledge extraction", "Turn text and documents into structured memories without generating a chat response.", "Source material becomes searchable topics and atomic facts.", ["Normalize source text and preserve a source identifier in tags.", "Call `ingest()` for each bounded document or section.", "Allow ingestion to finish before recall evaluation.", "Use Studio to review extraction quality."], `await agent.ingest(documentText, { tags: ["source:handbook", "version:2026"] });`),
  taskPage("guides/multi-session-memory", "Multi-session memory", "Carry selected context between otherwise independent sessions.", "A new session receives relevant memory with source provenance rather than inheriting an entire transcript.", ["Keep each conversation in its own session.", "Preview relevant source topics with a graft query.", "Absorb only the memories needed by the destination.", "Retain source and destination identifiers for auditing."], `await targetAgent.absorbFromAgent(sourceAgent, { query: "customer preferences", topK: 5 });`),
  taskPage("guides/streaming-responses", "Streaming responses", "Combine application-level response streaming with background memory ingestion.", "Tokens can reach the user immediately while the completed exchange is persisted afterward.", ["Recall before starting the provider stream.", "Inject the returned system prompt into the streaming request.", "Collect the final assistant text without delaying token delivery.", "Ingest the completed user and assistant turns after the stream closes."], `const memory = await agent.recall(userMessage, { tokenBudget: 1000 });\nconst stream = llm.stream({ system: memory.systemPrompt, message: userMessage });\n// After collecting the completed assistant response:\nawait agent.ingest(completedExchange);`),
  taskPage("guides/memory-review", "Memory review", "Review what MemoGrafter retained and why it is recalled.", "Developers can inspect topics, facts, quality, provenance, and lifecycle state before shipping.", ["Launch Studio against the same database as the application.", "Select the session and inspect its graph.", "Compare recalled facts with Prompt Preview.", "Suppress or forget incorrect memory through supported lifecycle actions."]),
  taskPage("guides/pruning", "Pruning", "Reduce noisy active memory while retaining an auditable graph.", "Low-value or obsolete memory stops participating in recall without uncontrolled deletion.", ["Identify stale, poorly supported, conflicting, or superseded facts.", "Prefer lifecycle state changes over physical deletion.", "Apply pruning in bounded batches.", "Measure recall quality before and after each policy change."], `const candidates = await agent.recall("obsolete project decisions", { limit: 50 });\n// Review candidates, then forget only approved memory IDs.`),
  taskPage("guides/forget-memory", "Forget memory", "Remove a memory from active retrieval when a user or application requests it.", "Forgotten facts no longer appear in normal recall while lifecycle history remains auditable.", ["Resolve the exact memory identifier.", "Call `forget()` with the appropriate scope.", "Confirm the memory no longer appears in recall.", "Record the application-level reason when policy requires it."], `await agent.forget(memoryId);`),
  taskPage("guides/conversation-summaries", "Conversation summaries", "Create compact, durable summaries from long conversations.", "The application uses topic summaries and atomic facts instead of a single ever-growing transcript summary.", ["Ingest complete conversational turns.", "Let topic drift divide the transcript into meaningful segments.", "Use topic nodes for broad summaries and memory nodes for exact facts.", "Recall summaries by the next task rather than by recency alone."], `await agent.ingest(transcript);\nconst summary = await agent.graftByRelevance("decisions and open questions");`),

  apiPage("memo-grafter-agent", "MemoGrafterAgent", "High-level session API for response generation, ingestion, recall, grafting, and lifecycle operations.", `new MemoGrafterAgent(config: MemoGrafterAgentConfig)`, ["`config.db`: database connection settings.", "`config.llm`: completion adapter.", "`config.embedder`: embedding adapter.", "`config.sessionId`: stable memory-session identifier.", "Optional drift, graph, injection, queue, and cache settings."], "A MemoGrafterAgent instance bound to its configuration and session.", `${commonAgent}`, ["Create agents server-side.", "Reuse an instance for related turns when practical.", "Call `close()` during graceful shutdown."], ["`invoke()`", "`ingest()`", "`recall()`", "`graft()`"]),
  apiPage("invoke", "invoke()", "Generate a response using recent history and recalled long-term memory, then ingest the exchange.", `invoke(message: string, options?: InvokeOptions): Promise<string>`, ["`message`: current user message.", "`options`: optional invocation and memory controls."], "A promise resolving to the assistant response text.", `const reply = await agent.invoke("What did we decide about deployment?");`, ["Use this as the default chatbot-facing path.", "Ingestion may continue after response generation depending on configuration."], ["`recall()`", "`ingest()`", "`history()`"]),
  apiPage("ingest", "ingest()", "Convert text or conversation material into graph memory without generating an assistant response.", `ingest(input: string, options?: IngestOptions): Promise<void>`, ["`input`: text or serialized conversational material.", "`options.tags`: optional routing and provenance tags."], "A promise that resolves after the ingestion request is accepted or completed according to mode.", `await agent.ingest(handbook, { tags: ["source:handbook"] });`, ["Queue mode can complete graph construction asynchronously.", "Use stable source tags when ingesting documents."], ["`recall()`", "Memory Pipeline", "Embeddings"]),
  apiPage("recall", "recall()", "Retrieve active facts related to a semantic query.", `recall(query: string, options?: RecallOptions): Promise<RecallResult>`, ["`query`: natural-language retrieval query.", "`options.limit`: maximum facts.", "`options.minSimilarity`: semantic threshold.", "`options.tokenBudget`: prompt budget.", "`options.tags`: optional metadata filters."], "A RecallResult containing facts, parent topic nodes, a prompt-ready system string, and token accounting.", `const result = await agent.recall("deployment config", { limit: 8, tokenBudget: 1000 });`, ["Forgotten, suppressed, decayed, or superseded facts are excluded by normal active reads.", "Tune quality with evaluation data, not one example."], ["`graft()`", "Retrieval Pipeline", "Prompt Design"]),
  apiPage("graft", "graft()", "Build transferable prompt context from one session or move selected memory into another.", `graft(options?: GraftOptions): Promise<GraftResult>`, ["`options`: selection, graph expansion, and token-budget controls."], "A GraftResult with selected topics, facts, provenance, and prompt-ready context.", `const graft = await agent.graft();\nconsole.log(graft.systemPrompt);`, ["Preview before absorbing memory across sessions.", "Provenance identifies the source of transferred memory."], ["`recall()`", "Multi-session Memory", "Grafting"]),
  apiPage("forget", "forget()", "Remove selected memory from active recall through lifecycle state.", `forget(memoryId: string): Promise<void>`, ["`memoryId`: exact memory-node identifier to forget."], "A promise resolving after the lifecycle update is persisted.", `await agent.forget("memory_01H...");`, ["Forgetting is a scoped lifecycle operation, not a substitute for database retention policy.", "Verify identifiers before applying mutations."], ["Forget Memory", "Lifecycle Actions", "`history()`"]),
  apiPage("history", "history()", "Read stored session history and lifecycle context for inspection or application display.", `history(options?: HistoryOptions): Promise<Message[]>`, ["`options`: optional range or pagination controls supported by the installed version."], "A promise resolving to ordered stored messages or history records.", `const messages = await agent.history();`, ["Use bounded history reads in long-running sessions.", "Long-term recall should use `recall()` rather than replaying all history."], ["`recall()`", "Messages", "Memory Review"]),
  apiPage("studio-api", "Studio API", "Read sessions, graph records, prompt previews, and supported lifecycle actions from the local Studio service.", `GET /api/sessions\nGET /api/sessions/:id/graph\nPOST /api/prompt-preview`, ["Path parameters select a session or graph record.", "Request bodies provide preview queries or lifecycle actions."], "JSON payloads used by the bundled Studio interface.", `const response = await fetch("http://localhost:2891/api/sessions");\nconst sessions = await response.json();`, ["The Studio API is local developer tooling and may evolve with the Studio UI.", "Do not expose it as an unauthenticated public API."], ["Launching Studio", "Prompt Preview", "Lifecycle Actions"]),
  apiPage("types", "Types", "Find the primary TypeScript contracts exported by MemoGrafter.", `import type { Message, TopicNode, MemoryNode, RecallResult, GraphStore } from "memo-grafter";`, ["`Message`: raw conversational turn.", "`TopicNode`: summarized topical unit.", "`MemoryNode`: atomic retained fact.", "`RecallResult`: structured retrieval result.", "`GraphStore`: persistence contract."], "TypeScript declarations with no runtime value.", `const useFact = (fact: MemoryNode) => fact.value;`, ["Import contracts with `import type` when they are used only by the type system.", "The installed package declarations are the version-specific source of truth."], ["MemoGrafterAgent", "Graph Store", "Errors"]),
  apiPage("errors", "Errors", "Handle setup, provider, storage, ingestion, retrieval, and lifecycle failures predictably.", `try {\n  await agent.invoke(message);\n} catch (error: unknown) {\n  // Narrow, log context, and choose an application fallback.\n}`, ["Thrown values should be narrowed from `unknown`.", "Provider and database clients can contribute their own error types."], "Methods reject their promises when a required operation cannot complete.", `try {\n  return await agent.recall(query);\n} catch (error) {\n  logger.error({ error, sessionId }, "Recall failed");\n  return { facts: [], systemPrompt: "" };\n}`, ["Do not log provider keys, raw credentials, or unnecessary private memory.", "Queue and cache failures may degrade differently from required storage operations."], ["Studio Troubleshooting", "Scaling", "MemoGrafterAgent"]),

  providerPage("openai", "OpenAI", `npm install memo-grafter openai`, ["Set `OPENAI_API_KEY` on the server.", "Choose completion and embedding models independently.", "Keep embedding dimensions consistent with the database index."]),
  providerPage("anthropic", "Anthropic", `npm install memo-grafter @anthropic-ai/sdk openai`, ["Set `ANTHROPIC_API_KEY` on the server.", "Anthropic supplies completion models; this example pairs it with OpenAI embeddings and also requires OPENAI_API_KEY.", "Normalize system prompts through the adapter contract."]),
  providerPage("gemini", "Gemini", `npm install memo-grafter @google/generative-ai`, ["Set `GEMINI_API_KEY` on the server.", "Configure explicit generation and embedding models.", "Confirm regional availability and quotas for the selected model."]),
  page("adapters/custom-adapter", "Custom adapter", "Implement provider-agnostic completion and embedding behavior.", "Adapter", [{ title: "Contracts", body: ["MemoGrafter depends on small LLM and embedding interfaces so provider SDK details remain outside the memory pipelines."], code: [{ label: "adapter.ts", language: "ts", code: `class MyLLMAdapter implements LLMAdapter {\n  async complete(messages: Message[], system?: string): Promise<string> {\n    return provider.complete({ messages, system });\n  }\n}` }] }, { title: "Implementation checklist", bullets: ["Map MemoGrafter roles and system context to the provider request.", "Return plain completion text.", "Normalize provider failures without hiding useful context.", "Add timeouts, retries, and observability at the adapter boundary."] }, { title: "Validation", bullets: ["Test system-prompt handling.", "Test empty and long inputs.", "Test rate limits and transient failures."] }]),
  page("adapters/embeddings", "Embeddings", "Configure semantic vectors for topic detection and memory retrieval.", "Adapter", [{ title: "Role", body: ["Embeddings power drift detection, semantic recall, topic matching, and graph expansion. All stored and queried vectors must use compatible dimensions and semantics."] }, { title: "Configuration", bullets: ["Choose one embedding model per compatible index.", "Record model and dimension changes as a migration concern.", "Batch document ingestion when the provider supports it.", "Evaluate similarity thresholds with representative queries."] }, { title: "Custom implementation", code: [{ label: "embedder.ts", language: "ts", code: `class MyEmbedder implements EmbedAdapter {\n  async embed(text: string): Promise<number[]> {\n    return provider.embed(text);\n  }\n}` }] }]),
  page("adapters/custom-llm", "Custom LLM", "Connect any completion provider to response generation and memory extraction.", "Adapter", [{ title: "Contract", body: ["A custom LLM adapter receives normalized messages plus optional system context and returns completion text."] }, { title: "Implementation", code: [{ label: "llm.ts", language: "ts", code: `class MyLLM implements LLMAdapter {\n  async complete(messages: Message[], system?: string) {\n    const result = await client.generate({ messages, system });\n    return result.text;\n  }\n}` }] }, { title: "Production concerns", bullets: ["Set request timeouts.", "Retry only safe transient failures.", "Track latency and token usage.", "Avoid logging private prompts by default."] }]),

  studioPage("launching-studio", "Launching Studio", "Start the local interface and connect it to a MemoGrafter database.", ["Set `DATABASE_URL` or pass the supported database option.", "Run `npx memo-grafter studio`.", "Open the printed localhost address.", "Choose a session before loading graph data."]),
  studioPage("graph-view", "Graph View", "Explore topic nodes, attached memories, graph edges, and provenance.", ["Select a session.", "Choose the Graph tab.", "Select a topic to load its memories.", "Inspect temporal, semantic, reentry, update, and graft relationships."]),
  studioPage("memory-table", "Memory Table", "Inspect MemoGrafter-owned records in a dense tabular view.", ["Open Tables after selecting a session.", "Choose an `mg_*` table.", "Filter or scan lifecycle fields and identifiers.", "Use record identifiers when debugging API behavior."]),
  studioPage("prompt-preview", "Prompt Preview", "Preview the memory context a recall or graft operation would inject.", ["Choose the session and preview mode.", "Enter a representative query.", "Adjust retrieval limits and token budget.", "Compare included facts with the graph before changing production settings."]),
  studioPage("lifecycle-actions", "Lifecycle Actions", "Apply supported memory lifecycle changes from Studio.", ["Inspect the exact topic or memory first.", "Choose the supported suppression or lifecycle action.", "Confirm the mutation.", "Repeat Prompt Preview to verify active reads changed as intended."]),
  studioPage("search", "Search", "Find sessions, topics, and memories during graph inspection.", ["Start with a distinctive subject, value, tag, or session identifier.", "Narrow results before applying lifecycle actions.", "Open the parent topic to understand provenance.", "Use semantic Prompt Preview for meaning-based retrieval checks."]),
  studioPage("troubleshooting", "Studio troubleshooting", "Resolve database, schema, port, graph-loading, and preview problems.", ["Confirm PostgreSQL and `pgvector` are reachable.", "Run migrations for the installed MemoGrafter version.", "Use the next available local port if 2891 is occupied.", "Confirm provider credentials when Prompt Preview needs model access.", "Inspect the terminal for the underlying server error."]),

  cliPage("installation", "CLI installation", "Run the bundled MemoGrafter command-line tools.", `npm install memo-grafter\nnpx memo-grafter --help`, ["The CLI ships with the package.", "Using npx keeps the command aligned with the project version.", "Run init, migrate, and doctor from your server-side project."]),
  cliPage("studio", "studio", "Start the local MemoGrafter Studio server.", `npx memo-grafter studio`, ["Verifies the database schema before serving Studio.", "Uses localhost port 2891 or the next available port.", "Resolves database settings from flags, environment, and generated config."]),
  cliPage("init", "init", "Generate the project-local MemoGrafter schema and configuration files.", `npx memo-grafter init`, ["Creates files under `src/memo-grafter/`.", "Keeps generated memory configuration reviewable in source control.", "Does not migrate the database."]),
  cliPage("migrate", "migrate", "Create or update MemoGrafter-owned PostgreSQL infrastructure.", `npx memo-grafter migrate`, ["Requires a reachable PostgreSQL database.", "Manages required extensions and `mg_*` tables only.", "Application-owned tables remain in the application migration system."]),
  page("cli/doctor", "doctor", "Verify that MemoGrafter, its configuration, PostgreSQL schema, pgvector, and optional recall cache are ready.", "CLI", [
    {
      title: "Purpose",
      body: [
        "Run Doctor after migration or whenever an environment stops behaving as expected. It performs read-only diagnostics and does not modify your configuration, database, or cache.",
        "Doctor does not require the normal initialization gate before starting. Missing configuration is reported as a required failure while independent checks continue where possible.",
      ],
    },
    {
      title: "Run Doctor",
      code: [{ label: "terminal", language: "bash", code: "npx memo-grafter doctor" }],
    },
    {
      title: "Checks performed",
      bullets: [
        "The active Node.js version and installed MemoGrafter version.",
        "Whether MemoGrafter configuration files and `DATABASE_URL` are available.",
        "PostgreSQL connectivity and the server version.",
        "Whether pgvector is available on the PostgreSQL server and enabled in the selected database.",
        "Whether `mg_migrations` exists and records the current MemoGrafter migration version.",
        "Whether all required core MemoGrafter tables exist.",
        "Redis reachability only when recall caching is configured through `cache.connectionString`.",
      ],
    },
    {
      title: "Database resolution order",
      body: [
        "Doctor resolves the database exactly as migration does. The first available value wins:",
      ],
      bullets: [
        "The `--db` command-line option.",
        "The project `.env` file or `DATABASE_URL` environment variable.",
        "`src/memo-grafter/mg.config.ts`.",
        "Root `mg.config.ts`.",
      ],
    },
    {
      title: "Override the database",
      body: [
        "Use `--db` to diagnose a specific database without changing project configuration. Doctor uses the supplied connection string but never prints it in the report.",
      ],
      code: [
        {
          label: "terminal",
          language: "bash",
          code: "npx memo-grafter doctor --db postgres://postgres:postgres@localhost:5432/memo_grafter",
        },
      ],
    },
    {
      title: "Dependency-aware checks",
      body: [
        "Checks run in dependency order. If PostgreSQL cannot be reached, Doctor reports that required failure and marks pgvector, migration, and schema checks as skipped instead of producing misleading secondary failures.",
      ],
      bullets: [
        "`passed`: the check completed successfully.",
        "`failed`: a required readiness check did not pass.",
        "`warning`: an optional integration is unavailable or degraded.",
        "`skipped`: a prerequisite was unavailable or the optional feature is not configured.",
      ],
    },
    {
      title: "Optional Redis behavior",
      body: [
        "Redis is optional in the current Doctor implementation. PostgreSQL-backed recall remains available when an optional recall cache cannot be reached.",
      ],
      bullets: [
        "An unconfigured recall cache is skipped.",
        "A reachable cache configured through `cache.connectionString` passes its Redis `PING` check.",
        "An unreachable configured cache produces a warning, not a required failure.",
        "`REDIS_URL` alone is not active recall-cache configuration and does not trigger the Redis check.",
      ],
    },
    {
      title: "Exit codes",
      bullets: [
        "`0`: all required checks passed.",
        "`1`: one or more required checks failed.",
        "`2`: invalid command usage, such as an unknown option or `--db` without a value.",
        "Optional cache Redis warnings do not produce exit code `1`; configured queue failures are required failures.",
      ],
      body: [
        "Doctor stores checks internally as structured `passed`, `failed`, `warning`, or `skipped` results so future output modes can reuse the same diagnostics.",
      ],
    },
    {
      title: "Troubleshooting",
      bullets: [
        "Run Doctor from the server-side package that contains MemoGrafter.",
        "Run `npx memo-grafter migrate` before diagnosing a new database.",
        "Confirm the expected `.env` file and configuration files are available from the current working directory.",
        "Use `npx memo-grafter doctor --help` to inspect options supported by the installed package version.",
      ],
    },
{
  "title": "Ingestion and configured Redis",
  "body": [
    "Use npx memo-grafter doctor --ingestion for read-only durable ingestion diagnostics. Doctor and Studio never apply reconciliation repairs. Cache Redis failure is optional; explicitly configured queue Redis failure is required."
  ],
  "links": [
    {
      "label": "Recovery guide",
      "href": "/docs/guides/durable-ingestion"
    }
  ]
}
]),
  cliPage("config", "config", "Understand generated configuration and CLI resolution rules.", `npx memo-grafter init`, ["CLI flags take precedence when supported.", "Environment variables are resolved next.", "Generated `src/memo-grafter/mg.config.ts` supplies project defaults.", "Keep secrets out of committed configuration.", "clustering.enabled opts into domains; drift.topicAssignment controls stable-topic reuse.", "Per-ingestion qualityPolicy and sourceReliability control quality admission; supported operation boundaries accept signal and timeoutMs."]),
  page("cli/environment-variables", "Environment variables", "Configure database, providers, Redis, and local tooling.", "CLI", [{ title: "Variables", code: [{ label: ".env", code: `DATABASE_URL=postgres://...\nOPENAI_API_KEY=...\nANTHROPIC_API_KEY=...\nGEMINI_API_KEY=...\nREDIS_URL=redis://localhost:6379` }] }, { title: "When they are required", bullets: ["`DATABASE_URL` configures the built-in PostgreSQL store and CLI.", "Provider keys are required only for adapters you use.", "`REDIS_URL` is required for queue mode or the optional recall cache."] }, { title: "Security", body: ["Load secrets only in the server environment and exclude local environment files from source control."] }]),

  examplePage("simple-chatbot", "Simple chatbot", "A single-session assistant that recalls user preferences.", `${commonAgent}\nconst reply = await agent.invoke("Plan a concise weekend itinerary.");`, ["One stable session per conversation.", "Invoke-time recall followed by background ingestion.", "Studio inspection during development."]),
  examplePage("customer-support", "Customer support", "A support assistant that combines customer context with shared policy memory.", `const recall = await support.recall("refund eligibility", { memory: "both" });\nconst reply = await support.invoke(customerMessage);`, ["Customer conversations remain session-scoped.", "Policies live in shared fleet memory.", "Lifecycle controls remove outdated policy facts."]),
  examplePage("personal-assistant", "Personal assistant", "An assistant that remembers preferences, routines, and open tasks across sessions.", `await agent.ingest("Preference: morning meetings after 9:30.");\nconst context = await agent.recall("Schedule a planning call");`, ["Atomic facts represent stable preferences.", "Tasks remain distinct from factual memories.", "Relevant memory is grafted into new sessions."]),
  examplePage("journal-memory", "Journal memory", "A private journal workflow that extracts themes without replaying every entry.", `await agent.ingest(entry, { tags: ["journal", "date:2026-07-21"] });\nconst themes = await agent.recall("recurring sources of energy");`, ["Each entry retains date and source tags.", "Topic nodes capture themes.", "Forgetting supports user-directed memory control."]),
  examplePage("research-assistant", "Research assistant", "A research workflow that remembers sources, claims, questions, and evolving conclusions.", `await agent.ingest(paperText, { tags: ["source:paper-42"] });\nconst evidence = await agent.recall("evidence about retrieval quality", { limit: 12 });`, ["Source tags preserve provenance.", "Questions and references remain separate memory types.", "Conflicts expose competing claims instead of silently overwriting them."]),
  examplePage("multi-agent-memory", "Multi-agent memory", "A fleet of specialized workers that shares selected knowledge.", `const fleet = new MemoGrafterFleet(config, { id: "research-fleet" });\nconst scout = await fleet.createWorker({ color: "scout" });\nconst writer = await fleet.createWorker({ color: "writer" });`, ["Workers retain local task context.", "A synthetic fleet session stores shared facts.", "The conductor coordinates selective transfer with provenance."]),

  advancedPage("architecture", "Architecture", "Understand the runtime layers and their responsibilities.", [
{
  "title": "Runtime responsibilities",
  "body": [
    "MemoGrafterAgent owns conversational invocation; MemoGrafter coordinates application-owned sessions. Ingestion constructs graph memory, retrieval selects current context, and explicit grafting assembles or copies selected memory. GraphStore isolates persistence. CLI and Studio use provider-independent storage, schema, and preview entry points."
  ],
  "diagram": "memory-hierarchy"
},
{
  "title": "Durable preparation and commit",
  "body": [
    "Built-in durable ingestion accepts messages with a run identity before provider work. Preparation reads the accepted range, segments it, validates extracted provenance and quality, and assigns episodes to stable topics. Commit locks the session and run, verifies the cursor, and atomically stores required graph records, canonical decisions, evidence, lifecycle edges, cursor, and completion."
  ],
  "diagram": "durable-ingestion-flow"
},
{
  "title": "Read path and invocation",
  "body": [
    "Retrieval searches memory, episode, and stable-topic embeddings. Adaptive selection applies lifecycle and scope filters and allocates bounded fact and episode context. Query contextualization can rewrite an underspecified query using recent messages. Invocation planning composes pins, recalled facts, episode context, and recent raw history before the provider call."
  ]
},
{
  "title": "Independent boundaries",
  "body": [
    "Quality admission and decay default to observation. Required database/provider work fails its operation; optional cache or enrichment failures report warnings. Cluster classification is disabled by default, runs after commit, and cannot change retrieval ranking or prompts. Crawler passes annotate lifecycle rather than deleting evidence."
  ],
  "links": [
    {
      "label": "Memory pipeline",
      "href": "/docs/advanced/memory-pipeline"
    },
    {
      "label": "Retrieval pipeline",
      "href": "/docs/advanced/retrieval-pipeline"
    },
    {
      "label": "Graph Store",
      "href": "/docs/advanced/graph-store"
    }
  ]
}
]),
  advancedPage("memory-pipeline", "Memory Pipeline", "Follow data from raw input to durable graph memory.", [
{
  "title": "Accept and prepare",
  "body": [
    "Durable completed exchanges allocate immutable absolute message indexes with a run record before provider work. Workers load accepted messages from PostgreSQL. Preparation is graph-write free and validates speaker/source references before quality admission and memory embedding."
  ],
  "diagram": "durable-ingestion-flow"
},
{
  "title": "Topic and memory construction",
  "body": [
    "Drift detection produces segments. Each segment has an episode; TopicAssigner reuses a sufficiently similar active stable topic or creates one. Canonical reconciliation turns repeated observations into evidence, with conflict or supersession decisions committed alongside required graph state."
  ]
},
{
  "title": "Atomic commit and best effort",
  "body": [
    "Under session/run locks, commit verifies the expected cursor, writes required segments, episodes, topics, canonical memories and evidence, advances the cursor, and completes the run. Optional semantic enrichment, telemetry, and post-commit clustering can complete with warnings. Compatibility custom-store paths have different capabilities."
  ],
  "links": [
    {
      "label": "Durable ingestion",
      "href": "/docs/guides/durable-ingestion"
    },
    {
      "label": "Canonical memories",
      "href": "/docs/concepts/canonical-memory"
    },
    {
      "label": "Memory quality",
      "href": "/docs/concepts/memory-quality"
    }
  ]
}
]),
  advancedPage("retrieval-pipeline", "Retrieval Pipeline", "Understand semantic search, lifecycle filters, ranking, and prompt assembly.", [
{
  "title": "Candidate generation",
  "body": [
    "Optionally contextualize the query from bounded recent messages, then create the retrieval embedding. Search memory, stable-topic, and episode vectors. Topic-only matches can load bounded active child memories. Apply session/tag scope and lifecycle filtering."
  ]
},
{
  "title": "Ranking and selection",
  "body": [
    "Semantic similarity determines rank, with evidence quality only breaking ties. Adaptive topic selection uses maxTopics, relativeScoreFloor, and scoreGapThreshold; fact and episode budgets remain separate. minSimilarity no longer cuts off recall candidate generation."
  ]
},
{
  "title": "Context and metadata",
  "body": [
    "context() bypasses recall caching and prepends pinned topics under their separate budget. Episode summaries form their own prompt block. Cluster metadata is hydrated for selected topic/session pairs after selection, including episode-only references; it changes neither cache identity nor prompts."
  ]
},
{
  "title": "Cache and degraded results",
  "body": [
    "Optional recall caching stores candidates, not final assembled prompts. Canonical reinforcement, lifecycle changes, and quality updates participate in revision hashes; quality candidates use the candidates-v3-quality namespace. Cache failures can return degraded results with warnings; required storage or embedder failures reject."
  ],
  "links": [
    {
      "label": "Retrieval tuning",
      "href": "/docs/advanced/retrieval-tuning"
    },
    {
      "label": "Errors & readiness",
      "href": "/docs/guides/errors-and-readiness"
    }
  ]
}
]),
  advancedPage("graph-store", "Graph Store", "Implement or operate the persistence boundary behind MemoGrafter.", [{ title: "Responsibilities", bullets: ["Message buffers and ingest cursors.", "Topic, memory, and edge persistence.", "Vector search and graph traversal.", "Lifecycle mutations and graft provenance.", "Fleet metadata and cleanup."] }, { title: "Built-in store", body: ["PostgresGraphStore uses PostgreSQL and pgvector. Schema changes should remain compatible with CLI-managed `mg_*` migrations."] },
{
  "title": "Optional durable and domain capabilities",
  "body": [
    "The built-in PostgreSQL store supports atomic run acceptance, transitions and leases, prepared graph commits, reconciliation inspection, immutable evidence, episodes, and cluster metadata. Custom stores can omit optional capabilities, but analyzeDetailed requires durable support and clustering emits warnings when enabled without support.",
    "Canonical reconciliation must preserve evidence idempotency and lifecycle edges. Domain writes must serialize within the session and recheck both topic revision and catalog digest; creation and membership must be atomic. Provider calls run outside the transaction."
  ],
  "links": [
    {
      "label": "GraphStore contract",
      "href": "/docs/api-reference/types/graph-store"
    },
    {
      "label": "Durable ingestion",
      "href": "/docs/guides/durable-ingestion"
    }
  ]
}
]),
  advancedPage("performance", "Performance", "Tune latency, model usage, retrieval size, and ingestion throughput.", [{ title: "Highest-impact controls", bullets: ["Bound recall with `limit` and `tokenBudget`.", "Move ingestion to queue mode when it affects response latency.", "Cache safe recall workloads with explicit invalidation expectations.", "Batch embeddings where the adapter supports it."] }, { title: "Measure", bullets: ["Invoke latency and first-token time.", "Ingestion lag and queue depth.", "Embedding and completion usage.", "Recall precision, empty-result rate, and prompt size."] }]),
  advancedPage("scaling", "Scaling", "Scale memory workloads across workers, sessions, and databases.", [{ title: "Application scaling", bullets: ["Use stable globally unique session identifiers.", "Keep workers stateless outside shared stores.", "Use Redis-backed queue mode for distributed ingestion.", "Apply database pooling and pgvector index maintenance."] }, { title: "Isolation", body: ["Enforce tenant and user authorization in the application layer before resolving any session or memory identifier."] }]),
  advancedPage("prompt-design", "Prompt Design", "Inject memory clearly without allowing recalled text to override application policy.", [{ title: "Principles", bullets: ["Label recalled content as memory, not instructions.", "Keep system policy separate and higher priority.", "Include provenance when it helps the model resolve ambiguity.", "Use token budgets and relevance thresholds to reduce distraction."] }, { title: "Validation", body: ["Test conflicting, stale, malicious, empty, and oversized memory alongside ordinary happy-path conversations."] }]),
  advancedPage("custom-pipelines", "Custom Pipelines", "Replace or extend ingestion, retrieval, grafting, and maintenance behavior.", [{ title: "Extension points", bullets: ["Custom adapters change model and embedding providers.", "GraphStore changes persistence.", "Pipeline configuration changes drift, expansion, ranking, and injection.", "Maintenance passes annotate conflict, supersession, and decay."] }, { title: "Design boundary", body: ["Keep lifecycle filtering and provenance intact when replacing a stage so custom behavior does not reactivate forgotten memory or obscure its source."] }]),
];
