import React from 'react';
import NavBar from '../components/Navbar/NavBar';
import Footer from '../components/Footer';
import Pricing from '../components/Pricing';

// Inline FAQSection placeholder
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

function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState(null);
  const [closingIndex, setClosingIndex] = React.useState(null);

  const handleToggle = (idx) => {
    if (openIndex === idx) {
      setClosingIndex(idx);
      setTimeout(() => {
        setOpenIndex(null);
        setClosingIndex(null);
      }, 300);
    } else {
      setClosingIndex(null);
      setOpenIndex(idx);
    }
  };

  return (
    <div style={{position: 'relative', width: '100%'}}>
      <style>{`
        @keyframes dropdown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 200px; opacity: 1; }
        }
        @keyframes dropdown-close {
          from { max-height: 200px; opacity: 1; }
          to { max-height: 0; opacity: 0; }
        }
        .faq-dropdown { overflow: hidden; transition-height: 0.3s ease-out; transition-opacity: 0.3s ease-out; }
        .faq-dropdown.open { animation: dropdown 0.3s ease-out forwards; }
        .faq-dropdown.close { animation: dropdown-close 0.3s ease-out forwards; }
        @media (max-width: 900px) {
          .faq-right-card-responsive {
            min-height: 600px !important;
            border-radius: 0px 0px 8px 8px !important;
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          left: '100px',
          top: '3px',
          width: '100px',
          height: '100px',
          transform: 'rotate(9.5deg)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Black circle background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#211F20',
            zIndex: 8,
          }}
        />
        {/* Decorative circle image - centered */}
        <img
          src="/Circled_Text_White.svg"
          alt="decorative circle"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '104px',
            height: '104px',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
        {/* Center minus icon */}
        <img
          src="/cir_minus_Black.svg"
          alt="minus icon"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '56px',
            height: '56px',
            transform: 'translate(-50%, -50%)',
            zIndex: 11,
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
        {/* Grain overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 20,
            pointerEvents: 'none',
            background: 'url(/grain.png)', // You must add a grain.png to public
            opacity: 0.35,
            borderRadius: '50%',
          }}
        />
      </div>
      <section className="w-full flex flex-col md:flex-row items-stretch justify-center min-h-[300px] md:min-h-[400px] py-12 px-4 md:px-12 gap-0">
        <div
          //className="flex flex-col justify-end items-start gap-4 flex-1 min-h-[200px] md:min-h-[260px] p-4 md:p-6 rounded-tl-[8px] md:rounded-l-[8px] rounded-tr-[8px] md:rounded-r-none rounded-bl-none md:rounded-bl-[8px] rounded-br-none md:rounded-br-none relative overflow-hidden"
          className="
            flex flex-col justify-end items-start
            flex-1
            min-h-[200px] md:min-h-[260px]
            px-[50px] md:px-[32px] sm:px-[24px] xs:px-[16px]
            pb-[50px] md:pb-[32px] sm:pb-[24px] xs:pb-[16px]
            gap-[32px] md:gap-[24px] sm:gap-[20px] xs:gap-[16px]
            rounded-tl-[8px] md:rounded-l-[8px] rounded-tr-[8px] md:rounded-r-none
            rounded-bl-none md:rounded-bl-[8px] rounded-br-none md:rounded-br-none
            relative overflow-hidden
          "
          style={{
            background: 'url(/lamp.jpg) center center / cover no-repeat',
          }}
        >
          {/* Gradient overlay for text readability */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: '60%',
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(33,31,32,0.5) 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
          <div 
            className="flex flex-col gap-[32px] md:gap-[24px] sm:gap-[20px] xs:gap-[16px]"
            style={{position: 'relative', zIndex: 5, width: '100%', paddingTop: '180px'}}>
            <h1
              className="w-fit max-w-[500px] sm:max-w-[600px] md:max-w-[700px] text-[40px] text-left drop-shadow-lg"
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
              className="
                w-fit flex justify-center items-center gap-1 rounded-[6px] 
                bg-[#E2FF65] text-[#211F20] font-poppins font-medium leading-normal 
                shadow-md border-none outline-none hover:opacity-80 transition

                text-[12px]        /* default smallest */
                xs:text-[12px]
                sm:text-[14px]
                md:text-[16px]

                md:py-[12px] md:px-[24px]
                sm:py-[10px] sm:px-[20px]
                xs:py-[8px] xs:px-[20px]
                py-[8px] px-[20px]
              "
              style={{
                fontFamily: 'Poppins, sans-serif',
                gap: '4px',
              }}
            >
              See full FAQ
            </button>
          </div>
        </div>
        <div
          className="flex flex-col items-start flex-1 min-h-[200px] md:min-h-[260px] p-4 md:p-6 rounded-tl-none md:rounded-l-none rounded-tr-none md:rounded-r-[8px] rounded-bl-[8px] md:rounded-bl-none rounded-br-[8px] md:rounded-br-[8px] relative overflow-hidden faq-right-card-responsive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: '1 0 0',
            alignSelf: 'stretch',
            borderRadius: '0px 8px 8px 0px',
            background: 'radial-gradient(50% 50% at 50% 50%, #8EFF7A 0%, #D7FFF8 100%)',
            paddingLeft: '0px',
            paddingRight: '0px',
            minHeight: '260px',
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
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: '40px', marginBottom: '8px', marginTop: '8px' }}
            >
              Pricing
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
                      Q
                    </button>
                    <span
                      style={{ cursor: 'pointer', minWidth: 28, minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: '0px' }}
                      onClick={() => handleToggle(idx)}
                    >
                      {openIndex === idx ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="44" viewBox="0 0 28 44" fill="none">
                          <path d="M2 22H26" stroke="#444509" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                      ) : (
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
      {/* Edge-to-edge thick black line before footer/legal stuff */}
      <div style={{ width: '100vw', margin: '80px 0 0 0', position: 'relative', left: '50%', right: '50%', transform: 'translateX(-50%)', padding: 0 }}> </div>
    </div>
  );
}

const PricingPage = () => {
  return (
    <>
      <NavBar />
      <Pricing />
      <FAQSection />
      <Footer />
    </>
  );
};

export default PricingPage; 