import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import HeaderBar from "../components/HeaderBar.js";
import newLogo from "../images/logomark_mixed.png";

const TOTAL_STEPS = 10; // Set total quiz steps

const PersonalityQuizPage = () => {
  const { step } = useParams();
  const navigate = useNavigate();
  const currentStep = parseInt(step);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep === 1) {
      setProgress(0);
    } else {
      setProgress((currentStep / TOTAL_STEPS) * 100);
    }
  }, [currentStep]);

  const handleAnswerClick = () => {
    if (currentStep < TOTAL_STEPS) {
      navigate(`/personalityquizpage/${currentStep + 1}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      navigate(`/personalityquizpage/${currentStep - 1}`);
    }
  };

  return (
    <div className="min-h-screen">
      <HeaderBar
        title="Personality Indicator"
        logo={newLogo}
        logoHeight="h-20"
        titleSize="text-4xl"
      />
      <div className="relative min-h-screen bg-[#85A2F2] flex flex-col items-center justify-center text-center">
        {/* Progress Bar */}
        <div className="absolute top-[100px] left-0 w-full py-2 px-6">
          <div className="w-[90%] bg-[#F3F3F3] mx-auto rounded-full">
            <div

              className="bg-[#0043F1] h-5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-[60px] flex flex-col items-center text-center w-full">
          {/* Questions */}
          <p className="font-poppins font-semibold text-[36px] text-black mb-8 w-full">
            Would you rather listen to rock or rap?
          </p>

          {/* Answers */}
          <div className="flex flex-col gap-4 items-center w-full">
            <button
              onClick={handleAnswerClick}
              className="w-[400px] h-[70px] bg-[#F3F3F3] text-black font-poppins font-semibold text-[32px] leading-[130%] text-center rounded-[12px] shadow-md hover:bg-gray-300 transition mx-auto"
            >
              Rap
            </button>
            <button
              onClick={handleAnswerClick}
              className="w-[400px] h-[70px] bg-[#F3F3F3] text-black font-poppins font-semibold text-[32px] leading-[130%] text-center rounded-[12px] shadow-md hover:bg-gray-300 transition mx-auto"
            >
              Rock
            </button>
            <button
              onClick={handleAnswerClick}
              className="w-[400px] h-[70px] bg-[#F3F3F3] text-black font-poppins font-semibold text-[32px] leading-[130%] text-center rounded-[12px] shadow-md hover:bg-gray-300 transition mx-auto"
            >
              Neither
            </button>
          </div>
        </div>

        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="absolute left-6 bottom-6 w-[70px] h-[60px] bg-[#F3F3F3] rounded-[13px] flex items-center justify-center shadow-md hover:bg-gray-300 transition"
          >
            <FaArrowLeft className="text-black text-3xl" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PersonalityQuizPage;
