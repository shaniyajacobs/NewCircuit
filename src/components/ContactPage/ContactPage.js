import React, { useState } from 'react';
import styles from './ContactPage.module.css';
import { functions } from '../../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', compliance: false });
  const [modal, setModal] = useState({ open: false, success: true });
  const [smsExpanded, setSMSExpanded] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
      await sendContactEmail(form);
      setForm({ name: '', email: '', phone: '', message: '', compliance: false });
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
            <div className={styles.checkboxContainer}>
              <input
                className={styles.complianceCheckbox}
                type="checkbox"
                name="compliance"
                id="compliance"
                checked={form.compliance}
                onChange={handleChange}
                required
              />
              <label htmlFor="compliance" className={styles.checkboxLabel}>
                I agree to the{' '}
                <a href="/terms-of-service#intro" className={styles.legalLink} target="_blank" rel="noopener noreferrer">
                  conditions of use
                </a>
                {' '}, {' '}
                <a href="/terms-of-service#sms" className={styles.legalLink} target="_blank" rel="noopener noreferrer">
                  SMS terms of service
                </a>
                {' '}and{' '}
                <a href="/terms-of-service#privacy" className={styles.legalLink} target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
              </label>
            </div>
            <div className={styles.smsDisclosure}>
              <div className={styles.smsDisclosureHeader} onClick={() => setSMSExpanded(!smsExpanded)}>
                <span>By checking this box you agree to receive SMS messages from Circuit LLC, including event reminders, updates, account notifications, customer care, and marketing messages. Message frequency varies. Message & data rates may apply. Reply STOP to any message to opt out. Message HELP for help. View our <a href="https://www.circuitspeeddating.com/terms-of-service#privacy" className={styles.legalLink} target="_blank" rel="noopener noreferrer">Privacy Policy</a> and our <a href="https://www.circuitspeeddating.com/terms-of-service#intro" className={styles.legalLink} target="_blank" rel="noopener noreferrer">Terms and Conditions</a>. Circuit LLC does not share mobile numbers or opt-in data with third parties.</span>
                <span className={styles.smsDisclosureToggle}>{smsExpanded ? '−' : '+'}</span>
              </div>
              {smsExpanded && (
                <div className={styles.smsDisclosureContent}>
                  <p><strong>Consent for SMS Communication:</strong> Information obtained as part of the SMS consent process will not be shared with third parties.</p>
                  <p><strong>Types of SMS Communications:</strong> If you have consented to receive text messages from Circuit LLC, you may receive text messages related to event reminders, updates, account notifications, customer care, and marketing messages.</p>
                  <p><strong>Examples:</strong> Customers and Guests: Updates regarding event reminders, connection selections, coupon notices, or other relevant information.</p>
                  <p><strong>Standard Messaging Disclosures:</strong> Message and data rates may apply. You can opt-out at any time by texting "STOP." For assistance, text "HELP" or visit our <a href="https://www.circuitspeeddating.com/terms-of-service#privacy" className={styles.legalLink} target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://www.circuitspeeddating.com/terms-of-service#intro" className={styles.legalLink} target="_blank" rel="noopener noreferrer">Terms of Service</a>.</p>
                </div>
              )}
            </div>
            <button 
              className={`${styles.sendButton} ${!form.compliance ? styles.sendButtonDisabled : ''}`} 
              type="submit"
              disabled={!form.compliance}
            >
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
            <div className={styles.email}>contact@circuitspeeddating.com</div>
            <div className={styles.phone}>+510.903.7210</div>
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