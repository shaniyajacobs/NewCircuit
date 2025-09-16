import React, { useState } from 'react';
import NavBar from '../components/Navbar/NavBar';
import Footer from '../components/Footer';
import styles from '../components/FAQ/FAQPage.module.css';

const gradients = [
  'radial-gradient(50% 50% at 50% 50%, #B0EEFF 0%, #E7E9FF 100%)',
  'radial-gradient(50% 50% at 50% 50%, #B4FFF2 0%, #E1FFD6 100%)',
  'radial-gradient(50% 50% at 50% 50%, #8EFF7A 0%, #D7FFF8 100%)',
];

const boxTitles = [
  'General Questions',
  'How it works',
  'Pricing',
];

const questions = [
  // General Questions
  [
    'Do I have to be in the exact age range to join an event?',
    'Do I have to live in the exact city where the event is hosted?',
    'Who can join Circuit events?',
    'Do I need special equipment?',
    'How do I know Circuit is safe?',
    'What happens if I don’t get any sparks?'
  ],
  // How it works
  [
    'How do Circuit events run?',
    'How do sparks work?',
    'What are AI-powered spark suggestions?',
    'What happens if my event doesn’t fill up?',
    'What’s the “Third Date On Us” program?',
    'Are food and drinks included in the virtual brunch, happy hour, or dinner events?'
  ],
  // Pricing
  [
    'How much do Circuit events cost?',
    'Do you offer refunds?',
    'Are there any hidden fees?',
    'Do I have to pay extra to message my sparks?',
    'What about the free drink on the third date?'
  ],
];

const answers = [
  // General Questions answers
  [
    'Our events are grouped by age ranges (25–34, 35–44, and 45–55). While we encourage participants to stay within their age group, you’re welcome to join a different range if it feels like a better fit. For example, a 33-year-old may prefer the 35–44 group, or a 58-year-old may still choose the 45–55 group.',
    'Not necessarily! Events are organized by city so participants can meet locally, but if you’re willing to travel, you can join an event in a nearby city. For example, someone from San Diego can register for a Los Angeles event.',
    'Circuit is open to singles ages 25–55 who are looking for intentional, face-to-face connections.',
    'Just a computer or tablet with a camera, microphone, and a stable internet connection. No fancy setup needed. Just bring yourself.',
    'All participants register with verified profiles, and every event is hosted and monitored by a trained Circuit host. We also have community guidelines to ensure a respectful, safe experience.',
    'Don’t worry, even the best connections take time. If you don’t receive a mutual spark during an event, you’ll still have had amazing conversations and practice putting yourself out there. You’re always welcome to join another event, and the personality indicator will continue refining your top 3 AI-powered suggestions.'
  ],
  // How it works answers
  [
    'Each event lasts about 90 minutes. You’ll rotate through up to 10 speed dates, each lasting 6 minutes, with breaks in between and guidance from your host.',
    'After the event, you’ll choose up to 3 connections. If the other person selects you too, it’s a spark! You and your spark can start messaging right away.',
    'When you create your profile, you’ll take a short personality indicator. Our system uses those results to suggest your top 3 likely sparks from the event, but you’re always free to choose your own.',
    'To keep things balanced, we require a good attendance ratio. If fewer than 6 quality dates per participant can be guaranteed, your event will be rescheduled and your ticket will be valid for the new date.',
    'If you and a spark go on 2 dates together and send us a quick photo proof, Circuit will treat you both to a free drink at one of our partnered restaurants.',
    'No — the names are simply a fun way to set the vibe for each event. While food and drinks aren’t included, we encourage you to bring a snack, coffee, or cocktail to enjoy while you mingle.'
  ],
  // Pricing answers
  [
    'Afternoon events are $28 and evening events are $38. Each ticket includes your full speed dating experience, host guidance, and access to messaging if sparks are mutual.',
    'Tickets are non-refundable. If a customer cancels within 48 hours of the event, a credit will be applied toward a future event. If Circuit reschedules an event, your ticket will automatically transfer or you can request a refund.',
    'Nope! The ticket price covers a full event.',
    'Not at all. Messaging with your sparks is included in your ticket price.',
    'That’s truly free. Once you and your spark qualify, Circuit covers the cost of your third-date cocktails or appetizers at our partnered restaurants.'
  ],
];

function PlusIcon() {
  return (
    <svg width="28" height="44" viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 22H26" stroke="#444509" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 34L14 10" stroke="#444509" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="28" height="44" viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 22H26" stroke="#444509" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const FAQBox = ({ gradient, title, questions, answers }) => {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <section className={styles.faqBox} style={{ background: gradient }}>
      <h2 className={styles.faqBoxTitle}>{title}</h2>
      <div className={styles.faqBoxList}>
        {questions.map((q, i) => (
          <div key={i} className={styles.faqItem}>
            <button
              className={styles.faqQuestionRow}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
              aria-controls={`faq-answer-${title}-${i}`}
            >
              <span className={styles.faqQ}>Q</span>
              <span className={styles.faqQuestionText || ''}>{q}</span>
              <span className={styles.faqPlusMinus}>{openIndex === i ? <MinusIcon /> : <PlusIcon />}</span>
            </button>
            <div
              id={`faq-answer-${title}-${i}`}
              className={
                openIndex === i
                  ? styles.faqAnswerOpen
                  : styles.faqAnswerClosed
              }
            >
              <div className={styles.faqAnswerText}>{answers[i]}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.faqBoxFooter}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.
      </div>
    </section>
  );
};

const FAQPage = () => {
  return (
    <>
      <NavBar />
      <main className={styles.faqPageBg}>
        <h1 className={styles.faqTitle}>Frequently Asked Questions</h1>
        <div className={styles.faqBoxes}>
          {gradients.map((gradient, idx) => (
            <FAQBox
              key={idx}
              gradient={gradient}
              title={boxTitles[idx]}
              questions={questions[idx]}
              answers={answers[idx]}
            />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default FAQPage; 