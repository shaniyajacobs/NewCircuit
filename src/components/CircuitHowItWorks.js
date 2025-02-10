import * as React from "react";
import profileIcon from '../images/profileIcon.png';
import heart from '../images/heart.png'
import find from '../images/find.png'
import champagne from '../images/champagne.png'

  export const stepsData = [
    {
      title: "1. Get Started",
      description: "Sign up, select your location, and create your profile. Take our personality indicator to discover personalized connections just for you.",
      isBlue: true
    },
    {
      title: "2. Explore Circuit",
      description: "Choose your circuit and enjoy 10 exciting speed dates. Connect, converse, and spark chemistry in a fun, fast-paced setting.",
      isBlue: false
    },
    {
      title: "3. Choose Your Connections",
      description: "After your speed dates, choose up to 3 people you'd like to stay in touch with. If your choices align, you'll both be a mutual connection.",
      isBlue: false
    },
    {
      title: "4. Ignite the Spark",
      description: "Take it to the next level with a memorable date at one of our partnered restaurants and deepen your connection.",
      isBlue: true
    }
  ];

export function StepCard({ title, description, isBlue }) {
  return (
    <div
      className={`overflow-hidden flex flex-col items-center px-14 pt-10 pb-24 max-w-full min-h-[289px] rounded-[40px] w-full ${isBlue ? 'bg-blue-700 border border-blue-900' : 'bg-neutral-800'}`}
    >
      {/* Icon Box (Lime Green or Blue) */}
      <div
        className={`relative flex items-center justify-center rounded-2xl h-[52px] w-[52px] min-h-[52px] shadow-[0px_2px_16px_rgba(0,0,0,0.035)] mb-6
          ${isBlue && description.includes('our') ? 'bg-lime-300' : 'bg-blue-700'}`}
      >
        {/* Profile Icon should only be inside the lime-green square in "Get Started" */}
        {title === "1. Get Started" && (
          <img
            src={profileIcon}
            alt="Profile Icon"
            className="absolute inset-0 m-auto w-8 h-8"
          />
        )}
        {title === "2. Explore Circuit" && (
          <img
            src={heart}
            alt="Heart"
            className="absolute inset-3 m-auto w-8 h-8"
          />
        )}
        {title === "3. Choose Your Connections" && (
          <img
            src={find}
            alt="Find"
            className="absolute inset-0 m-auto w-8 h-8"
          />
        )}
        {title === "4. Ignite the Spark" && (
          <img
            src={champagne}
            alt="Champagne"
            className="absolute inset-0 m-auto w-8 h-8"
          />
        )}
      </div>

      {/* Title inside the card */}
      <h2 className="text-2xl font-bold text-zinc-100 mb-4 text-center">
        {title}
      </h2>

      {/* Description */}
      <div className="z-10 text-base font-medium leading-6 text-zinc-100 max-w-[400px] text-center">
        {description}
      </div>
    </div>
  );
}


export function HowItWorks() {
  return (
    <div className="flex flex-col items-center justify-center px-20 py-28 bg-white max-md:px-5 max-md:pt-24">
      {/* Centering the Title */}
      <div className="flex z-10 flex-col mb-16 w-full max-w-[644px] font-bold text-center">
        <div className="text-7xl tracking-tighter leading-none text-blue-700 max-md:max-w-full max-md:text-4xl">
          How It Works
        </div>
      </div>
      
      {/* Centering the Steps */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-[1163px] max-md:grid-cols-1">
        {stepsData.map((step, index) => (
          <StepCard
            key={index}
            title={step.title}
            description={step.description}
            isBlue={step.isBlue}
            image={profileIcon}
          />
        ))}
      </div>
    </div>
  );
}
