import React from "react";

export function RestaurantPartnerships() {
  return (
    <div className="flex flex-col items-center bg-[#211F20] pt-10 pb-12 px-4">
      <SectionTitle title="Restaurant Partnerships" />
      <div className="mt-10 w-full max-w-screen-xl">
        <div className="flex flex-wrap gap-8 justify-center">
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
    <div className="text-2xl md:text-3xl font-bold text-center text-white">
      {title}
    </div>
  );
}

function PartnershipSection({ imageSrc1, imageSrc2, imageSrc, text, isReversed }) {
  return (
    <div className="flex flex-col flex-1 min-w-[280px] max-w-[400px] text-center text-white">
      <ImageWithAlt
        src={imageSrc || imageSrc2}
        alt="Restaurant partnership"
        className="w-full aspect-square rounded-2xl"
      />
      <div className="mt-4 text-base md:text-lg font-medium">{text}</div>
    </div>
  );
}

function ImageWithAlt({ src, alt, className }) {
  return <img loading="lazy" src={src} alt={alt} className={`object-cover ${className}`} />;
}

function CallToActionButton({ text }) {
  return (
    <button className="mt-10 px-6 py-4 text-lg font-semibold text-blue-700 bg-lime-300 rounded-[30px] shadow-md hover:bg-lime-400 transition">
      {text}
    </button>
  );
}

function AboutSection() {
  return (
    <div className="mt-6 text-sm text-center text-white px-4">
      <p>Learn more about our restaurant partnerships and how they benefit you!</p>
    </div>
  );
}
