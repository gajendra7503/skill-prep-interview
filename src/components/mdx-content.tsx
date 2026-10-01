import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CopyCodeBlock } from "@/components/copy-code-block";

const components = {
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 className="mt-10 mb-4 text-2xl font-semibold tracking-tight" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className="mt-8 mb-3 text-xl font-semibold tracking-tight" {...props} />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p className="mb-4 leading-7 text-zinc-700 dark:text-zinc-300" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-zinc-700 dark:text-zinc-300" {...props} />
  ),
  li: (props: React.ComponentProps<"li">) => <li className="leading-7" {...props} />,
  a: (props: React.ComponentProps<"a">) => (
    <a className="font-medium text-indigo-600 underline underline-offset-2 dark:text-indigo-400" {...props} />
  ),
  table: (props: React.ComponentProps<"table">) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-semibold dark:border-zinc-800 dark:bg-zinc-900" {...props} />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td className="border border-zinc-200 px-3 py-2 dark:border-zinc-800" {...props} />
  ),
  pre: (props: React.ComponentProps<"pre">) => <CopyCodeBlock {...props} />,
  code: (props: React.ComponentProps<"code">) => (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800" {...props} />
  ),
};

export function MdxContent({ source }: { source: string }) {
  return (
    <div className="mdx-body">
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeHighlight],
          },
        }}
      />
    </div>
  );
}
