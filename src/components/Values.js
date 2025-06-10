import React from 'react';

export function Values() {
  return (
    <div 
        className="max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-center items-center gap-[50px] w-full px-[6vw] py-[100px] bg-[#FAFFE7] min-h-screen"
    >
      {/* Video Rectangle */}
      <div
        style={{
          display: 'flex',
          padding: 'var(--Margins-S, 50px)',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          flex: '0.8 0 0',
          alignSelf: 'stretch',
          borderRadius: 'var(--Radius-M, 16px)',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.75) 100%), url(<path-to-image>) lightgray 50% / cover no-repeat',
          backgroundBlendMode: 'normal, soft-light',
        }}
        className="flex min-h-[580px] p-[24px] sm:p-[50px] flex-col justify-end items-start flex-[0.8] rounded-[16px] relative overflow-hidden"
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
        
        {/* Text over video */}
        <div className="relative z-2">
          <h1
            className="w-fit max-w-[500px] sm:max-w-[600px] md:max-w-[700px] text-[28px] sm:text-[36px] md:text-[50px] font-bricolage font-semibold leading-[110%] text-[#FAFFE7] text-left max-w-[10000px] md:max-w-[1000px]"
          >
            Behind the team trying to spark your flame
          </h1>
        </div>
      </div>

      {/* Value Boxes Container */}
      <div className="flex flex-col gap-[30px] flex-1  max-h-[800px]">
        {/* Value 01 */}
        <div
            className="flex h-[200px] max-h-[800px] p-[20px] sm:p-[30px] flex-col items-start gap-[20px] sm:gap-[30px] rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#E2FF65_0%,_#D2FFD7_100%)]"
        >
            <h2 className="text-[20px] sm:text-[24px] md:text-[28px] font-bricolage font-semibold leading-[110%] text-[#211F20]">
                → Value 01
            </h2>
            <p className="text-[12px] sm:text-[14px] font-poppins font-normal text-[#211F20]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
            </p>
        </div>


        {/* Value 02 */}
        <div
            className="flex h-[200px] max-h-[800px] p-[20px] sm:p-[30px] flex-col items-start gap-[20px] sm:gap-[30px] rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#8EFF7A_0%,_#D7FFF8_100%)]"
        >
            <h2 className="text-[20px] sm:text-[24px] md:text-[28px] font-bricolage font-semibold leading-[110%] text-[#211F20]">
                → Value 02
            </h2>
            <p className="text-[12px] sm:text-[14px] font-poppins font-normal text-[#211F20]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
            </p>
        </div>


        {/* Value 03 */}
        <div
            className="flex flex-1 min-h-[300px] p-[20px] sm:p-[30px] flex-col items-start justify-between gap-[20px] sm:gap-[30px] rounded-[16px] bg-[radial-gradient(50%_50%_at_50%_50%,_#79FFC7_0%,_#FFF9A1_100%)]"
        >
        <div>
            <h2 className="text-[20px] sm:text-[24px] md:text-[28px] font-bricolage font-semibold leading-[110%] text-[#211F20]">
                → Value 03
            </h2>
            <p className="text-[12px] sm:text-[14px] font-poppins font-normal text-[#211F20]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
            </p>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm mt-2">
            Learn more
        </button>
    </div>
      </div>
    </div>
  );
} 