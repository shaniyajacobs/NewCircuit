import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RestaurantPartnerships = () => {
  const [openIndex, setOpenIndex] = useState(3); // Start with 4th restaurant expanded
  const [closingIndex, setClosingIndex] = useState(null);

  const restaurants = [
    {
      id: 1,
      name: "Restaurant",
      address: "ADDRESS, CHICAGO, IL",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
    },
    {
      id: 2,
      name: "Restaurant",
      address: "ADDRESS, CHICAGO, IL",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
    },
    {
      id: 3,
      name: "Restaurant",
      address: "ADDRESS, CHICAGO, IL",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
    },
    {
      id: 4,
      name: "Restaurant",
      address: "ADDRESS, CHICAGO, IL",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
    },
    {
      id: 5,
      name: "Restaurant",
      address: "ADDRESS, CHICAGO, IL",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
    },
    {
      id: 6,
      name: "Restaurant",
      address: "ADDRESS, CHICAGO, IL",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
    }
  ];

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
    <div style={{position: 'relative', width: '100%', background: '#FAFFE7'}}>
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
            background: 'url(/grain.png)',
            opacity: 0.35,
            borderRadius: '50%',
          }}
        />
      </div>
      <section className="w-full flex flex-col md:flex-row items-stretch justify-center min-h-[300px] md:min-h-[400px] py-12 px-4 md:px-12 gap-0">
        <div
          className="flex flex-col justify-end items-start gap-4 flex-1 min-h-[200px] md:min-h-[260px] p-4 md:p-6 rounded-tl-[8px] md:rounded-l-[8px] rounded-tr-[8px] md:rounded-r-none rounded-bl-none md:rounded-bl-[8px] rounded-br-none md:rounded-br-none relative overflow-hidden"
          style={{
            background: 'url(/Restolist.webp) center center / cover no-repeat',
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
          <div style={{position: 'relative', zIndex: 5, width: '100%', paddingTop: '180px'}}>
            <h1
              className="w-fit max-w-[500px] sm:max-w-[600px] md:max-w-[700px] text-[40px] text-left mb-4 drop-shadow-lg"
              style={{
                color: '#FAFFE7',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 520,
                lineHeight: '120%',
                marginBottom: '8px',
              }}
            >
              Our partnered restaurants
            </h1>
            <Link to="/contact">
              <button
                className="flex px-2 py-3 justify-center items-center gap-1 rounded-[6px] bg-[#E2FF65] text-[#211F20] font-poppins text-[11px] font-medium leading-normal shadow-md border-none outline-none hover:opacity-80 transition"
                style={{ fontFamily: 'Poppins, sans-serif', fontSize: '11px', padding: '8px 8px', gap: '4px', marginBottom: '8px', marginTop: '8px' }}
              >
                I want to partner with Circuit
              </button>
            </Link>
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
            background: 'radial-gradient(50% 50% at 50% 50%, #E2FF65 0%, #D2FFD7 100%)',
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
            <div className="flex flex-col w-full mb-12" style={{ alignSelf: 'stretch' }}>
              {restaurants.map((restaurant, idx) => (
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
                      {restaurant.name}
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
                      <p style={{ fontWeight: '500', marginBottom: '8px' }}>{restaurant.address}</p>
                      <p>{restaurant.description}</p>
                    </div>
                  )}
                  {idx === restaurants.length - 1 && (
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
      <div style={{ width: '100vw', margin: '80px 0 0 0', position: 'relative', left: '50%', right: '50%', transform: 'translateX(-50%)', padding: 0 }}>
        <div style={{ width: '100vw', borderTop: '1px solid #211F20', height: 0, margin: 0, padding: 0 }} />
        <div style={{ height: '20px' }} />
      </div>
    </div>
  );
};

export default RestaurantPartnerships;
