import React from "react";
import { FaInstagram, FaTiktok, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import logo from "../images/Cir_Secondary_RGB_Mixed Black.png";
import { Link } from "react-router-dom";

const Footer = () => {

  return (
    <footer className="bg-[#FAFFE7] text-black px-3 py-12 md:px-16 lg:px-24 border-t border-black overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div>
          <h5 className="text-xs font-semibold uppercase mb-4">Pages</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="/create-account" onClick={() => window.scrollTo(0, 0)}>Get started</a></li>
            <li><a href="/" onClick={() => window.scrollTo(0, 0)}>Homepage</a></li>
            <li><Link to="/how-it-works" onClick={() => window.scrollTo(0, 0)}>How it works</Link></li>
            <li><a href="/pricing" onClick={() => window.scrollTo(0, 0)}>Pricing</a></li>
            <li><a href="/faq" onClick={() => window.scrollTo(0, 0)}>FAQ</a></li>
            <li><a href="/contact" onClick={() => window.scrollTo(0, 0)}>Contact</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase mb-4">Legal</h5>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy-policy" onClick={() => window.scrollTo(0, 0)}>Privacy policy</Link></li>
            <li><Link to="/cookie-policy" onClick={() => window.scrollTo(0, 0)}>Cookie policy</Link></li>
            <li><Link to="/terms-of-service" onClick={() => window.scrollTo(0, 0)}>Terms of service</Link></li>
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

      {/* LOGO: perfectly edge-to-edge full width on desktop, normal on mobile */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 flex justify-center items-center">
        <img
          src={logo}
          alt="Circuit Logo"
          className="w-full h-auto object-contain"
          style={{ maxHeight: '400px' }}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-12">
        <p className="text-xs text-black mb-4 md:mb-0">
          © 2025 Circuit Dating. All rights reserved.
        </p>
        <div className="flex gap-4 text-xl">
          <button className="hover:text-gray-600 transition-colors" aria-label="Follow us on Instagram">
            <FaInstagram />
          </button>
          <button className="hover:text-gray-600 transition-colors" aria-label="Follow us on TikTok">
            <FaTiktok />
          </button>
          <button className="hover:text-gray-600 transition-colors" aria-label="Follow us on LinkedIn">
            <FaLinkedin />
          </button>
          <button className="hover:text-gray-600 transition-colors" aria-label="Follow us on X (Twitter)">
            <FaXTwitter />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;