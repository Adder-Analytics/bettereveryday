/**
 * The read behind "Is It Real? Before You Pay, Click or Reply" (/scam).
 *
 * A text says a parcel is held for a £1.45 fee. A caller from "the fraud team"
 * says your savings aren't safe where they are. A message from a new number
 * starts "Hi Mum". Each one asks you to decide, now, whether it's real, and the
 * things people check to decide are the things a scammer can fake for free.
 *
 *   - Looking at it doesn't work. In the UK's Take Five campaign survey (2018),
 *     80% of people said they could spot a scam approach; in its quiz of over
 *     63,000 people, 9% got every question right. Logos, caller ID, perfect
 *     English and knowing your name or the last digits of your card all cost a
 *     scammer nothing, so none of them is evidence.
 *   - What gives it away is the ask, and how it got to you. Stajano and Wilson
 *     (Communications of the ACM, 2011), from scams recreated for the BBC's The
 *     Real Hustle, reduced hundreds of frauds to seven principles: distraction,
 *     social compliance (deference to authority), the herd, dishonesty,
 *     kindness, need and greed, and time pressure. The tells in the read are
 *     those principles as they show up in a message: an authority you'd obey,
 *     a clock, a windfall, a secret.
 *   - A hot head says yes. Kircanski and colleagues (Psychology and Aging,
 *     2018) found that inducing high arousal, good or bad, raised people's
 *     intention to buy falsely advertised products; they suggest postponing
 *     money decisions until calm. Every clock and threat in a scam is there to
 *     stop you doing that.
 *   - The losses are large and mostly by transfer. The FTC's figures for 2025:
 *     about $15.9 billion reported lost, impostors the most reported kind, bank
 *     transfers the payment method with the highest losses. UK Finance
 *     reported £576 million lost to authorised push payment fraud in 2025.
 *
 * So the read doesn't ask "does it look real?". It asks who started the
 * contact, what it asks for, how it wants paying, and what's pushing you; and
 * it ends in the one check that a scammer can't fake: contacting them yourself,
 * on details you found yourself.
 *
 * The read, checked in order:
 *   1. "undo"  — you've already paid, said a code or installed something:
 *                the steps, fastest first.
 *   2. "stop"  — it asks in a way nobody real asks: a code, gift cards,
 *                crypto, cash to a courier, a "safe account", a secret.
 *   3. "check" — they contacted you and want something. Don't act inside the
 *                message; check it another way.
 *   4. "wait"  — they contacted you but haven't asked for anything yet.
 *   5. "go"    — you found them yourself and nothing in it is a tell.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

export type Who =
  | ""
  | "bank"
  | "family"
  | "company"
  | "official"
  | "deal"
  | "job"
  | "invest"
  | "tech"
  | "other";
export type Start = "" | "them" | "link" | "me";
export type Ask = "money" | "code" | "login" | "remote" | "details";
export type Pay = "" | "gift" | "crypto" | "cash" | "transfer" | "app" | "card";
export type Push = "rush" | "threat" | "prize" | "secret" | "stay";
export type Done = "" | "no" | "paid" | "told" | "installed";

export type ScamInputs = {
  /** What the message or call says, in a line. */
  what: string;
  /** Who it says it's from. */
  who: Who;
  /** Who started the contact. */
  start: Start;
  /** What it asks you to do. */
  asks: Ask[];
  /** How it wants paying, if it wants money. */
  pay: Pay;
  /** What's pushing you. */
  pushes: Push[];
  /** Whether you've already acted on it. */
  done: Done;
};

export const BLANK_SCAM: ScamInputs = {
  what: "",
  who: "",
  start: "",
  asks: [],
  pay: "",
  pushes: [],
  done: "",
};

export type ScamKind = "undo" | "stop" | "check" | "wait" | "go";

/** One thing in the message that tells you something, and what it tells you. */
export type Tell = { id: string; head: string; body: string };

export type ScamRead = {
  kind: ScamKind;
  /** The tells nobody real would show. Any one of them is enough. */
  red: Tell[];
  /** The tells that should slow you down, but that real messages show too. */
  amber: Tell[];
};

/** True when the contact came to you, or you reached it through their link or number. */
export function cameToYou(inp: ScamInputs): boolean {
  return inp.start === "them" || inp.start === "link";
}

/** How it wants paying, counted only while it asks for money. */
export function payOf(inp: ScamInputs): Pay {
  return inp.asks.includes("money") ? inp.pay : "";
}

/**
 * The tells that settle it. Each is a way of asking that a real bank, company,
 * government office or relative doesn't use, so one is enough.
 */
export function redTells(inp: ScamInputs): Tell[] {
  const out: Tell[] = [];
  const pay = payOf(inp);
  const has = (a: Ask) => inp.asks.includes(a);
  const push = (p: Push) => inp.pushes.includes(p);
  if (has("code")) {
    out.push({
      id: "code",
      head: "It asks for a code sent to your phone.",
      body: "That code is the key to your account, sent to you so that only you can use it. Whoever reads it out has handed the key over. Banks and companies tell you never to share it, and they don't ask for it.",
    });
  }
  if (pay === "gift") {
    out.push({
      id: "gift",
      head: "It wants paying in gift cards.",
      body: "No real business or government office takes payment in gift cards. Gift cards are for gifts. Once the numbers are read out, the money is gone.",
    });
  }
  if (pay === "crypto") {
    out.push({
      id: "crypto",
      head: "It wants paying in crypto.",
      body: "Only scammers demand payment in cryptocurrency. It can't be reversed, and nobody can recall it for you.",
    });
  }
  if (pay === "cash") {
    out.push({
      id: "cash",
      head: "It wants cash, handed over or collected.",
      body: "Banks, police and companies don't send couriers to collect cash, cards or valuables from your door.",
    });
  }
  if (inp.who === "bank" && (pay === "transfer" || pay === "app")) {
    out.push({
      id: "safe",
      head: "Your bank wants you to move your money.",
      body: "A bank will never ask you to move money to another account to keep it safe. The \"safe account\" belongs to the caller.",
    });
  }
  if (push("secret")) {
    out.push({
      id: "secret",
      head: "It tells you to keep it quiet.",
      body: "Don't tell the bank, don't tell the family, don't say what it's for. A secret protects them, not you: it's there to stop the one conversation that would end it.",
    });
  }
  if (push("stay")) {
    out.push({
      id: "stay",
      head: "It tells you not to hang up.",
      body: "Keeping you on the line keeps you from checking. A real caller can be rung back.",
    });
  }
  if (has("remote") && cameToYou(inp)) {
    out.push({
      id: "remote",
      head: "Someone who contacted you wants to see or control your screen.",
      body: "Remote access gives them what you can see and do, your banking included. Real support doesn't come looking for you.",
    });
  }
  if (inp.who === "job" && has("money")) {
    out.push({
      id: "job",
      head: "A job that asks you to pay.",
      body: "Real employers pay you. A fee for training, equipment, a visa or to \"unlock\" your earnings is the job.",
    });
  }
  if (inp.who === "tech" && cameToYou(inp)) {
    out.push({
      id: "tech",
      head: "Tech support that found you.",
      body: "Real tech companies don't ring or pop up to tell you your computer is infected. A warning that won't close and gives a number to call is the scam.",
    });
  }
  return out;
}

/** The tells that should slow you down. Real messages have them sometimes, so none settles it alone. */
export function amberTells(inp: ScamInputs): Tell[] {
  const out: Tell[] = [];
  const pay = payOf(inp);
  const push = (p: Push) => inp.pushes.includes(p);
  if (cameToYou(inp)) {
    out.push({
      id: "came",
      head: inp.start === "link" ? "You reached them through their link or number." : "They contacted you.",
      body: inp.start === "link"
        ? "A number from a message, an ad or a search result is theirs to choose, so calling it checks nothing."
        : "You can't check who's really there from inside a call or a message they started. Caller ID and the sender's name can both be faked.",
    });
  }
  if (push("rush")) {
    out.push({
      id: "rush",
      head: "There's a clock on it.",
      body: "Today, within the hour, before the parcel is returned. A clock is there to stop you checking. Real problems wait the ten minutes a check takes.",
    });
  }
  if (push("threat")) {
    out.push({
      id: "threat",
      head: "Something bad happens if you don't.",
      body: "Arrest, a fine, an account closed, a relative in trouble. Fear is the point: people decide worse when they're frightened, and the people who send it know that.",
    });
  }
  if (push("prize")) {
    out.push({
      id: "prize",
      head: "Something good happens if you do.",
      body: "A refund, a prize, a return that's guaranteed. Excitement does to judgement what fear does. If it's yours, it will still be yours after a check.",
    });
  }
  if ((pay === "transfer" || pay === "app") && inp.who !== "bank") {
    out.push({
      id: "transfer",
      head: "It wants a bank transfer or a payment app.",
      body: "These move money instantly and are hard to get back, which is why they carry the largest losses. A card payment can be disputed; a transfer usually can't.",
    });
  }
  if (inp.asks.includes("login") && cameToYou(inp)) {
    out.push({
      id: "login",
      head: "It wants you to sign in or pay through its link.",
      body: "A link can lead to a perfect copy of the real page. Whatever the link says, go to the app or type the address yourself.",
    });
  }
  if (inp.asks.includes("details") && cameToYou(inp)) {
    out.push({
      id: "details",
      head: "It asks for your details.",
      body: "Date of birth, address, card number. Each one is harmless alone and useful to whoever is collecting them, often for the next call, which will sound more real for knowing them.",
    });
  }
  if (inp.who === "family" && cameToYou(inp) && inp.asks.includes("money")) {
    out.push({
      id: "family",
      head: "Family, on a new number, needing money.",
      body: "\"Hi Mum, I've broken my phone\" is one of the commonest scams there is. Voices can be faked too now. The old number is the check.",
    });
  }
  if (inp.who === "invest" && cameToYou(inp)) {
    out.push({
      id: "invest",
      head: "An investment that came looking for you.",
      body: "Investment scams cost more than any other kind. Good investments don't need to find you by message, and nobody can guarantee a return.",
    });
  }
  return out;
}

/**
 * The read so far, or null while who it's from or who started it is missing.
 * Someone who has already acted gets the steps straight away, with nothing else
 * asked first: the first hour matters more than the diagnosis.
 */
export function readScam(inp: ScamInputs): ScamRead | null {
  const acted = inp.done !== "" && inp.done !== "no";
  if (!acted && (!inp.who || !inp.start)) return null;
  const red = redTells(inp);
  const amber = amberTells(inp);
  let kind: ScamKind;
  if (acted) kind = "undo";
  else if (red.length > 0) kind = "stop";
  else if (cameToYou(inp) && inp.asks.length > 0) kind = "check";
  else if (cameToYou(inp)) kind = "wait";
  else kind = "go";
  return { kind, red, amber };
}

/** The answer's headline: the words printed largest, and spoken. */
export function scamHeadline(inp: ScamInputs, read: ScamRead): string {
  switch (read.kind) {
    case "undo":
      if (inp.done === "installed") return "Disconnect it, then call your bank from another phone.";
      if (inp.done === "told") return "Call your bank now, then change the passwords.";
      return "Call your bank now, on the number on your card.";
    case "stop":
      return "Stop. Nobody real asks this way.";
    case "check":
      return inp.who === "family"
        ? "Don't send anything yet. Call them on the number you already have."
        : "Don't act inside this message. Check it another way first.";
    case "wait":
      return "Nothing to do yet. Don't reply, and don't use its links.";
    case "go":
      return payOf(inp) === "transfer" || payOf(inp) === "app"
        ? "You found them yourself. Pay by card if you can."
        : "You found them yourself. Nothing here is a tell.";
  }
}

/** The check a scammer can't fake: you contact them, on details you found yourself. */
export function checkWay(who: Who): string {
  switch (who) {
    case "bank":
      return "Hang up. Call the number on the back of your card, from a different phone if you can; if you can't, wait a few minutes first, because some scammers keep the line open. In the UK, 159 connects you to most banks safely.";
    case "family":
      return "Call them on the number you already have for them, not the new one. If they don't pick up, ask someone who'd know where they are, or ask the new number something only they would know.";
    case "company":
      return "Don't use the link. Open the company's own app, or type its address yourself, and look at your account. A real fee, delivery or problem will be there.";
    case "official":
      return "Look the office up yourself (in the UK, on gov.uk; in the US, on a .gov site) and call the number listed there. Tax offices, courts and police don't take payment by phone in gift cards or crypto, and don't threaten arrest over a call.";
    case "deal":
      return "Keep it on the platform: pay through its own checkout, and keep the messages there too. For a rental, see it in person, or have someone you trust do it, before paying anything.";
    case "job":
      return "Find the company yourself, and apply through its own website. Ask for the offer in writing, from a company address, and never pay to start.";
    case "invest":
      return "Look the firm up on the regulator's register (in the UK, the FCA register; in the US, FINRA BrokerCheck or the SEC), and contact it only through the details listed there.";
    case "tech":
      return "Close the page; if it won't close, restart the device. If you're worried, ask someone you know, or take it to a shop you choose.";
    case "other":
    case "":
      return "Find their contact details yourself, from a bill, a card, a letter or an official site, and ask them directly.";
  }
}

/** The words to say, so ending the call doesn't need a reason invented on the spot. */
export function scamSay(inp: ScamInputs): string {
  if (inp.who === "family") return "Before I send anything, I'm going to ring your old number. If it's you, you'll understand.";
  if (inp.who === "deal") return "I only pay through the site's own checkout. If that doesn't work for you, no problem.";
  if (inp.who === "job") return "I don't pay to start a job. If the offer is real, please send it in writing from your company address.";
  return "I don't deal with anything on a call or a message I didn't start. I'll contact you myself, on the number I have.";
}

/** The steps for "undo", fastest first. */
export function undoSteps(inp: ScamInputs): string[] {
  const steps: string[] = [];
  if (inp.done === "installed") {
    steps.push("Turn off the Wi-Fi and data on that device, and remove the app they asked you to install.");
  }
  steps.push("Call your bank now on the number on your card, from a different phone if you can. Say you think you've been scammed. The sooner they hear, the more chance they can stop or recall a payment.");
  if (payOf(inp) === "gift") {
    steps.push("Call the gift card's company too, with the card numbers and your receipt. If the money hasn't been spent yet, they can sometimes freeze it.");
  }
  if (inp.done === "told" || inp.done === "installed") {
    steps.push("Change the password for your bank and your email, starting with the email, from a device they haven't touched. Turn on two-step sign-in where you can.");
  }
  steps.push("Report it. In the UK: Report Fraud (reportfraud.police.uk, 0300 123 2040), or Police Scotland on 101. In the US: reportfraud.ftc.gov. Forward a scam text to 7726, free on most UK and US networks.");
  steps.push("Expect a second call, offering to get your money back for a fee. That's the same people, or people who bought their list.");
  return steps;
}

/** The standing rule: the reusable part of the answer. */
export function scamRule(): string {
  return "My line for messages and calls: if someone contacts me and asks for money, a code or my details, I don't act inside that message. I hang up and contact them myself, on details I found myself. Nobody real asks for a code, gift cards, crypto, cash at the door, a \"safe account\" or a secret, so any of those is a no.";
}

/** The plain-text record, for notes or a message to someone you're helping. */
export function scamSummary(inp: ScamInputs, read: ScamRead): string {
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  lines.push(scamHeadline(inp, read));
  if (read.red.length > 0) {
    lines.push("");
    for (const t of read.red) lines.push(`- ${t.head} ${t.body}`);
  }
  lines.push("");
  if (read.kind === "undo") {
    undoSteps(inp).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  } else if (read.kind !== "go") {
    lines.push(`How to check: ${checkWay(inp.who)}`);
    lines.push(`What to say: ${scamSay(inp)}`);
  }
  lines.push("");
  lines.push(scamRule());
  return lines.join("\n");
}

const WHOS: Who[] = ["bank", "family", "company", "official", "deal", "job", "invest", "tech", "other"];
const STARTS: Start[] = ["them", "link", "me"];
const ASKS: Ask[] = ["money", "code", "login", "remote", "details"];
const PAYS: Pay[] = ["gift", "crypto", "cash", "transfer", "app", "card"];
const PUSHES: Push[] = ["rush", "threat", "prize", "secret", "stay"];
const DONES: Done[] = ["no", "paid", "told", "installed"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function someOf<T extends string>(v: unknown, list: T[]): T[] {
  if (!Array.isArray(v)) return [];
  return list.filter((x) => v.includes(x));
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseScamInputs(raw: unknown): ScamInputs {
  if (!raw || typeof raw !== "object") return BLANK_SCAM;
  const v = raw as Record<string, unknown>;
  return {
    what: typeof v.what === "string" ? v.what : "",
    who: oneOf(v.who, WHOS),
    start: oneOf(v.start, STARTS),
    asks: someOf(v.asks, ASKS),
    pay: oneOf(v.pay, PAYS),
    pushes: someOf(v.pushes, PUSHES),
    done: oneOf(v.done, DONES),
  };
}

/**
 * The worked example: a text about a £1,280 payment, then a call from "the
 * fraud team" saying the account is compromised and the savings must go to a
 * safe account today, without telling the branch. Read: stop.
 */
export const SCAM_EXAMPLE: ScamInputs = {
  what: "a call from my bank's fraud team about a payment I didn't make",
  who: "bank",
  start: "them",
  asks: ["money", "code"],
  pay: "transfer",
  pushes: ["rush", "threat", "secret"],
  done: "no",
};
