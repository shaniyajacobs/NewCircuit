import React from "react";

export function RestaurantPartnerships() {
  return (
    <div className="flex flex-col items-center bg-black pt-11">
      <SectionTitle title="Restaurant Partnerships" />
      <div className="mt-12 w-full max-w-[1252px] max-md:mt-10 max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col">
          <PartnershipSection
            imageSrc1="https://cdn.builder.io/api/v1/image/assets/168bce1fe76648e59dec4f13ce710a03/63ec9076ef9fabf9c0e15532959d327c00024a025dd8a4a808600c02f86436e8?apiKey=168bce1fe76648e59dec4f13ce710a03&"
            imageSrc2="https://cdn.builder.io/api/v1/image/assets/168bce1fe76648e59dec4f13ce710a03/b3a0d86a72667db6aef81ad6fedc45846108f288dbf2b0471f6f4f805eb481db?apiKey=168bce1fe76648e59dec4f13ce710a03&"
            text="Circuit partners with restaurants to get your third date on us."
          />
          <PartnershipSection
            imageSrc="https://cdn.builder.io/api/v1/image/assets/168bce1fe76648e59dec4f13ce710a03/2cc646aa6edecf3ef2b3d05ac47b49322687082d073936d7211231b86a6a1967?apiKey=168bce1fe76648e59dec4f13ce710a03&"
            text="Take photos of your meal to secure a third date on us."
            isReversed
          />
        </div>
      </div>
      <CallToActionButton text="See our Partnered Restaurants" />
      <AboutSection />
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="text-4xl font-bold text-center text-white max-md:max-w-full">
      {title}
    </div>
  );
}

function PartnershipSection({ imageSrc1, imageSrc2, imageSrc, text, isReversed }) {
    return isReversed ? (
      <div className="flex flex-col ml-5 w-[45%] max-md:ml-0 max-md:w-full">
        <div className="flex flex-col grow text-3xl font-bold text-center text-zinc-100 max-md:mt-10 max-md:max-w-full">
          {/* right picture */}
          <ImageWithAlt
            src={imageSrc}
            alt="Restaurant partnership illustration"
            className="w-full aspect-square rounded-[32px] max-md:max-w-full"
          />
          <div className="self-center mt-6 max-md:max-w-full">{text}</div>
        </div>
      </div>
    ) : (
        <div className="flex flex-col ml-5 w-[45%] max-md:ml-0 max-md:w-full">
        <div className="flex flex-col grow text-3xl font-bold text-center text-zinc-100 max-md:mt-10 max-md:max-w-full">
          {/* Make images side by side */}
          <div className="flex flex-row gap-10 max-md:flex-col max-md:items-center">
            {/* left picture */}
            <ImageWithAlt
              src={imageSrc2}
              alt="Restaurant partnership illustration"
              className="w-full aspect-square rounded-[32px] max-md:w-full"
            />
          </div>
          <div className="self-end mt-6 text-3xl font-bold text-center text-zinc-100 max-md:max-w-full">
            {text}
          </div>
        </div>
      </div>
    );
  }
  

function ImageWithAlt({ src, alt, className }) {
  return (
    <img loading="lazy" src={src} alt={alt} className={`object-contain ${className}`} />
  );
}

function CallToActionButton({ text }) {
  return (
    <button className="px-7 py-5 mt-16 max-w-full text-4xl font-semibold text-center text-blue-700 bg-lime-300 rounded-[30px] shadow-[0px_5px_4px_rgba(0,0,0,0.25)] w-[611px] max-md:px-5 max-md:mt-10 max-md:max-w-full">
      {text}
    </button>
  );
}

function AboutSection() {
  return (
    <div className="mt-10 text-center text-white">
      <p>Learn more about our restaurant partnerships and how they benefit you!</p>
    </div>
  );
}
