import * as React from "react";

export function PricingCard({ title, time, price, features, popular }) {
  return (
    <div className="flex flex-col w-[33%] max-md:ml-0 max-md:w-full">
      <div className="flex flex-col items-center px-12 pt-7 pb-20 mx-auto mt-9 w-full text-white bg-blue-700 rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.25)] max-md:px-5 max-md:mt-10">
        {popular && (
          <div className="self-stretch px-4 pb-8 h-10 text-sm leading-4 whitespace-nowrap bg-indigo-400 rounded-3xl rotate-[5.551115123125783e-17rad] w-[58px]">
            Popular
          </div>
        )}
        <div className="flex gap-5 self-stretch">
          <div className="flex shrink-0 my-auto w-6 h-[83px]" />
          <div className="flex flex-col grow shrink-0 basis-0 w-fit">
            <div className="self-start ml-9 text-4xl leading-none max-md:ml-2.5">
              {title}
            </div>
            <div className="mt-6 text-lg leading-[50px]">
              {time}
              <br />
              {features.map((feature, index) => (
                <React.Fragment key={index}>
                  {feature}
                  <br />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-40 text-5xl leading-none max-md:mt-10 max-md:text-4xl">
          ${price}
        </div>
        <button 
          className="px-16 py-3 mt-9 max-w-full text-base tracking-tight leading-loose text-center text-blue-700 bg-white rounded-lg w-[249px] max-md:px-5"
          aria-label={`Sign up for ${title} plan`}
        >
          Sign up now
        </button>
      </div>
    </div>
  );
}