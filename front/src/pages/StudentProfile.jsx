import React, { useState, useEffect, useRef } from 'react';
import styles from './StudentProfile.module.css';
import { useAuth } from '../context/AuthContext';
import StudentSidebar from '../components/StudentSidebar';
import StudentHeader from '../components/StudentHeader';
import api from '../api/axios';
import { changeSystemSettingsPassword } from '../services/systemSettingsEndpoint';

export default function StudentProfile() {
    const { user, updateUser } = useAuth();

    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        lastName: user?.last_name || user?.lastName || '',
        firstName: user?.first_name || user?.firstName || '',
        studentId: user?.registration_number || '',
        email: user?.email || '',
        major: user?.speciality || 'N/A',
        level: user?.promotion || 'Student',
        academicYear: user?.year || 'N/A',
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
                studentId: user?.registration_number || '',
                email: user?.email || '',
                major: user?.speciality || 'N/A',
                level: user?.promotion || 'Student',
                academicYear: user?.year || 'N/A',
            }));
        }
    }, [user]);

    const [showPassword, setShowPassword] = useState(false);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Helpers
    const getDisplayName = () => `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Student';

    const applyUserUpdate = (data) => {
        try {
            // Merge minimal user fields
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
            // fallback local preview
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
        // revert local fields to user
        setFormData((prev) => ({
            ...prev,
            lastName: user?.last_name || user?.lastName || '',
            firstName: user?.first_name || user?.firstName || '',
            studentId: user?.registration_number || '',
            email: user?.email || '',
            major: user?.speciality || 'N/A',
            level: user?.promotion || 'Student',
            academicYear: user?.year || 'N/A',
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
                speciality: formData.major,
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
        <div className={styles["app-container"]}>
            <StudentSidebar />

            {/* Main Content */}
            <main className={styles["main-content"]}>
                <StudentHeader />

                <div className={styles["page-title-bar"]}>
                    <div className={styles["page-title"]}>
                        <svg className={styles["title-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <h1>Student Profile</h1>
                    </div>
                </div>

                <div className={styles["content-area"]}>
                    {/* Profile Card */}
                    <div className={styles["profile-card"]}>
                        <div className={styles["profile-info"]}>
                                <div className={styles["avatar-container"]}>
                                <div className={styles["avatar"]} onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                                    {user?.profile_picture ? (
                                        <img src={user.profile_picture} alt={getDisplayName()} className={styles["avatar-image"]} />
                                    ) : (
                                        <div style={{ width: 80, height: 80, borderRadius: 40, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#111827' }}>{(formData.firstName || formData.lastName) ? ((formData.firstName || '')[0] + (formData.lastName || '')[0]).toUpperCase() : 'S'}</div>
                                    )}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, right: 0, display: 'flex', gap: 8 }}>
                                    <button type="button" className={styles["camera-btn"]} onClick={() => fileInputRef.current?.click()} disabled={loading}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    </button>
                                    <button type="button" className={styles["remove-btn"]} onClick={handleRemovePhoto} disabled={loading}>
                                        ✕
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelection} />
                                </div>
                            </div>
                            <div className={styles["profile-details"]}>
                                <h2 className={styles["profile-name"]}>{getDisplayName()}</h2>
                                <p className={styles["profile-subtitle"]}>Student in {formData.level || user?.promotion || 'Unknown'}</p>
                                <div className={styles["profile-badges"]}>
                                    <span className={`${styles["badge"]} ${styles["badge-id"]}`}>
                                        <img src="/Icons/Icon (10).png" alt="icon" />
                                        {user?.registration_number || 'N/A'}
                                    </span>
                                    <span className={`${styles["badge"]} ${styles["badge-status"]}`}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Status: Regular
                                    </span>
                                </div>
                            </div>
                        </div>
                        {!editing ? (
                            <button className={`${styles["btn"]} ${styles["btn-primary"]}`} onClick={handleStartEdit}>Edit Profile</button>
                        ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`${styles["btn"]} ${styles["btn-secondary"]}`} onClick={handleCancel}>Cancel</button>
                                <button className={`${styles["btn"]} ${styles["btn-primary"]}`} onClick={handleSaveProfile} disabled={loading}>Save Changes</button>
                            </div>
                        )}
                    </div>

                    <div className={styles["content-grid"]}>
                        {/* Personal Information */}
                        <div className={styles["info-card"]}>
                            <div className={styles["card-header"]}>
                                <div className={styles["card-title"]}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <h3>Personal Information</h3>
                                </div>
                                <button className={styles["edit-btn"]} onClick={handleStartEdit}>Edit</button>
                            </div>

                            <div className={styles["form-grid"]}>
                                <div className={styles["form-group"]}>
                                    <label>LAST NAME</label>
                                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} readOnly={!editing} />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>FIRST NAME</label>
                                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} readOnly={!editing} />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>STUDENT ID</label>
                                    <input type="text" value={formData.studentId} readOnly />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>INSTITUTIONAL EMAIL</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} readOnly={!editing} />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>MAJOR</label>
                                    <input type="text" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} readOnly={!editing} />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>LEVEL</label>
                                    <input type="text" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} readOnly={!editing} />
                                </div>
                                <div className={`${styles["form-group"]} ${styles["full-width"]}`}>
                                    <label>ACADEMIC YEAR</label>
                                    <input type="text" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} readOnly={!editing} />
                                </div>
                            </div>

                            <div className={styles["admin-note"]}>
                                <div className={styles["note-icon"]}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </div>
                                <div className={styles["note-content"]}>
                                    <h4>Administrative Note</h4>
                                    <p>Student ID and Academic Year fields are managed by the administration and cannot be modified directly.</p>
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className={styles["security-card"]}>
                            <div className={styles["card-title"]}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <h3>Security</h3>
                            </div>

                            <p className={styles["security-desc"]}>Modify your password to maintain the security of your student account.</p>

                            <div className={styles["form-group"]}>
                                <label>CURRENT PASSWORD</label>
                                <div className={styles["password-input"]}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    />
                                    <button
                                        className={styles["toggle-password"]}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className={styles["form-group"]}>
                                <label>NEW PASSWORD</label>
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                            </div>

                            <div className={styles["form-group"]}>
                                <label>CONFIRM NEW</label>
                                <input
                                    type="password"
                                    placeholder="Confirm new"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <button className={`${styles["btn"]} ${styles["btn-primary"]} ${styles["btn-full"]}`} onClick={handleUpdatePassword} disabled={loading}>Update Password</button>
                            <p className={styles["last-update"]}>Last update: 3 months ago</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles["footer-actions"]}>
                        <button className={`${styles["btn"]} ${styles["btn-secondary"]}`} onClick={handleCancel}>Cancel</button>
                        <button className={`${styles["btn"]} ${styles["btn-primary"]}`} onClick={handleSaveProfile} disabled={loading}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Save all changes
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}