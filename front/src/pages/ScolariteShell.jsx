import { Outlet } from 'react-router-dom';
import ScolariteSidebar from '../components/ScolariteSidebar';
import styles from './ScolariteShell.module.css';

export default function ScolariteShell() {
  return (
    <div className={styles.layout}>
      <ScolariteSidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
