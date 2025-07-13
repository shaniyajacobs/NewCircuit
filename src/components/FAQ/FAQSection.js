import React, { useState } from "react";

const faqItems = [
  {
    question: "What's your cancellation & no-show policy?",
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
    question: "When should I show up? What happens if I'm late?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
  },
  {
    question:
      "I want to register for another event. What if a person I have previously gone on a date with also signs up for the same event?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const [closingIndex, setClosingIndex] = useState(null);

  const handleToggle = (idx) => {
    if (openIndex === idx) {
      // Closing
      setClosingIndex(idx);
      setTimeout(() => {
        setOpenIndex(null);
        setClosingIndex(null);
      }, 300); // Match animation duration
    } else {
      // Opening
      setClosingIndex(null);
      setOpenIndex(idx);
    }
  };

  return (
    <div style={{position: 'relative', width: '100%'}}>
      <style>
        {`
          @keyframes dropdown {
            from {
              max-height: 0;
              opacity: 0;
            }
            to {
              max-height: 200px;
              opacity: 1;
            }
          }
          
          @keyframes dropdown-close {
            from {
              max-height: 200px;
              opacity: 1;
            }
            to {
              max-height: 0;
              opacity: 0;
            }
          }
          
          .faq-dropdown {
            overflow: hidden;
            transition-height: 0.3s ease-out;
            transition-opacity: 0.3s ease-out;
          }
          
          .faq-dropdown.open {
            animation: dropdown 0.3s ease-out forwards;
          }
          
          .faq-dropdown.close {
            animation: dropdown-close 0.3s ease-out forwards;
          }
        `}
      </style>
      <section className="w-full flex flex-col md:flex-row items-center justify-center py-12 px-[16px] sm:px-[24px] md:px-[32px] lg:px-[50px] gap-0 mx-auto max-w-[1440px] overflow-visible">
      {/* Left: Image Side */}
        <div
          className="flex flex-col justify-end items-start gap-4 w-full md:w-1/2 lg:w-[670px] h-[350px] sm:h-[450px] md:h-[650px] lg:h-[800px] p-6 md:p-8 rounded-tl-[16px] md:rounded-l-[16px] rounded-tr-[16px] md:rounded-r-none rounded-bl-none md:rounded-bl-[16px] rounded-br-none md:rounded-br-none relative overflow-visible"
          style={{
            background: 'url(/faqcard.webp) center center / cover no-repeat',
          }}
        >
          {/* Plus Icon SVG */}
          <div className="absolute -top-[50px] left-[40px] z-20 pointer-events-none scale-75 sm:scale-90 md:scale-100 lg:scale-110">
            <img 
              src="/Plus.svg" 
              alt="plus icon"
              className="w-[100px] h-[100px] rotate-6"
              style={{ 
                objectFit: 'contain'
              }}
            />
          </div>
          <div style={{position: 'relative', zIndex: 5, width: '100%'}}>
            <h1
              className="w-fit max-w-[500px] sm:max-w-[600px] md:max-w-[700px] text-[32px] sm:text-[32px] md:text-[48px] lg:text-[64px] text-left mb-4 drop-shadow-lg"
              style={{
                color: '#FAFFE7',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 520,
                lineHeight: '120%',
              }}
            >
              Got questions? Let's plug you in.
            </h1>
            <button
              className="flex items-center justify-center gap-3 px-4 rounded-[4px] bg-[#E2FF65] text-black font-poppins leading-normal transition-all hover:scale-105 hover:opacity-60 w-[114px] md:w-[127px] lg:w-[147px] h-[34px] lg:h-[48px] text-[12px] md:text-[14px] lg:text-[16px] md:rounded-[6px] lg:rounded-[8px] whitespace-nowrap"
            >
              See full FAQ
            </button>
          </div>
        </div>

        {/* Right: FAQ Side */}
        <div
          className="flex flex-col items-start w-full md:w-1/2 lg:w-[670px] h-[350px] sm:h-[450px] md:h-[650px] lg:h-[800px] p-6 md:p-8 rounded-tl-none md:rounded-l-none rounded-tr-none md:rounded-r-[16px] rounded-bl-[16px] md:rounded-bl-none rounded-br-[16px] md:rounded-br-[16px] relative overflow-hidden"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #B0EEFF 0%, #E7E9FF 100%)',
            paddingLeft: '0px',
            paddingRight: '0px',
          }}
        >
          <div
            className="flex flex-col items-start w-full h-full"
            style={{
              paddingTop: '0px',
              paddingLeft: '32px',
              paddingRight: '32px',
            }}
          >
            <h1
              className="text-[32px] sm:text-[32px] md:text-[48px] lg:text-[64px] font-bricolage font-semibold leading-[110%] text-[#211F20] mb-6"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}
            >
              FAQ
            </h1>
            <div 
              className="flex flex-col w-full overflow-y-auto"
              style={{ 
                alignSelf: 'stretch',
                maxHeight: 'calc(100% - 80px)',
                paddingRight: '8px',
                paddingBottom: '32px'
              }}
            >
              {faqItems.map((item, idx) => (
                <div key={idx}>
                  <div
                    className="w-full"
                    style={{
                      display: 'flex',
                      padding: '0px 0px',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      alignSelf: 'stretch',
                      borderTopWidth: '1.5px',
                      borderTopStyle: 'solid',
                      borderTopColor: '#211F20',
                    }}
                  >
                    <button
                      className="flex-1 text-left text-[14px] sm:text-[16px] md:text-[20px] lg:text-[24px]"
                      style={{
                        color: '#211F20',
                        fontFamily: 'Bricolage Grotesque, sans-serif',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        paddingLeft: '0px',
                        paddingRight: '0px',
                        paddingTop: '14px',
                        paddingBottom: '14px',
                      }}
                      onClick={() => handleToggle(idx)}
                    >
                      {item.question}
                    </button>
                    <span
                      style={{ cursor: 'pointer', minWidth: 28, minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: '0px' }}
                      onClick={() => handleToggle(idx)}
                    >
                      {openIndex === idx ? (
                        // Minus SVG
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="44" viewBox="0 0 28 44" fill="none">
                          <path d="M2 22H26" stroke="#444509" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        // Plus SVG
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="44" viewBox="0 0 28 44" fill="none">
                          <path d="M2 22H26" stroke="#444509" strokeWidth="3" strokeLinecap="round"/>
                          <path d="M14 34L14 10" stroke="#444509" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                      )}
                    </span>
                  </div>
                  {(openIndex === idx || closingIndex === idx) && (
                    <div
                      className={`w-full faq-dropdown ${openIndex === idx ? 'open' : 'close'} text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px]`}
                      style={{
                        padding: '0 0px 14px 0px',
                        color: '#211F20',
                        fontFamily: 'Poppins, sans-serif',
                        lineHeight: '1.5',
                      }}
                    >
                      {item.answer}
                    </div>
                  )}
                  {/* Add border line under the 5th question */}
                  {idx === 4 && (
                    <div
                      className="w-full"
                      style={{
                        borderTopWidth: '1.5px',
                        borderTopStyle: 'solid',
                        borderTopColor: '#211F20',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
