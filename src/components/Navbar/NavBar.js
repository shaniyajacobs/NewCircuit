import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../images/Cir_Primary_RGB_Mixed Black.png'; // Adjust the path based on your image location
import styles from './NavBar.module.css';
import { FaInstagram, FaTiktok, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { FiX } from 'react-icons/fi';

const NavBar = () => {
    const [showAnnouncement, setShowAnnouncement] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowAnnouncement(window.scrollY < 40);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change or link click
    useEffect(() => {
        const closeMenu = () => setMenuOpen(false);
        window.addEventListener('resize', closeMenu);
        return () => window.removeEventListener('resize', closeMenu);
    }, []);

    const handleMenuToggle = () => setMenuOpen((open) => !open);
    const handleLinkClick = () => {
        setMenuOpen(false);
        window.scrollTo(0, 0);
    };

    return (
        <>
        <div className={styles.top_text_box + (showAnnouncement ? '' : ' ' + styles.hide)}>
            <span className={styles.top_text}>
                The #1 Speed Dating App
            </span>
        </div>
        <nav className={styles.navContainer}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center' }} onClick={() => window.scrollTo(0, 0)}>
                            <img 
                                src={logo} 
                                alt="Circuit Logo" 
                        className={styles.logo}
                            />
                        </Link>
                {/* Desktop nav links/buttons */}
                <div className={styles.desktopNavLinks}>
                  <Link to="/how-it-works" className={styles.linkButton} onClick={() => window.scrollTo(0, 0)}>How it works</Link>
                  <Link to="/pricing" className={styles.linkButton} onClick={() => window.scrollTo(0, 0)}>Pricing</Link>
                  <Link to="/faq" className={styles.linkButton} onClick={() => window.scrollTo(0, 0)}>FAQ</Link>
                  <Link to="/contact" className={styles.linkButton} onClick={() => window.scrollTo(0, 0)}>Contact</Link>
                  <div className={styles.buttonGroup}>
                    <Link to="/login" className={styles.outlinedButton} onClick={() => window.scrollTo(0, 0)}>Sign in</Link>
                    <Link to="/create-account" className={styles.filledButton} onClick={() => window.scrollTo(0, 0)}>Get started</Link>
                  </div>
                    </div>
                {/* Hamburger/X icon for tablet/mobile */}
                        <button 
                    className={styles.hamburger}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    aria-controls="navbar-menu"
                    onClick={handleMenuToggle}
                >
                    {menuOpen ? (
                      <FiX size={32} />
                    ) : (
                      <>
                        <span className={styles.hamburgerBar}></span>
                        <span className={styles.hamburgerBar}></span>
                        <span className={styles.hamburgerBar}></span>
                      </>
                    )}
                        </button>
            </div>
            <div
                className={
                    styles.navLinks +
                    ' ' +
                    (menuOpen ? styles.menuOpen : styles.menuClosed)
                }
                id="navbar-menu"
            >
                <div className={styles.menuHeader}>
                  <Link to="/" style={{ display: 'flex', alignItems: 'center' }} onClick={handleLinkClick}>
                    <img 
                        src={logo} 
                        alt="Circuit Logo" 
                        className={styles.logo}
                    />
                  </Link>
                </div>
                <div className={styles.menuContent}>
                  <div className={styles.menuColumn}>
                    <Link to="/how-it-works" className={styles.linkButton} onClick={handleLinkClick}>How it works</Link>
                    <Link to="/pricing" className={styles.linkButton} onClick={handleLinkClick}>Pricing</Link>
                    <Link to="/faq" className={styles.linkButton} onClick={handleLinkClick}>FAQ</Link>
                    <Link to="/contact" className={styles.linkButton} onClick={handleLinkClick}>Contact</Link>
                    <Link to="/create-account" className={styles.filledButton + ' ' + styles.menuButton} onClick={handleLinkClick}>Get started</Link>
                    <Link to="/login" className={styles.outlinedButton + ' ' + styles.menuButton} onClick={handleLinkClick}>Sign in</Link>
                  </div>
                  <div className={styles.socialRow}>
                    <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram size={28} /></a>
                    <a href="https://tiktok.com" aria-label="TikTok" target="_blank" rel="noopener noreferrer"><FaTiktok size={28} /></a>
                    <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedin size={28} /></a>
                    <a href="https://twitter.com" aria-label="X" target="_blank" rel="noopener noreferrer"><FaXTwitter size={28} /></a>
                    </div>
                </div>
            </div>
        </nav>
        </>
    );
};

export default NavBar;
