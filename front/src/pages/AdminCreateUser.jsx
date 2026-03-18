import { Sidebar } from './sidebar';
import { Header } from './header';
import { CreateUser } from './CreateUser';
import { AccountInfo } from './AccountInfo';
import { AcademicDetails } from './AcademicDetails';
import './AdminCreateUser.css'
export function AdminCreateUser() {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="content">
                <Header />
                <CreateUser />
                <AccountInfo />
                <AcademicDetails />
                <div className='buttons-container'>
                    <button className='cancel-button'>Cancel</button>
                    <button className='buttons'>Create Account <img src="/images/Icon (4).png" alt="" /></button>

                </div>

            </div>

        </div>
    )
}