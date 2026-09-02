/**
 * The across-person self-distancing move, made concrete: rewrite a first-person
 * decision into the third person, so you read your own dilemma the way you'd read
 * a friend's. This is the mechanical half of Solomon's paradox (Grossmann and
 * Kross: people reason more wisely about a friend's identical problem than their
 * own, and the gap closes when they take a distanced view).
 *
 * It lived inside the cooling-off tool (`/cool`) for a long time, where it's one
 * of two quick distance passes for a *hot* decider. But the across-person move
 * isn't about heat — you reason worse about your own call stone-cold sober too —
 * and it now has a calm home of its own in `/advise`. So the rewrite lives here,
 * in one place both tools import, rather than being copied into the second: one
 * implementation, so the reframe can't drift between the two surfaces that show
 * it.
 */

/**
 * A best-effort rewrite of a first-person decision into the third person. It
 * doesn't have to be grammatically perfect; seeing your own dilemma with someone
 * else's name on it is the whole mechanism, and the original stays visible above
 * it. Pass a name to put it on the sentence, or leave it blank for "a friend".
 */
export function toThirdPerson(text: string, rawName: string): string {
  const name = rawName.trim();
  const subj = name || "a friend";
  const poss = name ? `${name}’s` : "their";
  const refl = name || "them";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const rules: [RegExp, string][] = [
    // question openers first, so "Am I" → "Is she", not "Is I"
    [/\bam I\b/gi, `is ${subj}`],
    [/\bdo I\b/gi, `does ${subj}`],
    [/\bhave I\b/gi, `has ${subj}`],
    [/\bwas I\b/gi, `was ${subj}`],
    [/\bcan I\b/gi, `can ${subj}`],
    // contractions
    [/\bI['’]m\b/gi, `${subj} is`],
    [/\bI['’]ve\b/gi, `${subj} has`],
    [/\bI['’]ll\b/gi, `${subj} will`],
    [/\bI['’]d\b/gi, `${subj} would`],
    // pronouns
    [/\bmyself\b/gi, refl],
    [/\bmy\b/gi, poss],
    [/\bmine\b/gi, poss],
    [/\bme\b/gi, refl],
    [/\bI\b/g, subj],
  ];

  let out = text;
  for (const [re, sub] of rules) out = out.replace(re, sub);
  return cap(out.trim());
}
