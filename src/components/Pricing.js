import React, { useState } from "react";

const Pricing = () => {
  const [isBundle, setIsBundle] = useState(true);

  return (
    <div className="flex flex-col items-center px-6 pt-16 pb-16 max-md:px-4">
      <h2 className="text-5xl font-bold leading-tight text-center text-blue-700 max-md:text-3xl">
        Pricing Options
      </h2>

      <div className="flex gap-4 items-center mt-12 max-w-full w-[320px] max-md:mt-8">
        <span
          className={`text-xl font-semibold ${
            isBundle ? "text-blue-700" : "text-black"
          }`}
        >
          Bundles
        </span>

        <button
          onClick={() => setIsBundle(!isBundle)}
          className="flex items-center px-4 py-1 bg-blue-700 rounded-full"
          aria-label={`Switch to ${isBundle ? "Individual" : "Bundles"} pricing`}
        >
          <div
            className={`bg-zinc-100 h-[32px] w-[32px] rounded-full transition-transform duration-300 ${
              isBundle ? "-translate-x-4" : "translate-x-4"
            }`}
          />
        </button>

        <span
          className={`text-xl font-semibold ${
            !isBundle ? "text-blue-700" : "text-black"
          }`}
        >
          Individual
        </span>
      </div>

      <div className="w-full mt-12 max-md:mt-8">
        <div className="flex flex-wrap justify-center items-stretch gap-6 max-w-screen-xl mx-auto max-md:flex-col">
          {[
            {
              title: isBundle ? "The Introduction" : "Brunch",
              features: isBundle
                ? ["All eligible venues", "Basic Matching Algorithm", "1 Dinner"]
                : ["12:30pm - 2:00 pm", "Advanced Matching Algorithm"],
              subheading: isBundle ? "3 Dates" : "",
              price: isBundle ? "$78" : "$28",
              bg: "bg-blue-700",
              text: "text-zinc-100",
              btnText: "text-blue-700",
            },
            {
              title: isBundle ? "The Connection" : "Happy Hour",
              features: isBundle
                ? ["All eligible venues", "Advanced Matching Algorithm", "2 Dinners"]
                : ["3:00pm - 4:30pm", "Advanced Matching Algorithm"],
              subheading: isBundle ? "6 Dates" : "",
              price: isBundle ? "$144" : "$28",
              bg: "bg-neutral-800",
              text: "text-zinc-100",
              btnText: "text-neutral-800",
              tag: "Popular",
            },
            {
              title: isBundle ? "The Adventure" : "Dinner",
              features: isBundle
                ? [
                    "All eligible venues",
                    "Advanced Matching Algorithm",
                    "Boosted Visibility and Matching",
                    "3 Dinners",
                  ]
                : ["6:00pm - 7:30pm", "Advanced Matching Algorithm"],
              subheading: isBundle ? "10 Dates" : "",
              price: isBundle ? "$220" : "$38",
              bg: "bg-blue-700",
              text: "text-zinc-100",
              btnText: "text-blue-700",
            },
          ].map((card, index) => (
            <div className="relative w-[26%] max-md:w-full" key={index}>
              {card.tag && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-8 py-2 text-sm bg-blue-700 rounded-full text-white font-semibold shadow-md z-10">
                  {card.tag}
                </div>
              )}
              <div
                className={`flex flex-col items-center px-4 pt-6 pb-8 rounded-3xl shadow-md ${card.bg} ${card.text}`}
              >
                <h3 className="mt-4 text-2xl font-semibold text-center">
                  {card.title}
                </h3>
                <ul className="mt-4 text-base list-disc text-left pl-5 leading-relaxed">
                  {card.features.map((f, i) => (
                    //<li key={i}>{f}</li>
                    <React.Fragment key={i}>
                      <li>{f}</li>
                      {isBundle && (card.title === "The Introduction" || card.title === "The Connection") && i === card.features.length - 1 && (
                        <li className="list-none h-6" aria-hidden="true"></li>   // This adds vertical space without a bullet
                      )}
                    </React.Fragment>
                  ))}
                </ul>
                <div className="mt-8 text-3xl font-bold">{card.subheading}</div>
                <div className="mt-2 text-3xl font-bold">{card.price}</div>
                <button
                  className={`mt-6 px-6 py-2 text-sm rounded-md bg-zinc-100 ${card.btnText} hover:bg-zinc-200 transition-colors`}
                >
                  Sign up now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
