import './CreateUser.css'

export function CreateUser() {
    return (
        <div className='user-type-container'>
            <div className='text'>
                User Role.
            </div>
            <div className='text'>
                Choose the account type you want to create.
            </div>
            <div className='user-type'>
                <div className='user-container'>
                    <img src="/images/profile.png" className='icons' />
                    <p>Student</p>
                </div>
                <div className='user-container'>
                    <img src="/images/Icon (1).png" className='icons' />
                    <p>Teacher</p>
                </div>
                <div className='user-container'>
                    <img src="/images/Icon (2).png" className='icons' />
                    <p>Academic Affairs</p>
                </div>
                <div className='user-container'>
                    <img src="/images/Icon (3).png" className='icons' />
                    <p>Admin</p>
                </div>

            </div>
        </div>
    )
}