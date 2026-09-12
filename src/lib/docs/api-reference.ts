import contracts from "./contracts.json";
import { currentApiDefinitions, currentErrorPage } from "./current-api";
import type { DocNavIcon, DocNavNode, DocPage, DocRelatedLink, DocSection } from "./types";

export type ApiDefinition = {
  family: string;
  subgroup?: string;
  slug: string;
  label: string;
  signature: string;
  purpose: string;
  example: string;
  icon?: DocNavIcon;
  parameters?: string[];
  returns?: string;
  notes?: string[];
  related?: DocRelatedLink[];
  useWhen?: string[];
  behavior?: string[];
  sideEffects?: string[];
  errors?: string[];
  examples?: { label: string; code: string }[];
};

function toSlug(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const api = (
  family: string,
  slug: string,
  label: string,
  signature: string,
  purpose: string,
  example: string,
  extra: Partial<ApiDefinition> = {},
): ApiDefinition => ({ family, slug, label, signature, purpose, example, ...extra });

const method = (
  family: string,
  _owner: string,
  name: string,
  signature: string,
  purpose: string,
  example: string,
  extra: Partial<ApiDefinition> = {},
) => api(family, name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), `${name}()`, signature, purpose, example, { icon: "braces", ...extra });

const definitions: ApiDefinition[] = [
  api("MemoGrafterAgent", "index", "Constructor", "new MemoGrafterAgent(config: MemoGrafterConfig): MemoGrafterAgent", "Create a batteries-included, single-session conversational memory agent.", `const agent = new MemoGrafterAgent({ db, llm, embedder });`, { icon: "box", parameters: ["`config`: database, LLM, embedder, and optional memory settings."], returns: "A new `MemoGrafterAgent` instance." }),
  api("MemoGrafterAgent", "create", "MemoGrafterAgent.create()", "MemoGrafterAgent.create(config: MemoGrafterConfigSource, overrides?: MemoGrafterConfigOverrides): Promise<MemoGrafterAgent>", "Resolve configuration, construct a MemoGrafterAgent, initialize its storage, and return the ready-to-use agent.", `import config from "./memo-grafter/mg.config.js";\n\nconst agent = await MemoGrafterAgent.create(config, {\n  inject: { recallLimit: 10 },\n});`, { subgroup: "Initialization", icon: "play", useWhen: ["Use this factory when configuration lives in an explicitly imported `mg.config` file or factory.", "Use the constructor plus `initialize()` when your application already has a fully resolved `MemoGrafterConfig` and wants to control initialization separately."], behavior: ["Evaluates the supplied object or configuration factory.", "Merges runtime overrides and validates the database, LLM, and embedder requirements.", "Constructs `MemoGrafterAgent`, calls `initialize()`, and resolves only when the agent is ready."], errors: ["Rejects when the config factory throws, required runtime dependencies are missing, or storage initialization fails."], notes: ["Automatic config discovery is not performed.", "Nested settings are merged field by field; adapter overrides replace configured adapters. `queue: false` and `cache: false` disable those services."], examples: [{ label: "Equivalent constructor flow", code: `const resolved = await resolveMemoGrafterConfig(config, overrides);\nconst agent = new MemoGrafterAgent(resolved);\nawait agent.initialize();` }] }),
  api("Configuration", "define-config", "defineConfig()", "defineConfig(config: MemoGrafterProjectConfig): MemoGrafterProjectConfig\ndefineConfig(config: () => MemoGrafterProjectConfig | Promise<MemoGrafterProjectConfig>): MemoGrafterConfigSource", "Define project configuration with TypeScript inference while allowing runtime dependencies to be supplied later.", `export default defineConfig(() => ({\n  db: {},\n  llm: new OpenAILLMAdapter(),\n  embedder: new OpenAIEmbedAdapter(),\n  inject: { recallLimit: 8 },\n}));`, { icon: "settings", notes: ["This helper does not discover, load, initialize, or validate configuration. Import the result explicitly."] }),
  api("Configuration", "resolve-memo-grafter-config", "resolveMemoGrafterConfig()", "resolveMemoGrafterConfig(source: MemoGrafterConfigSource, overrides?: MemoGrafterConfigOverrides): Promise<MemoGrafterConfig>", "Evaluate a project config source, merge runtime overrides, and validate the fields required at runtime.", `const resolved = await resolveMemoGrafterConfig(config, {\n  db: { connectionString: process.env.DATABASE_URL },\n  queue: false,\n});\nconst memo = new MemoGrafter(resolved);`, { icon: "settings", notes: ["Database, drift, graph, and injection fields are merged by field. Adapters and the system prompt replace configured values.", "Resolution rejects missing or invalid database, LLM, or embedder settings."] }),
  method("MemoGrafterAgent", "agent", "initialize", "initialize(): Promise<void>", "Verify that storage is ready for the agent.", `await agent.initialize();`),
  method("MemoGrafterAgent", "agent", "close", "close(): Promise<void>", "Release database, Redis, and queue resources owned by the agent.", `await agent.close();`),
  method("MemoGrafterAgent", "agent", "invoke", "invoke(userMessage: string): Promise<string>", "Recall memory, call the configured LLM, update history, and ingest the exchange.", `const answer = await agent.invoke("What city did I move to?");`, { parameters: ["`userMessage`: the new user turn."], returns: "A promise containing the assistant response." }),
  method("MemoGrafterAgent", "agent", "getHistory", "getHistory(): Message[]", "Read the agent's in-memory conversation.", `const messages = agent.getHistory();`, { returns: "The ordered in-memory `Message[]`." }),
  method("MemoGrafterAgent", "agent", "getSessionId", "getSessionId(): string", "Read the stable session identifier used by the agent.", `const sessionId = agent.getSessionId();`, { returns: "The current session ID." }),
  method("MemoGrafterAgent", "agent", "clearSession", "clearSession(): Promise<void>", "Clear local history and stored memory for the current session.", `await agent.clearSession();`, { notes: ["This is an explicit destructive reset of the current session."] }),
  method("MemoGrafterAgent", "agent", "ingestText", "ingestText(text: string, options?: IngestTextOptions): Promise<void>", "Ingest raw text into the current session.", `await agent.ingestText(releaseNotes, { label: "Release notes" });`),
  method("MemoGrafterAgent", "agent", "remember", "remember(text: string, options?: RememberOptions): Promise<void>", "Store an explicit natural-language fact or preference.", `await agent.remember("My preferred editor is Neovim.");`),
  method("MemoGrafterAgent", "agent", "recall", "recall(query: string, options?: RetrieverConfig): Promise<RetrievalResult>", "Retrieve semantically relevant memories from the current session.", `const result = await agent.recall("deployment preferences", { limit: 5 });`),
  method("MemoGrafterAgent", "agent", "graft", "graft(topicIds?: string[]): Promise<InjectionResult>", "Assemble prompt context from explicitly selected topics.", `const injection = await agent.graft([topicId]);`),
  method("MemoGrafterAgent", "agent", "graftByRelevance", "graftByRelevance(query: string, options?: GraftByRelevanceOptions): Promise<InjectionResult>", "Select topics semantically and assemble a graft prompt.", `const graft = await agent.graftByRelevance("travel plans", { topK: 3 });`),
  method("MemoGrafterAgent", "agent", "ingestGraftedNodes", "ingestGraftedNodes(nodes: TopicNode[]): Promise<TopicNode[]>", "Copy supplied topic nodes and their active memories into the current session.", `const copied = await agent.ingestGraftedNodes(graft.nodes);`),
  method("MemoGrafterAgent", "agent", "absorbFromAgent", "absorbFromAgent(sourceAgent: MemoGrafterAgent, options?: AbsorbFromAgentOptions): Promise<TopicNode[]>", "Select and copy memory from another agent.", `await writer.absorbFromAgent(researcher, { prompt: "facts about PostgreSQL" });`),
  method("MemoGrafterAgent", "agent", "getActiveNodes", "getActiveNodes(options?: TagFilterOptions): Promise<TopicNode[]>", "Read topic objects for the agent session, or tagged topics across sessions when explicitly requested.", `const topics = await agent.getActiveNodes({\n  tags: ["project:a"],\n  tagMode: "all",\n});\n\nfor (const topic of topics) {\n  console.log(topic.id, topic.label, topic.summary);\n}`, { returns: "A `TopicNode[]` ordered by session ID, topic order, and creation time. An empty array means that no topic matched. Each object includes its ID, label, summary, source message range, drift score, tags, lifecycle state, fleet metadata, and creation time.", notes: ["This operation is read-only and waits for the agent's local pending-ingest chain before reading.", "With BullMQ queue mode, waiting only guarantees that submission settled; the worker may not have persisted newly queued topics yet.", "Suppressed topics are excluded unless `includeSuppressed` is `true`.", "`scope: \"tagged\"` with non-empty `tags` searches matching topics across sessions. `sessionIds` and `includeForgotten` do not affect this topic-node read."] }),
  method("MemoGrafterAgent", "agent", "getActiveSegments", "getActiveSegments(): Promise<TopicSegment[]>", "Read active topic segments for the current session.", `const segments = await agent.getActiveSegments();`),
  method("MemoGrafterAgent", "agent", "getGraphSnapshot", "getGraphSnapshot(): Promise<GraphSnapshot>", "Read a complete inspection snapshot of the current graph.", `const snapshot = await agent.getGraphSnapshot();`),
  method("MemoGrafterAgent", "agent", "getGraftRegistry", "getGraftRegistry(): Promise<GraftRegistryEntry[]>", "Inspect graft provenance registered in the current session.", `const grafts = await agent.getGraftRegistry();`),
  method("MemoGrafterAgent", "agent", "setSessionTags", "setSessionTags(tags: string[]): Promise<void>", "Replace normalized tags for the current session.", `await agent.setSessionTags(["tenant:acme", "support"]);`),
  method("MemoGrafterAgent", "agent", "getSessionTags", "getSessionTags(): string[]", "Read normalized tags for the current session.", `const tags = agent.getSessionTags();`),
  method("MemoGrafterAgent", "agent", "forget", "forget(memoryId: string): Promise<boolean>", "Soft-forget one memory.", `const changed = await agent.forget(memoryId);`, { returns: "`true` when a row changed; otherwise `false`." }),
  method("MemoGrafterAgent", "agent", "forgetMany", "forgetMany(memoryIds: string[]): Promise<number>", "Soft-forget several memories.", `const changed = await agent.forgetMany(memoryIds);`, { returns: "The number of changed memory rows." }),
  method("MemoGrafterAgent", "agent", "suppressTopic", "suppressTopic(topicId: string): Promise<boolean>", "Hide a topic from active memory operations.", `await agent.suppressTopic(topicId);`),
  method("MemoGrafterAgent", "agent", "restoreTopic", "restoreTopic(topicId: string): Promise<boolean>", "Restore a suppressed topic to active memory operations.", `await agent.restoreTopic(topicId);`),
  method("MemoGrafterAgent", "agent", "getMemoryHistory", "getMemoryHistory(memoryId: string): Promise<MemoryHistoryResult>\ngetMemoryHistory(subject: string, predicate: string): Promise<MemoryHistoryResult>", "Inspect the lineage of a memory ID or fact key in the agent's current session.", `const history = await agent.getMemoryHistory("user", "location");`),
  method("MemoGrafterAgent", "agent", "getMemoryDiff", "getMemoryDiff(fromMemoryId: string, toMemoryId: string): Promise<MemoryDiff>", "Compare two memory versions.", `const diff = await agent.getMemoryDiff(oldId, newId);`),
  method("MemoGrafterAgent", "agent", "removeGraft", "removeGraft(nodeId: string): Promise<void>", "Remove a registered graft node from the current session.", `await agent.removeGraft(nodeId);`),

  api("MemoGrafter", "index", "Constructor", "new MemoGrafter(config: MemoGrafterConfig): MemoGrafter", "Create the session-oriented core API.", `const memo = new MemoGrafter({ db, llm, embedder });`, { icon: "box" }),
  method("MemoGrafter", "memo", "initialize", "initialize(): Promise<void>", "Verify core storage before use.", `await memo.initialize();`),
  method("MemoGrafter", "memo", "close", "close(): Promise<void>", "Release resources owned by the core instance.", `await memo.close();`),
  method("MemoGrafter", "memo", "ingest", "ingest(messages: Message[], sessionId: string, options?: IngestOptions): Promise<TopicNode[]>", "Ingest messages inline or submit them through the configured queue.", `const nodes = await memo.ingest(messages, "user-42", { tags: ["profile"] });`, { returns: "Newly created `TopicNode[]` during inline ingestion. With queue mode, this returns an empty array after accepting the job; use `ingestNow()` when the graph must be available immediately.", notes: ["Ingestion is incremental and processes only the suffix after the stored ingest cursor."] }),
  method("MemoGrafter", "memo", "ingestNow", "ingestNow(messages: Message[], sessionId: string, options?: IngestOptions): Promise<TopicNode[]>", "Force immediate conversation ingestion.", `const nodes = await memo.ingestNow(messages, "user-42");`),
  method("MemoGrafter", "memo", "enqueueIngest", "enqueueIngest(messages: Message[], sessionId: string, options?: IngestOptions): Promise<void>", "Submit conversation ingestion to BullMQ.", `await memo.enqueueIngest(messages, "user-42");`),
  method("MemoGrafter", "memo", "enqueueIncrementalIngest", "enqueueIncrementalIngest(messages: Message[], sessionId: string, startIndex: number, options?: IngestOptions): Promise<void>", "Submit an indexed conversation delta without copying the complete session history into Redis.", `await memo.enqueueIncrementalIngest(newMessages, "user-42", previousMessageCount);`, { notes: ["This is primarily the path used internally by `MemoGrafterAgent`.", "The worker skips or trims completed ranges and rejects gaps without advancing the ingest cursor.", "Without queue configuration the delta is processed synchronously."] }),
  method("MemoGrafter", "memo", "ingestText", "ingestText(text: string, sessionId: string, options?: IngestTextOptions & IngestOptions): Promise<TopicNode[]>", "Convert raw text into topic and memory nodes, inline or through the configured queue.", `const nodes = await memo.ingestText(note, "project-a", { label: "Roadmap" });`, { returns: "Newly created `TopicNode[]` during inline ingestion, or an empty array after queue submission.", notes: ["Text is chunked internally and may produce multiple topics.", "`replace: true` clears the existing session graph before processing the text."] }),
  method("MemoGrafter", "memo", "enqueueTextIngest", "enqueueTextIngest(text: string, sessionId: string, options?: IngestTextOptions & IngestOptions): Promise<void>", "Submit raw-text ingestion to the queue.", `await memo.enqueueTextIngest(documentText, "project-a");`),
  method("MemoGrafter", "memo", "inject", "inject(sessionId: string, topicIds: string[]): Promise<InjectionResult>", "Assemble prompt context from explicit topic IDs.", `const context = await memo.inject("session-1", topicIds);`),
  method("MemoGrafter", "memo", "graftByRelevance", "graftByRelevance(sessionId: string, query: string, options?: GraftByRelevanceOptions): Promise<InjectionResult>", "Select session topics by semantic relevance.", `const graft = await memo.graftByRelevance("session-1", "travel plans");`),
  method("MemoGrafter", "memo", "ingestGraftedNodes", "ingestGraftedNodes(nodes: TopicNode[], targetSessionId: string): Promise<TopicNode[]>", "Copy supplied nodes into a target session.", `await memo.ingestGraftedNodes(nodes, "target");`),
  method("MemoGrafter", "memo", "selectNodesForAbsorb", "selectNodesForAbsorb(sourceSessionId: string, options: AbsorbFromAgentOptions): Promise<TopicNode[]>", "Select source nodes before absorption.", `const selected = await memo.selectNodesForAbsorb("source", { prompt: "billing" });`),
  method("MemoGrafter", "memo", "absorbNodes", "absorbNodes(nodes: TopicNode[], targetSessionId: string): Promise<TopicNode[]>", "Copy selected nodes into a target session.", `await memo.absorbNodes(selected, "target");`),
  method("MemoGrafter", "memo", "getTopics", "getTopics(sessionId: string, options?: TagFilterOptions): Promise<{ nodes: TopicNode[]; segments: TopicSegment[] }>", "Read topics and segments for a session.", `const { nodes, segments } = await memo.getTopics("session-1");`),
  method("MemoGrafter", "memo", "createFleet", "createFleet(options?: MemoGrafterFleetOptions): MemoGrafterFleet", "Create a fleet backed by this core instance.", `const fleet = memo.createFleet({ name: "Support" });`),
  ...["forget", "forgetMany", "suppressTopic", "restoreTopic", "getMemoryHistory", "getMemoryDiff"].map((name) => api("MemoGrafter", name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`), `${name}()`, name === "forget" ? "forget(memoryId: string): Promise<boolean>" : name === "forgetMany" ? "forgetMany(memoryIds: string[]): Promise<number>" : name === "suppressTopic" || name === "restoreTopic" ? `${name}(topicId: string): Promise<boolean>` : name === "getMemoryDiff" ? "getMemoryDiff(fromMemoryId: string, toMemoryId: string): Promise<MemoryDiff>" : "getMemoryHistory(memoryId: string, options?: MemoryHistoryOptions): Promise<MemoryHistoryResult>", `Use ${name} with an application-managed session scope.`, `const result = await memo.${name}(/* identifiers and options */);`, { icon: "braces" })),
];

const pipelineDefinitions = [
  ["IngestPipeline", "new IngestPipeline(store, llm, embedder, config)", "Create a low-level conversation and text ingestion pipeline.", `const pipeline = new IngestPipeline(store, llm, embedder, driftConfig);`],
  ["IngestPipeline.run", "run(messages: Message[], sessionId: string, options?: IngestPipelineOptions): Promise<TopicNode[]>", "Run conversation ingestion.", `const nodes = await pipeline.run(messages, "session-1");`],
  ["IngestPipeline.runText", "runText(text: string, sessionId: string, options?: IngestPipelineOptions): Promise<TopicNode[]>", "Run raw-text ingestion.", `const nodes = await pipeline.runText(text, "session-1");`],
  ["RetrieverPipeline", "new RetrieverPipeline(store, embedder, config, cacheRedis?)", "Create a low-level memory retrieval pipeline.", `const retriever = new RetrieverPipeline(store, embedder, { limit: 5 });`],
  ["RetrieverPipeline.run", "run(query: string, sessionId: string): Promise<RetrievalResult>", "Retrieve and assemble prompt-ready facts.", `const result = await retriever.run("billing policy", "session-1");`],
  ["GrafterPipeline", "new GrafterPipeline(store, config)", "Create a topic-context assembly pipeline.", `const grafter = new GrafterPipeline(store, config);`],
  ["GrafterPipeline.run", "run(sessionId: string, topicIds: string[], options?): Promise<InjectionResult>", "Assemble graft context for selected topics.", `const result = await grafter.run("session-1", topicIds);`],
  ["GraftRelevancePipeline", "new GraftRelevancePipeline(store, embedder, grafter, config)", "Create a semantic topic-selection pipeline.", `const pipeline = new GraftRelevancePipeline(store, embedder, grafter, config);`],
  ["GraftRelevancePipeline.run", "run(sessionId: string, query: string, options?): Promise<InjectionResult>", "Select relevant topics and assemble graft context.", `const result = await pipeline.run("session-1", "billing");`],
] as const;

for (const [name, signature, purpose, example] of pipelineDefinitions) {
  definitions.push(api("Pipelines", toSlug(name.replace(/\./g, "-")), name.includes(".") ? `${name.split(".")[1]}()` : name, signature, purpose, example, { subgroup: name.split(".")[0], icon: "workflow" }));
}

const fleetApis = [
  ["MemoGrafterFleet", "index", "Constructor", "new MemoGrafterFleet(configOrCore: MemoGrafterConfig | MemoGrafter, options?: MemoGrafterFleetOptions)", "Create a color-identified worker fleet.", `const fleet = new MemoGrafterFleet(config, { name: "Support" });`],
  ["MemoGrafterFleet", "initialize", "initialize()", "initialize(): Promise<void>", "Initialize fleet storage and metadata.", `await fleet.initialize();`],
  ["MemoGrafterFleet", "close", "close()", "close(): Promise<void>", "Close resources owned by the fleet.", `await fleet.close();`],
  ["MemoGrafterFleet", "get-worker", "getWorker()", "getWorker(color: string): WorkerAgent | undefined", "Find a worker by color.", `const blue = fleet.getWorker("blue");`],
  ["MemoGrafterFleet", "get-graph", "getGraph()", "getGraph(): Promise<FleetGraph>", "Read fleet topology.", `const graph = await fleet.getGraph();`],
  ["MemoGrafterFleet", "get-shared-session-id", "getSharedSessionId()", "getSharedSessionId(): string", "Read the fleet shared-memory session ID.", `const id = fleet.getSharedSessionId();`],
  ["MemoGrafterFleet", "create-worker", "createWorker()", "createWorker(config: WorkerAgentConfig): Promise<WorkerAgent>", "Create a fleet worker.", `const blue = await fleet.createWorker({ color: "blue", memory: "both" });`],
  ["MemoGrafterFleet", "create-conductor", "createConductor()", "createConductor(): ConductorAgent", "Create a cross-worker memory conductor.", `const conductor = fleet.createConductor();`],
  ["MemoGrafterFleet", "ingest-to-fleet", "ingestToFleet()", "ingestToFleet(text: string, options?: FleetMemoryOptions): Promise<TopicNode[]>", "Ingest shared fleet memory.", `await fleet.ingestToFleet("Refunds are allowed for 30 days.");`],
  ["MemoGrafterFleet", "recall-from-fleet", "recallFromFleet()", "recallFromFleet(query: string, options?: FleetRetrievalOptions): Promise<RetrievalResult>", "Recall from shared fleet memory.", `const result = await fleet.recallFromFleet("refund window");`],
  ["MemoGrafterFleet", "get-shared-memory", "getSharedMemory()", "getSharedMemory(): Promise<SharedMemorySnapshot>", "Inspect shared fleet memory.", `const shared = await fleet.getSharedMemory();`],
  ["WorkerAgent", "get-agent-id", "getAgentId()", "getAgentId(): string", "Read the worker agent ID.", `const id = worker.getAgentId();`],
  ["WorkerAgent", "get-session-id", "getSessionId()", "getSessionId(): string", "Read the worker session ID.", `const id = worker.getSessionId();`],
  ["WorkerAgent", "get-color", "getColor()", "getColor(): string", "Read the worker color.", `const color = worker.getColor();`],
  ["WorkerAgent", "invoke", "invoke()", "invoke(userMessage: string): Promise<string>", "Run a fleet-aware conversation turn.", `const answer = await worker.invoke("Summarize the refund rule.");`],
  ["WorkerAgent", "get-history", "getHistory()", "getHistory(): Message[]", "Read worker conversation history.", `const history = worker.getHistory();`],
  ["WorkerAgent", "get-active-nodes", "getActiveNodes()", "getActiveNodes(): Promise<TopicNode[]>", "Read worker topics.", `const nodes = await worker.getActiveNodes();`],
  ["WorkerAgent", "get-active-segments", "getActiveSegments()", "getActiveSegments(): Promise<TopicSegment[]>", "Read worker segments.", `const segments = await worker.getActiveSegments();`],
  ["WorkerAgent", "graft", "graft()", "graft(topicIds?: string[]): Promise<InjectionResult>", "Assemble worker graft context.", `const graft = await worker.graft(topicIds);`],
  ["WorkerAgent", "graft-by-relevance", "graftByRelevance()", "graftByRelevance(query: string, options?: FleetGraftByRelevanceOptions): Promise<InjectionResult>", "Build fleet-aware relevant graft context.", `const graft = await worker.graftByRelevance("billing");`],
  ["WorkerAgent", "recall", "recall()", "recall(query: string, options?: FleetRetrievalOptions): Promise<RetrievalResult>", "Recall with the worker memory mode.", `const result = await worker.recall("refund policy");`],
  ["WorkerAgent", "ingest-grafted-nodes", "ingestGraftedNodes()", "ingestGraftedNodes(nodes: TopicNode[]): Promise<TopicNode[]>", "Copy grafted nodes into a worker.", `await worker.ingestGraftedNodes(nodes);`],
  ["WorkerAgent", "absorb-from-worker", "absorbFromWorker()", "absorbFromWorker(sourceWorker: WorkerAgent, options?: FleetAbsorbOptions): Promise<TopicNode[]>", "Absorb selected memory from another worker.", `await blue.absorbFromWorker(red, { prompt: "billing" });`],
  ["WorkerAgent", "tag-nodes", "tagNodes()", "tagNodes(): Promise<void>", "Apply fleet metadata to existing worker nodes.", `await worker.tagNodes();`],
  ["ConductorAgent", "graft-color-into-agent", "graftColorIntoAgent()", "graftColorIntoAgent(sourceColor: string, targetAgent: WorkerAgent, options?: ConductorGraftOptions): Promise<TopicNode[]>", "Transfer memory from one worker color.", `await conductor.graftColorIntoAgent("red", blue, { limit: 4 });`],
  ["ConductorAgent", "graft-by-prompt", "graftByPrompt()", "graftByPrompt(prompt: string, targetAgent: WorkerAgent, options?): Promise<TopicNode[]>", "Select fleet memory by prompt and transfer it.", `await conductor.graftByPrompt("billing context", blue);`],
  ["ConductorAgent", "get-worker", "getWorker()", "getWorker(color: string): WorkerAgent | undefined", "Find a worker through the conductor.", `const worker = conductor.getWorker("blue");`],
] as const;
for (const [subgroup, slug, label, signature, purpose, example] of fleetApis) definitions.push(api("Fleet Memory", `${toSlug(subgroup)}-${slug}`, label, signature, purpose, example, { subgroup, icon: "users" }));

const maintenanceApis = [
  ["memo-grafter-crawler", "MemoGrafterCrawler", "new MemoGrafterCrawler(config?: CrawlerConfig): MemoGrafterCrawler", "Create a graph-maintenance crawler.", `const crawler = new MemoGrafterCrawler({ store: memo.store });`],
  ["crawler-start", "start()", "start(): void", "Start scheduled maintenance.", `crawler.start();`],
  ["crawler-stop", "stop()", "stop(): void", "Stop scheduled maintenance.", `crawler.stop();`],
  ["crawler-run-once", "runOnce()", "runOnce(): Promise<CrawlerReport>", "Run one maintenance cycle.", `const report = await crawler.runOnce();`],
  ["conflict-detection-pass", "ConflictDetectionPass", "new ConflictDetectionPass()", "Create the built-in conflict pass.", `const pass = new ConflictDetectionPass();`],
  ["conflict-detection-run", "run()", "run(context: CrawlerPassContext): Promise<CrawlerPassResult>", "Run conflict detection directly.", `const result = await pass.run(context);`],
  ["versioning-pass", "VersioningPass", "new VersioningPass()", "Create the built-in versioning pass.", `const pass = new VersioningPass();`],
  ["versioning-run", "run()", "run(context: CrawlerPassContext): Promise<CrawlerPassResult>", "Run versioning directly.", `const result = await pass.run(context);`],
  ["decay-scoring-pass", "DecayScoringPass", "new DecayScoringPass(options?: DecayScoringPassOptions)", "Create the built-in decay pass.", `const pass = new DecayScoringPass({ halfLifeDays: 90 });`],
  ["decay-scoring-run", "run()", "run(context: CrawlerPassContext): Promise<CrawlerPassResult>", "Run decay scoring directly.", `const result = await pass.run(context);`],
] as const;
for (const [slug, label, signature, purpose, example] of maintenanceApis) definitions.push(api("Maintenance", slug, label, signature, purpose, example, { subgroup: label.includes("Crawler") || slug.startsWith("crawler") ? "MemoGrafterCrawler" : slug.includes("conflict") ? "ConflictDetectionPass" : slug.includes("versioning") ? "VersioningPass" : "DecayScoringPass", icon: "refresh" }));

const adapterApis = [
  ["openai-llm-adapter", "OpenAILLMAdapter", "new OpenAILLMAdapter(model?: string, options?: OpenAILLMAdapterOptions)", `const llm = new OpenAILLMAdapter("gpt-4o-mini", { streaming: true });`],
  ["anthropic-llm-adapter", "AnthropicLLMAdapter", "new AnthropicLLMAdapter(model?: string, maxTokens?: number)", `const llm = new AnthropicLLMAdapter("claude-sonnet-4-20250514");`],
  ["gemini-llm-adapter", "GeminiLLMAdapter", "new GeminiLLMAdapter(model?: string)", `const llm = new GeminiLLMAdapter("gemini-2.5-flash");`],
  ["llm-complete", "complete()", "complete(messages: Message[], system?: string): Promise<string>", `const text = await llm.complete(messages, systemPrompt);`],
  ["openai-embed-adapter", "OpenAIEmbedAdapter", "new OpenAIEmbedAdapter(model?: string)", `const embedder = new OpenAIEmbedAdapter("text-embedding-3-small");`],
  ["gemini-embed-adapter", "GeminiEmbedAdapter", "new GeminiEmbedAdapter(model?: string, outputDimensionality?: number)", `const embedder = new GeminiEmbedAdapter(undefined, 1536);`],
  ["embed", "embed()", "embed(text: string): Promise<number[]>", `const vector = await embedder.embed("memory text");`],
] as const;
const adapterPurpose: Record<string, string> = {
  "openai-llm-adapter": "Adapt an OpenAI chat model to MemoGrafter’s provider-neutral language-model interface.",
  "anthropic-llm-adapter": "Adapt an Anthropic Claude model to MemoGrafter’s provider-neutral language-model interface.",
  "gemini-llm-adapter": "Adapt a Google Gemini model to MemoGrafter’s provider-neutral language-model interface.",
  "llm-complete": "Generate one text response from normalized conversation messages and optional system context.",
  "openai-embed-adapter": "Create vector embeddings through OpenAI while exposing MemoGrafter’s provider-neutral embedding interface.",
  "gemini-embed-adapter": "Create vector embeddings through Gemini with an optional fixed output dimensionality.",
  embed: "Convert text into the numeric vector MemoGrafter uses for semantic topic and memory matching.",
};
for (const [slug, label, signature, example] of adapterApis) definitions.push(api("Provider Adapters", slug, label, signature, adapterPurpose[slug], example, { subgroup: slug.includes("embed") ? "Embedding adapters" : "LLM adapters", icon: "plug" }));

const studioApis = [
  ["create-studio-preview-service", "createStudioPreviewService()", "createStudioPreviewService(store: GraphStore, config: StudioPreviewServiceConfig | null | undefined): StudioPreviewService", `const preview = createStudioPreviewService(store, { embedder });`],
  ["pipeline-studio-preview-service", "PipelineStudioPreviewService", "new PipelineStudioPreviewService(store, embedder, config)", `const preview = new PipelineStudioPreviewService(store, embedder, config);`],
  ["unavailable-studio-preview-service", "UnavailableStudioPreviewService", "new UnavailableStudioPreviewService(reason: string)", `const preview = new UnavailableStudioPreviewService("Embedder missing");`],
  ["get-status", "getStatus()", "getStatus(): StudioPreviewStatus", `const status = preview.getStatus();`],
  ["run", "run()", "run(request: StudioPreviewRequest): Promise<StudioPreviewResult>", `const result = await preview.run({ mode: "recall", sessionId, query });`],
] as const;
for (const [slug, label, signature, example] of studioApis) definitions.push(api("Studio Preview", slug, label, signature, `Use the ${label} Studio preview API.`, example, { icon: "monitor-play", notes: ["This is a package API for local tooling, not an authenticated HTTP service."] }));

const storeMethods = [
  ["index", "Constructor", "new PostgresGraphStore(connectionString: string): PostgresGraphStore"],
  ["initialize", "initialize()", "initialize(): Promise<void>"], ["migrate", "migrate()", "migrate(): Promise<MigrationReport>"], ["verify-schema", "verifySchema()", "verifySchema(): Promise<void>"], ["rebuild-edges-for-session", "rebuildEdgesForSession()", "rebuildEdgesForSession(sessionId: string, semanticTopK?: number, semanticThreshold?: number): Promise<void>"], ["close", "close()", "close(): Promise<void>"],
  ["save-messages", "saveMessages()", "saveMessages(sessionId: string, messages: Message[]): Promise<void>"], ["save-messages-at", "saveMessagesAt()", "saveMessagesAt(sessionId: string, startIndex: number, messages: Message[]): Promise<void>"], ["get-messages-by-session", "getMessagesBySession()", "getMessagesBySession(sessionId: string, startIndex?: number, endIndex?: number): Promise<Message[]>"], ["get-recent-messages-before", "getRecentMessagesBefore()", "getRecentMessagesBefore(sessionId: string, beforeIndex: number, limit: number): Promise<Message[]>"], ["get-buffer-messages", "getBufferMessages()", "getBufferMessages(sessionId: string, start: number, end: number, maxChars?: number): Promise<Message[]>"], ["get-session-ingest-state", "getSessionIngestState()", "getSessionIngestState(sessionId: string): Promise<SessionIngestState | null>"], ["update-session-ingest-state", "updateSessionIngestState()", "updateSessionIngestState(sessionId: string, lastIngestedMessageIndex: number): Promise<void>"],
  ["save-segment", "saveSegment()", "saveSegment(segment: TopicSegment): Promise<TopicSegment>"], ["save-node", "saveNode()", "saveNode(node: TopicNode): Promise<void>"], ["save-edge", "saveEdge()", "saveEdge(edge: TopicEdge): Promise<void>"], ["insert-memories", "insertMemories()", "insertMemories(nodes: MemoryNodeInsert[]): Promise<void>"], ["build-memory-edges", "buildMemoryEdges()", "buildMemoryEdges(topicNodeId: string, sessionId: string, threshold: number): Promise<void>"], ["clear-session", "clearSession()", "clearSession(sessionId: string): Promise<void>"], ["clear-session-graph", "clearSessionGraph()", "clearSessionGraph(sessionId: string): Promise<void>"], ["delete-node", "deleteNode()", "deleteNode(nodeId: string, sessionId?: string): Promise<void>"],
  ["get-topic-node", "getTopicNode()", "getTopicNode(id: string, sessionId?: string): Promise<TopicNode | null>"], ["get-node-by-segment", "getNodeBySegment()", "getNodeBySegment(id: string): Promise<TopicNode | null>"], ["get-nodes-by-session", "getNodesBySession()", "getNodesBySession(sessionId: string, options?: TagFilterOptions): Promise<TopicNode[]>"], ["get-last-topic-node", "getLastTopicNode()", "getLastTopicNode(sessionId: string): Promise<TopicNode | null>"], ["get-segments-by-session", "getSegmentsBySession()", "getSegmentsBySession(sessionId: string): Promise<TopicSegment[]>"], ["get-session-node-count", "getSessionNodeCount()", "getSessionNodeCount(sessionId: string): Promise<number>"], ["get-edges-by-type", "getEdgesByType()", "getEdgesByType(sessionId: string, type: string): Promise<TopicEdge[]>"], ["get-edges-by-session", "getEdgesBySession()", "getEdgesBySession(sessionId: string): Promise<TopicEdge[]>"], ["get-memories-by-segment", "getMemoriesBySegment()", "getMemoriesBySegment(id: string): Promise<MemoryNode[]>"], ["get-memories-by-topic", "getMemoriesByTopic()", "getMemoriesByTopic(id: string): Promise<MemoryNode[]>"], ["get-memories-by-session", "getMemoriesBySession()", "getMemoriesBySession(sessionId: string): Promise<MemoryNode[]>"], ["get-memory-edges-by-session", "getMemoryEdgesBySession()", "getMemoryEdgesBySession(sessionId: string): Promise<MemoryEdge[]>"], ["get-top-k-similar", "getTopKSimilar()", "getTopKSimilar(nodeId: string, embedding: number[], sessionId: string, k: number): Promise<TopicNode[]>"], ["get-similar-nodes", "getSimilarNodes()", "getSimilarNodes(embedding: number[], sessionId: string, options?): Promise<TopicNode[]>"], ["get-similar-nodes-across-sessions", "getSimilarNodesAcrossSessions()", "getSimilarNodesAcrossSessions(embedding: number[], sessionIds: string[], options?): Promise<TopicNode[]>"], ["node-similarity", "nodeSimilarity()", "nodeSimilarity(nodeAId: string, nodeBId: string): Promise<number>"], ["get-neighbours", "getNeighbours()", "getNeighbours(nodeIds: string[], hopDepth: number, sessionId?: string): Promise<TopicNode[]>"], ["get-previous-node", "getPreviousNode()", "getPreviousNode(sessionId: string, topicOrder: number): Promise<TopicNode | null>"],
  ["search-memories", "searchMemories()", "searchMemories(embedding: number[], sessionId: string, limit: number, minSimilarity: number, options?): Promise<Array<MemoryNode & { similarity: number }>>"], ["search-memories-across-sessions", "searchMemoriesAcrossSessions()", "searchMemoriesAcrossSessions(embedding: number[], sessionIds: string[], limit: number, minSimilarity: number, options?): Promise<Array<MemoryNode & { similarity: number }>>"],
  ["list-memory-nodes-for-maintenance", "listMemoryNodesForMaintenance()", "listMemoryNodesForMaintenance(): Promise<MemoryNode[]>"], ["forget-memory", "forgetMemory()", "forgetMemory(id: string): Promise<boolean>"], ["forget-memories", "forgetMemories()", "forgetMemories(ids: string[]): Promise<number>"], ["suppress-topic", "suppressTopic()", "suppressTopic(id: string): Promise<boolean>"], ["restore-topic", "restoreTopic()", "restoreTopic(id: string): Promise<boolean>"], ["mark-memory-nodes-conflicting", "markMemoryNodesConflicting()", "markMemoryNodesConflicting(ids: string[]): Promise<number>"], ["mark-memory-node-superseded", "markMemoryNodeSuperseded()", "markMemoryNodeSuperseded(id: string, supersededBy: string): Promise<boolean>"], ["mark-memory-node-decayed", "markMemoryNodeDecayed()", "markMemoryNodeDecayed(id: string): Promise<boolean>"], ["update-memory-node-quality", "updateMemoryNodeQuality()", "updateMemoryNodeQuality(id: string, quality: MemoryQuality): Promise<boolean>"], ["upsert-memory-edge", "upsertMemoryEdge()", "upsertMemoryEdge(edge: MemoryEdge): Promise<boolean>"], ["get-memory-history-by-id", "getMemoryHistoryById()", "getMemoryHistoryById(id: string, options?: MemoryHistoryOptions): Promise<MemoryHistoryResult>"], ["get-memory-history-by-fact", "getMemoryHistoryByFact()", "getMemoryHistoryByFact(subject: string, predicate: string, options?: MemoryHistoryOptions): Promise<MemoryHistoryResult>"], ["get-memory-diff", "getMemoryDiff()", "getMemoryDiff(fromId: string, toId: string): Promise<MemoryDiff>"],
  ["save-fleet", "saveFleet()", "saveFleet(fleetId: string, name?: string): Promise<void>"], ["save-fleet-agent", "saveFleetAgent()", "saveFleetAgent(agent: FleetAgentRecord): Promise<void>"], ["get-fleet-agents", "getFleetAgents()", "getFleetAgents(fleetId: string): Promise<FleetAgentRecord[]>"], ["get-nodes-by-color", "getNodesByColor()", "getNodesByColor(fleetId: string, agentColor: string): Promise<TopicNode[]>"], ["get-similar-nodes-across-fleet", "getSimilarNodesAcrossFleet()", "getSimilarNodesAcrossFleet(fleetId: string, embedding: number[], options?): Promise<TopicNode[]>"], ["tag-session-nodes", "tagSessionNodes()", "tagSessionNodes(sessionId: string, metadata: object): Promise<void>"], ["set-session-tags", "setSessionTags()", "setSessionTags(sessionId: string, tags: string[]): Promise<void>"], ["insert-graft-registry", "insertGraftRegistry()", "insertGraftRegistry(entry: GraftRegistryEntry): Promise<GraftRegistryEntry>"], ["get-graft-registry", "getGraftRegistry()", "getGraftRegistry(sessionId: string): Promise<GraftRegistryEntry[]>"], ["delete-graft-registry", "deleteGraftRegistry()", "deleteGraftRegistry(nodeId: string): Promise<void>"], ["absorb-nodes", "absorbNodes()", "absorbNodes(nodes: TopicNode[], targetSessionId: string, options?): Promise<TopicNode[]>"],
] as const;
for (const [slug, label, signature] of storeMethods) {
  const subgroup = ["index", "initialize", "migrate", "verify-schema", "rebuild-edges-for-session", "close"].includes(slug) ? "Lifecycle & schema" : slug.includes("message") || slug.includes("ingest-state") ? "Messages & ingest state" : ["save-segment", "save-node", "save-edge", "insert-memories", "build-memory-edges", "clear-session", "clear-session-graph", "delete-node"].includes(slug) ? "Graph writes" : slug.startsWith("search-") ? "Memory search" : slug.includes("maintenance") || slug.includes("forget") || slug.includes("suppress") || slug.includes("restore") || slug.includes("mark-") || slug.includes("quality") || slug.includes("history") || slug.includes("diff") || slug.includes("upsert") ? "Lifecycle maintenance" : slug.includes("fleet") || slug.includes("color") || slug.includes("graft") || slug === "tag-session-nodes" || slug === "set-session-tags" || slug === "absorb-nodes" ? "Fleet & graft registry" : "Graph reads";
  const parameterList = signature.match(/\(([^)]*)\)/)?.[1] ?? "";
  const exampleArguments = parameterList
    .split(",")
    .map((parameter) => parameter.trim().match(/^([a-zA-Z][a-zA-Z0-9]*)\??:/)?.[1])
    .filter((parameter): parameter is string => Boolean(parameter))
    .join(", ");
  const methodName = label.replace("()", "");
  const call = `store.${methodName}(${exampleArguments})`;
  const example = slug === "index"
    ? `const store = new PostgresGraphStore(process.env.DATABASE_URL!);`
    : signature.includes("Promise<void>")
      ? `await ${call};`
      : `const result = await ${call};`;
  definitions.push(api("GraphStore", slug, label, signature, `Use ${label} through the PostgreSQL GraphStore implementation or a compatible custom store.`, example, { subgroup, icon: "database", notes: ["This is an extension-level storage API. Most applications should prefer `MemoGrafter`."] }));
}

const schemaApis = ["mgTable", "mgIndex", "mgExtension", "memoGrafterExtensions", "memoGrafterTables", "memoGrafterIndexes", "memoGrafterExtensionNames", "memoGrafterTableNames", "memoGrafterIndexNames"];
for (const name of schemaApis) definitions.push(api("Schema", name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`), name.startsWith("mg") ? `${name}()` : name, name.startsWith("mg") ? `${name}(definition): typeof definition` : `const ${name}: readonly unknown[]`, `Use the ${name} export from memo-grafter/schema.`, name.startsWith("mg") ? `const definition = ${name}({ name: "example", /* schema fields */ });` : `console.log(${name});`, { icon: "table" }));

const typeFamilies: Record<string, string[]> = {
  "Configuration & input": ["Message", "MemoGrafterConfig", "MemoGrafterDatabaseConfig", "MemoGrafterDriftConfig", "MemoGrafterGraphConfig", "MemoGrafterInjectConfig", "MemoGrafterQueueConfig", "MemoGrafterCacheConfig", "MemoGrafterProjectConfig", "MemoGrafterProjectDatabaseConfig", "MemoGrafterConfigSource", "MemoGrafterConfigOverrides", "IngestOptions", "IngestTextOptions", "RememberOptions", "RetrieverConfig", "TagFilterOptions", "GraftByRelevanceOptions", "AbsorbFromAgentOptions", "OpenAILLMAdapterOptions"],
  Telemetry: ["DatabaseQueryOperation", "DatabaseQueryTelemetryEvent", "MemoGrafterDatabaseTelemetry", "QueueJobTelemetryEvent", "MemoGrafterQueueTelemetry"],
  "Graph models": ["TopicNode", "TopicEdge", "TopicSegment", "MemoryNode", "MemoryNodeInsert", "MemoryEdge", "ExtractedMemory", "SegmentExtractionResult", "GraphSnapshot", "GraphSnapshotNode", "GraphSnapshotMemory", "GraftRegistryEntry", "GraftOrigin", "SessionIngestState"],
  "Results & history": ["InjectionResult", "RetrievalResult", "MemoryHistoryStatus", "MemoryHistoryEntry", "MemoryHistoryOptions", "MemoryHistoryResult", "MemoryDiff", "MemoryDiffField", "MemoryType", "MemorySourceType"],
  "Adapters & modes": ["LLMAdapter", "EmbedAdapter", "DriftMode", "DriftSensitivity", "GraftExpansionStrategy", "FleetMemoryMode"],
  Fleet: ["MemoGrafterFleetOptions", "WorkerAgentConfig", "FleetGraph", "FleetAgentInfo", "FleetWorker", "FleetMemoryOptions", "FleetRetrievalOptions", "FleetGraftByRelevanceOptions", "FleetAbsorbOptions", "ConductorGraftOptions", "SharedMemorySnapshot"],
  Maintenance: ["CrawlerConfig", "CrawlerPass", "CrawlerPassContext", "CrawlerPassResult", "CrawlerPassReport", "CrawlerReport", "CrawlerMaintenanceStore", "DecayScoringPassOptions"],
  "Storage & schema": ["GraphStore", "FleetAgentRecord", "MigrationReport", "MigrationReportItem", "MigrationItemStatus", "MgColumnType", "MgColumnDefinition", "MgTableDefinition", "MgIndexDefinition", "MgExtensionDefinition"],
  "Studio preview": ["StudioPreviewMode", "StudioPreviewRequest", "StudioPreviewResult", "StudioPreviewStatus", "StudioPreviewService", "StudioPreviewServiceConfig"],
};

const typeDeclarations: Record<string, string> = contracts.types;

const typeFieldHelp: Record<string, string[]> = {
  TagFilterOptions: [
    "`tags?` (`string[]`) — Tags to match. Omit this field to avoid tag filtering.",
    "`tagMode?` (`\"all\" | \"any\"`, default `\"all\"`) — Require every supplied tag or at least one supplied tag.",
    "`scope?` (`\"session\" | \"session-and-tags\" | \"tagged\"`, default `\"session\"`) — Keep reads in the selected session, combine the session with tagged sessions, or search tagged sessions across session boundaries.",
    "`sessionIds?` (`string[]`) — Explicitly constrain cross-session operations. It has no effect on APIs that are strictly current-session scoped.",
    "`includeSuppressed?` (`boolean`, default `false`) — Include suppressed topic nodes.",
    "`includeForgotten?` (`boolean`, default `false`) — Include forgotten memories where the operation returns or evaluates memories.",
  ],
  RetrieverConfig: [
    "`limit?` (`number`) — Maximum number of ranked memory facts to return.",
    "`minSimilarity?` is deprecated for recall; it no longer cuts off candidate generation. Use bounded candidates and adaptive selection.",
    "`tokenBudget?` (`number`) — Maximum token budget for assembled prompt context.",
    "`tags?`, `tagMode?`, `scope?`, `sessionIds?` — Control tag matching and authorized session scope.",
    "`candidateLimit?` defaults to 40; `limit?` defaults to 10. Adaptive `selection` controls topic count, relative score floor, and score gaps.",
    "`cache.ttlSeconds?` — Override the retrieval-cache lifetime for this operation.",
  ],
  IngestOptions: ["`tags?` (`string[]`) — Normalized metadata copied to topics and memories created by this ingestion."],
  IngestTextOptions: ["`replace?` (`boolean`, default `false`) — Clear the target session graph before processing this text.", "`label?` (`string`) — Supply a document/topic label instead of relying only on extraction.", "`source?` (`string`) — Preserve an application-defined provenance label."],
  RememberOptions: ["`replace?` (`boolean`, default `false`) — Clear the current session graph before remembering this text; use with care.", "`label?` (`string`) — Supply an extraction label.", "`source?` (`string`, default `\"remember\"`) — Override the provenance label applied by `remember()`."],
  GraftByRelevanceOptions: ["`topK?` (`number`) — Maximum number of semantic seed topics.", "`minSimilarity?` (`number`) — Minimum semantic similarity for a seed.", "`hopDepth?` (`number`) — Number of graph-neighbour expansion hops.", "`expansionStrategy?` (`\"none\" | \"graph\"`, default `\"graph\"`) — Keep only seeds or expand through topic edges.", "`sessionIds?` (`string[]`) — Restrict eligible source sessions where the calling API supports cross-session selection."],
  AbsorbFromAgentOptions: ["`topicIds?` (`string[]`) — Select explicit source topics.", "`prompt?` (`string`) — Select source topics semantically when IDs are unknown.", "`minSimilarity?` (`number`) — Reject semantic candidates below this score.", "`limit?` (`number`) — Cap the number of selected source topics.", "Do not combine conflicting selection intent. When neither `topicIds` nor `prompt` is supplied, all eligible source topics may be considered."],
  TopicNode: [
    "`id`, `sessionId`, and `segmentId` identify the topic and its owning session/segment.",
    "`label` is the short extracted topic name; `summary` is its generated description.",
    "`messageRange` is the inclusive source-message index range; `topicOrder` is its position in the session.",
    "`driftScore` records the topic-boundary signal. `embedding` is the stored semantic vector and can be large.",
    "`tags` and `source` preserve caller metadata.",
    "`suppressed` and `suppressedAt` describe topic lifecycle state.",
    "`agentColor`, `fleetId`, and `agentId` are populated for fleet-owned topics and otherwise are `null`.",
    "`createdAt` is a JavaScript `Date` when read through the package API.",
  ],
  RetrievalResult: [
    "`facts` contains ranked memory objects augmented with a semantic `similarity` score.",
    "`nodes` contains selected topics, including topic-vector matches and pinned topics when composed by context().",
    "`episodes`, `selection`, and `topicMatches` explain bounded event history and candidate selection. `clusterMetadata` is organizational metadata loaded after selection.",
    "`pinnedNodes`, `pinnedContextTruncated`, and `pinnedTokenBudget` describe separately budgeted required context. `degraded` and `warnings` describe best-effort failures.",
    "`systemPrompt` is prompt-ready memory context; `tokenCount` reports its size against optional `tokenBudget`.",
  ],
  InjectionResult: [
    "`systemPrompt` is the assembled context; this operation does not itself call the chat model.",
    "`nodes` are selected topics and `memories` contains their active structured facts when included.",
    "`tokenCount` is the assembled size; `tokenBudget` is present when a budget governed assembly.",
  ],
};

const documentedTypes = new Set(Object.values(typeFamilies).flat());
typeFamilies["Additional public contracts"] = contracts.publicTypes.filter(name => !documentedTypes.has(name));

definitions.push(...currentApiDefinitions);

for (const [subgroup, names] of Object.entries(typeFamilies)) for (const name of names) {
  const packagePath = name.startsWith("Mg") ? "memo-grafter/schema" : "memo-grafter";
  definitions.push(api("Types", name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`).replace(/^-/, ""), name, typeDeclarations[name] ?? `type ${name}`, `TypeScript contract for ${name}.`, name === "MemoGrafterCacheConfig" ? `import type { MemoGrafterConfig } from "memo-grafter";\ntype CacheConfig = MemoGrafterConfig["cache"];` : `import type { ${name} } from "${packagePath}";\n\nfunction useValue(value: ${name}) {\n  return value;\n}`, { subgroup, icon: "braces", parameters: typeFieldHelp[name], returns: "A compile-time-only TypeScript contract with no runtime value.", notes: [name === "MemoGrafterCacheConfig" ? "This is a supporting configuration shape, not a root export. Use MemoGrafterConfig[\"cache\"] in application code." : "Use `import type` when the contract is not needed at runtime."] }));
}

function apiRoute(definition: ApiDefinition) {
  const familySlug = toSlug(definition.family);
  return definition.slug === "index" ? `/docs/api-reference/${familySlug}` : `/docs/api-reference/${familySlug}/${definition.slug}`;
}

const visibleDefinitions = definitions.filter((definition) => {
  if (definition.family === "Types") return Boolean(typeDeclarations[definition.label]);
  return !definition.label.startsWith("_");
});

const parameterHelp: Record<string, string> = {
  config: "Provider, storage, and memory behavior used by the new instance.",
  userMessage: "The latest user turn to answer and add to the conversation.",
  messages: "Ordered conversation messages to extract memory from.",
  text: "Raw text to analyze and convert into memories.",
  query: "Natural-language intent used to rank relevant memory.",
  sessionId: "The application-owned session whose memory should be read or changed.",
  sourceSessionId: "The session to select source memory from.",
  targetSessionId: "The session that will receive copied memory.",
  topicIds: "Topic identifiers to include in the generated context.",
  topicId: "The topic to change.",
  memoryId: "The memory record to inspect or change.",
  memoryIds: "Memory records to change in one operation.",
  fromMemoryId: "The earlier memory version to compare.",
  toMemoryId: "The later memory version to compare.",
  nodeId: "The grafted topic node to remove.",
  nodes: "Topic nodes, including their active memories, to copy.",
  sourceAgent: "The agent whose memory will be considered for copying.",
  tags: "The complete normalized tag set that should replace the current set.",
  options: "A typed options object. The applicable fields and defaults are documented below.",
  overrides: "Runtime values merged into the imported project configuration before validation.",
  source: "An explicitly imported project configuration object or synchronous/asynchronous configuration factory.",
  startIndex: "Absolute zero-based message index for the first message in this incremental delta.",
  predicate: "The predicate portion of a structured `(subject, predicate)` fact key.",
  subject: "The subject portion of a structured `(subject, predicate)` fact key.",
};

function parsedParameters(definition: ApiDefinition) {
  if (definition.parameters) return definition.parameters;
  const firstSignature = definition.signature.split("\n")[0];
  const parameterText = firstSignature.match(/\((.*)\)/)?.[1]?.trim();
  if (!parameterText) return undefined;
  return parameterText.split(/,(?![^<{[]*[>\]}])/).map((parameter) => {
    const match = parameter.trim().match(/^(?:\.\.\.)?([A-Za-z_$][\w$]*)(\?)?\s*:\s*(.+)$/);
    if (!match) return `\`${parameter.trim()}\``;
    const [, name, optional, type] = match;
    const help = parameterHelp[name] ?? (optional ? "Optional operation-specific settings." : "Required input for this operation.");
    return `\`${name}${optional ?? ""}\` (\`${type}\`) — ${help}`;
  });
}

function resultDescription(definition: ApiDefinition) {
  if (definition.returns) return definition.returns;
  if (definition.family === "Types" || definition.slug === "index") return undefined;
  const currentResults: Record<string, string> = {
    "analyze-detailed": "An AnalyzeReceipt with processed or queued status, ingestionRunId, messageRange, messagesPersisted, graphProcessed, and optional nodes, warnings, or queue job identity.",
    "get-ingestion-run": "The durable IngestionRun, or null when the run does not exist.",
    "reconcile-session": "A ReconciliationReport with inspect/repair mode, detected issues, and issue codes actually repaired.",
    "reconcile-pending-ingestion": "A ReconciliationReport covering pending ingestion across sessions.",
    "check-readiness": "A ReadinessResult containing ready and structured checks with status, code, message, and optional help.",
    "get-topic-clusters": "Session-owned TopicCluster descriptions without embedding vectors; an empty array for unsupported stores or an empty catalog.",
    "backfill-topic-clusters": "A bounded scan result with scanned count, nextCursor (null at the end), and structured warnings.",
    "get-pinned-context": "A PinnedContextResult containing prompt, active topics and memories, token count, budget, and truncated state.",
  };
  if (currentResults[definition.slug]) return currentResults[definition.slug];
  const returnType = definition.signature.match(/:\s*([^\n]+)$/)?.[1];
  if (!returnType || returnType === "Promise<void>" || returnType === "void") return undefined;
  if (returnType.includes("RetrievalResult")) return "A retrieval result containing ranked facts, matched topics, generated prompt context, and token counts.";
  if (returnType.includes("InjectionResult")) return "The selected memory context and prompt text ready to pass to an LLM.";
  if (returnType.includes("TopicNode[]")) return "The topic nodes created, selected, or copied by the operation.";
  if (returnType.includes("GraphSnapshot")) return "A read-only snapshot of topics, memories, edges, segments, and graft provenance for inspection.";
  if (returnType.includes("MemoryHistoryResult")) return "The matching memory lineage, including current and superseded versions.";
  if (returnType.includes("MemoryDiff")) return "A field-level comparison between the two selected memory versions.";
  if (returnType.includes("boolean")) return "`true` when the requested state changed; `false` when the target was already in that state or was not found.";
  if (returnType.includes("number")) return "The number of records changed by the operation.";
  if (returnType.includes("string")) return definition.label === "invoke()" ? "The assistant response produced after memory recall." : "The requested identifier or text value.";
  return undefined;
}

const operationDetails: Record<string, string[]> = {
  invoke: ["This is the high-level chat path: it recalls relevant memory, builds context, calls the configured language model, records both turns, and schedules or performs ingestion according to the agent configuration."],
  remember: ["Use this for an explicit fact that should enter memory without first appearing as a user/assistant exchange. Extraction and lifecycle rules still apply."],
  "ingest-text": ["Raw text ingestion is useful for notes, documents, and external knowledge. The text is segmented and extracted into the same graph model used for conversational memory."],
  recall: ["Recall reads memory without producing an assistant answer. Use it when your application owns prompt construction or needs to inspect the evidence before calling a model."],
  graft: ["Grafting is deterministic when topic IDs are supplied: only active memory reachable from those topics is assembled into the injection result."],
  "graft-by-relevance": ["This combines semantic topic selection with prompt assembly, making it suitable when the caller has a query but does not already know the graph’s topic IDs."],
  "clear-session": ["This resets the current agent session, including persisted session memory. Treat it as a destructive user action and confirm intent in user-facing products."],
  forget: ["Forgetting is a soft lifecycle change. The record remains available for history and auditing but is excluded from active recall."],
  "forget-many": ["The batch form applies the same soft-forget behavior to multiple records and reports how many records actually changed."],
  "suppress-topic": ["Suppression hides a topic and its attached active memory from normal retrieval without deleting graph history."],
  "restore-topic": ["Restoring makes a previously suppressed topic eligible for retrieval again; it does not revive memories that were independently forgotten."],
  "enqueue-ingest": ["This method requires queue mode and returns after the job is accepted, not after extraction and persistence have finished."],
  "enqueue-text-ingest": ["Use this for large or latency-insensitive text ingestion when queue workers are configured."],
  "crawler-start": ["Starting the crawler begins its configured maintenance schedule. Keep one deliberate owner for this process in multi-instance deployments."],
  "crawler-stop": ["Stopping waits for scheduler ownership to end cleanly; it does not undo lifecycle changes made by completed passes."],
  "crawler-run-once": ["This is useful for controlled maintenance windows, tests, and jobs where the host scheduler determines cadence."],
};

// Authored behavior for application-facing APIs. Signatures are used for display and
// validation only; these descriptions intentionally come from the public reference,
// implementation, and tests rather than generic signature parsing.
const editorial: Record<string, Partial<ApiDefinition>> = {
  "MemoGrafterAgent:initialize": {
    useWhen: ["Call this once after constructor-based setup and before the first memory operation. `MemoGrafterAgent.create()` already performs this step."],
    behavior: ["Connects to storage and verifies that the expected migrated schema is available. It does not run migrations."],
    sideEffects: ["Opens the database and any configured Redis or queue resources."],
    errors: ["Rejects when storage is unreachable or the installed schema is missing or incompatible."],
  },
  "MemoGrafterAgent:close": {
    useWhen: ["Call during graceful shutdown, preferably in a `finally` block or process-shutdown hook."],
    behavior: ["Waits for owned resource shutdown and releases database, cache, and queue connections. It does not delete memory."],
    sideEffects: ["The instance must not be used for new operations after it is closed."],
  },
  "MemoGrafterAgent:invoke": {
    useWhen: ["Use for the complete conversational path when MemoGrafter should own recall, prompt injection, the model call, chat history, and ingestion."],
    behavior: ["Recalls relevant active facts, adds memory context to the configured system prompt, calls the LLM adapter, appends both turns to in-memory history, then ingests the completed exchange.", "Queue mode returns the assistant answer after ingestion is submitted, not after graph extraction finishes."],
    sideEffects: ["Adds the user and assistant messages to local history and creates or queues persistent graph memory."],
    errors: ["Rejects provider authentication, rate-limit, transport, storage, or queue-submission failures. A rejected call does not return a partial assistant string."],
    examples: [{ label: "Use the response and inspect history", code: `const answer = await agent.invoke("What city did I move to?");\nconsole.log(answer);\nconsole.log(agent.getHistory().at(-1));` }],
  },
  "MemoGrafterAgent:get-history": {
    useWhen: ["Use to render or inspect the conversation currently held by this agent instance."],
    behavior: ["Returns ordered `Message` objects from local memory. Raw-text ingestion and `remember()` do not add chat messages."],
    sideEffects: ["Read-only; it does not query the graph store."],
  },
  "MemoGrafterAgent:get-session-id": {
    useWhen: ["Use when logging, correlating storage records, or integrating the agent with application-owned session metadata."],
    behavior: ["Returns the stable session identifier assigned to this agent instance."],
    sideEffects: ["Read-only and synchronous."],
  },
  "MemoGrafterAgent:ingest-text": {
    useWhen: ["Use for notes, documents, or other text that should become graph memory without becoming a chat turn."],
    behavior: ["Chunks text, detects topics, extracts structured memories, and writes or queues them for the current session.", "`replace: true` clears the current session graph before processing; `label` and `source` are preserved as metadata."],
    sideEffects: ["Creates persistent topics, segments, memories, and graph edges. It does not modify chat history."],
    errors: ["Rejects empty or invalid input, extraction/provider failures, storage failures, or queue-submission failures."],
  },
  "MemoGrafterAgent:remember": {
    useWhen: ["Use for an explicit fact or preference such as a user choice, constraint, or profile detail."],
    behavior: ["Runs the same extraction pipeline as `ingestText()` and defaults `source` to `\"remember\"`. The text is not stored as a chat message."],
    sideEffects: ["Creates or queues graph memory in the current session."],
  },
  "MemoGrafterAgent:recall": {
    useWhen: ["Use when the application owns prompt construction or needs to inspect retrieved evidence without calling the chat model."],
    behavior: ["Embeds the query, searches active structured memories, filters lifecycle-ineligible rows, ranks matches by similarity, using evidence quality only to break ties, and assembles prompt-ready context within the token budget.", "Results are facts rather than full conversation transcripts."],
    sideEffects: ["Read-only, apart from optional retrieval-cache writes."],
    errors: ["Rejects embedding-provider, storage, or cache failures. No matches resolve successfully with empty `facts` and `nodes`."],
    examples: [{ label: "Inspect evidence", code: `const result = await agent.recall("deployment preferences", { limit: 5 });\nfor (const fact of result.facts) {\n  console.log(fact.value, fact.similarity, fact.quality);\n}\nconsole.log(result.systemPrompt);` }],
  },
  "MemoGrafterAgent:graft": {
    useWhen: ["Use when the application already knows which topic IDs should supply broader context."],
    behavior: ["Loads active memories for the selected topics and assembles an LLM-ready system prompt. With no IDs, it uses eligible topics from the agent session."],
    sideEffects: ["Read-only; grafting previews context and does not copy memory or call the LLM."],
  },
  "MemoGrafterAgent:graft-by-relevance": {
    useWhen: ["Use when broader topic context is needed but the caller does not know topic IDs."],
    behavior: ["Selects semantic seed topics, optionally expands through graph neighbours, loads active memories, and trims the assembled prompt to the configured budget."],
    sideEffects: ["Read-only; use `ingestGraftedNodes()` or absorption APIs to copy selected memory."],
  },
  "MemoGrafterAgent:ingest-grafted-nodes": {
    useWhen: ["Use to copy previously selected topics and their active memories into this agent's session."],
    behavior: ["Creates target-side IDs, copies eligible memories, and records graft provenance. Returned nodes are the new target-session objects, not the source objects."],
    sideEffects: ["Persists copied graph records in the current session."],
  },
  "MemoGrafterAgent:absorb-from-agent": {
    useWhen: ["Use for a one-step select-and-copy workflow between two agent instances."],
    behavior: ["Selects source topics by explicit IDs or semantic prompt and copies them into the receiving agent. If no selector is supplied, all eligible source topics may be considered."],
    sideEffects: ["Writes copied topics, memories, and provenance to the target session; source memory is unchanged."],
  },
  "MemoGrafterAgent:get-active-segments": {
    useWhen: ["Use to inspect the message-index ranges produced by topic-drift segmentation."],
    behavior: ["Waits for the local pending-ingest chain and returns ordered segments for the current session."],
    sideEffects: ["Read-only. Segment objects do not contain extracted memories or raw message text."],
  },
  "MemoGrafterAgent:get-active-nodes": {
    useWhen: ["Use to inspect detected topic objects, obtain IDs for explicit grafting, or build a topic browser."],
    behavior: ["Reads existing topic rows; it does not return the structured `MemoryNode` facts attached to them. Use `recall()` for ranked facts or `getGraphSnapshot()` for the complete inspection model."],
    sideEffects: ["Read-only."],
  },
  "MemoGrafterAgent:get-graph-snapshot": {
    useWhen: ["Use for Studio-like inspection, graph visualization, auditing, or debugging lifecycle state."],
    behavior: ["Returns topics, segments, topic edges, memories, memory edges, lifecycle wrappers, graft origins, and a capture timestamp. Snapshot arrays include stale lifecycle metadata so UIs can display suppressed, forgotten, decayed, conflicting, and superseded state."],
    sideEffects: ["Read-only. Raw message-buffer contents and presentation/layout decisions are not included."],
  },
  "MemoGrafterAgent:set-session-tags": {
    useWhen: ["Use to replace the authorization or project tags associated with the current session."],
    behavior: ["Normalizes and replaces the complete session tag set; it is not an additive update."],
    sideEffects: ["Updates session metadata used by tagged cross-session reads."],
  },
  "MemoGrafterAgent:get-session-tags": {
    useWhen: ["Use to inspect the normalized tag set that will be applied to new current-session ingestion."],
    behavior: ["Returns the agent's current in-memory session tags in normalized form."],
    sideEffects: ["Read-only and synchronous."],
  },
  "MemoGrafterAgent:get-graft-registry": {
    useWhen: ["Use to audit which target topics were copied from other sessions."],
    behavior: ["Returns provenance entries containing target node, source session, source node, and graft timestamp."],
    sideEffects: ["Read-only."],
  },
  "MemoGrafterAgent:remove-graft": {
    useWhen: ["Use to remove a copied graft topic from the current session by target node ID."],
    behavior: ["Deletes the registered target graft and its provenance according to the store's graft-removal workflow. Source-session data is not changed."],
    sideEffects: ["Destructive for the target session. The promise resolves with no value."],
  },
  "MemoGrafterAgent:forget": {
    useWhen: ["Use to remove one memory from active retrieval while retaining audit history."],
    behavior: ["Marks the memory forgotten. It returns `true` only when a row changed and `false` when the target was missing or already forgotten."],
    sideEffects: ["The row remains available to history and explicit lifecycle inspection."],
  },
  "MemoGrafterAgent:forget-many": {
    useWhen: ["Use to soft-forget several known memory IDs in one storage operation."],
    behavior: ["Applies the same lifecycle transition as `forget()` and returns the number of rows that actually changed."],
    sideEffects: ["Historical rows remain stored for audit and memory-history reads."],
  },
  "MemoGrafterAgent:suppress-topic": {
    useWhen: ["Use to hide an entire topic from normal active-memory operations without deleting it."],
    behavior: ["Marks the topic suppressed. Attached memories remain stored but are excluded through the topic's lifecycle state."],
    sideEffects: ["Returns whether the stored topic state changed; restoration is available through `restoreTopic()`."],
  },
  "MemoGrafterAgent:restore-topic": {
    useWhen: ["Use to make a suppressed topic eligible for active reads again."],
    behavior: ["Clears topic suppression but does not revive memories that were independently forgotten, decayed, or superseded."],
  },
  "MemoGrafterAgent:get-memory-history": {
    useWhen: ["Use to audit how a fact changed by memory ID or by the `(subject, predicate)` fact key."],
    behavior: ["Returns ordered versions, relationship edges, status labels, and the current active memory when one exists. Agent overloads are scoped to the current session."],
    sideEffects: ["Read-only and includes historical rows that normal recall filters out."],
  },
  "MemoGrafterAgent:get-memory-diff": {
    useWhen: ["Use to compare two known memory versions field by field."],
    behavior: ["Returns both memories, every compared field, the changed-field subset, and update/conflict relationships between the selected versions."],
    sideEffects: ["Read-only."],
    errors: ["Rejects when either selected memory cannot be loaded."],
  },
  "MemoGrafterAgent:clear-session": {
    useWhen: ["Use only for an explicit full reset of the current conversation and its persisted memory."],
    behavior: ["Clears local chat history and the stored session graph."],
    sideEffects: ["Destructive. User-facing products should confirm intent before calling it."],
  },
  "MemoGrafter:ingest-now": {
    useWhen: ["Use when created graph nodes must be available immediately, even if the instance has queue mode configured."],
    behavior: ["Runs extraction and persistence inline and resolves with the newly created topic nodes."],
    sideEffects: ["Writes messages, ingest cursor, topics, memories, and edges before resolving."],
  },
  "MemoGrafter:initialize": {
    useWhen: ["Call once after constructing the session-oriented core and before serving memory operations."],
    behavior: ["Connects to the configured store and verifies the already-migrated schema."],
    errors: ["Rejects unavailable storage or missing/incompatible schema state."],
  },
  "MemoGrafter:close": {
    useWhen: ["Call during graceful service shutdown after all session operations have settled."],
    behavior: ["Closes store, cache Redis, and queue resources owned by this core instance without deleting memory."],
  },
  "MemoGrafter:ingest": {
    useWhen: ["Use when the application owns ordered conversation history and session IDs and can accept configured queue semantics."],
    behavior: ["Processes only the unprocessed suffix after the stored ingest cursor. Inline mode returns created topics; queue mode returns an empty array after job acceptance."],
    sideEffects: ["Persists or queues messages, topic segments, topics, structured memories, graph edges, and ingest-cursor progress."],
  },
  "MemoGrafter:enqueue-ingest": {
    useWhen: ["Use for latency-insensitive conversation ingestion when a BullMQ worker owns extraction."],
    behavior: ["With queue configuration, resolves when the job is accepted. Without it, processes inline before resolving."],
    sideEffects: ["Queued graph state is not guaranteed to be readable when this promise resolves."],
  },
  "MemoGrafter:enqueue-incremental-ingest": {
    useWhen: ["Use for a known indexed message delta when avoiding complete-history queue payloads. Most applications should call `ingest()`; `MemoGrafterAgent` uses this path internally."],
    behavior: ["Compares the absolute range with the stored cursor, skips or trims completed indexes, and loads limited preceding context for drift detection. Gaps reject without advancing the cursor."],
    sideEffects: ["Queue mode resolves after acceptance; inline mode resolves after persistence."],
  },
  "MemoGrafter:ingest-text": {
    useWhen: ["Use for application-owned notes or documents associated with an explicit session ID."],
    behavior: ["Chunks and extracts text into the same graph model as conversations. Queue mode returns an empty array after submission."],
    sideEffects: ["`replace: true` clears the target session graph before new text is processed."],
  },
  "MemoGrafter:enqueue-text-ingest": {
    useWhen: ["Use for large or latency-insensitive text when a configured worker should perform extraction."],
    behavior: ["Resolves after queue acceptance. Without a queue, it processes the text inline."],
    sideEffects: ["New graph nodes may not be readable when the queued promise resolves."],
  },
  "MemoGrafter:inject": {
    useWhen: ["Use to assemble prompt context from explicit topic IDs in an application-selected session."],
    behavior: ["Loads active topic context and structured memories, applies the injection token budget, and returns prompt-ready text without calling the LLM."],
    sideEffects: ["Read-only."],
  },
  "MemoGrafter:graft-by-relevance": {
    useWhen: ["Use when the application has a session and natural-language intent but not explicit topic IDs."],
    behavior: ["Selects semantic seed topics, applies configured graph expansion, and assembles an `InjectionResult`."],
    sideEffects: ["Read-only."],
  },
  "MemoGrafter:ingest-grafted-nodes": {
    useWhen: ["Use to copy already-selected source topics into an application-owned target session."],
    behavior: ["Creates target-side topic and memory IDs and records source provenance."],
    sideEffects: ["Writes to the target session; source nodes remain unchanged."],
  },
  "MemoGrafter:select-nodes-for-absorb": {
    useWhen: ["Use when selection and copying must be reviewed or authorized as separate steps."],
    behavior: ["Selects source topics by explicit IDs or semantic prompt without copying them."],
    sideEffects: ["Read-only."],
  },
  "MemoGrafter:absorb-nodes": {
    useWhen: ["Use after `selectNodesForAbsorb()` or another trusted selection step to persist copied topics."],
    behavior: ["Copies eligible active memory and provenance into the target session and returns the new target nodes."],
    sideEffects: ["Writes target-session graph state."],
  },
  "MemoGrafter:get-topics": {
    useWhen: ["Use when an application-managed service needs topic nodes and their segmentation ranges for a particular session."],
    behavior: ["Applies topic filters to `nodes`; `segments` are read for the supplied session and are not tag-filtered."],
    sideEffects: ["Read-only."],
  },
  "MemoGrafter:create-fleet": {
    useWhen: ["Use to create fleet orchestration backed by this initialized core and its storage resources."],
    behavior: ["Returns a `MemoGrafterFleet`; initialize the fleet before creating workers or using shared memory."],
  },
};

const agentContentIssues = definitions
  .filter((definition) => definition.family === "MemoGrafterAgent" && definition.slug !== "index")
  .filter((definition) => {
    const content = { ...definition, ...editorial[`${definition.family}:${definition.slug}`] };
    return !content.useWhen?.length || !content.behavior?.length;
  })
  .map((definition) => `${definition.family}.${definition.label} needs authored usage and behavior content.`);

if (agentContentIssues.length) {
  throw new Error(`Incomplete primary API documentation:\n${agentContentIssues.join("\n")}`);
}

function purposeText(definition: ApiDefinition) {
  if (definition.family === "Types") {
    return [definition.purpose, `Use \`${definition.label}\` to keep application code aligned with the values MemoGrafter accepts or returns at this boundary. It is a TypeScript-only contract and adds no runtime behavior.`];
  }
  if (definition.slug === "index") return [definition.purpose, `The constructor wires the dependencies used by the ${definition.family} APIs on the pages in this group.`];
  if (definition.useWhen?.length || definition.behavior?.length) return [definition.purpose];
  const familyContext: Partial<Record<string, string>> = {
    MemoGrafterAgent: "The operation is scoped to the agent’s current session, so callers do not pass a session identifier on every call.",
    MemoGrafter: "This lower-level API keeps session selection explicit, which is useful for services that manage many users or conversations through one instance.",
    "Fleet Memory": "The operation follows the fleet’s memory mode and agent identity rules when selecting, storing, or transferring memory.",
    Maintenance: "The crawler coordinates supported lifecycle work and returns aggregate reporting without exposing its internal persistence passes.",
    "Provider Adapters": "Pass the adapter into MemoGrafter configuration so the rest of the memory pipeline remains independent of the provider SDK.",
  };
  return [definition.purpose, ...(operationDetails[definition.slug] ?? (familyContext[definition.family] ? [familyContext[definition.family]!] : []))];
}

function relatedApis(definition: ApiDefinition): DocRelatedLink[] {
  const links: Record<string, DocRelatedLink[]> = {
    invoke: [{ label: "recall()", href: "/docs/api-reference/memo-grafter-agent/recall", description: "Retrieve memory without running the full chat turn." }, { label: "getHistory()", href: "/docs/api-reference/memo-grafter-agent/get-history", description: "Inspect the conversation retained by the agent." }],
    recall: [{ label: "graftByRelevance()", href: "/docs/api-reference/memo-grafter-agent/graft-by-relevance", description: "Turn a relevance query into prompt-ready memory context." }],
    remember: [{ label: "ingestText()", href: `/docs/api-reference/${toSlug(definition.family)}/ingest-text`, description: "Ingest larger bodies of unstructured text." }],
    forget: [{ label: "forgetMany()", href: "/docs/api-reference/memo-grafter-agent/forget-many", description: "Soft-forget several memories together." }, { label: "getMemoryHistory()", href: "/docs/api-reference/memo-grafter-agent/get-memory-history", description: "Inspect versions retained after lifecycle changes." }],
    "graft-by-relevance": [{ label: "recall()", href: "/docs/api-reference/memo-grafter-agent/recall", description: "Retrieve ranked memory and its evidence." }],
  };
  const explicit = definition.related ?? links[definition.slug] ?? [];
  const referencedTypes = [...new Set(definition.signature.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? [])]
    .filter((name) => name !== definition.label && Boolean(typeDeclarations[name]))
    .slice(0, 4)
    .map((name) => ({
      label: name,
      href: `/docs/api-reference/types/${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "")}`,
      description: `Inspect the complete ${name} TypeScript contract.`,
    }));
  return [...explicit, ...referencedTypes.filter((candidate) => !explicit.some((link) => link.href === candidate.href))];
}

function optionSections(definition: ApiDefinition): DocSection[] {
  if (definition.family === "Types") return [];
  const optionTypes = Object.keys(typeFieldHelp).filter((name) => definition.signature.includes(name));
  return optionTypes.flatMap((name) => typeFieldHelp[name]?.length ? [{ title: `${name} fields`, bullets: typeFieldHelp[name] }] : []);
}

function apiPage(baseDefinition: ApiDefinition): DocPage {
  const definition = {
    ...baseDefinition,
    ...editorial[`${baseDefinition.family}:${baseDefinition.slug}`],
  };
  const owner = definition.family === "GraphStore" ? "PostgresGraphStore" : ["MemoGrafter", "MemoGrafterAgent"].includes(definition.family) ? definition.family : definition.subgroup ?? definition.family;
  const name = definition.label.replace(/\(\)$/, "").split(".").at(-1);
  const sourceSignature = (contracts.signatures as Record<string, string>)[`${owner}.${name}`];
  if (sourceSignature) definition.signature = sourceSignature;
  const href = apiRoute(definition);
  const isType = definition.family === "Types";
  const isConstructor = definition.slug === "index";
  const parameters = parsedParameters(definition);
  const result = resultDescription(definition);
  const related = relatedApis(definition);
  const sections: DocSection[] = [
    { title: "What it does", body: purposeText(definition) },
    ...(definition.useWhen?.length ? [{ title: "When to use it", bullets: definition.useWhen }] : []),
    { title: isType ? "Definition" : "Signature", code: [{ label: "TypeScript", language: "ts", code: definition.signature }] },
  ];
  if (parameters?.length) sections.push({ title: isType ? "Fields and behavior" : isConstructor ? "Configuration" : "Parameters", bullets: parameters });
  sections.push(...optionSections(definition));
  if (result) sections.push({ title: "Result", body: [result] });
  if (definition.behavior?.length) sections.push({ title: "Behavior", bullets: definition.behavior });
  if (definition.sideEffects?.length) sections.push({ title: "Side effects and completion", bullets: definition.sideEffects });
  if (definition.errors?.length) sections.push({ title: "Errors and empty results", bullets: definition.errors });
  sections.push({ title: "Example", code: [{ label: "example.ts", language: "ts", code: definition.example }] });
  if (definition.examples?.length) sections.push({ title: "More examples", code: definition.examples.map((example) => ({ ...example, language: "ts" })) });
  if (definition.notes?.length) sections.push({ title: "Important behavior", bullets: definition.notes });
  if (related.length) sections.push({ title: "Related APIs", links: related });
  return {
    slug: href.replace(/^\/docs\//, ""),
    eyebrow: definition.family,
    title: definition.label,
    description: definition.purpose,
    sections,
  };
}

const overviewPage: DocPage = {
  slug: "api-reference",
  eyebrow: "API Reference",
  title: "Public API overview",
  description: "Choose the right MemoGrafter API level and package entry point.",
  sections: [
    { title: "Package entry points", body: ["The root package exposes application APIs and intentionally exported advanced primitives. Provider-independent subpaths let storage, schema, and Studio tooling load without evaluating optional provider SDKs."], code: [{ label: "imports.ts", language: "ts", code: `import { MemoGrafterAgent, MemoGrafter } from "memo-grafter";\nimport { PostgresGraphStore } from "memo-grafter/store";\nimport { mgTable } from "memo-grafter/schema";\nimport { createStudioPreviewService } from "memo-grafter/studio";` }] },
    { title: "Choose an API level", bullets: ["Use `MemoGrafterAgent` for a conversational agent that owns one active session and handles recall, model invocation, history, and ingestion together.", "Use `MemoGrafter` when your application owns session identifiers, prompt orchestration, or queue timing.", "Use `MemoGrafterFleet` when several named agents share or exchange memory under an explicit fleet policy.", "Use `MemoGrafterCrawler` to schedule supported lifecycle maintenance without exposing the internal maintenance passes.", "Use provider adapters to connect supported chat and embedding clients to MemoGrafter’s provider-neutral interfaces."] },
    { title: "Advanced APIs", body: ["Pipelines, GraphStore, schema metadata, and Studio preview services are supported package exports for framework authors, custom storage implementations, migrations, and local tooling. Most applications should start with `MemoGrafterAgent` or `MemoGrafter`."], links: [{ label: "Pipelines", href: "/docs/api-reference/pipelines/ingest-pipeline", description: "Compose ingestion, retrieval, and grafting directly." }, { label: "GraphStore", href: "/docs/api-reference/graph-store", description: "Implement or use the persistence contract." }, { label: "Schema", href: "/docs/api-reference/schema/mg-table", description: "Use typed schema metadata and builders." }, { label: "Studio Preview", href: "/docs/api-reference/studio-preview/create-studio-preview-service", description: "Build read-only recall and graft previews." }] },
  ],
};

export const apiReferencePages: DocPage[] = [overviewPage, ...visibleDefinitions.map(apiPage), currentErrorPage];

const familyOrder = ["MemoGrafterAgent", "Configuration", "MemoGrafter", "Fleet Memory", "Maintenance", "Provider Adapters", "Types", "Pipelines", "GraphStore", "Schema", "Studio Preview"];
const familyIcons: Record<string, DocNavIcon> = { MemoGrafterAgent: "bot", Configuration: "settings", MemoGrafter: "box", "Fleet Memory": "users", Maintenance: "refresh", "Provider Adapters": "plug", Types: "braces", Pipelines: "workflow", GraphStore: "database", Schema: "table", "Studio Preview": "monitor-play" };

export const apiReferenceNavItems: DocNavNode[] = [
  { href: "/docs/api-reference", label: "Overview", icon: "book-open" },
  ...familyOrder.map((family): DocNavNode => {
    const familyDefinitions = visibleDefinitions.filter((definition) => definition.family === family);
    const direct = familyDefinitions.filter((definition) => !definition.subgroup);
    const subgroups = [...new Set(familyDefinitions.flatMap((definition) => definition.subgroup ? [definition.subgroup] : []))];
    return {
      type: "group",
      id: `api-${toSlug(family)}`,
      label: family,
      items: [
        ...direct.map((definition) => ({ href: apiRoute(definition), label: definition.label, icon: definition.icon ?? familyIcons[family] })),
        ...subgroups.map((subgroup): DocNavNode => ({
          type: "group",
          id: `api-${toSlug(family)}-${toSlug(subgroup)}`,
          label: subgroup,
          items: familyDefinitions.filter((definition) => definition.subgroup === subgroup).map((definition) => ({ href: apiRoute(definition), label: definition.label, icon: definition.icon ?? familyIcons[family] })),
        })),
      ],
    };
  }),
  { href: "/docs/api-reference/error-handling", label: "Error Handling", icon: "circle-alert" },
];
