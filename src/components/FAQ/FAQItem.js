import React, { useState } from "react";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
      
    <div className="flex flex-col mx-auto my-0 w-full max-w-[1263px] text-neutral-800">
      <div className="flex flex-col pt-4 pr-14 pb-9 pl-6 w-full rounded-md bg-indigo-400 bg-opacity-30 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] max-md:pt-4 max-md:pr-8 max-md:pb-9 max-md:pl-5 max-sm:px-5 max-sm:pt-4 max-sm:pb-8"
      style={{backgroundColor: isOpen ? '#dee5fb' : 'white'}}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-wrap gap-5 justify-between items-center w-full text-xl font-medium max-md:text-lg max-sm:gap-4 max-sm:text-base"
          aria-expanded={isOpen}
          aria-controls={`faq-answer-${question.replace(/\s+/g, "-").toLowerCase()}`}
        >
          <div className="flex gap-10 items-center max-sm:gap-5">
            <div className="shrink-0 w-6 h-6 stroke-black rounded-full"
              style={ {backgroundColor: isOpen ? '#0043F1' : 'white', borderColor: 'black', borderWidth: 1} }/>
            <div className="grow">{question}</div>
          </div>
          <div
            className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          >
            <svg
              className="chevron-icon"
              width="19"
              height="10"
              viewBox="0 0 19 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L9.5 9L18 1"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
        <div
          id={`faq-answer-${question.replace(/\s+/g, "-").toLowerCase()}`}
          className={`mt-2.5 text-base leading-relaxed text-neutral-800 text-opacity-90 max-sm:text-sm transition-all duration-200 ease-in-out ${isOpen ? "block opacity-100" : "hidden opacity-0"}`}
        >
          {answer}
        </div>
      </div>
    </div>
  );
};

export default FAQItem;
