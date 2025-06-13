import React from "react";
import { FaInstagram, FaTiktok, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import logo from "../images/Cir_Secondary_RGB_Mixed Black.png";

const Footer = () => {

  return (
    <footer className="bg-[#FAFFE7] text-black px-3 py-12 md:px-16 lg:px-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div>
          <h5 className="text-xs font-semibold uppercase mb-4">Pages</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="/create-account" onClick={() => window.scrollTo(0, 0)}>Get started</a></li>
            <li><a href="/" onClick={() => window.scrollTo(0, 0)}>Homepage</a></li>
            <li><a href="#">How it works</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="/faq" onClick={() => window.scrollTo(0, 0)}>FAQ</a></li>
            <li><a href="/contact" onClick={() => window.scrollTo(0, 0)}>Contact</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase mb-4">Legal</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="#">Privacy policy</a></li>
            <li><a href="#">Cookie policy</a></li>
            <li><a href="#">Terms of service</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="md:text-right">
          <h5 className="text-xs font-semibold uppercase mb-4">Get in touch</h5>
          <p className="text-2xl mb-1 underline">
            <a href="mailto:hello@circuit.com">hello@circuit.com</a>
          </p>
          <p className="text-2xl underline">+514.514.5144</p>
        </div>
      </div>

      <div className="w-full flex justify-center">
        <img
          src={logo}
          alt="Circuit Logo"
          className="w-full max-w-[1600px] h-auto object-contain"
          style={{ maxHeight: '400px' }}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-12">
        <p className="text-xs text-black mb-4 md:mb-0">
          © 2025 Circuit Dating. All rights reserved.
        </p>
        <div className="flex gap-4 text-xl">
          <a href="#"><FaInstagram /></a>
          <a href="#"><FaTiktok /></a>
          <a href="#"><FaLinkedin /></a>
          <a href="#"><FaXTwitter /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;