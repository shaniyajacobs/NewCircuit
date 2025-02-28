import React from 'react';

const Header = () => {
  return (
    <header className="flex flex-col items-end px-16 pt-8 pb-4 w-full bg-white max-md:px-5 max-md:max-w-full">
      <div className="flex flex-wrap gap-5 justify-between items-start max-w-full w-[900px]">
        <h1 className="mt-4 text-4xl font-semibold leading-snug text-black max-md:max-w-full">
          Pick a plan that fits you
        </h1>
        <div className="flex gap-6 items-center whitespace-nowrap">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/a6b72c24e2ae4ae22617e960fc2e04ddd56e05f79bfbc0b5dd068ee8daf4b7dd?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
            className="object-contain shrink-0 self-stretch my-auto w-12 rounded-none aspect-square"
            alt="Notification icon"
          />
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/780f8a5039b158c15ef6f92ee023969383b06c555bac712f77871615d9baec84?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
            className="object-contain shrink-0 self-stretch rounded-2xl aspect-square w-[60px]"
            alt="User avatar"
          />
          <div className="flex flex-col self-stretch my-auto">
            <div className="text-base font-medium text-black">Musfiq</div>
            <div className="self-start mt-1 text-sm leading-none text-black">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

const Sidebar = () => {
  return (
    <div className="flex flex-col w-[350px] min-h-[1200px] max-md:ml-0 max-md:w-full">
      <div className="flex overflow-hidden relative flex-col items-start px-11 pt-12 w-full h-full fill-white max-md:px-5 max-md:pb-24">
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/6538b376f82a6facae1b32c8f000632060b1d14a11ca0ef21f51ea42f8001f86?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
          alt=""
          className="object-cover absolute inset-0 size-full"
        />
        <div className="flex relative gap-3">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/4f9d442e51b295be3ee16387af4c94d1851d2821f4947fc1e9289fa3f69c51b5?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
            alt=""
            className="object-contain shrink-0 w-14 rounded-xl aspect-[1.06]"
          />
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/2515ceab5f03e5f2ed2bcf420392dbd0a927ee5cf34c6df529cf545076e5ef10?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
            alt=""
            className="object-contain shrink-0 max-w-full aspect-[2.88] w-[150px]"
          />
        </div>
        <nav className="relative w-full mt-28 max-md:mt-10">
          <ul className="list-none p-0">
            <li className="flex gap-4 ml-7 text-lg text-black whitespace-nowrap max-md:ml-2.5 mb-9">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/73523d4d472ca63fe374d4688d4a532627a618a70bc4fb486a63229132c20726?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
                className="object-contain shrink-0 w-10 aspect-[1.05]"
                alt=""
              />
              <span className="my-auto">Home</span>
            </li>
            <li className="relative self-center text-lg text-black mb-9">
              My Matches
            </li>
            <li className="flex gap-6 items-center px-6 py-4 ml-4 text-lg font-semibold text-black bg-blue-700 rounded-2xl shadow-2xl min-h-[64px] w-full max-md:px-5 max-md:ml-2.5 mb-3.5">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/e429da9bd661624b660ab48b0c27a7ac7d5a300ccf3ff49367094d7c692d3c86?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
                className="object-contain shrink-0 self-stretch my-auto w-8 aspect-square"
                alt=""
              />
              <span className="self-stretch my-auto">Date Calendar</span>
            </li>
            <li className="flex gap-6 ml-7 text-lg text-black max-md:ml-2.5 mb-12 max-md:mb-10">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/d5031a0db03825d1cfeb71e59049ce2b929b843df87521086d4ced00877d7e56?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
                className="object-contain shrink-0 w-8 aspect-square"
                alt=""
              />
              <span className="my-auto">My Coupons</span>
            </li>
            <li className="flex gap-6 ml-7 text-lg text-black max-md:ml-2.5 mb-12 max-md:mb-10">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/9857e2e6d9091abf3f92f025fee0e2f66291bd116bf07d3836751ece1b8653e8?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
                className="object-contain shrink-0 w-8 aspect-square"
                alt=""
              />
              <span className="my-auto">My Profile</span>
            </li>
            <li className="flex gap-6 ml-7 text-lg text-black whitespace-nowrap max-md:ml-2.5 mb-12 max-md:mb-10">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/bf87224edea79352fbbcfe1f988a9cad7eedc2f781b645d1e3c9179efbc7d4c5?placeholderIfAbsent=true&apiKey=b8a60d49f1904e46938a9f4047405641"
                className="object-contain shrink-0 w-8 aspect-square"
                alt=""
              />
              <span className="my-auto">Settings</span>
            </li>
            {/* Sign Out menu item with an icon */}
            <li className="flex gap-4 ml-7 text-lg text-black whitespace-nowrap max-md:ml-2.5 mb-12">
              <img
                loading="lazy"
                src="https://cdn-icons-png.flaticon.com/512/1828/1828490.png"
                className="object-contain shrink-0 w-10 aspect-[1.05]"
                alt="Sign Out"
              />
              <span className="my-auto">Sign Out</span>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};






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

const DateCalendar = () => {
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
    <div className="overflow-hidden bg-gray-50 border border-gray-50 border-solid min-h-screen">
      <div className="flex gap-0 max-md:flex-col ">
        <Sidebar />
        <div className="flex flex-col ml-5 w-[82%] max-md:ml-0 max-md:w-full">
          <div className="flex flex-col max-md:max-w-full">
            <Header />
            <div className="flex flex-col justify-center items-center px-20 py-11 mt-3 mr-9 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0px_4px_20px_rgba(238,238,238,0.502)] max-md:px-5 max-md:mr-2.5 max-md:max-w-full">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateCalendar;
