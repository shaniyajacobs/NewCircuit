import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../images/Cir_Primary_RGB_Mixed Black.png'; // Adjust the path based on your image location
import styles from './NavBar.module.css';

const NavBar = () => {
    const [showAnnouncement, setShowAnnouncement] = useState(true);
    const navigate = useNavigate();
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setShowAnnouncement(window.scrollY < 40);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
        <div className={styles.top_text_box + (showAnnouncement ? '' : ' ' + styles.hide)}>
            <span className={styles.top_text}>
                The #1 speed dating app in north america
            </span>
        </div>
        <nav className={styles.navContainer}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src={logo} 
                        alt="Circuit Logo" 
                        className={styles.logo}
                    />
                </Link>
            </div>
            <div className={styles.navLinks}>
                <Link to="/how-it-works" className={styles.linkButton}>How it works</Link>
                <Link to="/pricing" className={styles.linkButton}>Pricing</Link>
                <Link to="/faq" className={styles.linkButton}>FAQ</Link>
                <Link to="/contact" className={styles.linkButton}>Contact</Link>
                <div className={styles.buttonGroup}>
                    <button className={styles.outlinedButton}>Sign in</button>
                    <button className={styles.filledButton}>Get started</button>
                </div>
            </div>
        </nav>
        </>
    );
};

export default NavBar;
