import React, { useState } from "react";
import patternImage from '../images/Cir_Pattern_White_RGB@2x.png';

const testimonials = [
  {
    quote: "Life changing",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas.",
    author: " -  Tom, 24 years old",
  },
  {
    quote: "Changed the game",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas.",
    author: " -  Hannah, 29 years old",
  },
  {
    quote: "A fantastic experience",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas.",
    author: " -  Alex, 31 years old",
  }
];

const ClientTestimonials = () => {
  const [startIndex, setStartIndex] = useState(0);

  const nextTestimonial = () => {
    setStartIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setStartIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const getVisibleTestimonials = () => {
    // Get the 3 testimonials to display, with the middle one being the second in the array
    return [
      testimonials[(startIndex + 0) % testimonials.length],
      testimonials[(startIndex + 1) % testimonials.length],
      testimonials[(startIndex + 2) % testimonials.length],
    ];
  };

  return (
    <div className="relative pt-10 pb-9 bg-blue-700">
  <div className="font-poppins text-center text-white text-4xl font-bold mb-6">
    What Our Clients Say About Us
  </div>

  {/* Left Background Image */}
  <img
    src={patternImage}
    alt="Pattern"
    className="absolute left-0 top-1/3 transform -translate-y-1/2 w-48 scale-115 opacity-100"
  />

  {/* Right Background Image */}
  <img
    src={patternImage}
    alt="Pattern"
    className="absolute right-0 top-2/3 transform -translate-y-1/2 w-48 scale-115 opacity-100"
  />

  {/* Testimonials Section */}
  <div className="flex justify-center gap-12 items-center mt-12 relative">
    {getVisibleTestimonials().map((testimonial, index) => {
      const scaleClass = index === 1 ? "scale-125" : "scale-90";

      return (
        <div
          key={index}
          className={`flex flex-col p-6 w-96 bg-white rounded-[30px] text-zinc-800 shadow-lg transition-all duration-500 ${scaleClass}`}
        >
          <div className="font-poppins text-2xl font-bold text-center">{testimonial.quote}</div>
          <div className="font-poppins mt-4 text-base">{testimonial.text}</div>
          <div className="font-poppins mt-3 text-lg text-left">{testimonial.author}</div>
        </div>
      );
    })}
  </div>

  {/* Navigation Arrows & Dots */}
  <div className="flex flex-wrap gap-5 justify-between items-center mx-auto mt-10 max-w-full w-[513px]">
    {/* Left Arrow */}
    <button onClick={prevTestimonial} className="text-white text-3xl">
      &lt;
    </button>

    {/* Dots Indicator */}
    <div className="flex gap-2 justify-center items-center">
      {testimonials.map((_, index) => (
        <div
          key={index}
          className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${
            index === (startIndex + 1) % testimonials.length
              ? "bg-white border-lime-400 shadow-[0_0_8px_#a3e635]" // Lime green glow
              : "bg-gray-400 border-transparent"
          }`}
        ></div>
      ))}
    </div>



    {/* Right Arrow */}
    <button onClick={nextTestimonial} className="text-white text-3xl">
      &gt;
    </button>
  </div>
</div>

  );
};

export default ClientTestimonials;

