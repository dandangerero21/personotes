import LandingBackground from "./components/LandingBackground";
import './styles/index.css';
import './styles/auth.css';
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsSuccess(false);

        if (!token) {
            setMessage('Password reset token is missing from the URL.');
            return;
        }

        if (newPassword.length < 6) {
            setMessage('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match. Please verify.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setMessage(data.message || 'Password successfully reset! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                setIsSuccess(false);
                setMessage(data.message || 'Failed to reset password. The link may have expired.');
            }
        } catch (error) {
            console.error('Reset password network error:', error);
            setIsSuccess(false);
            setMessage('Failed to connect to backend server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <LandingBackground />
            <div className="login-wrapper">
                <Link to="/login" className="nav-button">
                    <span>←</span> Return to Login
                </Link>

                <h1 className="auth-heading">
                    Set New Password
                </h1>
                <p className="auth-desc">
                    Choose a strong password to secure your account.
                </p>

                <div className="login-box">
                    {!token ? (
                        <div>
                            <p className="auth-msg auth-msg-error" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
                                Missing password reset token. Please request a new password reset link.
                            </p>
                            <Link to="/forgot-password" className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                                Request Reset Link
                            </Link>
                        </div>
                    ) : (
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="new-password">New Password</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter new password (min 6 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirm-password">Confirm New Password</label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {message && (
                                <p className={`auth-msg ${isSuccess ? 'auth-msg-success' : 'auth-msg-error'}`}>
                                    {message}
                                </p>
                            )}

                            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating Password...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <p className="auth-footer-text">
                        Back to
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </>
    );
}

export default ResetPassword;
