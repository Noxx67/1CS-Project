import { useState } from 'react';
import { Link } from "react-router-dom";
import styles from './loginPage.module.css';

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    function togglePassword() {
        setShowPassword(!showPassword);
    }
    return (
        <div className={styles.container}> 
            <div className={styles.loginPage}> 
                <div className={styles.titleContainer}>
                    <img src="/images/logo.png" className={styles.logo} />
                    <h3 className={styles.esiTitle}>ESI Sidi Bel Abbès</h3>
                    <h6 className={styles.appTitle}>Absence Management System</h6> 
                </div>

                <div className={styles.bodyContainer}>

                    <p className={styles.inputFieldTitle}>ID OR UNIVERSITY EMAIL</p>
                    <div className={styles.inputWrapper}>
                        <img src="/images/@.png" className={styles.inputIcon}/>
                        <input type="text" placeholder="e.nom@esi-sba.dz" className={styles.inputWrapperText} />
                    </div>

                    <p className={styles.inputFieldTitle}>PASSWORD</p>
                    <div className={styles.inputWrapper}>
                        <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={styles.inputWrapperText}/>
                        <span>
                            <img src="/images/lock.png" className={styles.inputIcon}/>
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

                    <button className={styles.loginButton}>
                        <img src="/images/exit.png" className="login-icon" />
                        Login
                    </button>

                    <div className={styles.supportContainer}>
                        Technical issues?
                        <a href="mailto:support@example.com" className={styles.supportLink}>Contact Support</a>
                    </div> 
                </div>


            </div>
            <Link to="/AdminCreateUser">admin create user</Link>
            <footer className={styles.footer}>© 2026 École Supérieure en Informatique de Sidi Bel Abbès</footer>
        </div>
    );
}