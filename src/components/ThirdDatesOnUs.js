import * as React from "react";
import { useNavigate } from "react-router-dom";

const thirdDateSteps = [
  {
    step: "STEP 01",
    title: "Do your first speed date",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
  },
  {
    step: "STEP 02",
    title: "Connect with a spark",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
  },
  {
    step: "STEP 03",
    title: "Go on 3 dates with a spark & take pictures",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac."
  }
];

export function ThirdDatesOnUs() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white flex flex-col items-center px-[64px] py-[100px] gap-[100px] sm:px-[96px] px-[48px] sm:py-[100px] py-[60px]">
      {/* Title */}
      <h2
        style={{
          color: '#211F20',
          textAlign: 'center',
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 520,
          lineHeight: '120%',
          alignSelf: 'stretch',
        }}
        // Desktop: 48px, Mobile: 36px (example for responsiveness)
        className="text-[36px] sm:text-[48px]"
      >
        The third date's on us
      </h2>

      {/* Card Grid */}
      <div className="flex flex-col sm:flex-row justify-center gap-[36px] w-full">
        {thirdDateSteps.map((card, index) => (
          <div
            key={index}
            // For full screen, let's target a desktop width (e.g., around 300px for a 3-column layout with gaps)
            // On mobile, it will take full width (w-full)
            // sm:w-[calc(33.333%-24px)] is what you had, let's re-incorporate it for sm+
            className="third-date-card flex flex-col justify-between items-start rounded-[20px] border-[1.5px] border-[#211F20] bg-[#FAFFE7] relative p-[24px] sm:p-[48px]"
            style={{
                flex: '1 1 calc(33.333% - 24px)', // 3 cards per row with spacing
                aspectRatio: window.innerWidth >= 768 && window.innerWidth <= 1024 ? '1 / 1' : 'auto',
                maxWidth: '425px',
                width: '100%',
}}
          >
            {/* Icon container in top left corner */}
            <div
              className="absolute top-[24px] left-[24px] flex items-center justify-center
                         w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px]"
              style={{
                maxWidth: 'calc(50% - 24px)',
              }}
            >
              {index === 0 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100" fill="none"
                  className="w-full h-full"
                >
                  <path d="M48.6657 1.18531C48.8534 -0.395103 51.1466 -0.395103 51.3343 1.18531L52.9075 14.4435C54.9388 31.5634 68.4366 45.0612 85.5563 47.0925L98.8146 48.6657C100.395 48.8534 100.395 51.1466 98.8146 51.3343L85.5563 52.9075C68.4366 54.9388 54.9388 68.4366 52.9075 85.5563L51.3343 98.8146C51.1466 100.395 48.8534 100.395 48.6657 98.8146L47.0925 85.5563C45.0612 68.4366 31.5634 54.9388 14.4435 52.9075L1.18531 51.3343C-0.395103 51.1466 -0.395103 48.8534 1.18531 48.6657L14.4435 47.0925C31.5634 45.0612 45.0612 31.5634 47.0925 14.4435L48.6657 1.18531Z" fill="#211F20"/>
                </svg>
              )}
              {index === 1 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 101 64" fill="none"
                  className="w-full h-full relative sm:top-1 md:top-2"
                >
                  <path fillRule="evenodd" clipRule="evenodd" d="M100.333 32C100.333 32 77.9473 63.2749 50.333 63.2749C22.7189 63.2749 0.333008 32 0.333008 32C0.333008 32 22.7189 0.725098 50.333 0.725098C77.9473 0.725098 100.333 32 100.333 32ZM73.1533 32C73.1533 44.5669 62.9366 54.7546 50.333 54.7546C37.7294 54.7546 27.5126 44.5669 27.5126 32C27.5126 19.4331 37.7294 9.24538 50.333 9.24538C62.9366 9.24538 73.1533 19.4331 73.1533 32ZM50.333 45.039C57.5553 45.039 63.4099 39.2012 63.4099 32C63.4099 24.7988 57.5553 18.961 50.333 18.961C43.1107 18.961 37.2561 24.7988 37.2561 32C37.2561 39.2012 43.1107 45.039 50.333 45.039Z" fill="#211F20"/>
                </svg>
              )}
              {index === 2 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 57 100" fill="none"
                  className="w-full h-full"
                >
                  <path d="M56.4207 0H19.8568L0.914062 53.0974H16.7731L3.55723 100L49.3722 35.3982H33.0727L56.4207 0Z" fill="#211F20"/>
                </svg>
              )}
            </div>
            {/* Dots in top right corner - remains fixed */}
            <div 
              style={{ 
                position: 'absolute', 
                top: 24, 
                right: 24, 
                display: 'flex', 
                flexDirection: 'row', 
                gap: 'clamp(4px, 1vw, 10px)',
                maxWidth: 'calc(50% - 24px)',
              }}
            >
              {[0, 1, 2, 3].map((dotIdx) => (
                <div
                  key={dotIdx}
                  style={{
                    display: 'flex',
                    width: 'clamp(6px, 1.5vw, 12px)',
                    height: 'clamp(6px, 1.5vw, 12px)',
                    padding: 'clamp(3px, 1vw, 8px)',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 'clamp(4px, 1vw, 10px)',
                    borderRadius: '100px',
                    border: '1.5px solid #211F20',
                    background: dotIdx < index + 1 ? '#E2FF65' : 'transparent',
                  }}
                />
              ))}
            </div>
            {/* Text content with adjusted spacing and sizes */}
            <div className="mt-[120px] sm:mt-[140px] md:mt-[160px]">
              <p
                className="font-bricolage uppercase text-[#211F20]/75 mb-3 sm:mb-4 text-left
                          text-[14px] sm:text-[15px] md:text-[17px]"
                style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 400 }}
              >
                {card.step}
              </p>
              <h3
                className="font-bricolage text-[#211F20] mb-3 sm:mb-4 text-left
                          text-[20px] sm:text-[22px] md:text-[26px]"
                style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 400 }}
              >
                {card.title}
              </h3>
              <p
                className="font-poppins font-normal text-[#211F20] mb-0 pb-0 text-left
                          text-[14px] sm:text-[15px] md:text-[17px]"
              >
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Image Section */}
      <div className="w-full flex justify-center">
        <div
          style={{
            position: 'relative',
            display: 'flex',
            height: '500px',
            minHeight: 'var(--Min-Height-S, 500px)',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            alignSelf: 'stretch',
            borderRadius: 'var(--Radius-M, 16px)',
            overflow: 'hidden',
            marginTop: '-70px',
            background: `url('/WomanWineGlass.png') lightgray 50% / cover no-repeat`,
            maxWidth: '95.5%',
          }}
          // Responsive padding for image section
          className="px-[24px] py-[24px] sm:px-[50px] sm:py-[50px] w-full"
        >
          {/* Noise overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2.5\' numOctaves=\'6\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              opacity: 0.95,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          {/* Black gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
          {/* Dots in top right corner of image section (Reverted to always filled) */}
          <div style={{
            position: 'absolute',
            top: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            zIndex: 4
          }}>
            {[0, 1, 2, 3].map((dotIdx) => (
              <div
                key={dotIdx}
                style={{
                  display: 'flex',
                  width: '12px',
                  height: '12px',
                  padding: '8px',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '10px',
                  borderRadius: '100px',
                  border: '1.5px solid #211F20',
                  background: '#E2FF65', // Always filled as per original or desired look
                }}
              />
            ))}
          </div>
          {/* Text above gradient */}
          <div style={{
            position: 'relative',
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            width: '100%',
          }}>
            <span
              // Mobile first: 16px, then 20px on sm+
              className="text-[16px] sm:text-[20px]"
              style={{
                alignSelf: 'stretch',
                color: '#FAFFE7',
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: '130%',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              STEP 04
            </span>
            <span
              // Mobile first: 40px, then 64px on sm+
              className="text-[40px] sm:text-[64px]"
              style={{
                position: 'relative',
                zIndex: 2,
                alignSelf: 'stretch',
                color: 'var(--Mindaro_Light, #FAFFE7)',
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontStyle: 'normal',
                fontWeight: 550,
                lineHeight: '110%',
                marginTop: 'auto',
                marginBottom: 0,
              }}
            >
              The third date includes a drink on us
            </span>
            <span
              // Mobile first: 14px, then 16px on sm+
              className="text-[14px] sm:text-[16px]"
              style={{
                alignSelf: 'stretch',
                color: 'var(--Mindaro_Light, #FAFFE7)',
                fontFamily: 'Poppins, sans-serif',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                marginTop: '8px'
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
            </span>
          </div>
        </div>
      </div>
      {/* Button */}
      <button
        onClick={() => navigate('/create-account')}
        style={{
          display: 'flex',
          padding: 'var(--TopBottom-S, 14px) var(--Left-Right-M, 28px)',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--Gap-XXS, 12px)',
          borderRadius: 'var(--Radius-S, 8px)',
          background: 'var(--Raisin_Black, #211F20)',
          color: 'var(--Mindaro_Light, #FAFFE7)',
          fontFamily: 'Poppins, sans-serif',
          fontSize: 'var(--Body-S-Med, 17px)',
          fontStyle: 'normal',
          fontWeight: 500,
          lineHeight: 'normal',
          border: 'none',
          cursor: 'pointer',
          marginTop: '8px',
          transition: 'all 0.3s',
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
      >
        Claim my free drink
      </button>
    </div>
  );
}