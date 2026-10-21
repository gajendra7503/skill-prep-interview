"use client";

import { useState } from "react";

/** Share links for an earned certificate: copy the public verification link, add to LinkedIn, or send on WhatsApp. */
export function ShareCertificate({
  verifyUrl,
  certificateId,
  courseTitle,
  issuedAt,
}: {
  verifyUrl: string;
  certificateId: string;
  courseTitle: string;
  issuedAt: string;
}) {
  const [copied, setCopied] = useState(false);
  const issued = new Date(issuedAt);

  const linkedIn = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${courseTitle} course`,
    organizationName: "SkillPrep",
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl: verifyUrl,
    certId: certificateId,
  })}`;
  const whatsApp = `https://wa.me/?text=${encodeURIComponent(
    `I completed the ${courseTitle} course on SkillPrep! Verify my certificate: ${verifyUrl}`
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", verifyUrl);
    }
  }

  const button =
    "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600";

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between print:hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Share your achievement</p>
        <p className="truncate text-sm text-slate-500">
          Anyone can verify it at <span className="font-mono text-slate-700 dark:text-slate-300">{verifyUrl}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={copy} className={button} aria-live="polite">
          {copied ? "Link copied" : "Copy link"}
        </button>
        <a href={linkedIn} target="_blank" rel="noopener noreferrer" className={button}>
          Add to LinkedIn
        </a>
        <a href={whatsApp} target="_blank" rel="noopener noreferrer" className={button}>
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
