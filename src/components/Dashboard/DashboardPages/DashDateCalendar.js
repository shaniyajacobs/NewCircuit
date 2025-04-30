import React from 'react';

const DatePlan = ({ title, time, price }) => {
  return (
    <div className="flex flex-col items-center pb-8 mx-auto w-full text-black rounded-3xl bg-zinc-100 shadow-[0px_4px_20px_rgba(0,0,0,0.25)] max-md:mt-10 min-h-[400px]">
      <div className="self-stretch px-5 py-1 rounded-xl bg-zinc-100 shadow-[0px_4px_20px_rgba(0,0,0,0.25)] text-2xl text-center">
        {title}
      </div>
      <div className="flex gap-3 self-stretch mt-4 mx-3 text-base leading-[50px]">
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/b2d623af50b08b4ca3cbbda9d0a3307b9b4482757268bca4055fd648ba317776?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
          className="object-contain shrink-0 my-auto w-3.5 aspect-[0.12]"
          alt=""
        />
        <div>
          {time}
          <br />
          Advanced Matching Algorithm
        </div>
      </div>
      <div className="mt-6 text-center text-2xl text-black">{price}</div>
      <div className="mt-auto">
        <button className="px-14 py-1.5 mt-6 text-base tracking-tight leading-loose text-center text-black bg-blue-700 rounded-lg w-[177px]">
          Buy now
        </button>
      </div>
    </div>
  );
};

const BundlePlan = ({ title, features, dates, price }) => {
  return (
    <div className="flex flex-col items-center pb-8 mx-auto w-full text-black rounded-3xl bg-zinc-100 shadow-[0px_4px_20px_rgba(0,0,0,0.25)] max-md:mt-10 min-h-[400px]">
      <div className="self-stretch px-5 py-1 rounded-xl bg-zinc-100 shadow-[0px_4px_20px_rgba(0,0,0,0.25)] text-2xl text-center">
        {title}
      </div>
      <div className="flex gap-3 self-stretch mt-4 mx-3 text-base leading-[50px]">
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/51c3c9bc64c92e637a5650381230da654e3e9165f76db48baf122c3e020b8961?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
          className="object-contain shrink-0 my-auto w-3.5 aspect-[0.12]"
          alt=""
        />
        <div className="w-[293px]">
          {features.map((feature, index) => (
            <React.Fragment key={index}>
              {feature}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="mt-6 text-center">{dates}</div>
      <div className="mt-4 text-center text-black">{price}</div>
      <div className="mt-auto">
        <button className="px-14 py-1.5 mt-6 text-base tracking-tight leading-loose text-center text-black bg-blue-700 rounded-lg w-[177px]">
          Buy now
        </button>
      </div>
    </div>
  );
};

const DashDateCalendar = () => {
  const datePlans = [
    { title: "Brunch", time: "12:30pm - 2:00pm", price: "$28" },
    { title: "Happy Hour", time: "3:00pm - 4:30pm", price: "$28" },
    { title: "Dinner", time: "6:00pm - 7:30pm", price: "$38" }
  ];

  const bundlePlans = [
    {
      title: "The Introduction",
      features: ["All eligible venues", "Basic Matching Algorithm", "1 Dinner"],
      dates: "3 Dates",
      price: "$78"
    },
    {
      title: "The Connection",
      features: ["All eligible venues", "Advanced Matching Algorithm", "2 Dinners"],
      dates: "6 Dates",
      price: "$144"
    },
    {
      title: "The Adventure",
      features: [
        "All eligible venues",
        "Advanced Matching Algorithm",
        "Boosted Visibility and Matching",
        "3 Dinners"
      ],
      dates: "10 Dates",
      price: "$220"
    }
  ];

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-md:p-5">
      <div className="flex flex-col max-w-full w-[1014px]">
        <h2 className="self-start text-4xl font-semibold leading-snug text-black">
          Individual Date
        </h2>
        <div className="mt-11 max-md:mt-10 max-md:mr-2.5 max-md:max-w-full">
          <div className="flex gap-5 max-md:flex-col">
            {datePlans.map((plan, index) => (
              <DatePlan key={index} {...plan} />
            ))}
          </div>
        </div>
        <h2 className="self-start mt-20 text-4xl font-semibold leading-snug text-black max-md:mt-10">
          Bundle Date Package
        </h2>
        <div className="mt-11 max-md:mt-10 max-md:max-w-full">
          <div className="flex gap-5 max-md:flex-col">
            {bundlePlans.map((plan, index) => (
              <BundlePlan key={index} {...plan} />
            ))}
          </div>
        </div>
      </div>
    </div>    
  );
};

export default DashDateCalendar;
