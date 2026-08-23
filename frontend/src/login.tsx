import LandingBackground from "./components/LandingBackground";
import './styles/index.css';
import './styles/auth.css';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", `Bearer ${data.token}`);
                setMessage('Login successful! Redirecting to dashboard...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);
            } else {
                let errorMsg = 'Invalid username or password';
                try {
                    const data = await response.json();
                    if (data.message) errorMsg = data.message;
                } catch {
                    // Ignore non-json response
                }
                setMessage(errorMsg);
            }
        } catch (error) {
            console.error('Login network error:', error);
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
                    Login to <span className="gradient-text">PersoNotes</span>
                </h1>

                <div className="login-box">
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {message && <p className="auth-msg">{message}</p>}

                        <button type="submit" className="auth-submit-btn">
                            Sign In
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Don't have an account?
                        <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </>
    );
}

export default Login;