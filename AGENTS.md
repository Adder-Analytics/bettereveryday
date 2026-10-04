<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# JSX text spacing

This compiler drops the leading space of JSX text after an element or `{expression}` whenever the text contains an HTML entity (`<em>can</em> take, isn&rsquo;t` renders "cantake"). The local ESLint rule `local/entity-text-space` (`eslint-rules/`) catches it; `bunx eslint --fix` inserts the `{" "}` guard.
