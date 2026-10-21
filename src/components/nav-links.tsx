"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/** Header tabs; the one for the current page is highlighted and marked as the current page. */
export function NavLinks({ links, className, activeClassName }: { links: NavItem[]; className: string; activeClassName: string }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`${className} ${active ? activeClassName : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
