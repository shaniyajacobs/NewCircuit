import React from "react";
import aboutImage from "../images/aboutImage.png"; // Import your image

export function AboutSection() {
  return (
    <section className="bg-[#211F20] text-white py-12 px-6 flex justify-center">
      <div className="flex items-center justify-between gap-10 max-w-6xl w-full max-md:flex-col max-md:text-center">
        {/* Left Side: Text */}
        <div className="flex-1 max-md:w-full -ml-9 max-md:ml-0">
          <h2 className="text-5xl font-extrabold max-md:text-3xl">ABOUT</h2>
          <CircuitComponent />
          <AboutDescription />
        </div>

        {/* Right Side: Image */}
        <div className="flex justify-center items-center max-md:mt-8">
          <img
            src={aboutImage}
            alt="About Section Illustration"
            className="w-[400px] h-[440px] object-cover rounded-2xl max-md:w-[300px] max-md:h-[320px]"
          />
        </div>
      </div>
    </section>
  );
}

function AboutDescription() {
  return (
    <p className="mt-6 text-lg font-medium text-gray-300 leading-relaxed max-md:text-base">
      Circuit is a cutting-edge virtual speed dating platform that transforms
      the modern dating experience by fostering genuine connections through
      dynamic, structured events. Designed for today's fast-paced, tech-savvy
      singles, Circuit goes beyond the superficial to deliver quality
      interactions, exceptional customer service, and an enjoyable user
      experience. Leveraging advanced technology and innovation, Circuit
      creates a vibrant community where authenticity, energy, and excitement
      thrive.
    </p>
  );
}

const CircuitComponent = () => {
  return (
    <div className="inline-block px-3 py-1 mt-4 text-sm font-semibold text-black bg-lime-300 rounded-xl max-md:mx-auto">
      Circuit
    </div>
  );
};
