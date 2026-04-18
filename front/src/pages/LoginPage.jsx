import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import styles from './loginPage.module.css';
import { useAuth } from '../context/AuthContext'; // Import the hook


export function LoginPage() {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function togglePassword() {
        setShowPassword(!showPassword); 
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Attempting login for:", email);
            
            // Use the AuthContext login method
            const response = await login(email, password);
            
            console.log("Login successful, user data:", response.user);
            
            // Check if user must change password (admin bypasses forced-reset behavior)
            if (response.user.must_change_password && response.user.role !== 'ADMIN') {
                console.log("User must change password, redirecting to reset password");
                navigate('/ResetPassword');
            } else if (response.user.role === 'ADMIN') {
                console.log("Admin login, redirecting to dashboard");
                navigate('/dashboard');
            } else {
                console.log("Non-admin login, redirecting to home placeholder");
                navigate('/home');
            }
            
        } catch (error) {
            console.error("Login Error:", error.response?.data || error.message);
            // Navigate to error page on login failure
            navigate('/dumbahh');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginPage}>
                <div className={styles.titleContainer}>
                    <img src="/images/logo.png" className={styles.logo} />
                    <h3 className={styles.esiTitle}>ESI Sidi Bel Abbès</h3>
                    <h6 className={styles.appTitle}>Absence Management System</h6>
                </div>

                <form className={styles.bodyContainer} onSubmit={handleSubmit}>

                    <p className={styles.inputFieldTitle}>ID OR UNIVERSITY EMAIL</p>
                    <div className={styles.inputWrapper}>
                        <img src="/images/@.png" className={styles.inputIcon} />
                        <input
                            type="text"
                            placeholder="e.nom@esi-sba.dz"
                            className={styles.inputWrapperText}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} />

                    </div>

                    <p className={styles.inputFieldTitle}>PASSWORD</p>
                    <div className={styles.inputWrapper}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={styles.inputWrapperText}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />

                        <span>
                            <img src="/images/lock.png" className={styles.inputIcon} />
                            <button type="button" className={styles.eyeButton} onClick={togglePassword}>
                                <img src="/images/eye-open.png" className={styles.eyeIcon} />
                            </button>
                        </span>
                    </div>

                    <div className={styles.rememberContainer}>
                        <div className={styles.rememberGroup}>
                            <input type="checkbox" id="remember" className={styles.checkbox} />
                            <label htmlFor="remember" className={styles.rememberText}>Remember me</label>
                        </div>

                        <a href="mailto:support@example.com" className={styles.forgetLink}>Forgot Password?</a>

                    </div>

                    <button type='submit' className={styles.loginButton}>
                        <img src="/images/exit.png" className="login-icon" />
                        Login
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
