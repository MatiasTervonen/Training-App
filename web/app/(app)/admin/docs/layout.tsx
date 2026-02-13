"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const docGroups = [
  {
    group: "Web",
    sections: [
      {
        name: "Getting Started",
        links: [{ name: "Installation and Setup", slug: "web/installation" }],
      },
    ],
  },
  {
    group: "Mobile",
    sections: [
      {
        name: "Getting Started",
        links: [
          { name: "Installation and Setup", slug: "mobile/installation" },
          { name: "Development", slug: "mobile/development" },
        ],
      },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex max-w-7xl w-full mx-auto p-4  md:gap-4">
      <nav className="w-60 shrink-0 flex flex-col gap-6 bg-slate-900 p-8 rounded-lg ">
        {docGroups.map((group) => (
          <div key={group.group}>
            <h2 className="text-sm  uppercase tracking-wider text-gray-400 mb-3">
              {group.group}
            </h2>
            {group.sections.map((section) => (
              <div key={section.name} className="flex flex-col gap-1 mb-3">
                <h3 className="text-sm text-gray-300">{section.name}</h3>
                {section.links.map((link) => {
                  const isActive = pathname === `/admin/docs/${link.slug}`;

                  return (
                    <Link
                      key={link.slug}
                      href={`/admin/docs/${link.slug}`}
                      className={`pl-3 text-sm transition-colors ${isActive ? "text-blue-500 font-medium underline" : "text-gray-400 hover:text-gray-200"}`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <main className="flex-1 shrink-0">{children}</main>
    </div>
  );
}
