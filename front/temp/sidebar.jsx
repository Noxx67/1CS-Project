import './sidebar.css'
import { Link } from 'react-router-dom'
export function Sidebar() {
    return (
        <div className="sidebar">
            <div className='sidebar-header'>
                <img src="/images/logo.png" className='logo' />
                <div className='sidebar-header-content'>
                    <p className='esi-text'> ESI SBA</p>
                    <p className='absence-text'> ABSENCE PORTAL</p>
                </div>
            </div>
            <div className='sidebar-content'>
                <Link><img src="Icons/Icon (1).png" className='Icons' /> Dashboard</Link>
                <Link> <img src="Icons/Icon (5).png" className='Icons' /> Users Management</Link>
                <Link><img src="Icons/Icon (2).png" className='Icons' /> Schedules</Link>
                <Link> <img src="Icons/Icon (3).png" className='Icons' />Activity Logs</Link>
                <Link><img src="Icons/Icon (4).png" className='Icons' />System Settings</Link>

            </div>

        </div>
    )

}