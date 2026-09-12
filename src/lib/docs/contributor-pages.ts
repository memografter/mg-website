import type { DocPage, DocSection } from "./types";

const githubRepository = "https://github.com/mayhemking007/memo-grafter";
const githubIssues = `${githubRepository}/issues`;

function contributorPage(
  slug: string,
  title: string,
  description: string,
  sections: DocSection[],
): DocPage {
  return {
    slug: slug ? `contributing/${slug}` : "contributing",
    title,
    description,
    eyebrow: "Contributing",
    sections,
  };
}

export const contributorPages: DocPage[] = [
  contributorPage("", "Contributing to MemoGrafter", "Set up the repository, understand its boundaries, propose focused changes, and send well-tested pull requests.", [
    {
      title: "Welcome",
      body: [
        "Suggestions, bug reports, documentation improvements, tests, provider adapters, Studio improvements, and code contributions are welcome.",
        "Keep issues, reviews, and design discussions polite and constructive. Focus each contribution on a clear problem or outcome so it is easier to discuss, test, and review.",
      ],
    },
    {
      title: "Contribution workflow",
      bullets: [
        "Search open and closed issues before starting substantial work.",
        "Create a new issue or reference an existing one so the intended behavior and scope are clear.",
        "Fork the repository, clone your fork, and add the main repository as `upstream`.",
        "Create a focused branch from an up-to-date `main` branch.",
        "Implement the change and add or update appropriate tests.",
        "Update documentation when public behavior, configuration, or usage changes.",
        "Open a focused pull request that explains the change, motivation, and validation.",
      ],
    },
    {
      title: "Start here",
      links: [
        {
          label: "Development setup",
          href: "/docs/contributing/development-setup",
          description: "Clone, configure, build, migrate, test, and run Studio locally.",
        },
        {
          label: "Project structure",
          href: "/docs/contributing/project-structure",
          description: "Understand the boundaries between core logic, storage, providers, CLI, Studio, tests, and examples.",
        },
        {
          label: "Creating issues",
          href: "/docs/contributing/creating-issues",
          description: "Search for existing work and write a useful bug report or proposal.",
        },
        {
          label: "Testing and pull requests",
          href: "/docs/contributing/testing-and-pull-requests",
          description: "Choose a branch, run the right checks, and prepare a reviewable pull request.",
        },
      ],
    },
  ]),

  contributorPage("development-setup", "Development setup", "Prepare a local MemoGrafter checkout with PostgreSQL, optional Redis, migrations, tests, and Studio.", [
    {
      title: "Requirements",
      bullets: [
        "Node.js 18 or newer. The repository CI currently runs Node.js 20.",
        "npm. The repository commits `package-lock.json`, so use npm for dependency changes.",
        "Git and a GitHub account for the fork-and-pull-request workflow.",
        "Docker Desktop or Docker Engine with Compose when using the repository-provided local services.",
        "A compatible existing PostgreSQL installation with pgvector can be used instead of Docker.",
        "Redis is required only when working on queue mode or the optional recall cache.",
      ],
    },
    {
      title: "Fork and clone",
      body: [
        "Fork `mayhemking007/memo-grafter` on GitHub, clone your fork, and add the main repository as the `upstream` remote.",
      ],
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `git clone https://github.com/<your-github-username>/memo-grafter.git
cd memo-grafter
git remote add upstream https://github.com/mayhemking007/memo-grafter.git
git remote -v`,
        },
      ],
    },
    {
      title: "Install dependencies",
      code: [{ label: "terminal", language: "bash", code: "npm install" }],
    },
    {
      title: "Configure the environment",
      body: [
        "Copy the example environment file. Its default `DATABASE_URL` matches the PostgreSQL service in the repository's `compose.yml`.",
        "If you use an existing database, replace the default URL. Leave `REDIS_URL` empty unless you are enabling queue mode or the recall cache; the environment variable alone does not activate either feature.",
      ],
      code: [
        { label: "macOS or Linux", language: "bash", code: "cp .env.example .env" },
        { label: "PowerShell", language: "powershell", code: "Copy-Item .env.example .env" },
      ],
    },
    {
      title: "Start PostgreSQL only",
      body: [
        "PostgreSQL with pgvector is sufficient for normal development and the default unit tests. Start only the `postgres` service when you are not working on Redis-backed features.",
      ],
      code: [{ label: "terminal", language: "bash", code: "docker compose up -d postgres" }],
    },
    {
      title: "Start PostgreSQL and Redis",
      body: [
        "Start the complete contributor stack when testing queue mode, recall caching, or Redis integrations.",
      ],
      code: [{ label: "terminal", language: "bash", code: "docker compose up -d" }],
    },
    {
      title: "Inspect local services",
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `docker compose ps
docker compose logs -f postgres
docker compose exec postgres pg_isready -U memografter -d memografter
docker compose exec postgres psql -U memografter -d memografter -c "SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pgcrypto') ORDER BY extname;"
docker compose exec redis redis-cli ping`,
        },
      ],
      body: [
        "Run the Redis command only when Redis is running; a healthy Redis service returns `PONG`.",
      ],
    },
    {
      title: "Build, initialize, and migrate",
      body: [
        "In a cloned SDK checkout, use the development migration and Doctor runners without scaffolding consumer configuration. Consumer applications use npx memo-grafter init, migrate, and doctor. Migration manages only MemoGrafter-owned infrastructure.",
      ],
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `npm run build
npm run migrate
npm run doctor`,
        },
      ],
    },
    {
      title: "Run the standard checks",
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `npm run typecheck
npm run lint
npm run test:run`,
        },
      ],
    },
    {
      title: "Start Studio",
      body: [
        "Start the local Studio after migration to inspect sessions, graphs, tables, and Prompt Preview. Studio is local development tooling and should not be exposed as a public application endpoint.",
      ],
      code: [{ label: "terminal", language: "bash", code: "npx memo-grafter studio" }],
    },
    {
      title: "Provider setup smoke tests",
      body: [
        "Provider smoke tests require a working `DATABASE_URL` and the matching provider API key. They call external APIs and may incur normal usage charges. Redis is not required.",
      ],
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `# Requires OPENAI_API_KEY
npx tsx --env-file=.env tests/manual/setup-test/openai-smoke.ts

# Requires ANTHROPIC_API_KEY
npx tsx --env-file=.env tests/manual/setup-test/anthropic-smoke.ts

# Requires GEMINI_API_KEY
npx tsx --env-file=.env tests/manual/setup-test/gemini-smoke.ts`,
        },
      ],
    },
    {
      title: "Reset local services",
      body: [
        "Stop the containers without removing local database or Redis data with `docker compose down`.",
      ],
      warning: {
        title: "This permanently deletes local development data",
        body: "Running `docker compose down -v` removes the PostgreSQL and Redis volumes. Back up anything you need before using it.",
      },
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `docker compose down

# Permanently remove local PostgreSQL and Redis data
docker compose down -v`,
        },
      ],
    },
    {
      title: "Common setup failures",
      bullets: [
        "Unsupported Node.js version: install Node.js 18 or newer; use Node.js 20 to match CI.",
        "Docker daemon not running: start Docker Desktop or Docker Engine before running Compose.",
        "Port `5432` or `6379` already in use: stop the conflicting service or adjust the Compose mapping and matching environment URL.",
        "PostgreSQL container unhealthy: inspect `docker compose ps` and `docker compose logs postgres`.",
        "Missing `.env` or `DATABASE_URL` mismatch: copy `.env.example` and make the credentials, database, host, and port match the active PostgreSQL service.",
        "Old credentials persist: existing Docker volumes retain their initialized database credentials even after `compose.yml` changes.",
        "Studio reports an incomplete schema: run `npx memo-grafter init`, `npx memo-grafter migrate`, and `npx memo-grafter doctor`.",
        "pgvector or `pgcrypto` unavailable: use the repository Compose service or install and enable the extensions on the selected PostgreSQL server.",
        "Queue or cache tests fail without Redis: start the full Compose stack and explicitly configure the queue or cache.",
        "Provider smoke test fails: confirm the corresponding API key is loaded and the selected model is available.",
      ],
    },
  ]),

  contributorPage("project-structure", "Project structure", "Understand where MemoGrafter behavior belongs and keep provider, persistence, CLI, and Studio concerns isolated.", [
    {
      title: "Repository map",
      code: [
        {
          label: "memo-grafter",
          code: `src/
  adapters/       Provider SDK integrations
  agents/         Session and fleet-facing agents
  core/           Runtime orchestration and shared types
  ingestion/      Segmentation, extraction, and queue-backed ingest
  maintenance/    Conflict, versioning, and decay passes
  prompts/        Provider-neutral prompt construction
  retrieval/      Recall, grafting, and graph expansion
  schema/         MemoGrafter-owned schema metadata
  store/          GraphStore boundary and PostgreSQL implementation
  studio/         Provider-independent Studio preview services
  utils/          Focused reusable domain utilities
cli/
  commands/       init, migrate, doctor, and studio commands
  doctor/         Structured Doctor results and rendering
  studio/         Local server, API, repository, and bundled frontend
  utils/          Project, configuration, and database helpers
tests/
  unit/           Isolated automated tests
  package/        Published-entrypoint and CLI smoke tests
  core/           Database-backed core scenarios
  fleet/          Database-backed multi-agent scenarios
  manual/         Provider and realistic workflow smoke tests
examples/         Runnable package-user workflows
migrations/       Historical SQL migration references`,
        },
      ],
    },
    {
      title: "Core agents and orchestration",
      body: [
        "`src/agents/` exposes session-oriented and fleet-oriented workflows. `src/core/` coordinates adapters, storage, ingestion, retrieval, queues, and caching without owning provider SDK details.",
      ],
      bullets: [
        "Keep public agent behavior thin enough to delegate reusable work to pipelines and stores.",
        "Keep normalized shared contracts in provider-neutral types.",
        "Preserve session identity, lifecycle filtering, and graceful resource cleanup across orchestration changes.",
      ],
    },
    {
      title: "Pipelines and prompts",
      body: [
        "`src/ingestion/` builds graph memory, while `src/retrieval/` searches and assembles it for recall or grafting. `src/maintenance/` manages lifecycle annotations, and `src/prompts/` keeps prompt formatting separate from orchestration.",
      ],
      bullets: [
        "Pipeline logic should depend on small storage and adapter contracts.",
        "Prompt modules should format normalized data rather than import provider SDKs.",
        "Algorithm changes should include focused unit tests and realistic database-backed coverage when needed.",
      ],
    },
    {
      title: "Storage and schema",
      body: [
        "`src/store/GraphStore.ts` is the persistence boundary. `src/store/postgres-pgvector/` implements it with PostgreSQL and pgvector. `src/schema/` is the source of truth for MemoGrafter-owned extensions, tables, indexes, and migration metadata.",
      ],
      bullets: [
        "Keep application-owned tables outside MemoGrafter migrations.",
        "Update schema metadata, migration behavior, verification, tests, and documentation together.",
        "Do not make storage code depend on provider SDKs.",
      ],
    },
    {
      title: "Provider adapters",
      body: [
        "`src/adapters/` contains OpenAI, Anthropic, Gemini, and adapter contracts. Provider SDK imports belong in their adapter modules so package users pay only for the providers they choose.",
      ],
      bullets: [
        "Implement normalized LLM or embedding contracts at the adapter boundary.",
        "Keep provider-specific request types, authentication, and errors out of core pipelines.",
        "Add adapter unit tests and focused provider smoke tests without making provider credentials necessary for unrelated suites.",
      ],
    },
    {
      title: "CLI boundary",
      body: [
        "`cli/commands/` implements project initialization, migration, Doctor, and Studio startup. `cli/utils/` owns project discovery, configuration resolution, and shared database diagnostics.",
      ],
      bullets: [
        "Schema generation and Doctor use the provider-independent `memo-grafter/schema` entry point.",
        "Migration uses `memo-grafter/store`.",
        "CLI database tooling must not evaluate the provider-bearing package root.",
      ],
    },
    {
      title: "Studio boundary",
      body: [
        "`src/studio/` contains provider-independent preview services exported through `memo-grafter/studio`. `cli/studio/` contains the local HTTP host, API, database repository, and bundled frontend.",
      ],
      bullets: [
        "Session browsing, graph inspection, and table browsing must work without a provider SDK.",
        "Prompt Preview may use a configured embedder while remaining optional.",
        "Studio is local developer tooling, not an authenticated multi-user application.",
      ],
    },
    {
      title: "Tests and examples",
      body: [
        "`tests/unit/` is the default fast suite. Package tests protect exports and CLI workflows; core and fleet suites require PostgreSQL; manual tests cover provider calls and realistic workflows.",
        "`examples/` demonstrates package-user workflows and should use public APIs rather than internal implementation shortcuts.",
      ],
    },
{
  "title": "Durable memory implementation map",
  "body": [
    "src/ingestion/types.ts defines durable runs and receipts. Ingestion preparation and commit span the pipeline and store. src/ingestion/clustering handles optional domains; src/utils/memoryQuality.ts owns normalization, admission, reinforcement and persistence. src/invocation centralizes prompt planning. Schema metadata and migrations must evolve together."
  ]
},
{
  "title": "Cross-module review boundaries",
  "body": [
    "Changes to accepted ranges, cursor advancement, or canonical evidence affect ingestion and storage. Retrieval changes must preserve lifecycle filtering and keep domain metadata outside ranking. Fleet copies must retain quality/provenance and re-scope clusters. Studio and CLI consume the same contracts as runtime code."
  ]
}
]),

  contributorPage("creating-issues", "Creating issues", "Search for existing work, discuss scope before implementation, and provide enough context for maintainers to act.", [
    {
      title: "When to open an issue",
      body: [
        "Open an issue before implementing bugs, proposals, or larger changes so the intended behavior and scope can be discussed.",
      ],
      bullets: [
        "A reproducible bug or regression.",
        "A new user-facing capability or provider integration.",
        "A behavioral change that affects public APIs, configuration, persistence, or compatibility.",
        "A larger refactor, migration, or Studio change that benefits from agreement on boundaries.",
        "A documentation gap whose intended guidance needs clarification.",
      ],
    },
    {
      title: "Search before creating",
      bullets: [
        "Search both open and closed issues for the same behavior, error, or proposal.",
        "Try alternative terminology used by the API, CLI, database, provider, or Studio.",
        "Add useful reproduction details to an existing issue instead of creating a duplicate.",
        "Understand the intended scope before claiming or beginning a substantial change.",
      ],
      links: [
        {
          label: "Search MemoGrafter issues",
          href: githubIssues,
          description: "Review open and closed issues in the MemoGrafter repository.",
        },
      ],
    },
    {
      title: "Use the issue template",
      body: [
        "The repository's General issue template uses four sections. Replace the prompts with concrete details.",
      ],
      code: [
        {
          label: "GitHub issue",
          language: "markdown",
          code: `## What

Describe the change.

## Why

Why is this needed?

## Expected outcome

What should the expected outcome?

## Notes

Additional context or constraints.`,
        },
      ],
    },
    {
      title: "Writing a bug report",
      bullets: [
        "Provide minimal, ordered reproduction steps.",
        "Describe both the expected and actual behavior.",
        "Include relevant error output or logs after removing secrets and private memory content.",
        "Include the Node.js, MemoGrafter, operating-system, PostgreSQL, and pgvector versions when relevant.",
        "State whether Redis, queue mode, or recall caching is enabled.",
        "Include a minimal example or failing test when practical.",
      ],
    },
    {
      title: "Writing a proposal",
      bullets: [
        "Describe the intended user or contributor workflow.",
        "Explain why existing APIs or behavior do not solve the problem.",
        "Identify proposed public API, configuration, schema, CLI, or documentation changes.",
        "Call out compatibility and migration concerns.",
        "Describe alternatives considered and why they were not selected.",
        "Note the expected testing and documentation work.",
      ],
    },
    {
      title: "Keep issues safe and focused",
      bullets: [
        "Never post database passwords, provider keys, access tokens, private memory content, or complete connection strings.",
        "Keep one logical problem or proposal per issue.",
        "Use a concise title that describes the failure or desired outcome.",
        "Expect maintainers to refine the scope before implementation.",
        "Reference the issue from the related branch, commits, and pull request where practical.",
      ],
    },
    {
      title: "Create the issue",
      links: [
        {
          label: "Open a MemoGrafter issue",
          href: `${githubIssues}/new/choose`,
          description: "Use the repository template to create a structured issue.",
        },
      ],
    },
  ]),

  contributorPage("testing-and-pull-requests", "Testing and pull requests", "Create a focused branch, run the checks appropriate to your change, and open a reviewable pull request.", [
    {
      title: "Sync your fork",
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `git checkout main
git fetch upstream
git merge --ff-only upstream/main
git push origin main`,
        },
      ],
    },
    {
      title: "Create a focused branch",
      body: [
        "Choose a short description and a prefix that communicates the type of change.",
      ],
      bullets: [
        "`feat/short-description`: a new user-facing capability.",
        "`fix/short-description`: a bug fix.",
        "`chore/short-description`: maintenance, tooling, dependencies, or repository housekeeping.",
        "`refactor/short-description`: an internal change that preserves behavior.",
        "`test/short-description`: test additions or improvements.",
        "`docs/short-description`: documentation-only changes.",
      ],
      code: [{ label: "terminal", language: "bash", code: "git checkout -b feat/short-description" }],
    },
    {
      title: "Required checks",
      body: [
        "Every change should pass the repository's type, lint, build, and unit-test checks.",
      ],
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `npm run typecheck
npm run lint
npm run build
npm run test:run`,
        },
      ],
    },
    {
      title: "Change-specific checks",
      bullets: [
        "Run `npm run test:package` for CLI, package exports, packaging, or generated-project workflow changes.",
        "Run `npm run test:core` with `DATABASE_URL` configured for database-backed core behavior.",
        "Run `npm run test:fleet` with `DATABASE_URL` configured for fleet behavior.",
        "Add a focused test under `tests/manual/` when an algorithm or provider behavior benefits from realistic end-to-end verification.",
        "Redis is not required for default unit tests or PostgreSQL-only development.",
      ],
    },
    {
      title: "Live smoke tests",
      body: [
        "Before releasing, or after changing a critical Grafter, ingestion, Fleet, crawler, or lifecycle workflow, run the minimal live smoke suite.",
        "The suite uses the root `.env`; its basic chat, graph building, queue, and Fleet checks call OpenAI. Queue and recall-cache coverage runs when `REDIS_URL` is configured.",
      ],
      code: [
        {
          label: "Minimal live smoke suite",
          language: "bash",
          code: "npm run live-smoke:smoke",
        },
      ],
    },
    {
      title: "Live smoke report",
      body: [
        "The `--write-doc` option saves a Markdown report containing timings, answers, drift scores, node counts, queue metrics, and estimated token usage.",
        "See `tests/manual/live-smoke/README.md` for individual suite commands and reporting options.",
      ],
      code: [
        {
          label: "Markdown report",
          language: "bash",
          code: "npm run live-smoke:smoke -- --write-doc",
        },
      ],
    },
    {
      title: "Formatting, tests, and documentation",
      bullets: [
        "Add or update automated tests whenever behavior changes.",
        "Update public documentation when behavior, configuration, or usage changes.",
        "Update the changelog only when required by the release process.",
        "The repository does not currently define a formatter script. Do not invent a formatter command; use typecheck and lint as the enforced style checks until one is added.",
        "Keep provider-specific tests close to adapter behavior and do not require provider credentials for unrelated test suites.",
      ],
    },
    {
      title: "Commit and push",
      body: [
        "Use concise conventional-style commit and pull-request titles such as `feat: add provider adapter`, `fix: avoid duplicate ingestion`, or `docs: clarify migration setup`.",
      ],
      code: [
        {
          label: "terminal",
          language: "bash",
          code: `git add <changed-files>
git commit -m "feat: short description"
git push -u origin feat/short-description`,
        },
      ],
    },
    {
      title: "Open the pull request",
      bullets: [
        "Open the pull request from your fork into `mayhemking007/memo-grafter`'s `main` branch.",
        "Explain what changed and why.",
        "Link the related issue.",
        "Describe the checks and manual validation you performed.",
        "Mention compatibility considerations, migration requirements, and follow-up work.",
        "Keep the pull request focused on one logical change.",
        "Respond politely and constructively to review feedback.",
      ],
      links: [
        {
          label: "Open a MemoGrafter pull request",
          href: `${githubRepository}/compare`,
          description: "Compare your fork's focused branch with the MemoGrafter main branch.",
        },
      ],
    },
    {
      title: "Merge expectations",
      body: [
        "Accepted pull requests are expected to be squash-merged so `main` receives one focused commit. Keep commits understandable during review, but write the pull-request title and description so they can represent the final merged change.",
      ],
    },
{
  "title": "Current memory regression coverage",
  "body": [
    "Cover durable acceptance, idempotency, atomic commits, retry/lease transitions, reconciliation, and shutdown for ingestion changes. Quality changes need provenance/admission, reinforcement, migration, tie-breaking, and observe/enforce coverage. Episodes and clustering need stable-topic reuse, session isolation, revision races, cooldown, and retrieval-invariance checks.",
    "Use the manual memory-quality test for live extraction review; it writes reports and retains its session in Studio. npm run manual:clusters uses isolated PostgreSQL schemas without provider calls. npm run accuracy:clusters -- /path/to/mg.config.ts evaluates configured providers without database writes. Live provider suites have separate environment and cost requirements."
  ]
}
]),
];
