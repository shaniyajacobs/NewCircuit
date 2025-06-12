import React, { useState } from 'react';
import styles from './ContactPage.module.css';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  return (
    <div className={styles.contactBackground}>
      <h1 className={styles.contactTitle}>Contact</h1>
      <div className={styles.contactRow}>
        <form className={styles.formContainer} onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.formTitle}>Send us a message</div>
          <hr className={styles.horizontalDivider} />
          <div className={styles.formFields}>
            <div className={styles.inputRow}>
              <input
                className={styles.inputBox}
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                className={styles.inputBox}
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <input
              className={styles.inputBox}
              type="text"
              name="phone"
              placeholder="Phone number"
              value={form.phone}
              onChange={handleChange}
            />
            <textarea
              className={styles.textareaBox}
              name="message"
              placeholder="Message"
              value={form.message}
              onChange={handleChange}
              rows={6}
              required
            />
            <button className={styles.sendButton} type="submit">
              <span className={styles.sendButtonText}>Send</span>
            </button>
          </div>
        </form>
        <div
          className={styles.imageContainer}
          style={{
            background: `linear-gradient(0deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.55) 100%), url('/faqcard.webp') center center / cover no-repeat`,
            backgroundBlendMode: 'normal, soft-light, normal'
          }}
        >
          <div className={styles.contactInfoMobile}>
            <div className={styles.getInTouch}>GET IN TOUCH</div>
            <div className={styles.email}>hello@circuit.com</div>
            <div className={styles.phone}>+514.514.5144</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 