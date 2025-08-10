import React, { useState } from "react";
import styles from "./Pricing.module.css";
import { ReactComponent as FiveDots } from "../images/5 Dots.svg";
import { ReactComponent as Butterfly } from "../images/Butterfly.svg";
import { ReactComponent as Ellipse } from "../images/Ellipse.svg";
import { ReactComponent as Hole } from "../images/Hole.svg";
import { ReactComponent as SoftFlower } from "../images/Soft Flower.svg";
import { ReactComponent as Team } from "../images/Team.svg";

const Pricing = () => {
  const [isBundle, setIsBundle] = useState(true);

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
            Bundles
          </span>

          <button 
            onClick={() => setIsBundle(!isBundle)}
            className={`${styles.toggleBackground} `}
            aria-label={`Switch to ${isBundle ? "Individual" : "Bundles"} pricing`}
          >

            <div
              className={`transition-transform duration-300 ${styles.toggleButton}  
              ${isBundle ? "translate-x-0" : "translate-x-full"}`}
              style={{ transform: isBundle ? "translateX(0%)" : "translateX(100%)" }}
            />
          </button>


          <span
            className={styles.toggleText}
          >
            Individual
          </span>
        </div>

        <div className={styles.cardsContainer}>
            {[
              {
                image: isBundle? Team : Ellipse,
                subheading: isBundle ? "10 Dates" : "",
                title: isBundle ? "The Adventure" : "Brunch",
                oldPrice: isBundle ? "$38" : "", 
                price: isBundle ? "$22" : "$28",

                features: isBundle
                  ? ["10 Speed Dates", "Advanced Matching Algorithm", "Includes up to 3 dinner speed dates"]
                  : ["Brunch Speed Date", "12:30pm - 2:00 pm", "Advanced Matching Algorithm"],
                bill: isBundle ? "Billed at USD$220" : "",
                tag: isBundle ? "BEST DEAL 🔥" : "", 
              },
              {
                image: isBundle? FiveDots : Butterfly,
                subheading: isBundle ? "6 Dates" : "",
                title: isBundle ? "The Connection" : "Happy Hour",
                oldPrice: isBundle ? "$38" : "", 
                price: isBundle ? "$24" : "$28",
                features: isBundle
                  ? ["6 Speed Dates", "Advanced Matching Algorithm", "Includes up to 2 dinner speed dates"]
                  : ["Happy Hour Speed Date", "3:00pm - 4:30pm", "Advanced Matching Algorithm"],
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
                      "3 Speed Dates",
                      "Advanced Matching Algorithm",
                      "Includes up to 1 dinner speed dates",
                    ]
                  : ["Dinner Speed Date", "6:00pm - 7:30pm", "Advanced Matching Algorithm"],
                bill: isBundle ? "Billed at USD$78" : "",
              },
            ].map((card, index) => (
              <div   className={`
                ${styles.card}
                ${isBundle ? styles.bundleCard : styles.individualCard}
                ${card.title === "The Adventure" ? styles.adventureCard : ""}
              `}>
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
                      <button className={styles.PurchaseButton}>
                        Purchase
                      </button>
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
            ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
