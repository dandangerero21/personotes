import LandingBackground from "./components/LandingBackground";
import './styles/index.css';
import './styles/auth.css';
import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setIsSuccess(false);

        try {
            const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                }),
            });

            const data = await response.json();
            setIsSuccess(true);
            setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');
        } catch (error) {
            console.error('Forgot password network error:', error);
            setIsSuccess(false);
            setMessage('Failed to connect to backend server. Please try again later.');
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
                    Reset Password
                </h1>
                <p className="auth-desc">
                    Enter the email associated with your account and we'll send you a password reset link.
                </p>

                <div className="login-box">
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="forgot-email">Email Address</label>
                            <input
                                id="forgot-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {message && (
                            <p className={`auth-msg ${isSuccess ? 'auth-msg-success' : 'auth-msg-error'}`}>
                                {message}
                            </p>
                        )}

                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Remember your password?
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </>
    );
}

export default ForgotPassword;
