import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBar from "../components/Navbar/NavBar";
import Footer from "../components/Footer";

/** Inject Inter font into document <head> (works in CRA/Vite/Next) */
function useInterFont() {
  useEffect(() => {
    const id = "inter-font-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);
}

/**
 * Lightweight runtime "tests" (sanity checks) to help catch regressions in this single-file preview.
 * - Ensures section IDs are unique
 * - Ensures SMS copy contains links to /terms and /privacy
 * - Logs results to console (does not throw in prod to avoid breaking the page)
 */
function validateSections(sections) {
  try {
    // 1) Unique IDs
    const ids = sections.map(s => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
      console.warn("[SanityCheck] Duplicate section ids:", Array.from(new Set(dupes)));
    } else {
      console.info("[SanityCheck] Section IDs are unique (", ids.length, ")");
    }

    // 2) SMS links
    const sms = sections.find(s => s.id === "sms");
    if (sms && sms.content) {
      const html = JSON.stringify(sms.content);
      const hasTerms = html.includes("/terms");
      const hasPrivacy = html.includes("/privacy");
      if (!hasTerms || !hasPrivacy) {
        console.warn("[SanityCheck] SMS section missing expected links:", { hasTerms, hasPrivacy });
      } else {
        console.info("[SanityCheck] SMS links present: /terms & /privacy");
      }
    }
  } catch (e) {
    console.warn("[SanityCheck] Validation ran into an error:", e);
  }
}

// Replaced mock header/footer with the real site components

const sections = [
  // ————— TERMS & CONDITIONS —————
  {
    id: "intro",
    title: "Terms and Conditions of Use",
    content: (
      <div className="space-y-4">
        <p>
          These Terms and Conditions of Use ("Terms") constitute a legally binding
          agreement between you ("User" or "you") and Circuit ("Circuit," "we," "us,"
          or "our"), governing your access to and use of the Circuit website, mobile
          application, and related services (collectively, the "Platform"). By using
          the Platform, you agree to these Terms.
        </p>
        <div className="rounded-xl border bg-gray-50 p-4 text-sm">
          <p><span className="font-medium">Effective Date:</span> July 2025</p>
          <p><span className="font-medium">Last Updated:</span> September 2025</p>
        </div>
      </div>
    ),
  },
  {
    id: "eligibility",
    title: "1. Eligibility",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          You represent and warrant that you are at least twenty-five (25) years of
          age and possess the legal capacity to enter into these Terms.
        </li>
        <li>
          The Platform is not intended for use by individuals under twenty-five (25).
          Any such use is strictly prohibited and constitutes a material breach of
          these Terms.
        </li>
      </ol>
    ),
  },
  {
    id: "account",
    title: "2. Account Registration and Security",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>Create an account with complete and accurate information.</li>
        <li>You are responsible for safeguarding your credentials and account activity.</li>
        <li>
          You agree not to impersonate others, misrepresent affiliations, or provide
          false or incomplete information. Circuit may suspend or terminate
          non-compliant accounts.
        </li>
      </ol>
    ),
  },
  {
    id: "conduct",
    title: "3. User Obligations and Prohibited Conduct",
    content: (
      <div className="space-y-2">
        <p>Use the Platform only for lawful personal purposes related to social interaction and dating.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Do not harass, abuse, intimidate, or exploit other users.</li>
          <li>No solicitation of funds, goods, or services.</li>
          <li>No unlawful, obscene, defamatory, fraudulent, or deceptive content or activity.</li>
          <li>No viruses, harmful code, or IP infringement.</li>
          <li>
            During Circuit-hosted events, do not exchange personal contact information (phone, email,
            external social usernames). Violations may result in account restrictions, flagging, or
            termination at Circuit’s sole discretion.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "content-license",
    title: "4. User Content and License",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          By submitting content ("User Content"), you grant Circuit a non-exclusive, worldwide,
          royalty-free, transferable, sublicensable license to use it to operate the Platform.
        </li>
        <li>You represent you have all necessary rights to grant the foregoing license.</li>
        <li>Circuit may remove User Content at its sole discretion.</li>
      </ol>
    ),
  },
  {
    id: "safety",
    title: "5. Safety Acknowledgement",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>Circuit does not conduct background checks, criminal screenings, or identity verification of Users.</li>
        <li>You acknowledge that interactions with other Users, whether online or offline, are solely at your own risk.</li>
        <li>
          Circuit disclaims all responsibility for the conduct, statements, or actions of Users and shall not be liable for any
          damages, injuries, or losses resulting therefrom.
        </li>
      </ol>
    ),
  },

  /** Updated per your wording */
  {
    id: "fees",
    title: "6. Fees And Payments",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Certain features of the Platform, including but not limited to participation in virtual speed
          dating events, may require payment of fees or charges. All fees are payable in advance and are
          non-refundable, except as expressly provided herein or as required by applicable law.
        </li>
        <li>
          Circuit virtual speed dating events rely on strong participant turnout. While Circuit endeavors
          to accommodate scheduling changes and encourages Users to be considerate of one another, Users
          are required to provide as much advance notice as possible in the event of a cancellation or
          rescheduling request. Providing such notice enables Circuit to fill the vacated position and
          preserve the quality of the event experience for all participants.
        </li>
        <li>
          In the event that a scheduled virtual speed dating event must be rescheduled or cancelled due to
          last-minute User cancellations, unforeseen circumstances, or inclement weather conditions,
          affected participants shall be entitled to a full refund of any fees paid for such event.
        </li>
        <li>Circuit reserves the right to modify pricing and available features at any time, with or without notice.</li>
      </ol>
    ),
  },

  /** New section */
  {
    id: "refund",
    title: "7. Refund Policy",
    content: (
      <div className="space-y-2">
        <p><strong>Event Rescheduling:</strong> If an event does not meet the minimum threshold (fewer than six quality speed dates per participant), the event is rescheduled. Customers may choose to keep their ticket for the rescheduled date.</p>
        <p><strong>Cancellations by Customer:</strong> Customers who cancel with at least 48 hours’ notice before the event are eligible to receive a credit for a future event.</p>
        <p><strong>Late Cancellations / No-Shows:</strong> Tickets are non-refundable if canceled less than 48 hours before the event or if the customer does not attend.</p>
        <p><strong>Technical Issues:</strong> If a verified technical issue on Circuit’s end prevents participation, customers are offered either a reschedule or a refund.</p>
      </div>
    ),
  },

  {
    id: "termination",
    title: "8. Termination and Suspension",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>Circuit may suspend, restrict, or terminate accounts for violations, suspected fraudulent/abusive conduct, or actions harmful to the Platform.</li>
        <li>Users may terminate their accounts at any time via Platform instructions.</li>
      </ol>
    ),
  },
  {
    id: "ip",
    title: "9. Intellectual Property Rights",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>The Platform and all associated intellectual property are the exclusive property of Circuit and protected by law.</li>
        <li>Users are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for its intended purpose, subject to compliance.</li>
      </ol>
    ),
  },
  {
    id: "warranties",
    title: "10. Disclaimer of Warranties",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>The Platform is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind.</li>
        <li>Circuit disclaims all warranties, including merchantability, fitness for purpose, non-infringement, and accuracy.</li>
        <li>Circuit does not warrant uninterrupted, secure, or error-free operation of the Platform.</li>
      </ol>
    ),
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Circuit shall not be liable for indirect, incidental, consequential, or punitive damages, including loss of profits,
          data, goodwill, or other intangible losses, arising from or related to user access, interactions, or unauthorized
          access to data.
        </li>
        <li>In no event shall Circuit’s aggregate liability exceed the amount paid by the User in the twelve (12) months preceding the claim.</li>
      </ol>
    ),
  },
  {
    id: "law",
    title: "12. Governing Law and Dispute Resolution",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>These Terms are governed by the laws of [Insert State/Country], without regard to conflict-of-laws principles.</li>
        <li>Disputes shall be resolved through binding arbitration in [Insert Location], pursuant to AAA or relevant rules.</li>
        <li>Users waive the right to participate in class actions or representative proceedings.</li>
      </ol>
    ),
  },
  {
    id: "amendments",
    title: "13. Amendments",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>Circuit reserves the right to amend, modify, or update these Terms at any time, effective upon posting on the Platform.</li>
        <li>Continued use of the Platform following posting constitutes acceptance of such changes.</li>
      </ol>
    ),
  },
  {
    id: "misc",
    title: "14. Miscellaneous",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>These Terms constitute the entire agreement between you and Circuit.</li>
        <li>If any provision is held invalid or unenforceable, the remaining provisions remain in full force and effect.</li>
        <li>Failure to enforce any right or provision shall not constitute a waiver of such right or provision.</li>
      </ol>
    ),
  },
  {
    id: "noncompete",
    title: "15. Non-Compete and Restrictive Covenants",
    content: (
      <div>
        <p className="mb-2">
          Participants and competitors are prohibited from using any knowledge, contacts, or insights obtained through Circuit
          events to create, support, or participate in a competing service or enterprise, for as long as such restrictions are
          enforceable under applicable law.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Hosting or organizing speed dating events.</li>
          <li>Developing or promoting competing online dating platforms.</li>
          <li>Leveraging contacts or user information gained through Circuit for commercial purposes.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "sms",
    title: "16. SMS Terms of Service",
    content: (
      <div className="space-y-2">
        <p>
          By opting into SMS from a web form, account creation, or other medium, you agree to receive SMS messages from Circuit,
          including event reminders, updates, account notifications, customer care, and promotional messages. Message frequency
          varies. Message &amp; data rates may apply. Reply <strong>STOP</strong> to cancel, <strong>HELP</strong> for help. View our {" "}
          <a href="/terms-of-service#intro" target="_blank" rel="noopener noreferrer" className="underline">Terms &amp; Conditions</a> and {" "}
          <a href="/terms-of-service#privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>. Circuit does not share mobile numbers or opt-in data with third parties.
        </p>
      </div>
    ),
  },

  // ————— PRIVACY POLICY —————
  {
    id: "privacy",
    title: "Privacy Policy",
    content: (
      <div className="space-y-4">
        <div className="rounded-xl border bg-gray-50 p-4 text-sm">
          <p><span className="font-medium">Effective Date:</span> July 2025</p>
          <p><span className="font-medium">Last Updated:</span> September 2025</p>
        </div>
        <p>
          This Privacy Policy explains how Circuit (“Circuit,” “we,” “us,” or “our”) collects, uses, discloses, and protects
          information in connection with the Platform. By using the Platform, you consent to these practices.
        </p>

        <h3 className="font-semibold">1. Information We Collect</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-medium">You provide:</span> account details (name, email, DOB, gender, location), profile content, photos, messages, event registrations, support communications, and SMS opt-in preferences.</li>
          <li><span className="font-medium">Automatically:</span> IP, device IDs, browser/OS, log and usage data, cookies/pixels (see Cookies Policy).</li>
          <li><span className="font-medium">From third parties:</span> processors and vendors (payments, hosting, analytics, SMS, marketing).</li>
        </ul>

        <h3 className="font-semibold">2. How We Use Information</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Operate and improve the Platform and user experience.</li>
          <li>Facilitate events (including virtual speed dating) and manage payments.</li>
          <li>Provide support; send administrative, promotional, and SMS communications.</li>
          <li>Enforce Terms and community guidelines; detect/prevent fraud and abuse.</li>
          <li>Comply with legal obligations and protect rights, users, and the Platform.</li>
        </ul>

        <h3 className="font-semibold">3. How We Share Information</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-medium">Service providers:</span> payment, hosting, analytics, SMS, support, security.</li>
          <li><span className="font-medium">Legal:</span> compliance with laws and lawful requests.</li>
          <li><span className="font-medium">Business transfers:</span> merger, acquisition, financing, or sale.</li>
          <li><span className="font-medium">With consent:</span> where you direct us to share.</li>
        </ul>

        <h3 className="font-semibold">4. SMS Communications</h3>
        <p>
          By opting into SMS from a web form, account creation, or other medium, you agree to receive SMS messages from Circuit,
          including event reminders, updates, account notifications, customer care, and promotional messages. Message frequency
          varies. Message &amp; data rates may apply. Reply <strong>STOP</strong> to cancel, <strong>HELP</strong> for help. View our {" "}
          <a href="/terms-of-service#intro" target="_blank" rel="noopener noreferrer" className="underline">Terms &amp; Conditions</a> and {" "}
          <a href="/terms-of-service#privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>. Circuit does not share mobile numbers or opt-in data with third parties.
        </p>

        <h3 className="font-semibold">5. Cookies and Tracking</h3>
        <p>See the Cookies Policy below for details on types of cookies and choices.</p>

        <h3 className="font-semibold">6. Data Retention</h3>
        <p>We retain information as needed to operate the Platform, meet legal obligations, resolve disputes, and enforce agreements.</p>

        <h3 className="font-semibold">7. Your Rights</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access, correct, or delete personal information (subject to legal exceptions).</li>
          <li>Opt out of marketing emails and SMS (reply STOP for SMS).</li>
          <li>Restrict or object to certain processing, depending on your jurisdiction.</li>
        </ul>

        <h3 className="font-semibold">8. Security</h3>
        <p>We use commercially reasonable safeguards but cannot guarantee absolute security.</p>

        <h3 className="font-semibold">9. Children’s Privacy</h3>
        <p>The Platform is not intended for individuals under eighteen (18). We do not knowingly collect data from minors.</p>

        <h3 className="font-semibold">10. International Transfers</h3>
        <p>Your information may be processed in jurisdictions with different data protection laws than your own.</p>

        <h3 className="font-semibold">11. Changes</h3>
        <p>We may update this Privacy Policy. The “Last Updated” date reflects the most recent changes.</p>

        <h3 id="contact" className="font-semibold">12. Contact</h3>
        <ul className="list-disc pl-5">
          <li>Email: <span className="font-mono">privacy@circuit.example</span></li>
          <li>Mailing Address: [Insert Business Address]</li>
        </ul>
      </div>
    ),
  },

  // ————— COOKIE POLICY —————
  {
    id: "cookies",
    title: "Cookie Policy",
    content: (
      <div className="space-y-4">
        <div className="rounded-xl border bg-gray-50 p-4 text-sm">
          <p><span className="font-medium">Effective Date:</span> July 2025</p>
          <p><span className="font-medium">Last Updated:</span> September 2025</p>
        </div>
        <p>
          This Cookie Policy explains how Circuit uses cookies, pixels, local storage, and similar technologies (“Cookies”)
          on the Platform. Where required by law, we will obtain your consent before setting non-essential Cookies.
        </p>

        <h3 className="font-semibold">1. What Are Cookies?</h3>
        <p>
          Cookies are small text files stored on your device to help websites function, enhance user experience, and provide
          analytics and advertising insights.
        </p>

        <h3 className="font-semibold">2. Types of Cookies We Use</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-medium">Strictly Necessary:</span> required for core features (authentication, security, load balancing).</li>
          <li><span className="font-medium">Performance/Analytics:</span> measure usage and improve performance (e.g., page views, session length).</li>
          <li><span className="font-medium">Functional:</span> remember preferences (language, region, UI settings).</li>
          <li><span className="font-medium">Marketing/Advertising:</span> personalize content and measure campaign effectiveness.</li>
        </ul>

        <h3 className="font-semibold">3. How We Use Cookies</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Authenticate users and prevent fraudulent activity.</li>
          <li>Remember preferences and improve site features.</li>
          <li>Analyze traffic and usage to enhance the Platform.</li>
          <li>Deliver relevant ads and measure marketing performance.</li>
        </ul>

        <h3 className="font-semibold">4. Your Choices</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use browser settings to block or delete Cookies. Some features may not work without Cookies.</li>
          <li>Where available, use our in-product cookie banner/manager to accept or decline categories of Cookies.</li>
          <li>Opt-out tools from analytics/ads providers may be available (depending on region).</li>
        </ul>

        <h3 className="font-semibold">5. Third-Party Cookies</h3>
        <p>
          Some Cookies are set by third parties (e.g., analytics and ad partners). We do not control these Cookies
          and recommend reviewing those parties’ privacy policies.
        </p>

        <h3 className="font-semibold">6. Changes to This Policy</h3>
        <p>We may update this Cookie Policy from time to time. Please review it periodically.</p>

        <h3 className="font-semibold">7. Contact</h3>
        <ul className="list-disc pl-5">
          <li>Email: <span className="font-mono">privacy@circuit.example</span></li>
          <li>Mailing Address: [Insert Business Address]</li>
        </ul>
      </div>
    ),
  },
];

export default function LegalMockup() {
  useInterFont();
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  // Run our simple runtime tests once after mount
  useEffect(() => {
    validateSections(sections);
  }, []);

  // Smooth scrolling for in-page anchors and footer links with hash
  useEffect(() => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";

    const scrollToHash = () => {
      const hash = location.hash?.replace('#', '');
      if (!hash) return;
      // slight delay to ensure sections are rendered
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
      });
    };

    scrollToHash();

    return () => {
      document.documentElement.style.scrollBehavior = previous;
    };
  }, [location]);

  return (
    <div
      className="min-h-screen text-gray-900"
      style={{ backgroundColor: "#FAFFE7", fontFamily: "Inter, sans-serif" }}
      id="legal"
    >
      <NavBar />

      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Legal</h1>
              <p className="mt-2 max-w-2xl text-gray-700">
                Review our Terms, Privacy, Cookie Policy, and important information about using Circuit.
              </p>
            </div>
            <div className="hidden md:block rounded-xl border bg-white p-4 text-sm text-gray-700 shadow-sm">
              <p className="font-medium">Need help?</p>
              <p>Contact support@circuit.example</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-[240px,1fr] pb-20">
        <aside className="hidden md:block">
          <div className="sticky top-20 space-y-2" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingBottom: 16 }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              On this page
            </p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-800 hover:bg:white/70 hover:bg-white/70"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="space-y-8">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 rounded-2xl border bg:white p-6 shadow-sm bg-white"
            >
              <h2 className="mb-3 text-xl font-semibold tracking-tight">{s.title}</h2>
              <div className="prose prose-sm max-w-none text-gray-800">
                {s.content}
              </div>
            </section>
          ))}
        </article>
      </div>

      <Footer />
    </div>
  );
}