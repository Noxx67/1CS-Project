import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import styles from './ResetPassword.module.css'
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export function ResetPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    const { user } = useAuth();

    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    function togglePassword() {
        setShowPassword(!showPassword);
    }
    function toggleConfirmPassword() {
        setShowConfirmPassword(!showConfirmPassword);
    }

    const passwordsMatch = (password === confirmPassword);
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!passwordsMatch) {
            alert("Passwords don't match!");
            return;
        }
        if (!oldPassword.trim()) {
            alert("Please enter your current password.");
            return;
        }

        try {
            const response = await api.post('accounts/change-password/', {
                old_password: oldPassword.trim(),
                new_password: password,
                confirm_password: confirmPassword
            });

            if (response.status === 200) {
                // Update stored tokens
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);

                // If backend returns user data (not required), update local authorisation object
                if (response.data.user) {
                  const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
                  localStorage.setItem('user_info', JSON.stringify({
                    ...storedUser,
                    must_change_password: false,
                  }));
                }

                // Redirect by role
                if (user?.role === 'ADMIN') {
                    navigate('/dashboard');
                } else {
                    navigate('/home');
                }
            }
        } catch (error) {
            console.error("Password change error:", error.response?.data || error.message);
            navigate('/dumbahh');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.ResetPassword}>
                <div className={styles.titleContainer}>
                    <img src="/images/lock-key.png" className={styles.lockIcon} />
                    <h3 className={styles.Title}>Change your Password</h3>
                    <h6 className={styles.appTitle}>Enter a new password below to change  the password </h6>
                </div>

                <form className={styles.bodyContainer} onSubmit={handleSubmit}>

                    <p className={styles.inputFieldTitle}>CURRENT PASSWORD *</p>
                    <div className={styles.inputWrapper}>
                        <input
                            type="password"
                            placeholder="Current password"
                            className={styles.inputWrapperText}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                    </div>

                    <p className={styles.inputFieldTitle}>NEW PASSWORD*</p>
                    <div className={styles.inputWrapper}>

                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={styles.inputWrapperText}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                        <span>
                            <button type="button" className={styles.eyeButton} onClick={togglePassword}>
                                <img src="/images/eye-open.png" className={styles.eyeIcon} />
                            </button>
                        </span>
                    </div>

                    <p className={styles.inputFieldTitle}>CONFIRM PASSWORD*</p>
                    <div className={styles.inputWrapper}>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={styles.inputWrapperText}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} />

                        <span>

                            <button type="button" className={styles.eyeButton} onClick={toggleConfirmPassword}>
                                <img src="/images/eye-open.png" className={styles.eyeIcon} />
                            </button>
                        </span>
                    </div>

                    <label className={` ${passwordsMatch ? styles.emptyText : styles.Text}`}>Password do not match!</label>






                    <button type='submit' className={styles.ResetPasswordButton} >

                        Reset Password
                    </button>

                    <div className={styles.supportContainer}>
                        Technical issues?
                        <a href="mailto:support@example.com" className={styles.supportLink}>Contact Support</a>
                    </div>
                </form>


            </div>
            <footer className={styles.footer}>© 2026 École Supérieure en Informatique de Sidi Bel Abbès</footer>
        </div>
    );
}
