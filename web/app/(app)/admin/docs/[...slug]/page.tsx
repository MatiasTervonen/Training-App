import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import { CopyBlock } from "./copy-block";

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
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <article className="prose prose-invert max-w-none prose-headings:font-medium">
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
