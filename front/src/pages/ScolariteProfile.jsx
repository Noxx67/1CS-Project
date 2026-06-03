import React, { useState, useEffect, useRef } from 'react';
import styles from './ScolariteProfile.module.css';
import { useAuth } from '../context/AuthContext';
import ScolariteSidebar from '../components/ScolariteSidebar';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import api from '../api/axios';
import { changeSystemSettingsPassword } from '../services/systemSettingsEndpoint';

export default function ScolariteProfile() {
  const { user, updateUser } = useAuth();

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    lastName: user?.last_name || user?.lastName || '',
    firstName: user?.first_name || user?.firstName || '',
    email: user?.email || '',
    currentPassword: '••••••••',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        lastName: user?.last_name || user?.lastName || '',
        firstName: user?.first_name || user?.firstName || '',
        email: user?.email || '',
      }));
    }
  }, [user]);

  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDisplayName = () => `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Admin';

  const applyUserUpdate = (data) => {
    try {
      updateUser({ ...user, ...data });
    } catch (e) {
      console.error('Failed to update auth user in context', e);
    }
  };

  const handlePhotoSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const form = new FormData();
      form.append('profile_picture', file);
      const response = await api.put('/accounts/me/picture/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const next = response.data?.profile_picture || '';
      applyUserUpdate({ profile_picture: next });
      event.target.value = '';
    } catch (err) {
      console.error('Upload failed', err);
      const reader = new FileReader();
      reader.onload = () => {
        applyUserUpdate({ profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setLoading(true);
      await api.put('/accounts/me/picture/', { profile_picture: '' });
      applyUserUpdate({ profile_picture: '' });
    } catch (err) {
      console.error('Remove photo failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => setEditing(true);

  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      lastName: user?.last_name || user?.lastName || '',
      firstName: user?.first_name || user?.firstName || '',
      email: user?.email || '',
      newPassword: '',
      confirmPassword: '',
    }));
    setEditing(false);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
      };
      const resp = await api.put('/accounts/me/', payload);
      applyUserUpdate(resp.data || payload);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      alert(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (!formData.newPassword) {
        alert('Please provide a new password');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        alert('Password confirmation does not match');
        return;
      }
      setLoading(true);
      await changeSystemSettingsPassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      alert('Password updated');
      setFormData((prev) => ({ ...prev, currentPassword: '••••••••', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      console.error('Password update failed', err);
      alert(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <ScolariteSidebar />

      <main className={styles.main}>
        <ScolaritePageHeader />

        <div className={styles.content}>
          <div className={styles.header}>
            <h1>Admin Profile</h1>
            <p>Manage your profile settings and security</p>
          </div>

          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.profileInfo}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar} onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt={getDisplayName()} className={styles.avatarImage} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 40, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#111827' }}>
                      {(formData.firstName || formData.lastName) ? ((formData.firstName || '')[0] + (formData.lastName || '')[0]).toUpperCase() : 'A'}
                    </div>
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, display: 'flex', gap: 8 }}>
                  <button type="button" className={styles.cameraBtn} onClick={() => fileInputRef.current?.click()} disabled={loading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  <button type="button" className={styles.removeBtn} onClick={handleRemovePhoto} disabled={loading}>
                    ✕
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelection} />
                </div>
              </div>
              <div>
                <h2 className={styles.displayName}>{getDisplayName()}</h2>
                <p className={styles.role}>Academic Office Administrator</p>
              </div>
            </div>
            {!editing ? (
              <button className={styles.btnPrimary} onClick={handleStartEdit}>Edit Profile</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={styles.btnSecondary} onClick={handleCancel}>Cancel</button>
                <button className={styles.btnPrimary} onClick={handleSaveProfile} disabled={loading}>Save Changes</button>
              </div>
            )}
          </div>

          <div className={styles.grid}>
            {/* Personal Information */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Personal Information</h3>
                {!editing && <button className={styles.editBtn} onClick={handleStartEdit}>Edit</button>}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>LAST NAME</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} readOnly={!editing} />
                </div>
                <div className={styles.formGroup}>
                  <label>FIRST NAME</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} readOnly={!editing} />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>EMAIL</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} readOnly={!editing} />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Security</h3>
              </div>

              <p className={styles.description}>Update your password to keep your account secure.</p>

              <div className={styles.formGroup}>
                <label>CURRENT PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={formData.currentPassword} readOnly style={{ width: '100%' }} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>NEW PASSWORD</label>
                <input type={showPassword ? 'text' : 'password'} value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} placeholder="Enter new password" />
              </div>

              <div className={styles.formGroup}>
                <label>CONFIRM PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Confirm new password" />
                </div>
              </div>

              <button className={styles.btnPrimary} onClick={handleUpdatePassword} disabled={loading}>Update Password</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
