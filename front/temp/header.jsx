import './header.css'
export function Header() {
    return (
        <div className="header-container">
            <div className="header-leftside">

                <a href="/" className='fleche-icon'>←</a>
                <div>
                    <h3 className='header-title'>Add New User</h3>
                    <p className='text'>Users Management  Create User </p>

                </div>

            </div>
            <div className="header-rightside">
                <img src="/images/notificationIcon.png" />
                <button className="user-info">AD</button>
            </div>

        </div>


    )
}
