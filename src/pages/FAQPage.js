import React, { useState } from 'react';
import NavBar from '../components/Navbar/NavBar';
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
  [
    'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q',
  ],
  [
    'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q',
  ],
  [
    'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q',
  ],
];

const answers = [
  [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
  ],
  [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
  ],
  [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sed magna eget nibh in turpis.',
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
    </>
  );
};

export default FAQPage; 