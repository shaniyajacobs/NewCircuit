/*
import React from 'react';
import {Link} from 'react-router-dom';
const Pricing = () => {
    return ( 
        <div className="w-full flex items-center justify-center text-white cta">
            <div className="mx-8 w-full h-96 text-center lg:text-left py-16 px-12 flex lg:justify-between items-center">                    
                <div className="w-full flex flex-col lg:flex-row lg:justify-around">
                    <div className="mb-4">
                        <p className='text-2xl md:text-4xl font-bold mb-4'>Are you ready to scale your business?</p>
                        <p className="text-lg md:text-2xl">Get in touch and let us build something amazing <span className='font-black'>together!</span></p>
                    </div>
                    
                    <div className="w-full lg:w-72 pt-6 lg:mx-12">
                        <Link to="/contact" className="bg-transparent border hover:bg-blue-900 hover:border-blue-800 text-white justify-center text-center rounded-lg px-10 py-3 flex items-center group">Send a message
                        <svg className="w-5 h-5 ml-1 group-hover:translate-x-2 duration-500 ease-in" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
     );
}
 
export default Pricing;
*/

import React, { useState } from "react";

const Pricing = () => {
  const [isBundle, setIsBundle] = useState(true);

  return (
    <div
      className="flex flex-col items-center px-14 pt-28 pb-40 max-md:px-5 max-md:py-24"
      //data-aos="fade-up"
    >
      <h2 className="ml-8 text-7xl font-bold text-[80px] leading-none text-center text-blue-700 max-md:max-w-full max-md:text-4xl">
        Pricing Options
      </h2>

      <div className="flex gap-6 items-center mt-28 max-w-full w-[378px] max-md:mt-10">
        <span
          className={`grow self-stretch my-auto text-2xl font-semibold ${
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
          className={`grow shrink self-stretch my-auto text-2xl font-semibold text-[25px] ${
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
            //data-aos="fade-up"
            //data-aos-delay="100"
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
                    <li>12:30pm - 2:00 pm</li>
                    <li>Advanced Matching Algorithm</li>
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
            //data-aos="fade-up"
            //data-aos-delay="200"
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
                    <li>3:00pm - 4:30pm</li>
                    <li>Advanced Matching Algorithm</li>
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
            //data-aos="fade-up"
            //data-aos-delay="300"
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
                    <li>6:00pm - 7:30pm</li>
                    <li>Advanced Matching Algorithm</li>
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