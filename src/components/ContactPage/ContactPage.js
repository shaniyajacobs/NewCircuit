import React, { useState } from 'react';
import styles from './ContactPage.module.css';
import { functions } from '../../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [modal, setModal] = useState({ open: false, success: true });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
      await sendContactEmail(form);
      setForm({ name: '', email: '', phone: '', message: '' });
      setModal({ open: true, success: true });
    } catch (err) {
      console.error('Failed to send message:', err);
      setModal({ open: true, success: false });
    }
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
      {modal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>
              {modal.success ? 'Message Sent!' : 'Something went wrong'}
            </div>
            <div className={styles.modalMessage}>
              {modal.success
                ? 'Thank you for reaching out – we’ll be in touch shortly.'
                : 'Sorry, we could not send your message. Please try again later.'}
            </div>
            <button
              className={styles.modalButton}
              onClick={() => setModal({ ...modal, open: false })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPage; 