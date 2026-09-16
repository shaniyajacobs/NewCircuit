import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Pricing.module.css";
import { ReactComponent as FiveDots } from "../images/5 Dots.svg";
import { ReactComponent as Butterfly } from "../images/Butterfly.svg";
import { ReactComponent as Ellipse } from "../images/Ellipse.svg";
import { ReactComponent as Hole } from "../images/Hole.svg";
import { ReactComponent as SoftFlower } from "../images/Soft Flower.svg";
import { ReactComponent as Team } from "../images/Team.svg";
import { isActiveByTitle, bundleActiveByTitle } from "./Dashboard/DashboardPages/shopOptionsConfig";

const Pricing = () => {
  const [isBundle, setIsBundle] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.cardsRow}>
        <h2 className={styles.SecTitle}>
          Pricing
        </h2>

        <div className={`${styles.toggleContainer} ${!isBundle ? styles.invertColors : ''}`}>
          <span
            className={styles.toggleText}
          >
            Individual
          </span>

          <button 
            onClick={() => setIsBundle(!isBundle)}
            className={`${styles.toggleBackground} `}
            aria-label={`Switch to ${isBundle ? "Individual" : "Bundles"} pricing`}
          >

            <div
              className={`transition-transform duration-300 ${styles.toggleButton}  
              ${isBundle ? "translate-x-full" : "translate-x-0"}`}
              style={{ transform: isBundle ? "translateX(100%)" : "translateX(0%)" }}
            />
          </button>


          <span
            className={styles.toggleText}
          >
            Bundles
          </span>
        </div>

        <div className={styles.cardsContainer}>
            {[
              {
                image: isBundle? Team : Ellipse,
                subheading: isBundle ? "10 Dates" : "",
                title: isBundle ? "The Adventure" : "Brunch",
                oldPrice: isBundle ? "$38" : "", 
                price: isBundle ? "$22" : "$38",

                features: isBundle
                  ? ["10 Virtual Speed Dates", "Advanced Matching Algorithm", "Includes up to 3 Virtual dinner speed dates"]
                  : ["Virtual Brunch Speed Date", "12:30pm - 2:00 pm", "Advanced Matching Algorithm"],
                bill: isBundle ? "Billed at USD$220" : "",
                tag: isBundle ? "BEST DEAL 🔥" : "", 
              },
              {
                image: isBundle? FiveDots : Butterfly,
                subheading: isBundle ? "6 Dates" : "",
                title: isBundle ? "The Connection" : "Happy Hour",
                oldPrice: isBundle ? "$38" : "", 
                price: isBundle ? "$24" : "$38",
                features: isBundle
                  ? ["6 Virtual Speed Dates", "Advanced Matching Algorithm", "Includes up to 2 Virtual dinner speed dates"]
                  : ["Virtual Happy Hour Speed Date", "3:00pm - 4:30pm", "Advanced Matching Algorithm"],
                bill: isBundle ? "Billed at USD$144" : "",
              },
              {
                image: isBundle? Hole : SoftFlower,
                subheading: isBundle ? "3 Dates" : "",
                title: isBundle ? "The Introduction" : "Dinner",
                oldPrice: isBundle ? "$38" : "", 
                price: isBundle ? "$26" : "$38",
                features: isBundle
                  ? [
                      "3 Virtual Speed Dates",
                      "Advanced Matching Algorithm",
                      "Includes up to 1 virtual dinner speed date",
                    ]
                  : ["Virtual Dinner Speed Date", "6:00pm - 7:30pm", "Advanced Matching Algorithm"],
                bill: isBundle ? "Billed at USD$78" : "",
              },
            ].map((card, index) => {
              // Determine if this card should be disabled
              const isDisabled = isBundle 
                ? bundleActiveByTitle[card.title] === false
                : isActiveByTitle[card.title] === false;

              return (
                <div key={index} className={`
                  ${styles.card}
                  ${isBundle ? styles.bundleCard : styles.individualCard}
                  ${card.title === "The Adventure" ? styles.adventureCard : ""}
                  ${isDisabled ? ' opacity-50 pointer-events-none' : ''}
                `} aria-disabled={isDisabled ? 'true' : undefined}>
                  {card.tag && (
                    <div className={styles.tagContainer}> 
                      <div className={styles.tag}>{card.tag}</div>
                    </div>
                  )}
                  <div className={styles.upperContent}>
                    <div className={styles.PricingImageWrapper}>
                      <card.image className={styles.PricingImage} />
                    </div>
                    <div className={styles.upperTextContainer}>
                      <div className={styles.upperText}>
                        <div className={styles.PricingSubheading}>{card.subheading}</div>
                        <h3 className={styles.PricingTitle}>{card.title}</h3>
                        <div className={styles.OldPrice}>{card.oldPrice}</div>
                        <div className={styles.currPriceWrapper}>
                          <div className={styles.Price}>{card.price}</div>
                          <div className={styles.PricePerDate}>/Date</div>
                        </div>
                      </div> 

                      <div className={styles.PurchaseSection}>
                        <Link to="/create-account">
                          <button 
                            className={styles.PurchaseButton}
                            aria-disabled={isDisabled ? 'true' : undefined}
                          >
                            {isDisabled ? "Coming Soon" : "Purchase"}
                          </button>
                        </Link>
                        <div className={styles.bill}>{card.bill}</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.featuresWrapper}>
                    <ul className={styles.features}>
                      {card.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
