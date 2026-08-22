import LandingBackground from './components/LandingBackground';

function LandingPage() {
    return (
        <div className="landing-container">
            <LandingBackground />

            <section className="hero-section">
                <h1 className="hero-title">
                    Your personalized <br />
                    <span className="gradient-text">notes.</span>
                </h1>

                <p className="hero-subtitle">
                    A modern, beautiful note-taking experience with a focus on speed, privacy, and ease of use.
                </p>

                <div className="hover-swap-container">
                    <div className="swap-layer swap-layer-1">
                        <div>
                            <h3 className="note-title">Tired of ugly looking notes?</h3>
                            <p className="note-content">
                                Boring note-taking apps are a thing of the past.
                                With <span className="gradient-text">PersoNotes</span>, you can capture your thoughts in a beautiful, personalized way. <br /><br />
                                • No more lost ideas or forgotten to-dos<br />
                                • A simple, beautiful interface for your notes<br />
                                • Take your notes anywhere, anytime<br />
                                • Stay organized with our powerful note management system<br />
                                • And much more on the way!
                            </p>
                        </div>
                        <div className="note-tags">
                            <span className="tag">#thisisbeautiful</span>
                            <span className="tag">#thisispersonotes</span>
                        </div>
                    </div>

                    <div className="swap-layer swap-layer-2">
                        <div>
                            <h3 className="note-title">Worried about someone reading your notes?</h3>
                            <p className="note-content">
                                Your notes are secured with end-to-end encryption. <br /> <br />
                                • You can delete your notes anytime.<br />
                                • No one, not even us, can read your notes<br />

                            </p>
                        </div>
                        <div className="note-tags">
                            <span className="tag">#privacyontop</span>
                            <span className="tag">#secure</span>
                        </div>
                    </div>
                </div>

                <p className="card-hint">
                    Made with ❤️ by <span>Dandan</span>
                </p>
            </section>
        </div>
    );
}

export default LandingPage;