import { siAngular, siExpress, siHtml5, siJavascript, siLinux, siMysql, siNextdotjs, siNodedotjs, siPython, siReact, siRedux, siTypescript } from "simple-icons";

type IconDef = { title: string; path: string; color: string };

// A four-point sparkle; AI prompting isn't tied to one brand, so it gets a generic mark.
const SPARKLES_PATH =
  "M10 3l2.1 6.9L19 12l-6.9 2.1L10 21l-2.1-6.9L1 12l6.9-2.1zM19 1l.9 2.1L22 4l-2.1.9L19 7l-.9-2.1L16 4l2.1-.9z";

// A database cylinder: three stacked discs.
const DATABASE_PATH =
  "M12 2C7.03 2 3 3.79 3 6v12c0 2.21 4.03 4 9 4s9-1.79 9-4V6c0-2.21-4.03-4-9-4zm0 2c4.42 0 7 1.5 7 2s-2.58 2-7 2-7-1.5-7-2 2.58-2 7-2zM5 8.69C6.65 9.52 9.18 10 12 10s5.35-.48 7-1.31V12c0 .5-2.58 2-7 2s-7-1.5-7-2V8.69zm0 6C6.65 15.52 9.18 16 12 16s5.35-.48 7-1.31V18c0 .5-2.58 2-7 2s-7-1.5-7-2v-3.31z";

// A small binary tree (three nodes, two edges) for Data Structures & Algorithms.
const TREE_PATH =
  "M9.5 4.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0zM3 18.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0zM16 18.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0zM11.54 7.27L7.32 16.37L5.96 15.73L10.18 6.63zM12.46 7.27L16.68 16.37L18.04 15.73L13.82 6.63z";

/**
 * Keys used in each course's meta.json `icon` field. Brand marks come from Simple Icons (CC0).
 * `currentColor` is used for near-black marks so they stay visible in dark mode.
 */
const ICONS: Record<string, IconDef> = {
  react: { title: siReact.title, path: siReact.path, color: `#${siReact.hex}` },
  "react-native": { title: "React Native", path: siReact.path, color: `#${siReact.hex}` },
  angular: { title: siAngular.title, path: siAngular.path, color: "#DD0031" },
  nextjs: { title: siNextdotjs.title, path: siNextdotjs.path, color: "currentColor" },
  javascript: { title: siJavascript.title, path: siJavascript.path, color: `#${siJavascript.hex}` },
  python: { title: siPython.title, path: siPython.path, color: `#${siPython.hex}` },
  // Simple Icons' MySQL mark includes a wordmark that is illegible at tile size, so use a database glyph in MySQL blue.
  mysql: { title: siMysql.title, path: DATABASE_PATH, color: `#${siMysql.hex}` },
  html5: { title: siHtml5.title, path: siHtml5.path, color: `#${siHtml5.hex}` },
  nodejs: { title: siNodedotjs.title, path: siNodedotjs.path, color: `#${siNodedotjs.hex}` },
  express: { title: siExpress.title, path: siExpress.path, color: "currentColor" },
  typescript: { title: siTypescript.title, path: siTypescript.path, color: `#${siTypescript.hex}` },
  redux: { title: siRedux.title, path: siRedux.path, color: `#${siRedux.hex}` },
  // Tux's official yellow is too faint on a light background, so follow the text colour.
  linux: { title: siLinux.title, path: siLinux.path, color: "currentColor" },
  tree: { title: "Data Structures & Algorithms", path: TREE_PATH, color: "#0D9488" },
  sparkles: { title: "AI", path: SPARKLES_PATH, color: "#D97757" },
};

/** Renders a course's logo at 1em, so it sizes like the text around it. Unknown keys render as text (e.g. an emoji). */
export function CourseIcon({ icon, className = "" }: { icon: string; className?: string }) {
  const def = ICONS[icon];
  if (!def) return <span className={className}>{icon}</span>;

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill={def.color}
      aria-label={def.title}
      className={`inline-block shrink-0 ${className}`}
    >
      <path d={def.path} />
    </svg>
  );
}
