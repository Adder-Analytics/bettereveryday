import type { Metadata } from "next";
import TaxReturnClient from "./TaxReturnClient";

export const metadata: Metadata = {
  title: "A Tax Return Due: What Does Late Cost, and What Stops It? — Better Every Day",
  description:
    "Self Assessment's two clocks, in pounds and dates: what filing late adds, what paying late adds, the payment plan that stops the 5%, why January's first bill is half as big again, and the letters to appeal a penalty or withdraw a notice to file.",
  openGraph: {
    title: "A Tax Return Due: What Does Late Cost, and What Stops It? — Better Every Day",
    description:
      "Can't pay? File anyway. The return and the money have separate clocks, and only one of them is cheap to stop.",
    type: "website",
  },
};

export default function TaxReturnPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          A tax return due: what does late cost, and what stops it?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Self Assessment runs two clocks that feel like one. The return has a
          deadline, and missing it costs £100 even if you owe nothing, then
          £10 a day, then more. The money has the same deadline, and missing
          that costs interest and 5% steps. The most expensive thing people do
          is wait to file until they can pay, so both clocks run at once, when
          the return could have gone in on time and the tax been spread over a
          year for the price of the interest.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This dates every step for your return, shows what each one adds in
          pounds, works out why the first January bill is half as big again as
          the tax, and writes what to send: a payment plan request, an appeal
          against a penalty, or a request to withdraw a notice you never
          needed.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For individuals filing online in the UK, on the rules for returns up
          to 2025/26 (Making Tax Digital&rsquo;s own penalties are noted where
          they apply). Interest is worked out at HMRC&rsquo;s published rates,
          so the pence are estimates. It isn&rsquo;t tax advice, and nothing
          you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <TaxReturnClient />
    </div>
  );
}
