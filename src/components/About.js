import React from "react";
import aboutImage from "../images/aboutImage.png"; // Import your image

export function AboutSection() {
  return (
    <section className="flex items-center min-h-screen bg-[#211F20] text-white px-20 max-md:px-5 max-md:flex-col">
      {/* Left Side: Text */}
      <div className="w-1/2 max-md:w-full">
        <h1 
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: "700",
          fontStyle: "normal",
          fontSize: "50px",
          lineHeight: "60px",
          letterSpacing: "-2.7px",
        }}
        >
          About
        </h1>
        <CircuitComponent />
        <AboutDescription />
      </div>

      {/* Right Side: Image */}
      <div className="w-1/3 flex justify-center items-center ml-auto max-md:w-full max-md:mt-10">
  <img
    src={aboutImage}
    alt="About Section Illustration"
    className="w-[500px] h-[550px] object-cover rounded-2xl"
  />
</div>

    </section>
  );
}

function AboutDescription() {
  return (
    <p className="mt-8 text-2xl font-medium text-left text-gray-300 max-md:mt-6 max-md:text-lg">
      Circuit is a cutting-edge virtual speed dating platform that transforms
      the modern dating experience by fostering genuine connections through
      dynamic, structured events. Designed for today's fast-paced, tech-savvy
      singles, Circuit goes beyond the superficial to deliver quality
      interactions, exceptional customer service, and an enjoyable user
      experience. Leveraging advanced technology and innovation, Circuit
      creates a vibrant community where authenticity, energy, and excitement
      thrive. More than just a dating service, Circuit is a fresh and
      effective way to find love and build meaningful relationships in the
      digital age.
    </p>
  );
}

const CircuitComponent = () => {
  return (
    <div className="inline-block px-2 py-1 mt-6 text-lg font-bold text-center text-black bg-lime-300 rounded-2xl">
  Circuit
</div>

  );
};
