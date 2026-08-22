import LandingBackground from "./components/LandingBackground";
import './styles/index.css';
import './styles/auth.css';
import { useState } from "react";
import { Link } from "react-router-dom";


function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('http://localhost:8080/users/register', {
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

        const data = await response.json();

        if (response.ok) {
            console.log('Account Created:', data);
            setMessage('Account created successfully! Redirecting...');
            const timeoutId = setTimeout(() => {
                console.log('Redirecting to login...');
                window.location.href = '/login';
            }, 2000);

            // Cleanup timeout on unmount
            return () => clearTimeout(timeoutId);

        } else {
            console.log('Error:', data);
            setMessage('Error creating account');
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

                        <button type="submit" className="auth-submit-btn">
                            Create Account
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