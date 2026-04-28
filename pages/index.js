import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      <Head>
        <title>SecureEscrow - Secure Transactions, Simplified</title>
        <meta name="description" content="Secure escrow service for your peace of mind." />
      </Head>

      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            SecureEscrow
          </div>
          <div className="header-actions">
            <Link href="/login" className="btn btn-outline" style={{ border: 'none' }}>
              Login
            </Link>
            <Link href="/register" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="hero-section">
          <div className="hero-content">
            <h1>Secure Transactions, Simplified.</h1>
            <p>
              Protect your payments with our secure escrow service. We hold the funds until both parties are satisfied.
            </p>

            <div className="hero-buttons">
              <Link href="/register" className="btn btn-primary">
                Get Started
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link href="/login" className="btn btn-outline">
                Login
              </Link>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h3>Secure Payments</h3>
                  <p>Funds are held safely until the transaction is completed.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div className="feature-text">
                  <h3>Passkey Auth</h3>
                  <p>Login securely without passwords using WebAuthn.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="feature-text">
                  <h3>Low Fees</h3>
                  <p>Only 2.5% platform fee per transaction.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-image-container">
            {/* Using a placeholder image from Unsplash that matches the "handshake" theme */}
            <img
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              alt="Secure Transaction"
              className="hero-image"
            />
          </div>
        </main>
      </div>
    </>
  );
}
