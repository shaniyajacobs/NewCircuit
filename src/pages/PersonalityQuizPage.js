import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import HeaderBar from "../components/HeaderBar.js";
import newLogo from "../images/logomark_white.png";

const TOTAL_STEPS = 17; // Set total quiz steps

// question bank
const QUESTIONS = [
  "What is your gender", "What is your sexual preference?", "What is your current employment status?", "Which best describes your political views?", "Are you a morning person or night owl?", "Would you date someone who has kids?", 
  "Which romantic setting sounds more appealing to you?", "Do you often worry about things beyond your control?", "Which type of intelligence do you value the most?", 
  "How open are you with your emotions?", "Are you ready to get married right now and settle down?", "How important is religion or belief in your life?", "What’s your love language?",
  "What's your communication style in a relationship?", "Which relationship dynamic do you prefer?", "How do you handle conflict in a relationship?", "When you're upset, what do you need most from your partner?"
]

// response bank
const RESPONSES = [
  ["Man", "Woman", "Other"], ["Men", "Women", "Other"], ["Full-time", "Part-time", "Student", "Unemployed"], ["Liberal/Left Leaning", "Conservative/Right Leaning", "Centrist", "Other/Choose Not To Disclose"], ["I'm an early bird", "Definitely a night owl", "Depends on my schedule or mood that week", "I adapt to whatever life throws at me"], ["Yes, I love kids!", "I'm open to it, but I'd like to take things slow", "I'd prefer not to, but never say never", "I'm not comfortable dating someone with kids"],
   ["Watching the sunset on the beach", "Stargazing in the middle of nowhere", "Exploring a new city together"], ["I worry about those things more than I’d like to admit",  "Only if it directly affects people I care about", "I try not to, but it depends on how big the situation feels",
"I focus on what I can control most of the time"], ["Logical", "Emotional", "Practical", "I just appreciate someone who's open to learning and growing"], 
   ["I'm an open book", "Depends on how much I trust the person", "I tend to keep my emotions to myself", "It's rare for me to share my emotions"], ["I would love to get married right now", "I'm not quite ready yet", "I'm ready to settle down but not to get married", "I don't believe in marriage"], ["Very important", "Somewhat important", "Not very important", "Not important at all"], ["Words of affirmation", "Acts of service", "Quality time", "Physical touch", "Receiving gifts"],
   ["Constant communication every day", "Periodic meaningful check-ins", "I appreciate thoughtful texts", "I express myself deeply when it matters"], 
   ["Partners who are best friends", "A romantic spark with passion", "A relationship built on independence and trust", "A calm connection with emotional stability"],
    ["Talk it out immediately", "Take some time to cool down and discuss", "Write a thoughtful message about your feelings", "Avoid confrontation and wait for things to settle"], ["Reassurance and affection", "Space to cool off", "Someone to listen without trying to fix things", "A distraction"]
]
const PersonalityQuizPage = () => {
  const { step } = useParams();
  const navigate = useNavigate();
  const currentStep = parseInt(step);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep === 1) {
      setProgress(10);
    } else {
      setProgress(((currentStep)/ TOTAL_STEPS) * 100);
    }
  }, [currentStep]);

  const handleAnswerClick = () => {
    if (currentStep < TOTAL_STEPS) {
      navigate(`/personalityquizpage/${currentStep + 1}`);
    } else {
      navigate('/finalQuizPage'); //navigate to the final quiz page
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
      <div className="relative min-h-screen bg-white flex flex-col items-center justify-center text-center">
        {/* Progress Bar */}
        <div className="absolute top-[100px] left-0 w-full py-2 px-6">
          <div className="w-[90%] bg-[#F3F3F3] mx-auto rounded-full">
            <div

              className="bg-[#0043F1] h-5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-black">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="mt-[60px] flex flex-col items-center text-center w-full">
          {/* Current Question Number */}
          <p className="font-poppins font-semibold text-[24px] text-black mb-4">
            Question {currentStep} of {TOTAL_STEPS}
          </p>
          {/* Updated Questions */}
          <p className="font-poppins font-semibold text-[36px] text-black mb-8 w-full">
            {QUESTIONS[currentStep - 1] || "Loading..."}
          </p>

          {/* Updated Responses */}
          <div className="flex flex-col gap-4 items-center w-full">
            {RESPONSES[currentStep - 1]?.map((option, index) => (
              <button
              key={index}
              onClick={handleAnswerClick}
              className="w-[400px] h-auto min-h-[70px] bg-[#F3F3F3] text-black font-poppins font-semibold text-[28px] leading-[130%] text-center rounded-[12px] shadow-md hover:bg-gray-300 transition mx-auto px-4 py-2 break-words text-wrap"
            >
              {option}
            </button>
            ))}
          </div>
        </div>

        {currentStep > 1 && (
  <button
    onClick={prevStep}
    className="fixed bottom-6 left-6 w-[70px] h-[60px] bg-[#F3F3F3] rounded-[13px] flex items-center justify-center shadow-md hover:bg-gray-300 transition"
  >
    <FaArrowLeft className="text-black text-3xl" />
  </button>
)}

      </div>
    </div>
  );
};

export default PersonalityQuizPage;
