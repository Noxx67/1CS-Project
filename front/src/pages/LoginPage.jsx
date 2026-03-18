import { useState } from 'react';
import { Link } from "react-router-dom";
import './loginPage.css'

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    function togglePassword() {
        setShowPassword(!showPassword);
    }
    return (
        <div className='container'>
            <div className="login-page">
                <img src="/images/logo.png" className="logo" />
                <h3 className='esi-title'>ESI Sidi Bel Abbès</h3>
                <h6 className='Title'>Absence Management System</h6>
                <p className='text'>ID OR UNIVERSITY EMAIL  </p>
                <div className="input-wrapper">
                    <span className="input-prefix">@</span>
                    <input type="text" placeholder="e.nom@esi-sba.dz" className='input-text' />
                </div>
                <p className='text'>PASSWORD</p>
                <div className="input-wrapper">
                    <input type={showPassword ? 'text' : 'password'} className='input-text' />
                    <span>
                        <img src="/images/lock.png" className="lock-icon" />
                        <button type="button" className='eye-button' onClick={togglePassword}>
                            <img src="/images/eye.png" className='eye-icon' />
                        </button>


                    </span>


                </div>
                <div className='remember-container'>
                    <input type="checkbox" id="remember" />

                    <label htmlFor="remember" className='remember-text'>Remember me</label>
                    <label className='forget-text'>Forget Password ?</label>


                </div>
                <button className='signin-button'>
                    <img src="/images/Icon.png" className="login-icon" />
                    Sign in
                </button>
                <div className='support-container'>
                    <p className='TEXT'>Technical issues ? </p>
                    <a href="mailto:support@example.com" className="support-link">Contact Support</a>

                </div>

            </div>
            <p>© 2026 École Supérieure en Informatique de Sidi Bel Abbès</p>
            <Link to="/AdminCreateUser">admin create user</Link>
        </div>
    );
}