import React from "react";
import Testimonials from "../components/Testimonials";

const ClientTestimonials = () => {
  return (
    <div
      className="pt-14 pb-9 bg-blue-700"
      aria-label="Client Testimonials Section"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://drive.google.com/file/d/1tdEMMH9j7l8ygz0OqNByS1-JMsXrfH47/view?usp=sharing')] bg-cover bg-center z-0"></div>
      <div className="flex flex-col items-center w-full max-md:mt-10 max-md:max-w-full">
        <h2 className="text-4xl font-bold text-white text-center max-md:max-w-full">
          What Our Clients Say About Us
        </h2>
        <div className="mt-6 w-full max-w-[948px]">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};

const PersonalityQuiz = () => {
  return (
    <div
      className="flex flex-col items-center px-20 pt-8 pb-14 text-4xl text-center text-blue-700 bg-zinc-100 max-md:px-5"
      aria-label="Personality Quiz Section"
    >
      <div className="flex flex-col max-w-full w-[948px]">
        <h2 className="font-bold max-md:max-w-full">
          We match you to your ideal partner based <br />
          on our highly comprehensive personality indicator.
        </h2>
        <button
          className="self-center px-5 py-5 mt-6 ml-3.5 max-w-full font-semibold bg-lime-300 rounded-[30px] shadow-[0px_5px_4px_rgba(0,0,0,0.25)] w-[587px] max-md:pr-5 max-md:max-w-full hover:bg-lime-400 transition-colors duration-300"
          aria-label="Start Personality Quiz"
        >
          Take the Personality Indicator
        </button>
      </div>
    </div>
  );
};

const MainPage = () => {
  return (
    <div className="flex flex-col">
      <ClientTestimonials />
      <PersonalityQuiz />
    </div>
  );
};

export default MainPage;
