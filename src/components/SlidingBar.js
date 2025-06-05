import React from 'react';
import './SlidingBar.css';

const SLIDING_PHRASE = (
  <>
    Find your next match on circuit
    <span className="sliding-bar__heart" role="img" aria-label="blue heart">💙</span>
  </>
);

const SlidingBar = () => (
  <div className="sliding-bar" data-testid="sliding-bar">
    <div className="sliding-bar__marquee">
      <div className="sliding-bar__track">
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        {/* Duplicate for seamless loop */}
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
        <span className="sliding-bar__text">{SLIDING_PHRASE}</span>
      </div>
    </div>
  </div>
);

export default SlidingBar; 