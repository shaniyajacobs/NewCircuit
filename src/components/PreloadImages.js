import React from 'react';
import atlantaImg from '../images/atlanta.jpeg';
import chicagoImg from '../images/chicago.jpeg';
import denverImg from '../images/denver.jpeg';
import losAngelesImg from '../images/los-angeles.jpeg';
import newYorkImg from '../images/new-york.jpeg';
import phoenixImg from '../images/phoenix.jpeg';
import sanFranciscoImg from '../images/san-francisco.jpeg';

const PreloadImages = () => {
  return (
    <div style={{ display: 'none' }}>
      <img src={atlantaImg} alt="" />
      <img src={chicagoImg} alt="" />
      <img src={denverImg} alt="" />
      <img src={losAngelesImg} alt="" />
      <img src={newYorkImg} alt="" />
      <img src={phoenixImg} alt="" />
      <img src={sanFranciscoImg} alt="" />
    </div>
  );
};

export default PreloadImages; 