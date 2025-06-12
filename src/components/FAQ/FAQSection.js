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
      {/* Decorative Circle SVG absolutely positioned on top */}
      <div
        style={{
          position: 'absolute',
          left: '100px',
          top: '-10px',
          width: '130px',
          height: '130px',
          transform: 'rotate(9.5deg)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="65" cy="65" r="55" fill="#211F20" stroke="#211F20" strokeWidth="1" />
          {/* Replace circular text with SVG image */}
          <image 
            href="/Circled_Text_White.svg" 
            x="0" 
            y="0" 
            width="130" 
            height="130" 
            preserveAspectRatio="xMidYMid meet"
          />
        </svg>
        {/* Plus Icon SVG centered and smaller */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '80px',
            height: '80px',
            transform: 'translate(-50%, -50%)',
            zIndex: 101,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img 
            src="/cir_minus_Black.svg" 
            alt="minus icon"
            style={{ 
              objectFit: 'contain',
              width: '150px',
              height: '150px'
            }}
          />
        </div>
      </div>
      <section className="w-full flex flex-col md:flex-row items-stretch justify-center min-h-[400px] md:min-h-[520px] py-12 px-4 md:px-12 gap-0">
        {/* Left: Image Side */}
        <div
          className="flex flex-col justify-end items-start gap-4 flex-1 min-h-[300px] md:min-h-[400px] p-6 md:p-8 rounded-tl-[16px] md:rounded-l-[16px] rounded-tr-[16px] md:rounded-r-none rounded-bl-none md:rounded-bl-[16px] rounded-br-none md:rounded-br-none relative overflow-hidden"
          style={{
            background: 'url(/faqcard.webp) center center / cover no-repeat',
          }}
        >
          <div style={{position: 'relative', zIndex: 5, width: '100%'}}>
            <h1
              className="w-fit max-w-[500px] sm:max-w-[600px] md:max-w-[700px] text-[24px] sm:text-[32px] md:text-[52px] text-left mb-4 drop-shadow-lg"
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
              className="flex px-4 py-2 justify-center items-center gap-2 rounded-[8px] bg-[#E2FF65] text-[#211F20] font-poppins text-[14px] font-medium leading-normal shadow-md border-none outline-none hover:opacity-80 transition"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              See full FAQ
            </button>
          </div>
        </div>

        {/* Right: FAQ Side */}
        <div
          className="flex flex-col items-start flex-1 min-h-[300px] md:min-h-[400px] p-6 md:p-8 rounded-tl-none md:rounded-l-none rounded-tr-none md:rounded-r-[16px] rounded-bl-[16px] md:rounded-bl-none rounded-br-[16px] md:rounded-br-[16px] relative overflow-hidden"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #B0EEFF 0%, #E7E9FF 100%)',
            paddingLeft: '0px',
            paddingRight: '0px',
          }}
        >
          <div
            className="flex flex-col items-start w-full"
            style={{
              paddingTop: '0px',
              paddingLeft: '32px',
              paddingRight: '32px',
              gap: '24px',
              alignSelf: 'stretch',
            }}
          >
            <h1
              className="text-[32px] md:text-[48px] font-bricolage font-semibold leading-[110%] text-[#211F20]"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: '48px' }}
            >
              FAQ
            </h1>
            <div className="flex flex-col w-full mb-12" style={{ alignSelf: 'stretch' }}>
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
                      className="flex-1 text-left text-[18px] md:text-[24px]"
                      style={{
                        color: '#211F20',
                        fontFamily: 'Bricolage Grotesque, sans-serif',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
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
                      className={`w-full faq-dropdown ${openIndex === idx ? 'open' : 'close'}`}
                      style={{
                        padding: '0 0px 14px 0px',
                        color: '#211F20',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '16px',
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
