import '../styles/header.css';
import { Link } from 'react-router-dom';

function Header() {
    return (
        <div className="header-wrapper">
            <header className="header">
                <a href="#" className="logo">
                    <span>PersoNotes</span>
                </a>

                <div className="header-actions">
                    <Link to="/login" className="btn-ghost">Sign In</Link>
                    <Link to="/register" className="btn-header-cta">Get Started →</Link>
                </div>
            </header>
        </div>
    );
}

export default Header;