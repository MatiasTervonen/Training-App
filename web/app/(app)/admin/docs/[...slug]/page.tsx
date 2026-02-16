import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CopyBlock } from "@/app/(app)/admin/docs/[...slug]/copy-block";

// Pre-build all doc pages during "next build" so they are served as static HTML.
// Without this, Vercel doesn't include the .md files in the deployment and the pages crash.
export async function generateStaticParams() {
  const docsDir = path.join(process.cwd(), "app", "content", "docs");

  const params: { slug: string[] }[] = [];

  function scanDir(dir: string, segments: string[]) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name), [...segments, entry.name]);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const slug = [...segments, entry.name.replace(/\.md$/, "")];
        params.push({ slug });
      }
    }
  }
  scanDir(docsDir, []);
  return params;
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  const filePath = path.join(
    process.cwd(),
    "app",
    "content",
    "docs",
    ...slug.slice(0, -1),
    `${slug[slug.length - 1]}.md`,
  );
  if (!fs.existsSync(filePath)) notFound();
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <article className="prose prose-invert max-w-none font-body prose-headings:font-primary prose-headings:font-medium bg-slate-900 p-8 rounded-lg min-h-[calc(100vh-104px)]">
      <ReactMarkdown
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return <CopyBlock>{String(children).trimEnd()}</CopyBlock>;
            }
            return <code className={className}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
