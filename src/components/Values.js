import React from 'react';

export function Values() {
  return (
    <div 
        className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-center items-center gap-[18px] sm:gap-[24px] md:gap-[32px] lg:gap-[50px] w-full px-[6vw] py-[100px] bg-[#FAFFE7] min-h-screen"
    >
      {/* Video Rectangle */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          flex: '0.8 0 0',
          alignSelf: 'center',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.75) 100%), url(<path-to-image>) lightgray 50% / cover no-repeat',
          backgroundBlendMode: 'normal, soft-light',
        }}
        className="order-last md:order-none flex w-[358px] min-h-[350px] sm:w-[696px] sm:min-h-[450px] md:w-[592px] md:min-h-[690px] lg:min-w-[645px] lg:min-h-[800px] p-[16px] sm:p-[24px] md:p-[32px] lg:p-[50px] flex-col justify-end items-start rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] relative overflow-hidden"
      >
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{
            backgroundBlendMode: 'normal, soft-light',
          }}
        >
          <source src="/aboutuscard.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 z-1"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.75) 100%)',
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
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.3) 10%%)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
        
        {/* Noise overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2.5\' numOctaves=\'6\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            opacity: 1,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
        
        {/* Text over video */}
        <div 
            style={{
                position: 'relative',
                zIndex: 10,
            }}
        >
          <h1
            style={{
              color: '#FAFFE7',
              textAlign: 'left',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 520,
              lineHeight: '120%',
            }}
            className="w-fit max-w-[500px] sm:max-w-[600px] md:max-w-[700px] text-[32px] sm:text-[32px] md:text-[48px] lg:text-[64px] text-left max-w-[10000px] md:max-w-[1000px]"
          >
            Behind the team trying to spark your flame
          </h1>
        </div>
      </div>

      {/* Value Boxes Container */}
      <div className="flex flex-col gap-[18px] sm:gap-[24px] md:gap-[32px] lg:gap-[50px] flex-1  max-h-[800px]">
        {/* Value 01 */}
        <div
            className="flex w-[358px] h-[137px] sm:w-[696px] sm:h-[135px] md:w-[592px] md:h-[170px] lg:w-[645px] lg:h-[225px] p-[20px] sm:p-[30px] flex-col items-start gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#E2FF65_0%,_#D2FFD7_100%)]"
        >
            <h2 
                style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 520,
                    lineHeight: '120%',
                }}
                className="text-[32px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[110%] text-[#211F20] break-words"
            >
                → Value 01
            </h2>
            <p className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-normal text-[#211F20] break-words">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
            </p>
        </div>


        {/* Value 02 */}
        <div
            className="flex w-[358px] h-[137px] sm:w-[696px] sm:h-[135px] md:w-[592px] md:h-[170px] lg:w-[645px] lg:h-[225px] p-[20px] sm:p-[30px] flex-col items-start gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#8EFF7A_0%,_#D7FFF8_100%)]"
        >
            <h2 
                style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 520,
                    lineHeight: '120%',
                }}
                className="text-[32px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[110%] text-[#211F20] break-words"
            >
                → Value 02
            </h2>
            <p className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-normal text-[#211F20] break-words">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
            </p>
        </div>


        {/* Value 03 */}
        <div
            className="flex w-[358px] h-[195px] sm:w-[696px] sm:h-[219px] md:w-[592px] md:h-[286px] lg:w-[645px] lg:h-[373px] p-[20px] sm:p-[30px] flex-col items-start gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#79FFC7_0%,_#FFF9A1_100%)]"
        >
            <div className="flex flex-col items-start gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px]">
                <h2 
                    style={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontWeight: 520,
                        lineHeight: '120%',
                    }}
                    className="text-[32px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[110%] text-[#211F20] break-words"
                >
                    → Value 03
                </h2>
                <p className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-normal text-[#211F20] break-words">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
                </p>
            </div>
            <button 
                className="text-white px-4 py-2 rounded text-sm mt-auto"
                style={{
                    backgroundColor: '#211F20',
                    transition: 'all 0.3s',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
                Learn more
            </button>
        </div>
      </div>
    </div>
  );
} 