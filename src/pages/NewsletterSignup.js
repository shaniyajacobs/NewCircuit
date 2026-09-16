import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import styles from './NewsletterSignup.module.css';
import { IoChevronBack } from 'react-icons/io5';

const NewsletterSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    city: '',
    preference: '',
    birthday: '',
  });

  const cities = [
    { value: 'sf-bay-area', label: 'SF Bay Area' },
    { value: 'seattle', label: 'Seattle' },
    { value: 'dfw', label: 'DFW' },
    { value: 'atlanta', label: 'Atlanta' },
    { value: 'nyc', label: 'New York City' },
    { value: 'dc', label: 'Washington D.C.' },
  ];

  const preferences = [
    { value: 'men-seeking-women', label: 'Men seeking women' },
    { value: 'women-seeking-men', label: 'Women seeking men' },
    { value: 'women-seeking-women', label: 'Women seeking women' },
    { value: 'men-seeking-men', label: 'Men seeking men' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked ? value : '' });
      if (checked) setSelectedCity(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate
    if (!formData.email || !formData.city || !formData.preference || !formData.birthday) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Calculate age from birthday
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Determine age group
      let ageGroup = '';
      if (age >= 25 && age <= 34) ageGroup = '25-34';
      else if (age >= 35 && age <= 44) ageGroup = '35-44';
      else if (age >= 45 && age <= 55) ageGroup = '45-55';
      else ageGroup = 'other';

      // Call the Cloud Function to add subscriber to Klaviyo
      try {
        const addSubscriber = httpsCallable(
          functions,
          'addSubscriberToKlaviyo'
        );

        const result = await addSubscriber({
          email: formData.email.trim().toLowerCase(),
          city: formData.city,
          preference: formData.preference,
          ageGroup: ageGroup,
          birthday: formData.birthday,
        });

        const data = result.data;

        // Email is already subscribed
        if (data?.alreadySubscribed) {
          setError(
            "🎉 You're already on the list! We'll keep you updated about upcoming Circuit events."
          );
          setLoading(false);
          return;
        }

        // New subscriber
        console.log(' New subscriber added to Klaviyo');
        setSubmitted(true);

      } catch (err) {
        console.error(' Klaviyo error:', err);

        setError(
          "We couldn't complete your signup right now. Please try again."
        );

        setLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const cityLabel = cities.find(c => c.value === formData.city)?.label || formData.city;
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <button onClick={() => navigate('/')} className={styles.backBtn}>
            <IoChevronBack size={20} />
            <span>Back to Home</span>
          </button>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}> </div>
            <h2 className={styles.successTitle}>You're on the list!</h2>
            <p className={styles.successMessage}>
              We'll notify you when events open in <strong>{cityLabel}</strong>.
            </p>
            <button onClick={() => navigate('/events')} className={styles.primaryBtn}>
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button onClick={() => navigate('/')} className={styles.backBtn}>
          <IoChevronBack size={20} />
          <span>Back to Home</span>
        </button>

        <h1 className={styles.title}>Stay in the Loop</h1>
        <p className={styles.subtitle}>
          Get notified when events open in your city. No spam, just updates.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <div className={styles.inputGroup}>
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={styles.input}
              required
            />
          </div>

          {/* City Selection - Checkboxes */}
          <div className={styles.inputGroup}>
            <label>Select Your City *</label>
            <div className={styles.cityGrid}>
              {cities.map((city) => (
                <label key={city.value} className={styles.cityCheckbox}>
                  <input
                    type="checkbox"
                    name="city"
                    value={city.value}
                    checked={formData.city === city.value}
                    onChange={handleChange}
                  />
                  <span>{city.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Partner Preference */}
          <div className={styles.inputGroup}>
            <label>Partner Preference *</label>
            <select
              name="preference"
              value={formData.preference}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Select your preference</option>
              {preferences.map((pref) => (
                <option key={pref.value} value={pref.value}>
                  {pref.label}
                </option>
              ))}
            </select>
          </div>

          {/* Birthday */}
          <div className={styles.inputGroup}>
            <label>Date of Birth *</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              className={styles.input}
              required
            />
            <p className={styles.hint}>We'll use this to find events in your age group.</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.primaryBtn}>
            {loading ? 'Signing up...' : 'Sign Up for Updates'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterSignup;