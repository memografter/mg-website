import type { ApiDefinition } from "./api-reference";
import type { DocPage } from "./types";
import contracts from "./contracts.json";

const signatures: Record<string, string> = contracts.signatures;
// These forwarding methods infer their return types; API_REFERENCE.md spells them out.
const inferredSignatures: Record<string, string> = {
  "MemoGrafter.getTopicClusters": 'getTopicClusters(sessionId: string): Promise<Array<Omit<TopicCluster, "embedding">>>',
  "MemoGrafter.backfillTopicClusters": 'backfillTopicClusters(sessionId: string, options?: { afterId?: string; limit?: number }): Promise<{ scanned: number; nextCursor: string | null; warnings: MemoGrafterWarning[] }>',
};
function method(family: string, name: string, purpose: string, example: string, behavior: string[], relatedSlug: string): ApiDefinition {
  const signature = signatures[`${family}.${name}`] ?? inferredSignatures[`${family}.${name}`];
  if (!signature) throw new Error(`Missing documented signature: ${family}.${name}`);
  return {
    family, slug: name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), label: `${name}()`,
    signature, purpose, example,
    ...(family === "MemoGrafterAgent" ? { useWhen: [name === "pinTopic"
      ? "Use a pin for an enduring instruction or constraint that should remain in active context across unrelated queries."
      : name === "unpinTopic"
        ? "Use this when a topic should return to normal query-based selection."
        : "Inspect required topics before reviewing or adjusting the pinned-context budget."] } : {}),
    behavior,
    related: [{ label: "Workflow guide", href: `/docs/${relatedSlug}` }],
  };
}

export const currentApiDefinitions: ApiDefinition[] = [
  method("MemoGrafter", "create", "Resolve configuration, validate local readiness, and initialize storage.",
    `import config from "./memo-grafter/mg.config.js";\nconst memo = await MemoGrafter.create(config);`,
    ["Validates adapter shape, required provider SDKs and environment variables without a provider API call. Storage initialization verifies the migrated schema.", "Import the configuration explicitly. Overrides can disable cache or queue with false."], "guides/existing-chatbot"),
  method("MemoGrafter", "context", "Build fresh memory context before an application-owned model call.",
    `const context = await memo.context({\n  sessionId: "support-42", query: "What did we decide?",\n  candidateLimit: 40, limit: 10, tokenBudget: 1200,\n}, { timeoutMs: 10_000 });\nconsole.log(context.systemPrompt, context.episodes);`,
    ["Reads current storage without using the configured recall cache or generating an assistant response. Optional query contextualization can use the LLM to rewrite an underspecified query.", "Prepends active pinned context, deduplicates recalled topic blocks, and returns facts, episode history, selection diagnostics, and current cluster metadata.", "Required database or embedding failures reject. Best-effort failures are reported through warnings and degraded results."], "guides/existing-chatbot"),
  method("MemoGrafter", "analyze", "Persist one completed exchange after your application generates the response.",
    `await memo.analyze({ sessionId: "support-42", userMessage, assistantMessage });`,
    ["Accepts exactly one user-assistant pair. Do not ingest the same exchange through another API.", "With initialized durable storage, acceptance persists an immutable message range and run. Inline completion returns topic nodes; queue acceptance returns an empty array.", "Custom stores without durable capabilities use the compatibility append path. Use analyzeDetailed for explicit receipts and idempotency keys."], "guides/existing-chatbot"),
  method("MemoGrafter", "analyzeDetailed", "Accept a completed exchange with an explicit durable ingestion receipt.",
    `const receipt = await memo.analyzeDetailed({\n  sessionId: "support-42", userMessage, assistantMessage,\n  idempotencyKey: "support-42:exchange-17",\n}, { timeoutMs: 30_000 });\nconsole.log(receipt.ingestionRunId, receipt.messagesPersisted, receipt.graphProcessed);`,
    ["Requires initialized durable-store capabilities. Reuse the same application exchange key on retries to avoid duplicate messages.", "Receipt status is processed or queued; graphProcessed distinguishes visibility from acceptance. The durable run has its own richer status.", "Cancellation before acceptance prevents the write. Errors after acceptance retain safe state indicating that messages persist."], "guides/durable-ingestion"),
  method("MemoGrafter", "getIngestionRun", "Inspect the durable authority for one accepted ingestion run.",
    `const run = await memo.getIngestionRun(receipt.ingestionRunId);\nconsole.log(run?.status, run?.attemptCount, run?.lastErrorCode);`,
    ["Returns a run or null. Includes accepted range, status, attempts, lease timestamps, and safe failure metadata.", "A queued receipt alone does not prove graph completion. Inspect completed or completed_with_warnings before depending on new memory."], "guides/durable-ingestion"),
  method("MemoGrafter", "reconcileSession", "Inspect ingestion consistency for a session and optionally apply selected repairs.",
    `const report = await memo.reconcileSession("support-42");\nconsole.log(report.issues);\n// After reviewing the issues:\nawait memo.reconcileSession("support-42", {\n  mode: "repair", repairs: ["queue-accepted"],\n});`,
    ["Defaults to read-only inspect. Repair mode requires an explicit repairs list.", "Supported repairs are queue-accepted, recover-expired-lease, and requeue-retryable. The report lists detected and actually repaired issue codes.", "Requires the corresponding optional store capabilities; Doctor and Studio inspect only."], "guides/durable-ingestion"),
  method("MemoGrafter", "reconcilePendingIngestion", "Inspect pending ingestion across sessions and apply only explicitly selected repairs.",
    `const report = await memo.reconcilePendingIngestion({ mode: "inspect" });\nconsole.log(report.issues);`,
    ["Uses the same inspect/repair contract as reconcileSession.", "Inspect accepted work, expired leases, retryable failures, cursor inconsistencies, orphan graph rows, and duplicate ranges before selecting repairs."], "guides/durable-ingestion"),
  method("MemoGrafter", "checkReadiness", "Inspect adapter and storage readiness on an initialized core instance.",
    `const readiness = await memo.checkReadiness();\nconsole.log(readiness);`,
    ["Use structured readiness checks to explain configuration problems.", "Factory readiness checks validate local SDK and environment requirements without spending a provider request."], "guides/errors-and-readiness"),
  method("MemoGrafter", "getTopicClusters", "List a session's organizational domains without embedding vectors.",
    `const clusters = await memo.getTopicClusters("support-42");\nconsole.log(clusters);`,
    ["Clusters belong to one session and organize stable topics.", "They do not affect retrieval ranking, graph traversal, prompts, or token allocation. Unsupported stores return an empty list."], "guides/topic-domains"),
  method("MemoGrafter", "backfillTopicClusters", "Classify existing topics through a bounded, resumable scan.",
    `let afterId: string | undefined;\ndo {\n  const page = await memo.backfillTopicClusters("support-42", { afterId, limit: 8 });\n  console.log(page.scanned, page.warnings);\n  afterId = page.nextCursor ?? undefined;\n} while (afterId);`,
    ["Enable clustering and migrate first. Continue with nextCursor until null.", "Classification respects cooldowns, evaluated revisions, and existing assignments. Run another full pass later to revisit eligible failures.", "Provider work happens outside the final transaction. A stale topic or catalog decision is refreshed and retried once."], "guides/topic-domains"),
  ...["MemoGrafter", "MemoGrafterAgent"].flatMap(family => {
    const owner = family === "MemoGrafter" ? "memo" : "agent";
    const session = owner === "memo" ? '"support-42", ' : "";
    return [
      method(family, "pinTopic", "Make an active session topic required context for future invocation planning.",
        `const changed = await ${owner}.pinTopic(${session}topicId);`,
        ["Persists the pin on the topic row and returns whether a row changed.", "Pins are ordered required context with a separate budget. Suppressed topics cannot contribute active pinned context; inactive memories remain excluded."], "guides/topic-pinning"),
      method(family, "unpinTopic", "Remove a topic's required-context pin while preserving its memory.",
        `const changed = await ${owner}.unpinTopic(${session}topicId);`,
        ["Returns whether a row changed. The topic can still be selected by normal retrieval.", "Unpinning does not forget facts, suppress the topic, or alter quality."], "guides/topic-pinning"),
      method(family, "getPinnedTopics", "Read active pinned topics in their persisted pin order.",
        `const topics = await ${owner}.getPinnedTopics(${owner === "memo" ? '"support-42"' : ""});`,
        ["Returns active pinned topics for the selected session.", "Agent reads wait for local pending ingestion; queue worker completion remains a separate boundary."], "guides/topic-pinning"),
    ];
  }),
  method("MemoGrafter", "getPinnedContext", "Compose active pinned memory within its separate token budget.",
    `const pinned = await memo.getPinnedContext("support-42");\nconsole.log(pinned.systemPrompt, pinned.tokenCount, pinned.truncated);`,
    ["Returns topics, active memories, prompt, token count, configured budget, and truncation state.", "Uses inject.tokenBudget. Forgotten, decayed, superseded, and suppressed-topic memories do not contribute."], "guides/topic-pinning"),
  {
    family: "Configuration", slug: "normalize-memory-quality", label: "normalizeMemoryQuality()",
    signature: "normalizeMemoryQuality(input: unknown): MemoryQuality", purpose: "Normalize four independent quality dimensions.",
    example: `import { normalizeMemoryQuality } from "memo-grafter";\nconst quality = normalizeMemoryQuality(undefined);\n// All dimensions default independently to 0.5.`,
    behavior: ["Finite numbers are clamped to [0, 1]. Missing or malformed dimensions default to 0.5.", "Quality assesses evidence and persistence characteristics, not current-query relevance."],
    related: [{ label: "Memory quality", href: "/docs/concepts/memory-quality" }],
  },
  {
    family: "Configuration", slug: "compute-persistence-score", label: "computePersistenceScore()",
    signature: "computePersistenceScore(input: unknown): number", purpose: "Compute a persistence score from structured quality.",
    example: `import { computePersistenceScore } from "memo-grafter";\nconst score = computePersistenceScore({\n  explicitness: 0.95, sourceReliability: 0.9, stability: 0.2, salience: 0.9,\n});`,
    behavior: ["Normalizes the input before applying the versioned persistence formula.", "Persistence influences maintenance. It does not boost semantic retrieval rank or resolve contradictory claims."],
    related: [{ label: "Quality and migration", href: "/docs/guides/memory-quality-migration" }],
  },
];

export const currentErrorPage: DocPage = {
  slug: "api-reference/error-handling", eyebrow: "API Reference", title: "Errors, warnings & readiness",
  description: "Handle structured errors, degraded results, deadlines, and durable ingestion state.",
  sections: [
    { title: "Structured failures", body: ["Public create, analyze, context, and foreground invoke boundaries use MemoGrafterError. Branch on code, operation, and retryable instead of message text. Required storage, provider, and embedding failures remain fatal to the affected operation."], code: [{ label: "errors.ts", language: "ts", code: `import { isMemoGrafterError } from "memo-grafter";\ntry {\n  await memo.analyzeDetailed(exchange, { timeoutMs: 30_000 });\n} catch (error) {\n  if (isMemoGrafterError(error)) {\n    console.error(error.toJSON());\n    // Inspect persisted range and retryability before retrying.\n  }\n  throw error;\n}` }] },
    { title: "Safe failure state", body: ["Ingestion errors can include sessionId, messageRange, messagesPersisted, cursorAdvanced, and retrySafe. toJSON() emits allowlisted operational metadata and excludes causes, prompts, provider payloads, credentials, and connection strings. Use the original idempotency key when retrying an accepted exchange."] },
    { title: "Cancellation and deadlines", bullets: ["MemoGrafterOperationOptions contains signal and timeoutMs at supported boundaries.", "Explicit cancellation reports OPERATION_ABORTED and is not automatically retryable. A framework deadline reports retryable OPERATION_TIMEOUT.", "Cancellation after durable acceptance does not erase accepted messages. Inspect the run before deciding recovery."] },
    { title: "Degraded success", body: ["Optional cache failures can return usable retrieval with degraded: true and structured warnings. Required queue connectivity is not an optional cache failure. Observe warnings through diagnostics.onWarning and inspect durable work separately."] },
    { title: "Readiness and shutdown", body: ["MemoGrafter.create validates local adapter shape, installed SDKs, and required environment variables without a provider call, then initializes storage. checkReadiness exposes structured checks. close({ drain: true, timeoutMs }) bounds shutdown; MemoGrafterShutdownError reports failures, pendingRunCount, and jobsMayBeActive. Closing local resources does not prove remote workers have finished."], links: [{ label: "Errors and readiness guide", href: "/docs/guides/errors-and-readiness" }, { label: "Durable ingestion", href: "/docs/guides/durable-ingestion" }] },
  ],
};
