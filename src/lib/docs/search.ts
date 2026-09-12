import { docsNavGroups } from "./nav";
import { docsPages } from "./pages";
import { getDocSectionId } from "./section-id";

export type DocSearchRecord = {
  id: string;
  href: string;
  title: string;
  pageTitle: string;
  category: string;
  path: string[];
  content: string;
};

const navPathByHref = new Map<string, string[]>();

for (const group of docsNavGroups) {
  visitNav(group.items, [group.title]);
}

export const docsSearchIndex: DocSearchRecord[] = docsPages.flatMap((page) => {
  const pageHref = page.slug ? `/docs/${page.slug}` : "/docs";
  const path = navPathByHref.get(pageHref) ?? [page.eyebrow, page.title];
  const category = path[0];
  const pageRecord: DocSearchRecord = {
    id: pageHref,
    href: pageHref,
    title: page.title,
    pageTitle: page.title,
    category,
    path,
    content: [page.eyebrow, page.description].join(" "),
  };

  const sectionRecords = page.sections.map((section) => {
    const content = [
      ...section.body ?? [],
      ...section.bullets ?? [],
      ...section.table?.headers ?? [],
      ...section.table?.rows.flat() ?? [],
      ...(section.warning ? [section.warning.title, section.warning.body] : []),
      ...section.links?.flatMap((link) => [link.label, link.description ?? ""]) ?? [],
      ...section.code?.flatMap((block) => [block.label, block.code]) ?? [],
    ].join(" ");

    return {
      id: `${pageHref}#${getDocSectionId(section.title)}`,
      href: `${pageHref}#${getDocSectionId(section.title)}`,
      title: section.title,
      pageTitle: page.title,
      category,
      path,
      content,
    };
  });

  return [pageRecord, ...sectionRecords];
});

function visitNav(items: (typeof docsNavGroups)[number]["items"], parentPath: string[]) {
  for (const item of items) {
    if (item.type === "group") visitNav(item.items, [...parentPath, item.label]);
    else navPathByHref.set(item.href, [...parentPath, item.label]);
  }
}
