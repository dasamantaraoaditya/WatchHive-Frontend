import React, { useEffect } from 'react';
import './PrivacyPolicyPage.css';

export const PrivacyPolicyPage: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="privacy-page">
            <div className="privacy-container">
                <header className="privacy-header">
                    <h1>Privacy Policy</h1>
                    <p className="last-updated">Last Updated: March 10, 2026</p>
                </header>

                <div className="privacy-content">
                    <section>
                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to WatchHive. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you about how we look after your personal data when you visit our website
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2>2. The Data We Collect</h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                        </p>
                        <ul>
                            <li><strong>Identity Data:</strong> Includes username, display name, and profile picture.</li>
                            <li><strong>Contact Data:</strong> Includes email address.</li>
                            <li><strong>Technical Data:</strong> Includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                            <li><strong>Profile Data:</strong> Includes your watch history, ratings, reviews, and preferences.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>3. How We Use Your Data</h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul>
                            <li>To provide you with the services of WatchHive.</li>
                            <li>To manage your account and provide you with customer support.</li>
                            <li>To improve our website and services.</li>
                            <li>To allow you to interact with other users (social features).</li>
                        </ul>
                    </section>

                    <section>
                        <h2>4. Google OAuth</h2>
                        <p>
                            WatchHive allows you to sign in using your Google account. When you use Google OAuth, we receive
                            your email address, name, and profile picture from Google. We use this information only to create
                            and manage your WatchHive account. We do not share this information with third parties for marketing purposes.
                        </p>
                    </section>

                    <section>
                        <h2>5. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
                            used or accessed in an unauthorized way, altered or disclosed.
                        </p>
                    </section>

                    <section>
                        <h2>6. Your Legal Rights</h2>
                        <p>
                            Under certain circumstances, you have rights under data protection laws in relation to your personal data,
                            including the right to request access, correction, erasure, restriction, transfer, or to object to processing.
                        </p>
                    </section>

                    <section>
                        <h2>7. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at:
                            <br />
                            <strong>Email:</strong> privacy@watchhive.app
                        </p>
                    </section>
                </div>

                <footer className="privacy-footer">
                    <button className="back-btn" onClick={() => window.history.back()}>
                        Go Back
                    </button>
                </footer>
            </div>
        </div>
    );
};

