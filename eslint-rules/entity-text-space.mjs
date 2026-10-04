/**
 * The compiler this Next version ships (SWC) drops the leading space of a JSX
 * text run that follows an element or an `{expression}` whenever that run
 * contains an HTML entity — `<em>can</em> take, this isn&rsquo;t` renders as
 * "cantake", and `{toolCountWord} working &mdash;` as "twenty-fourworking".
 * Plain text, typed Unicode (’ —), and runs without an entity are unaffected,
 * which is why it slips past reading the source and has been caught one
 * sentence at a time on rendered pages.
 *
 * This rule finds every such run and autofixes it with the guard the codebase
 * already uses by hand: an explicit `{" "}` in front of the text.
 */
const ENTITY = /&[a-zA-Z][a-zA-Z0-9]*;|&#x?[0-9a-fA-F]+;/;
const LEADING_INLINE_SPACE = /^[ \t]+(?=\S)/;

const rule = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Guard the leading space of JSX text that contains an HTML entity, which the compiler otherwise drops",
    },
    messages: {
      dropped:
        'This space is dropped at build time (the text contains an HTML entity). Write it as {" "}.',
    },
    schema: [],
  },
  create(context) {
    const source = context.sourceCode ?? context.getSourceCode();
    return {
      JSXText(node) {
        const raw = source.getText(node);
        const lead = raw.match(LEADING_INLINE_SPACE);
        if (!lead || !ENTITY.test(raw)) return;
        const siblings = node.parent?.children ?? [];
        const prev = siblings[siblings.indexOf(node) - 1];
        if (!prev || prev.type === "JSXText") return;
        context.report({
          node,
          messageId: "dropped",
          fix: (fixer) =>
            fixer.replaceTextRange(
              [node.range[0], node.range[0] + lead[0].length],
              '{" "}'
            ),
        });
      },
    };
  },
};

const plugin = { rules: { "entity-text-space": rule } };

export default plugin;
