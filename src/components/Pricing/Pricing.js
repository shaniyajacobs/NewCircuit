import React, { useState } from "react";
import { pricingPlans } from "./PricingData";
import { PricingCard } from "./IndividualPricing";

const Pricing = () => {
  const [isBundle, setIsBundle] = useState(true);

  return (
    <div
      className="flex flex-col items-center px-14 pt-28 pb-40 max-md:px-5 max-md:py-24"
      data-aos="fade-up"
    >
      <h2 className="ml-8 text-7xl font-[Poppins] font-bold text-[80px] leading-none text-center text-blue-700 max-md:max-w-full max-md:text-4xl">
        Pricing Options
      </h2>

      <div className="flex gap-6 items-center mt-28 max-w-full w-[378px] max-md:mt-10">
        <span
          className={`grow self-stretch my-auto text-2xl font-[Poppins] font-semibold ${
            isBundle ? "text-blue-700" : "text-black"
          }`}
        >
          Bundles
        </span>
  
        <button
          onClick={() => setIsBundle(!isBundle)}
          className="flex flex-col justify-center items-start self-stretch px-5 py-1 bg-blue-700 rounded-[36px]"
          aria-label={`Switch to ${
            isBundle ? "Individual" : "Bundles"
          } pricing`}
        >
        <div
            className={`flex shrink-0 bg-zinc-100 h-[43px] rounded-[36px] w-[43px] transition-all duration-300 transform ${
              isBundle ? "-translate-x-5" : "translate-x-5"
            }`}
        />
        </button>
        <span
          className={`grow shrink self-stretch my-auto text-2xl font-[Poppins] font-semibold text-[25px] ${
            !isBundle ? "text-blue-700" : "text-black"
          } w-[109px]`}
        >
          Individual
        </span>
      </div>

      <div className="self-stretch mt-16 max-md:mt-10 max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div
            className="w-[33%] max-md:ml-0 max-md:w-full"
            data-aos="fade-up"
            data-aos-delay="100"
          > 
            <div className="flex flex-col items-center px-9 pt-7 pb-20 mx-auto mt-9 w-full bg-blue-700 rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.25)] text-zinc-100 max-md:px-5 max-md:mt-10">
     
              <h3 className="self-stretch text-4xl leading-none">
                {isBundle ? "The Introduction" : "Brunch" }
              </h3>
              
              <div className="flex gap-5 self-start mt-6 text-lg leading-[50px] max-md:ml-2">
                <div className="flex shrink-0 my-auto w-6 h-[115px]" />
                {isBundle ?
                  <ul className="list-disc">
                    <li>All eligible venues</li>
                    <li>Basic Matching Algorithm</li>
                    <li>1 Dinner</li>
                  </ul> :
                  <ul className="list-disc">
                    <li>{pricingPlans.at(0).time}</li>
                    <li>{pricingPlans.at(0).features}</li>
                </ul> 
                }
              </div>
              <div className="mt-24 text-5xl leading-none max-md:mt-10 max-md:text-4xl">
                {isBundle ? "3 Dates" : "" }
              </div>
              <div className="mt-4 text-5xl leading-none max-md:text-4xl">
              {isBundle ? "$78" : "$28" }
              </div>
              <button className="px-16 py-3 mt-9 max-w-full text-base tracking-tight leading-loose text-center text-blue-700 rounded-lg bg-zinc-100 w-[249px] max-md:px-5 hover:bg-zinc-200 transition-colors">
                Sign up now
              </button>
            </div>
          </div>

          <div
            className="ml-5 w-[33%] max-md:ml-0 max-md:w-full"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="flex flex-col items-center pb-24 mx-auto w-full rounded-3xl bg-neutral-800 shadow-[0px_4px_20px_rgba(0,0,0,0.25)] text-zinc-100 max-md:mt-10">
              <div className="self-stretch px-4 pb-6 h-10 text-xl leading-3 whitespace-nowrap bg-blue-700 rounded-tl-3xl rounded-tr-3xl text-center pt-3">
                Popular
              </div>
              <h3 className="mt-9 text-4xl leading-none">
                {isBundle ? "The Connection" : "Happy Hour" }
              </h3>
              <div className="flex gap-5 items-start mt-8 max-w-full text-lg leading-[50px] w-[296px]">
        
                {isBundle ?
                  <ul className="flex-auto w-[254px] list-disc">
                  <li>All eligible venues</li>
                  <li>Advanced Matching Algorithm</li>
                  <li>2 Dinners</li>
                </ul> :
                  <ul className="list-disc">
                    <li>{pricingPlans.at(1).time}</li>
                    <li>{pricingPlans.at(1).features}</li>
                </ul> 
                }
                
              </div>
              <div className="mt-28 text-5xl leading-none max-md:mt-10 max-md:text-4xl">
              {isBundle ? "6 Dates" : "" }
              </div>
              <div className="mt-6 text-5xl leading-none max-md:text-4xl">
              {isBundle ? "$144" : "$28" }
              </div>
              <button className="px-16 py-3 mt-9 max-w-full text-base tracking-tight leading-loose text-center rounded-lg bg-zinc-100 text-neutral-800 w-[249px] max-md:px-5 hover:bg-zinc-200 transition-colors">
                Sign up now
              </button>
            </div>
          </div>

          <div
            className="ml-5 w-[33%] max-md:ml-0 max-md:w-full"
            data-aos="fade-up"
            data-aos-delay="300"
          >

            <div className="flex flex-col items-center px-11 pt-7 pb-20 mx-auto mt-9 w-full bg-blue-700 rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.25)] text-zinc-100 max-md:px-5 max-md:mt-10">
              <h3 className="self-stretch text-4xl leading-none max-md:mr-2.5">
                {isBundle ? "The Adventure" : "Dinner" }
              </h3>
              <div className="flex gap-5 items-start self-stretch mt-4 text-lg leading-[50px]">
                {isBundle ?
                  <ul className="flex-auto w-[259px] list-disc">
                  <li>All eligible venues</li>
                  <li>Advanced Matching Algorithm</li>
                  <li>Boosted Visibility and Matching</li>
                  <li>3 Dinners</li>
                </ul> :
                  <ul className="list-disc">
                    <li>{pricingPlans.at(2).time}</li>
                    <li>{pricingPlans.at(2).features}</li>
                </ul> 
                }
                
              </div>
              <div className="mt-16 text-5xl leading-none max-md:mt-10 max-md:text-4xl">
              {isBundle ? "10 Dates" : "" }
              </div>
              <div className="mt-6 text-5xl leading-none max-md:text-4xl">
              {isBundle ? "$220" : "#38" }
              </div>
              <button className="px-16 py-3 mt-9 ml-2.5 max-w-full text-base tracking-tight leading-loose text-center text-blue-700 rounded-lg bg-zinc-100 w-[249px] max-md:px-5 hover:bg-zinc-200 transition-colors">
                Sign up now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
