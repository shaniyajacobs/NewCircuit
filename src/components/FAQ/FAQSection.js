import React from "react";
import FAQItem from "./FAQItem";

const FAQSection = () => {
  const faqItems = [
    {
      question: "What’s your cancellation & no-show policy?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question: "What are the ground rules (safety, matching, and disclaimer)?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question: "Do I need to keep my phone on the entire time?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question: "When should I show up? What happens if I’m late?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question:
        "I want to register for another event. What if a person I have previously gone on a date with also signs up for the same event?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question: "How long do rounds last for?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question: "What happens if there is an uneven number of participants?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question: "Does Circuit have a partnership with the venues they work with?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
    {
      question:
        "I’m 30 years-old, but would rather register for the 31-41 bracket. Am I allowed to?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center text-blue-700 font-[Poppins] font-bold mt-6 mb-4 text-4xl md:text-5xl">
        FAQ
      </div>
      <div className="flex flex-col space-y-4 mb-20">
        {faqItems.map((item, index) => (
          <FAQItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
  
};

export default FAQSection;
