import React from "react";
import { ReactComponent as Ellipse } from "../../../images/Ellipse.svg";
import { ReactComponent as Butterfly } from "../../../images/Butterfly.svg";
import { ReactComponent as SoftFlower } from "../../../images/Soft Flower.svg";
import styles from "../DashboardPages/Shop.module.css";

// Matches homepage Pricing component structure exactly
export default function ShopOptionCard({ option, onBuyNow, disabled }) {
  const { title, price, venue } = option;

  const getIcon = () => {
    switch (title) {
      case "Brunch":
        return <Ellipse className={styles.PricingImage} />;
      case "Happy Hour":
        return <Butterfly className={styles.PricingImage} />;
      case "Dinner":
        return <SoftFlower className={styles.PricingImage} />;
      default:
        return (
          <div className={styles.PricingImage}>
            <span>{title}</span>
          </div>
        );
    }
  };

  const getFeatures = () => {
    switch (title) {
      case "Brunch":
        return [
          "Virtual Brunch Speed Date",
          "12:30pm - 2:00 pm",
          "Advanced Matching Algorithm",
        ];
      case "Happy Hour":
        return [
          "Virtual Happy Hour Speed Date",
          "3:00pm - 4:30pm",
          "Advanced Matching Algorithm",
        ];
      case "Dinner":
        return [
          "Virtual Dinner Speed Date",
          "6:00pm - 7:30pm",
          "Advanced Matching Algorithm",
        ];
      default:
        return ["Speed Date", "Advanced Matching Algorithm"];
    }
  };

  return (
    <div className={`${styles.card} ${styles.individualCard}${disabled ? ' opacity-50 pointer-events-none' : ''}`} aria-disabled={disabled ? 'true' : undefined}>
      <div className={styles.upperContent}>
        <div className={styles.PricingImageWrapper}>
          {getIcon()}
        </div>
        <div className={styles.upperTextContainer}>
          <div className={styles.upperText}>
            <h3 className={styles.PricingTitle}>{title}</h3>
            <div className={styles.currPriceWrapper}>
              <div className={styles.Price}>{price}</div>
              <div className={styles.PricePerDate}>/Date</div>
            </div>
          </div> 

          <div className={styles.PurchaseSection}>
            <button 
              className={styles.PurchaseButton}
              onClick={() => onBuyNow({ packageType: "Individual", title, venue, price })}
            >
              Purchase
            </button>
          </div>
        </div>
      </div>

      <div className={styles.featuresWrapper}>
        <ul className={styles.features}>
          {getFeatures().map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


