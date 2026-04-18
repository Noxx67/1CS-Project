import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ContactPage.module.css';

const locationIcon = '/Icons/location.svg';
const emailIcon = '/Icons/email.svg';
const esiLogo = '/images/logo.png';
const userIcon = '/Icons/user.svg';
const atIcon = '/Icons/at.svg';
const subjectIcon = '/Icons/subject.svg';
const sendIcon = '/Icons/send.svg';
const arrowLeftIcon = '/Icons/arrow-left.svg';
const chevronIcon = '/Icons/chevron.svg';

const ContactPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectWrapperRef = useRef(null);

  const subjectOptions = [
    'Account Issue',
    'Absence Justification',
    'Technical Problem',
    'Other',
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectWrapperRef.current && !selectWrapperRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleSelectToggle = () => {
    setIsSelectOpen((prev) => !prev);
  };

  const handleOptionSelect = (option) => {
    setFormData((prev) => ({ ...prev, subject: option }));
    setIsSelectOpen(false);
  };

  const handleSelectKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsSelectOpen(false);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsSelectOpen((prev) => !prev);
    }
  };

  const handleReturn = () => {
    navigate('/');
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <main className={styles.card}>
          <aside className={styles.leftPanel} aria-label="ESI branding panel">
            <div className={styles.logoWrapper}>
              <div className={styles.logoBackground} />
              <img
                src={esiLogo}
                alt="ESI Sidi Bel Abbès Logo"
                className={styles.logoImage}
              />
            </div>

            <div className={styles.brandingBlock}>
              <h1 className={styles.heading}>Absence Management System</h1>
              <p className={styles.subheading}>
                Need help with your academic portal?
                <br />
                Our technical team is here to Assist you.
              </p>
            </div>

            <div className={styles.infoBlock}>
              <div className={styles.infoItem}>
                <div className={styles.infoIconWrapper} aria-hidden="true">
                  <img src={locationIcon} alt="" width="16" height="20" />
                </div>
                <div className={styles.infoTextBlock}>
                  <span className={styles.infoLabel}>Localisation</span>
                  <span className={styles.infoValue}>Sidi Bel Abbès, Algérie</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIconWrapper} aria-hidden="true">
                  <img src={emailIcon} alt="" width="20" height="16" />
                </div>
                <div className={styles.infoTextBlock}>
                  <span className={styles.infoLabel}>Email Support</span>
                  <span className={styles.infoValue}>example@esi-sba.dz</span>
                </div>
              </div>
            </div>
          </aside>

          <section className={styles.rightPanel} aria-label="Contact support form">
            <header className={styles.header}>
              <h2 className={styles.title}>Contact Support</h2>
              <p className={styles.subtitle}>Please fill out the form Under to contact us</p>
            </header>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.fieldWrapper}>
                <label htmlFor="fullName" className={styles.fieldLabel}>
                  Full Name
                </label>

                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <img src={userIcon} alt="" width="14" height="14" />
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    className={styles.input}
                    placeholder="Ex: Mohamed Amine"
                    value={formData.fullName}
                    onChange={handleChange('fullName')}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className={styles.fieldWrapper}>
                <label htmlFor="email" className={styles.fieldLabel}>
                  Email Address
                </label>

                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <img src={atIcon} alt="" width="17" height="17" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    placeholder="nom.prenom@esi-sba.dz"
                    value={formData.email}
                    onChange={handleChange('email')}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className={styles.fieldWrapper}>
                <label id="subject-label" htmlFor="subject" className={styles.fieldLabel}>
                  Subject
                </label>

                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <img src={subjectIcon} alt="" width="14" height="12" />
                  </span>

                  <div className={styles.selectWrapper} ref={selectWrapperRef}>
                    <button
                      id="subject"
                      type="button"
                      className={`${styles.selectButton} ${!formData.subject ? styles.selectPlaceholder : ''} ${isSelectOpen ? styles.selectOpen : ''}`}
                      aria-haspopup="listbox"
                      aria-expanded={isSelectOpen}
                      aria-labelledby="subject-label subject"
                      onClick={handleSelectToggle}
                      onKeyDown={handleSelectKeyDown}
                    >
                      {formData.subject || 'Subject'}
                    </button>

                    <span
                      className={`${styles.selectChevron} ${isSelectOpen ? styles.selectChevronOpen : ''}`}
                      aria-hidden="true"
                    >
                      <img src={chevronIcon} alt="" width="14" height="14" />
                    </span>

                    {isSelectOpen && (
                      <ul className={styles.optionsList} role="listbox" aria-labelledby="subject-label">
                        {subjectOptions.map((option) => (
                          <li key={option} role="option" aria-selected={formData.subject === option}>
                            <button
                              type="button"
                              className={`${styles.optionItem} ${formData.subject === option ? styles.optionItemSelected : ''}`}
                              onClick={() => handleOptionSelect(option)}
                            >
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.fieldWrapper}>
                <label htmlFor="message" className={styles.fieldLabel}>
                  Message
                </label>

                <textarea
                  id="message"
                  className={styles.textarea}
                  placeholder="Describe your issue in detail..."
                  value={formData.message}
                  onChange={handleChange('message')}
                />
              </div>

              <button className={styles.sendButton} type="submit">
                <span className={styles.sendButtonLabel}>Send Message</span>
                <span className={styles.sendButtonIcon} aria-hidden="true">
                  <img src={sendIcon} alt="" width="16" height="14" />
                </span>
              </button>
            </form>

            <div className={styles.returnWrapper}>
              <button
                className={styles.returnButton}
                onClick={handleReturn}
                type="button"
                aria-label="Return to previous page"
              >
                <img className={styles.returnIcon} src={arrowLeftIcon} alt="" width="12" height="12" />
                <span className={styles.returnText}>Return</span>
              </button>
            </div>
          </section>
        </main>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © 2026 École Supérieure en Informatique de Sidi Bel Abbès
        </p>
      </footer>
    </div>
  );
};

export default ContactPage;
