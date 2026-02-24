"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const docGroups = [
  {
    group: "Web",
    sections: [
      {
        name: "Getting Started",
        links: [{ name: "Installation and Setup", slug: "web/installation" }],
      },
      {
        name: "Core Systems",
        links: [{ name: "Authentication", slug: "web/auth" }],
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
          { name: "Debugging Native Code", slug: "mobile/debugging" },
        ],
      },
      {
        name: "Core Systems",
        links: [{ name: "Authentication", slug: "mobile/auth" }],
      },
      {
        name: "Features",
        links: [{
          name: "Activities", slug: "mobile/activities"
        }],
      },
    ],
  },
  {
    group: "Backend",
    sections: [
      {
        name: "Overview",
        links: [{ name: "Architecture", slug: "backend/overview" }],
      },
      {
        name: "Database",
        links: [
          { name: "Schema", slug: "backend/database" },
          { name: "RPC Functions", slug: "backend/rpc-functions" },
          { name: "Migrations", slug: "backend/migrations" },
        ],
      },
      {
        name: "API",
        links: [{ name: "API Routes", slug: "backend/api-routes" }],
      },
    ],
  },
];

function NavContent({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {docGroups.map((group) => (
        <div key={group.group}>
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
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
                    onClick={onLinkClick}
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
    </>
  );
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex max-w-7xl w-full mx-auto p-4 md:gap-4">
      {/* Mobile menu button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed top-20 right-4 z-40 md:hidden bg-blue-600 text-white p-2 rounded-lg shadow-lg"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <nav className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 p-8 flex flex-col gap-6 overflow-y-auto">
            <button
              onClick={() => setDrawerOpen(false)}
              className="self-end text-gray-400 hover:text-gray-200"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
            <NavContent
              pathname={pathname}
              onLinkClick={() => setDrawerOpen(false)}
            />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-60 shrink-0 flex-col gap-6 bg-slate-900 p-8 rounded-lg">
        <NavContent pathname={pathname} />
      </nav>

      <main className="flex-1 shrink-0">{children}</main>
    </div>
  );
}
