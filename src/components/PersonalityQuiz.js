import React from "react";

const PersonalityQuiz = () => {
  return (
    <div
      className="flex flex-col items-center px-20 pt-8 pb-14 text-4xl text-center text-blue-700 bg-zinc-100 max-md:px-5"
      data-name="Section"
    >
      <div className="flex flex-col max-w-full w-[948px]">
        <div
          className="font-poppins font-bold max-md:max-w-full"
          data-name="We match you to your ideal partner based on our highly comprehensive personality indicator."
        >
          We match you to your ideal partner based <br />
          on our highly comprehensive personality indicator.
        </div>
        <div
          className="font-poppins self-center px-5 py-5 mt-6 ml-3.5 max-w-full font-semibold bg-lime-300 rounded-[30px] shadow-[0px_5px_4px_rgba(0,0,0,0.25)] w-[587px] max-md:pr-5 max-md:max-w-full"
          data-name="Take the Personality Indicator"
        >
          Take the Personality Indicator
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz;
