import LandingBackground from "./components/LandingBackground";
import './styles/index.css';
import './styles/auth.css';
import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('http://localhost:8080/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", `Bearer ${data.token}`);
            console.log('Logged In:', data);
            setMessage('Login successful! Redirecting...');
            const timeoutId = setTimeout(() => {
                console.log('Redirecting to dashboard...');
                window.location.href = '/dashboard';
            }, 2000);

            // Cleanup timeout on unmount
            return () => clearTimeout(timeoutId);

        } else {
            console.log('Error:', data);
            setMessage('Error Logging In');
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