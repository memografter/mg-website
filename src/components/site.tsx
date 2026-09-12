import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Box,
  Braces,
  CircleDot,
  Database,
  GitBranch,
  MemoryStick,
  Network,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { LandingNavigation } from "@/components/landing-navigation";
import { CopyCodeButton } from "@/components/copy-code-button";
import { SiteBrand } from "@/components/site-brand";
export { DocsSidebar, MobileDocsNav } from "@/components/docs-sidebar";
import { highlightCode, inferCodeLanguage } from "@/lib/code-highlight";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  text: string;
  compact?: boolean;
};

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  text: string;
  align?: "left" | "center";
};

type PipelineStep = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export function Header({
  ctaHref = "/docs",
  ctaLabel = "Docs",
  ctaVariant = "secondary",
  githubUrl,
}: {
  ctaHref?: string;
  ctaLabel?: string;
  ctaVariant?: "primary" | "secondary";
  githubUrl?: string;
}) {
  if (githubUrl) return <LandingNavigation githubUrl={githubUrl} />;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080b0d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-emerald-300/30 bg-emerald-300/10">
            <MemoryStick className="h-5 w-5 text-emerald-300" />
          </span>
          <span className="text-base font-semibold">MemoGrafter</span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
          <Link href="/#features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-white">
            How it works
          </Link>
          <Link href="/#studio" className="transition-colors hover:text-white">
            Studio
          </Link>
          <Link href="/docs" className="transition-colors hover:text-white">Docs</Link>
          {githubUrl ? <a href={githubUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">GitHub</a> : null}
        </nav>
        <Link
          className={`${ctaVariant === "primary" ? "btn-primary" : "btn-secondary"} h-10 px-3 text-sm sm:px-4`}
          href={ctaHref}
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

export function Footer({ contained = false, githubUrl }: { contained?: boolean; githubUrl?: string } = {}) {
  return (
    <footer
      className={
        contained
          ? "mt-16 border-t border-white/10 py-8 text-sm text-slate-500"
          : "relative z-30 border-t border-white/10 bg-[#080b0d] px-5 py-8 text-sm text-slate-500 sm:px-8"
      }
    >
      <div className={contained ? "footer-grid" : "footer-grid mx-auto max-w-7xl"}>
        {/* Match the header: Next.js tracks LCP loading metadata by image URL. */}
        <div><SiteBrand eager /><p className="footer-description">Open-source memory infrastructure for TypeScript AI agents.</p></div>
        <div className="footer-links">
          <Link href="/docs" className="transition-colors hover:text-emerald-200">
            Docs
          </Link>
          <Link href="/#api" className="transition-colors hover:text-emerald-200">
            API
          </Link>
          <Link href="/#studio" className="transition-colors hover:text-emerald-200">
            Studio
          </Link>
          {githubUrl ? <a href={githubUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-emerald-200">GitHub</a> : null}
          <a href="https://www.npmjs.com/package/memo-grafter" target="_blank" rel="noreferrer" className="transition-colors hover:text-emerald-200">npm</a>
        </div>
        <p className="footer-meta">MIT licensed · © MemoGrafter</p>
      </div>
    </footer>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-sm font-medium uppercase leading-5 tracking-[0.18em] text-emerald-300">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-[clamp(2.25rem,3.5vw,3.5rem)] font-semibold leading-[1.12] text-white">
        {title}
      </h2>
      <p className="mt-4 text-pretty text-[clamp(1.05rem,1.2vw,1.2rem)] leading-[1.65] text-slate-300">{text}</p>
    </div>
  );
}

export function FeatureCard({ icon: Icon, title, text, compact }: FeatureCardProps) {
  return (
    <article className={`panel group h-full ${compact ? "p-5" : "p-6"}`}>
      <div className="mb-5 grid h-11 w-11 place-items-center rounded-md border border-sky-300/20 bg-sky-300/10 text-sky-200 transition-colors group-hover:border-emerald-300/30 group-hover:text-emerald-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </article>
  );
}

export async function CodeBlock({
  code,
  label,
  language,
  id,
}: {
  code: string;
  label: string;
  language?: string;
  id?: string;
}) {
  const codeLanguage = inferCodeLanguage(label, language);
  const highlightedCode = await highlightCode(code, codeLanguage);

  return (
    <div id={id} className="code-panel">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          </div>
          <div className="flex min-w-0 items-center gap-2 truncate text-xs text-slate-400">
            <Terminal className="h-4 w-4 shrink-0 text-amber-300" />
            <span className="truncate">{label}</span>
          </div>
        </div>
        <CopyCodeButton code={code} />
      </div>
      <div className="code-scroll code-highlight" dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </div>
  );
}

export function Pipeline({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.title} className="relative">
          {index < steps.length - 1 ? (
            <div className="absolute left-[calc(100%-12px)] top-9 hidden h-px w-8 bg-gradient-to-r from-emerald-300/60 to-sky-300/20 lg:block" />
          ) : null}
          <article className="panel pipeline-card h-full p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="pipeline-icon grid h-10 w-10 place-items-center rounded-md bg-emerald-300/10 text-emerald-200">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                0{index + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{step.text}</p>
          </article>
        </div>
      ))}
    </div>
  );
}

export function GraphMockup() {
  const nodes = [
    {
      label: "User",
      position: "left-[8%] top-[22%]",
      tone: "border-emerald-300/50 text-emerald-100",
    },
    {
      label: "Preference",
      position: "right-[8%] top-[14%]",
      tone: "border-sky-300/50 text-sky-100",
    },
    {
      label: "Project",
      position: "left-[18%] bottom-[12%]",
      tone: "border-amber-300/50 text-amber-100",
    },
    {
      label: "Graft",
      position: "right-[16%] bottom-[20%]",
      tone: "border-emerald-300/50 text-emerald-100",
    },
  ];

  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-lg border border-white/10 bg-[#0d1216] p-5">
      <div className="graph-grid absolute inset-0 opacity-70" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 330" aria-hidden="true">
        <path d="M110 95 C210 50 300 70 412 70" className="graph-line" />
        <path d="M130 250 C180 165 285 145 392 235" className="graph-line graph-line-blue" />
        <path d="M110 95 C150 170 150 210 130 250" className="graph-line graph-line-amber" />
        <path d="M412 70 C430 130 420 185 392 235" className="graph-line" />
      </svg>
      {nodes.map((node) => (
        <div
          key={node.label}
          className={`absolute ${node.position} rounded-md border bg-black/40 px-3 py-2 text-xs font-medium backdrop-blur ${node.tone}`}
        >
          {node.label}
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 w-[min(72%,360px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-[#090d10]/90 p-4 shadow-xl shadow-black/30">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Network className="h-4 w-4 text-emerald-300" />
            Active graft
          </div>
          <span className="rounded bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
            score 0.94
          </span>
        </div>
        <div className="space-y-3 text-xs text-slate-400">
          <div className="rounded border border-white/10 bg-white/[0.03] p-3">
            Prefers concise implementation notes.
          </div>
          <div className="rounded border border-white/10 bg-white/[0.03] p-3">
            Working on support-bot onboarding.
          </div>
          <div className="rounded border border-white/10 bg-white/[0.03] p-3">
            Avoid storing payment details.
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudioMockup() {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1014] shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Box className="h-4 w-4 text-sky-300" />
          Studio
        </div>
        <span className="rounded bg-amber-300/10 px-2 py-1 text-xs text-amber-200">
          12 pending
        </span>
      </div>
      <div className="grid min-h-[360px] grid-cols-[120px_1fr] sm:grid-cols-[170px_1fr]">
        <aside className="border-r border-white/10 bg-white/[0.02] p-3 text-xs text-slate-500">
          {["Graph", "Review", "Grafts", "Policies"].map((item, index) => (
            <div
              key={item}
              className={`mb-2 rounded px-3 py-2 ${
                index === 1 ? "bg-emerald-300/10 text-emerald-200" : ""
              }`}
            >
              {item}
            </div>
          ))}
        </aside>
        <div className="min-w-0 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Review candidate</h3>
              <p className="mt-1 text-xs text-slate-500">Extracted from checkout assistant</p>
            </div>
            <CircleDot className="h-5 w-5 shrink-0 text-emerald-300" />
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-200">
              <Database className="h-4 w-4 text-amber-300" />
              preference.shipping
            </div>
            <p className="text-sm leading-6 text-slate-400">
              User prefers delivery windows after 5 PM on weekdays.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["approve", "redact", "merge"].map((action) => (
                <span key={action} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300">
                  {action}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
              <Braces className="mb-2 h-4 w-4 text-sky-300" />
              schema validated
            </div>
            <div className="rounded border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
              <GitBranch className="mb-2 h-4 w-4 text-emerald-300" />
              linked to usr_2049
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
