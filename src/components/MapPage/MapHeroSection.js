import React from 'react';

const MapHeroSection = () => {
  return (
    <div 
        className="max-w-[1280px] mx-auto flex md:flex-row-reverse flex-col justify-center items-center gap-[18px] sm:gap-[24px] md:gap-[32px] lg:gap-[50px] w-full px-4 sm:px-6 md:px-10 lg:px-[100px] pb-[100px] bg-[#FAFFE7] min-h-screen"
    >
      {/* Image Rectangle */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          flex: '0.8 0 0',
          alignSelf: 'center',
        }}
        className="order-last md:order-none flex w-full sm:w-full md:w-[592px] md:min-h-[690px] lg:min-w-[645px] min-h-[350px] sm:min-h-[450px] lg:min-h-[800px] p-[16px] sm:p-[24px] md:p-[32px] lg:p-[50px] justify-end items-start rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] relative overflow-hidden"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'url("/restaucard.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0
          }}
        />
        
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
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.3) 10%)',
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
            opacity: 0.05,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
        
        {/* Text over image */}
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
            The Kind of Places You’ll Want to Come Back To
          </h1>
        </div>
      </div>

      {/* Restaurant Cards Container */}
      <div className="flex flex-col w-full gap-[18px] sm:gap-[24px] md:gap-[32px] lg:gap-[50px] flex-1  max-h-[800px]">
        {/* Dietary restrictions */}
        <div
            className="flex md:w-[592px] h-[172px] sm:h-[135px] md:h-[170px] lg:w-[645px] lg:h-[225px] p-[20px] sm:p-[30px] flex-col items-start gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#8EFF7A_0%,_#D7FFF8_100%)]"
        >
            <h2 
                style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 520,
                    lineHeight: '120%',
                }}
                className="text-[32px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[110%] text-[#211F20] break-words"
            >
                → Dietary-Friendly Menus
            </h2>
            <p className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-normal text-[#211F20] break-words">
                Whether you’re gluten-free, vegan, or have other preferences, we choose restaurants that can accommodate your needs.
            </p>
        </div>


        {/* Budget-friendly options */}
        <div
            className="flex w-full sm:w-full md:w-[592px] h-[172px] sm:h-[135px] md:h-[170px] lg:w-[645px] lg:h-[225px] p-[20px] sm:p-[30px] flex-col items-start gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#B4FFF2_0%,_#E1FFD6_100%)]"
        >
            <h2 
                style={{
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 520,
                    lineHeight: '120%',
                }}
                className="text-[32px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[110%] text-[#211F20] break-words"
            >
                → Options That Won’t Break the Bank
            </h2>
            <p className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-normal text-[#211F20] break-words">
                We partner with restaurants that feel like a treat, without the hefty price tag.
            </p>
        </div>


        {/* Top Rated Restaurants */}
        <div
            className="flex w-full sm:w-full md:w-[592px] h-[230px] sm:h-[219px] md:h-[286px] lg:w-[645px] lg:h-[373px] p-[20px] sm:p-[30px] flex-col items-start gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] rounded-[8px] sm:rounded-[10px] md:rounded-[12px] lg:rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#B0EEFF_0%,_#E7E9FF_100%)]"
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
                    → Top-Rated Local Gems
                </h2>
                <p className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-normal text-[#211F20] break-words">
                    From cozy cocktail bars to buzzy small plates, we partner with places that people genuinely love and review highly.
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

export default MapHeroSection; 