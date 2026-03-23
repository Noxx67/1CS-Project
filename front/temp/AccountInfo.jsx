import { useState } from 'react';

import './AccountInfo.css'

export function AccountInfo() {
    const [showPassword, setShowPassword] = useState(false);
    function togglePassword() {
        setShowPassword(!showPassword);
    }
    return (
        <div className='info-container'>
            <div className='text'>
                Personal & Account Information.
            </div>
            <div className='text'>
                General contact details and authentication.
            </div>
            <div className='info'>
                <div>
                    <div>
                        Full Name
                    </div>

                    <input className='input' />

                </div>
                <div>
                    <div> Email Address</div>

                    <input placeholder='email@esi-sba.dz' className='input' />

                </div>
                <div>
                    <div> Temporary Password</div>

                    <div className="input-wrapper">
                        <input className='input' type={showPassword ? 'text' : 'password'} />
                        <button type="button" className='eye-button' onClick={togglePassword}>
                            <img src="/images/eye.png" className='eye-icon' />
                        </button>
                    </div>

                </div>
                <div>
                    <div>Phone Number</div>


                    <input placeholder='+213 XX XX XX XX' className='input' />



                </div>


            </div>
        </div>
    )
}