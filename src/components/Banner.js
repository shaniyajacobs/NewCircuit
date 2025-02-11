import React from "react";
import bgImage from "../images/hero-bg.svg";
import foregroundImage from "../images/web-dev.svg";

const Banner = () => {
  return (
    <section className="relative" role="banner" aria-label="Hero Banner">
      <div className="flex relative flex-col items-start px-5 pt-96 pb-20 w-full min-h-[535px] max-md:pt-24 max-md:max-w-full">
        <img
          loading="lazy"
          src={bgImage}
          srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true&width=100 100w, https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true&width=200 200w, https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true&width=400 400w, https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true&width=800 800w, https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true&width=1200 1200w, https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true&width=1600 1600w, https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true&width=2000 2000w, https://cdn.builder.io/api/v1/image/assets/TEMP/35036b9042c391acd6a800c994f8518bdbe64458f88fc11fb9d37e960cd7db00?placeholderIfAbsent=true"
          alt="Background decoration"
          className="object-cover absolute inset-0 size-full"
        />
        <img
          loading="lazy"
          src={foregroundImage}
          srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true&width=100 100w, https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true&width=200 200w, https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true&width=400 400w, https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true&width=800 800w, https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true&width=1200 1200w, https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true&width=1600 1600w, https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true&width=2000 2000w, https://cdn.builder.io/api/v1/image/assets/TEMP/ea7740b90a593d062f3c9ebbe1064c4dcf5b75cccdbea9b897bbe1184bfdc3bc?placeholderIfAbsent=true"
          alt="Web development illustration"
          className="object-contain max-w-full aspect-[4.18] w-[205px]"
        />
      </div>
    </section>
  );
};

export default Banner;
