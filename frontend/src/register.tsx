import LandingBackground from "./components/LandingBackground";
import './styles/index.css';
import './styles/auth.css';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            });

            if (response.ok) {
                setMessage('Account created successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            } else {
                let errorMsg = 'Error creating account';
                try {
                    const data = await response.json();
                    if (data.message) errorMsg = data.message;
                } catch {
                    // Ignore non-json
                }
                setMessage(errorMsg);
            }
        } catch (error) {
            console.error('Register network error:', error);
            setMessage('Failed to connect to backend server. If Render backend was sleeping, please wait ~30s and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <LandingBackground />
            <div className="login-wrapper">
                <Link to="/" className="nav-button">
                    <span>←</span> Return to Home
                </Link>

                <h1 className="auth-heading">
                    Join <span className="gradient-text">PersoNotes</span>
                </h1>

                <div className="login-box">
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="reg-username">Username</label>
                            <input
                                id="reg-username"
                                type="text"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="reg-email">Email Address</label>
                            <input
                                id="reg-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="reg-password">Password</label>
                            <input
                                id="reg-password"
                                type="password"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {message && <p className="auth-msg">{message}</p>}

                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Already have an account?
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </>
    );
}

export default Register;