import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import styles from './ContactSupport.module.css';

export function ContactSupport() {
    // Controlled inputs
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post('contact/', {
                full_name: fullName,
                email: email,
                subject,
                message,
            });

            alert('Message sent successfully!');
            setFullName('');
            setEmail('');
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error(error);
            alert('Failed to send message. Please try again.');
        }
    };

    return (
        <div className={styles.contactSupportContainer}>
            {/* LEFT SIDE */}
            <div className={styles.contactSupportLeftside}>
                <div>
                    <img src="/images/logo.png" className={styles.logo} alt="Logo" />
                    <h2 className={styles.title}>Absence Management System</h2>
                    <div className={styles.description}>
                        Need help with your academic portal? Our technical team is here to assist you.
                    </div>
                </div>

                <div>
                    <div className={styles.locationRow}>
                        <img src="/Icons/Icon.png" alt="Location" />
                        <div>
                            <p className={styles.location}>LOCALISATION</p>
                            <p className={styles.text}>Sidi Bel Abbès, Algérie</p>
                        </div>
                    </div>

                    <div className={styles.emailRow}>
                        <img src="/Icons/msg.png" alt="Email" />
                        <div>
                            <p className={styles.email}>EMAIL SUPPORT</p>
                            <p className={styles.text}>example@esi-sba.dz</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className={styles.contactSupportRightside}>
                <h3 className={styles.ContactTitle}>Contact Support</h3>
                <p className={styles.ContactDescription}>
                    Please fill out the form below to contact us
                </p>

                <form onSubmit={handleSubmit}>
                    {/* FULL NAME */}
                    <div className={styles.formGroup}>
                        <label htmlFor="fullName" className={styles.label}>FULL NAME</label>
                        <div className={styles.inputWrapper}>
                            <img src="/Icons/userIcon.png" className={styles.inputIcon} alt="User" />
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                className={styles.input}
                                placeholder="Ex: Mohamed Amine"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* EMAIL */}
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>EMAIL ADDRESS</label>
                        <div className={styles.inputWrapper}>
                            <img src="/Icons/Icon (8).png" className={styles.inputIcon} alt="Email" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={styles.input}
                                placeholder="nom.prenom@esi-sba.dz"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* SUBJECT */}
                    <div className={styles.formGroup}>
                        <label htmlFor="subject" className={styles.label}>SUBJECT</label>
                        <div className={styles.inputWrapper}>
                            <img src="/Icons/Icon (6).png" className={styles.inputIcon} alt="Subject" />
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                className={styles.input}
                                placeholder="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* MESSAGE */}
                    <div className={styles.formGroup}>
                        <label htmlFor="message" className={styles.label}>MESSAGE</label>
                        <textarea
                            id="message"
                            name="message"
                            className={styles.textarea}
                            rows="5"
                            placeholder="Describe your issue or question here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    {/* SEND BUTTON */}
                    <button type="submit" className={styles.submitButton}>
                        SEND MESSAGE
                        <img src="/Icons/Icon (7).png" className={styles.sendIcon} alt="Send" />
                    </button>
                </form>

                {/* RETURN LINK */}
                <div className={styles.centerContainer}>
                    <Link to="/LoginPage" className={styles.backfleche}>← Return</Link>
                </div>
            </div>
        </div>
    );
}