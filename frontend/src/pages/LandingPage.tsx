/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

declare global {
    interface Window {
        AOS: any;
    }
}

const HeroForm: React.FC = () => {
    const [heroData, setHeroData] = React.useState({ name: '', phone: '', email: '' });
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!heroData.name.trim()) {
            alert('Please enter your name');
            return;
        }
        if (heroData.phone.length !== 10) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            const { webService } = await import('../services/webService');
            await webService.submitLead({
                name: heroData.name,
                email: heroData.email || '', // Backend will use fallback if empty
                phone: heroData.phone,
                message: 'Requested demo via Hero section'
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error(error);
            alert('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="alert alert-success rounded-pill px-4 py-3 shadow-sm d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2"></i>
                <span>Thank you! We will call you soon.</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="d-flex flex-column gap-2" style={{ maxWidth: 600 }}>
                <div className="input-group input-group-custom shadow-sm">
                    <span className="input-group-text border-0 bg-transparent"><i className="bi bi-person-fill text-primary"></i></span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Your Name *"
                        value={heroData.name}
                        onChange={(e) => setHeroData({ ...heroData, name: e.target.value })}
                        required
                    />
                </div>
                <div className="input-group input-group-custom shadow-sm">
                    <span className="input-group-text border-0 bg-transparent fw-bold">+91</span>
                    <input
                        type="tel"
                        className="form-control"
                        placeholder="Mobile Number *"
                        value={heroData.phone}
                        onChange={(e) => setHeroData({ ...heroData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        required
                    />
                </div>
                <div className="input-group input-group-custom shadow-sm">
                    <span className="input-group-text border-0 bg-transparent"><i className="bi bi-envelope-fill text-primary"></i></span>
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Email (Optional)"
                        value={heroData.email}
                        onChange={(e) => setHeroData({ ...heroData, email: e.target.value })}
                    />
                </div>
                <button type="submit" className="btn btn-custom rounded-pill py-3 fw-bold w-100" disabled={loading}>
                    {loading ? 'Processing...' : 'Get Free Demo'} <i className="fa fa-arrow-right ms-1"></i>
                </button>
            </div>
        </form>
    );
};

const ContactForm: React.FC = () => {
    const [formData, setFormData] = React.useState({ name: '', phone: '', email: '', time: 'Any Time (11 AM To 6 PM)' });
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.phone.length !== 10) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            const { webService } = await import('../services/webService');
            await webService.submitDemoRequest({
                name: formData.name,
                email: formData.email || '', // Backend will use fallback if empty
                phone: formData.phone,
                companyName: `Pref Time: ${formData.time}`
            });
            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center p-4">
                <div className="display-1 text-success mb-3"><i className="bi bi-check-circle"></i></div>
                <h4 className="fw-bold">Request Received!</h4>
                <p className="text-muted">Our team will contact you shortly to schedule your live demo.</p>
                <button className="btn btn-primary rounded-pill px-4 mt-2" onClick={() => setSuccess(false)}>Send Another</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                className="form-control mb-3 py-3 rounded-pill"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
            />
            <input
                type="tel"
                className="form-control mb-3 py-3 rounded-pill"
                placeholder="Mobile Number *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                required
            />
            <input
                type="email"
                className="form-control mb-3 py-3 rounded-pill"
                placeholder="Email (Optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <select
                className="form-select mb-4 py-3 rounded-pill"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                aria-label="Select preferred time for demo"
            >

                <option value="Any Time (11 AM To 6 PM)">Any Time (11 AM To 6 PM)</option>
                <option value="Morning (10 AM To 1 PM)">Morning (10 AM To 1 PM)</option>
                <option value="Evening (4 PM To 7 PM)">Evening (4 PM To 7 PM)</option>
            </select>
            <button type="submit" disabled={loading} className="btn btn-primary btn-otp py-3 rounded-pill w-100 fw-bold">
                {loading ? 'SUBMITTING...' : 'SUBMIT DETAILS'}
            </button>
        </form>
    );
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    useEffect(() => {
        if (!isLoading && user) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);

    useEffect(() => {
        // Initialize AOS with Performance Settings
        if (window.AOS) {
            window.AOS.init({ 
                duration: 600, 
                once: true,
                offset: 50,
                debounceDelay: 50,
                throttleDelay: 99,
                disable: 'mobile' // Solve TBT issues on mobile
            });
        }

        // Hide preloader logic removed for performance


        // Initialize counters with requestAnimationFrame (prevents main thread blocking)
        const counters = document.querySelectorAll('.count');
        const speed = 200;

        const startCounter = (counter: any) => {
            const target = +counter.innerText;
            const inc = target / speed;
            let current = 0;

            const updateCount = () => {
                if (current < target) {
                    current = Math.ceil(current + inc);
                    counter.innerText = current > target ? target : current;
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {

                if (entry.isIntersecting) {
                    startCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 1 });

        counters.forEach(counter => observer.observe(counter));

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleAccessApp = () => {
        navigate('/login');
    };

    const handleBuyNow = () => {
        navigate('/payment');
    };

    return (
        <div id="landing-page-content" style={{ fontFamily: "'Geist', sans-serif" }}>
            {/* PRE-LOADER REMOVED FOR 90+ PERFORMANCE SCORE */}



            {/* NAVBAR */}
            <nav className="navbar navbar-expand-lg bg-white sticky-top py-1 border-bottom border-light">
                <div className="container">
                    <a className="navbar-brand d-flex align-items-center" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} aria-label="BillSoft Home">
                        <img src="/Bill (1).svg" alt="BillSoft Logo" className="logo-img" style={{ marginRight: '8px' }} />
                        <span className="logo-text">Bill<span style={{ color: '#3157a2' }}>Soft</span></span>
                    </a>
                    
                    <div className="d-flex align-items-center ms-auto gap-2">
                        {/* Try Now Button - Shrunk for Mobile screen */}
                        <button 
                            onClick={handleAccessApp}
                            className="btn btn-try-now d-lg-none d-md-block px-3 py-2 fw-bold"
                            style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                            Try Now
                        </button>

                        {/* Hamburger Button - FORCED VISIBLE */}
                        <button
                            className="btn d-lg-none p-0 border-0 d-flex align-items-center justify-content-center"
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            style={{ 
                                background: '#3157a2', 
                                color: 'white',
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                minWidth: '40px',
                                zIndex: 1100
                            }}
                        >
                            <i className="bi bi-list fs-3"></i>
                        </button>
                    </div>

                    <style>{`
                        @media (max-width: 576px) {
                            .logo-img { height: 40px !important; }
                            .logo-text { font-size: 1.2rem !important; font-weight: 800 !important; }
                        }
                        @media (min-width: 577px) {
                            .logo-img { height: 60px; }
                            .logo-text { font-size: 1.6rem; font-weight: 800; }
                        }
                    `}</style>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto align-items-center" style={{ gap: '4px' }}>
                            <li className="nav-item"><a className="nav-link fw-800 nav-item-bold" href="#about">About</a></li>
                            <li className="nav-item"><a className="nav-link fw-800 nav-item-bold" href="#customization">Features</a></li>
                            <li className="nav-item"><a className="nav-link fw-800 nav-item-bold" href="#pricing">Pricing</a></li>

                            <li className="nav-item ms-lg-3">
                                <a href="/support" onClick={(e) => { e.preventDefault(); navigate('/support'); }} className="nav-link fw-800 nav-item-bold nav-link-support">
                                    <i className="bi bi-headset me-2"></i>Support
                                </a>
                            </li>
                            <li className="nav-item ms-lg-1">
                                <button onClick={handleAccessApp} className="btn-signin-nav fw-bold">Sign In</button>
                            </li>
                            <li className="nav-item ms-lg-4">
                                <button
                                    onClick={handleAccessApp}
                                    className="btn btn-try-now shadow-sm fw-bold"
                                >
                                    Try Now
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main id="main-content">
                {/* HERO SECTION — Premium Colorful Redesign */}

            <section id="hero" className="hero-section text-center position-relative overflow-hidden" style={{
                backgroundImage: "url('/hero_pos.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                minHeight: '88vh',
                display: 'flex',
                alignItems: 'center',
            }}>
                {/* Vivid Blue-Purple-Cyan Overlay — makes the background pop */}
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                    background: 'linear-gradient(135deg, rgba(17,24,39,0.82) 0%, rgba(49,87,162,0.75) 40%, rgba(0,180,200,0.45) 100%)',
                }}></div>

                {/* Brighter Aura Blobs */}
                <div className="hero-aura-container">
                    <div className="aura-blob blob-blue" style={{ opacity: 0.25 }}></div>
                    <div className="aura-blob blob-gold" style={{ opacity: 0.12 }}></div>
                </div>

                <div className="container position-relative" style={{ zIndex: 2 }}>
                    <div className="mx-auto" style={{ maxWidth: '900px' }}>

                        {/* Pill badge */}
                        <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mb-4" data-aos="fade-down"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1.5px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00dfd8', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                            INDIA'S #1 BILLING PLATFORM
                        </div>

                        {/* Main Headline — multi-color gradient on key words */}
                        <h1 className="hero-title mb-4 px-2" style={{

                            fontSize: '3.8rem',
                            lineHeight: '1.15',
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            textTransform: 'none',
                            color: '#ffffff'
                        }}>
                            The most{' '}
                            <span style={{
                                background: 'linear-gradient(90deg, #00dfd8 0%, #3bbbff 50%, #a78bfa 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>trusted billing software</span>
                            <br className="d-none d-md-block" />
                            <span style={{
                                background: 'linear-gradient(90deg, #ffd700 0%, #ff9d00 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>for all your business needs</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="mb-5 px-3" data-aos="fade-up" data-aos-delay="100" style={{
                            fontSize: '1.2rem',
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 400,
                            lineHeight: 1.7,
                            maxWidth: '650px',
                            margin: '0 auto'
                        }}>
                            Experience the future of billing with BillSoft. Simplify your business, go GST-ready, and grow faster with our powerful billing ecosystem.
                        </p>

                        {/* CTA Buttons */}
                        <div className="d-flex justify-content-center gap-3 flex-wrap" data-aos="zoom-in" data-aos-delay="200">
                            <button className="btn btn-lg fw-bold rounded-pill px-5 py-3" onClick={handleAccessApp}
                                style={{ background: 'linear-gradient(135deg, #3157a2 0%, #00dfd8 100%)', color: '#fff', border: 'none', boxShadow: '0 8px 30px rgba(49,87,162,0.5)', fontSize: '1rem' }}>
                                Get Started Free <i className="bi bi-arrow-right ms-2 fs-5"></i>
                            </button>
                            <a href="#pricing"
                                className="btn btn-lg fw-bold rounded-pill px-5 py-3"
                                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)', fontSize: '1rem' }}>
                                View Pricing
                            </a>
                        </div>

                        {/* Trust Badges */}
                        <div className="d-flex justify-content-center flex-wrap gap-3 mt-5" data-aos="fade-up" data-aos-delay="300">
                            {[
                                { icon: 'bi-shield-check', label: 'GST Ready' },
                                { icon: 'bi-people-fill', label: '1000+ Businesses' },
                                { icon: 'bi-lightning-charge-fill', label: 'Smart Billing' },
                                { icon: 'bi-lock-fill', label: '256-bit Secure' },
                            ].map((b, i) => (
                                <div key={i} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '100px', padding: '8px 18px', color: '#fff',
                                    fontSize: '0.85rem', fontWeight: 600, backdropFilter: 'blur(6px)'
                                }}>
                                    <i className={`bi ${b.icon}`} style={{ color: '#00dfd8' }}></i>
                                    {b.label}
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 text-center">
                            <img
                                src="/hero_rupee.png"
                                className="img-fluid rounded-4 shadow-2xl"
                                alt="BillSoft POS Dashboard Preview"
                                fetchPriority="high"
                                style={{ maxWidth: 'min(900px, 100%)', height: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                        </div>

                    </div>
                </div>
            </section>




            {/* Metrics */}
            <section className="bg-white">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="section-title-center">Numbers That Define Our Success</h2>
                        <p className="text-muted text-uppercase">Trusted by businesses across industries.</p>
                    </div>
                    <div className="row g-4 mt-5">
                        <div className="col-md-3 col-6 text-center" data-aos="fade-up">
                            <div className="p-3">
                                <h2 className="fw-900 text-primary mb-1">~<span className="count">5</span> Lacs+</h2>
                                <p className="text-muted text-uppercase fw-bold small">Saving from <br /> billing errors</p>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 text-center" data-aos="fade-up" data-aos-delay="100">
                            <div className="p-3">
                                <h2 className="fw-900 text-primary mb-1"><span className="count">3</span>x Reduction</h2>
                                <p className="text-muted text-uppercase fw-bold small">in overdue <br /> payment delays</p>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 text-center" data-aos="fade-up" data-aos-delay="200">
                            <div className="p-3">
                                <h2 className="fw-900 text-primary mb-1"><span className="count">65</span>% Faster</h2>
                                <p className="text-muted text-uppercase fw-bold small">Order to invoice <br /> processing</p>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 text-center" data-aos="fade-up" data-aos-delay="300">
                            <div className="p-3">
                                <h2 className="fw-900 text-primary mb-1"><span className="count">98</span>% Accurate</h2>
                                <p className="text-muted text-uppercase fw-bold small">GST & E-Way <br /> Compliance</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Master Intelligence Dashboard - NEW PREMIUM SECTION */}
            <section className="dashboard-spotlight-section">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-5 order-2 order-lg-1">
                            <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill mb-4" style={{ background: 'rgba(49, 87, 162, 0.1)', color: '#3157a2', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px' }}>
                                <i className="bi bi-stars me-2"></i> PRODUCT SHOWCASE
                            </div>
                            <h2 className="display-4 fw-900 text-dark mb-4">Command Your <br /><span className="text-primary">Enterprise Intelligence</span></h2>
                            <p className="lead text-muted mb-5" style={{ fontSize: '1.15rem' }}>
                                Experience the sheer power of BillSoft's unified dashboard. Real-time data visualization that turns complex retail operations into simple, actionable growth steps.
                            </p>

                            <div className="d-flex flex-column gap-3 mb-5">
                                <div className="feature-pill">
                                    <div className="pill-icon"><i className="bi bi-lightning-charge"></i></div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">Hyper-Speed Billing</h6>
                                        <p className="small text-muted mb-0">Complete sales in under 3 seconds with smart POS.</p>
                                    </div>
                                </div>
                                <div className="feature-pill">
                                    <div className="pill-icon" style={{ background: '#00dfd8' }}><i className="bi bi-shield-check"></i></div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">Encrypted Data Vault</h6>
                                        <p className="small text-muted mb-0">Your business intelligence is secured with 256-bit AES protection.</p>
                                    </div>
                                </div>
                                <div className="feature-pill">
                                    <div className="pill-icon" style={{ background: '#1e3a8a' }}><i className="bi bi-cpu"></i></div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">Auto-Sync Core</h6>
                                        <p className="small text-muted mb-0">Multi-outlet stock sync happens in background seamlessly.</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleAccessApp} className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-xl py-3 mt-2">Access Portal Now</button>
                        </div>

                        <div className="col-lg-7 order-1 order-lg-2 mb-5 mb-lg-0">
                            <div className="dashboard-container shadow-2xl">
                                <img src="/Untitled design (1).svg" className="img-fluid dashboard-main-img" alt="BillSoft Intelligence Hub" width="1200" height="850" fetchPriority="high" />



                                <div className="floating-badge badge-top">

                                    <i className="bi bi-check-lg text-info"></i>
                                    System Online
                                </div>

                                <div className="floating-badge badge-bottom" style={{ background: '#ffffff', color: '#0f172a' }}>
                                    <i className="bi bi-graph-up text-primary"></i>
                                    +32% Efficiency Boost
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Why BillSoft Section */}
            <section id="about" className="why-section" style={{ scrollMarginTop: '100px' }}>
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-7">
                            <h2 className="display-5 fw-bold mb-3 text-white">Why do businesses need billing software?</h2>
                            <p className="lead mb-5 opacity-75">Minimise human errors in billing and tax calculations with our advanced automation.</p>

                            <ul className="why-list list-unstyled p-0">
                                <li className="list-item d-flex align-items-center mb-3">
                                    <i className="bi bi-check-circle-fill text-info me-3"></i>
                                    <span>Generates professional invoices quickly, reducing manual work</span>
                                </li>
                                <li className="list-item d-flex align-items-center mb-3">
                                    <i className="bi bi-check-circle-fill text-info me-3"></i>
                                    <span>Ensures adherence to taxation rules with automated GST/VAT features</span>
                                </li>
                                <li className="list-item d-flex align-items-center mb-3">
                                    <i className="bi bi-check-circle-fill text-info me-3"></i>
                                    <span>Keeps records of paid, pending, and overdue invoices</span>
                                </li>
                                <li className="list-item d-flex align-items-center mb-3">
                                    <i className="bi bi-check-circle-fill text-info me-3"></i>
                                    <span>Cuts down paperwork and repetitive manual tasks</span>
                                </li>
                                <li className="list-item d-flex align-items-center mb-3">
                                    <i className="bi bi-check-circle-fill text-info me-3"></i>
                                    <span>Provides clear, error-free bills, building trust</span>
                                </li>
                                <li className="list-item d-flex align-items-center mb-3">
                                    <i className="bi bi-check-circle-fill text-info me-3"></i>
                                    <span>Connects billing with stock updates for real-time management</span>
                                </li>
                            </ul>

                        </div>
                        <div className="col-lg-5">
                            <div className="position-relative">
                                <img src="/image copy 25.png" className="img-fluid rounded-4 shadow-lg border border-light border-opacity-25" alt="Dashboard Preview" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Branded Invoices Section */}
            <section className="premium-dark-section py-5">
                <div className="container text-center">

                    <h2 className="section-title-center text-white">Your bill, Your Brand</h2>
                    <p className="text-muted opacity-75 text-uppercase mb-5">Professional, fully customized invoices in multiple formats.</p>


                    <ul className="nav nav-tabs justify-content-center mb-5" id="printTabs" role="tablist">
                        <li className="nav-item" role="presentation"><button className="nav-link active" id="a5-tab" data-bs-toggle="tab" data-bs-target="#a5" type="button" role="tab" aria-controls="a5" aria-selected="true">A5 Prints</button></li>
                        <li className="nav-item" role="presentation"><button className="nav-link" id="thermal-tab" data-bs-toggle="tab" data-bs-target="#thermal" type="button" role="tab" aria-controls="thermal" aria-selected="false">Thermal Prints</button></li>
                        <li className="nav-item" role="presentation"><button className="nav-link" id="a4-tab" data-bs-toggle="tab" data-bs-target="#a4" type="button" role="tab" aria-controls="a4" aria-selected="false">A4 Prints</button></li>
                    </ul>

                    <div className="tab-content">
                        <div className="tab-pane fade show active" id="a5">
                            <img src="/image copy 40.png" className="img-fluid rounded shadow-sm" style={{ maxWidth: 'min(600px, 100%)', margin: '0 auto', display: 'block' }} alt="A5 Print Preview" loading="lazy" width="600" height="800" />
                        </div>
                        <div className="tab-pane fade" id="thermal">
                            <img src="/image copy 38.png" className="img-fluid rounded shadow-sm" style={{ maxWidth: 'min(400px, 100%)', margin: '0 auto', display: 'block' }} alt="Thermal Print Preview" loading="lazy" width="400" height="800" />
                        </div>
                        <div className="tab-pane fade" id="a4">
                            <img src="/image copy 39.png" className="img-fluid rounded shadow-sm" style={{ maxWidth: 'min(800px, 100%)', margin: '0 auto', display: 'block' }} alt="A4 Print Preview" loading="lazy" width="800" height="1100" />
                        </div>
                    </div>

                </div>
            </section>

            {/* Multi-outlet management section */}
            <section id="multi-outlet" className="premium-dark-section py-5">


                <div className="container">
                    <div className="multi-outlet-header text-center">
                        <h2 className="multi-outlet-title">Multi-outlet retail management: <br /> Expand with ease, manage with confidence</h2>
                    </div>

                    <div className="row align-items-center g-5">
                        <div className="col-lg-7">
                            <div className="floating-illus-container p-4">
                                <img src="/multi_outlet.png" className="img-fluid rounded-4" alt="Multi-outlet Management" data-aos="zoom-in" loading="lazy" width="800" height="500" />

                                {/* Overlay Cards for "Interactive" feel */}
                                <div className="f-card d-none d-md-block" style={{ top: '10%', left: '-5%', width: '220px', zIndex: 10 }} data-aos="fade-right" data-aos-delay="200">
                                    <h4 className="fw-bold small mb-2 text-muted">Day wise margin</h4>
                                    <div className="text-center">
                                        <i className="bi bi-graph-up-arrow text-primary fs-3"></i>
                                        <p className="small mt-1 mb-0">+14% vs last week</p>
                                    </div>
                                </div>

                                <div className="f-card d-none d-md-block" style={{ bottom: '15%', right: '-2%', width: '240px', zIndex: 10 }} data-aos="fade-left" data-aos-delay="400">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-light p-2 rounded-3">
                                            <i className="bi bi-box-seam text-warning fs-4"></i>
                                        </div>
                                        <div>
                                            <h4 className="fw-bold small mb-0">Stock Summary</h4>
                                            <p className="small text-muted mb-0">110 Total Quantity</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5" data-aos="fade-left">
                            <p className="lead text-white opacity-75 mb-5" style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                                Keep your stores running smoothly with a centralized retail POS system. Set uniform outlet-wise pricing, track stock movement, and oversee sales and purchases across all locations in real time, all from a single web portal. Grow your business into a brand instead of managing each store as a branch.
                            </p>
                            <div className="d-flex align-items-center">
                                <button className="btn btn-red-trial shadow-sm px-4 py-3 fw-bold" onClick={handleAccessApp} aria-label="Get Started with BillSoft">
                                    Get Started
                                </button>
                                <a href="#customization" className="learn-more-link text-white ms-3" onClick={(e) => { e.preventDefault(); document.getElementById('customization')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                    Learn more <i className="bi bi-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Hardware Integration Section */}
            <section id="hardware-integration" className="hardware-section">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-5" data-aos="fade-right">
                            <p className="hardware-text mb-4">
                                BillSoft’s retail POS software is designed to work with your existing hardware, peripherals, and third-party applications, allowing you to upgrade without costly replacements. Easily connect barcode scanners, receipt printers, weighing scales, and more to create a fully integrated retail software that enhances efficiency and business growth.
                            </p>
                            <a href="#" className="learn-more-link ms-0" onClick={(e) => e.preventDefault()}>
                                Learn more <i className="bi bi-arrow-right"></i>
                            </a>
                        </div>
                        <div className="col-lg-7" data-aos="fade-left">
                            <div className="hardware-collage">
                                <img src="/hardware_collage.png" alt="POS Hardware integration" className="img-fluid rounded-4 shadow-xl" loading="lazy" width="600" height="600" />
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <a href="#" className="btn btn-talk shadow-sm" onClick={(e) => { e.preventDefault(); handleAccessApp(); }}>
                            Talk to us today
                        </a>
                    </div>
                </div>
            </section>

            {/* Verticals Supported Section - Infinite Continuous Scroll */}
            <section id="verticals" className="verticals-section py-0 overflow-hidden" style={{ background: '#0c121e' }}>
                <div className="container-fluid px-0">
                    <div className="verticals-header container pt-5 mb-5 px-lg-5">
                        <h2 className="verticals-title" style={{ color: '#fff', fontSize: '3rem', fontWeight: 800 }}>Verticals supported by <br /> our retail management software</h2>
                    </div>

                    <div className="verticals-scroller">
                        <div className="verticals-track">
                            {[
                                { img: "/v_lifestyle.png", title: "Lifestyle & Fashion" },
                                { img: "/v_pharmacy.png", title: "Pharma & Healthcare" },
                                { img: "/v_supermarket.png", title: "Supermarket & Groceries" },
                                { img: "/v_hypermarket.png", title: "Hypermarket & Departmental" },
                                { img: "/v_electronics.png", title: "Electrical & Electronics" },
                                { img: "/v_apparel.png", title: "Apparel & Footwear" },
                                { img: "/v_multichain.png", title: "Multi-chain Operations" },
                                { img: "/v_specialized.png", title: "Specialized Retail" }
                            ].map((v, i) => (
                                <div className="vertical-v-card" key={`v1-${i}`}>
                                    <img src={v.img} alt={v.title} loading="lazy" decoding="async" width="280" height="180" />
                                    <div className="vertical-v-overlay">
                                        <h4>{v.title}</h4>
                                    </div>
                                </div>

                            ))}
                            {/* Duplicate Set for Infinite Scroll */}
                            {[
                                { img: "/v_lifestyle.png", title: "Lifestyle & Fashion" },
                                { img: "/v_pharmacy.png", title: "Pharma & Healthcare" },
                                { img: "/v_supermarket.png", title: "Supermarket & Groceries" },
                                { img: "/v_hypermarket.png", title: "Hypermarket & Departmental" },
                                { img: "/v_electronics.png", title: "Electrical & Electronics" },
                                { img: "/v_apparel.png", title: "Apparel & Footwear" },
                                { img: "/v_multichain.png", title: "Multi-chain Operations" },
                                { img: "/v_specialized.png", title: "Specialized Retail" }
                            ].map((v, i) => (
                                <div className="vertical-v-card" key={`v2-${i}`}>
                                    <img src={v.img} alt={v.title} loading="lazy" decoding="async" width="280" height="180" />
                                    <div className="vertical-v-overlay">
                                        <h4>{v.title}</h4>
                                    </div>
                                </div>

                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Industry Solutions / Workflow Tabs */}
            <section id="customization" className="bg-white" style={{ scrollMarginTop: '100px' }}>
                <div className="container text-center">
                    <h1 className="section-title-center mb-2">Key features of the billing software</h1>
                    <p className="text-muted text-uppercase mb-5">BillSoft simplifies billing and invoicing with built-in GST compliance and automation features.</p>

                    <div className="vertical-tabs-container text-start mt-5">
                        <ul className="nav vertical-nav" id="serviceTabs" role="tablist">
                            <li className="nav-item shadow-sm" role="presentation">
                                <button className="nav-link active w-100" id="invoicing-tab" data-bs-toggle="tab" data-bs-target="#invoicing" type="button" role="tab" aria-controls="invoicing" aria-selected="true">
                                    Invoicing, GST & compliance
                                </button>
                            </li>
                            <li className="nav-item shadow-sm" role="presentation">
                                <button className="nav-link w-100" id="inventory-tab" data-bs-toggle="tab" data-bs-target="#inventory" type="button" role="tab" aria-controls="inventory" aria-selected="false">
                                    Inventory- billing integration
                                </button>
                            </li>
                            <li className="nav-item shadow-sm" role="presentation">
                                <button className="nav-link w-100" id="pricing-tab-btn" data-bs-toggle="tab" data-bs-target="#pricing-tab" type="button" role="tab" aria-controls="pricing-tab" aria-selected="false">
                                    Pricing & plans
                                </button>
                            </li>
                        </ul>

                        <div className="tab-content service-content shadow-lg border">
                            <div className="tab-pane fade show active" id="invoicing">
                                <div className="row align-items-center">
                                    <div className="col-lg-7">
                                        <div className="service-list">
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Automates the creation of professional, accurate invoices, saving a lot of time</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Automatically applies correct GST rates, splits CGST/SGST/IGST for invoices</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Prepares detailed GST reports (GSTR-1, GSTR-3B, etc.) for easy filing and auditing</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Minimises manual tax calculation mistakes, ensuring accuracy in every bill</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Helps businesses stay updated with changing tax laws and remain legally compliant</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-5 text-center mt-4 mt-lg-0">
                                        <img src="/image copy 10.png" className="img-fluid rounded" alt="Software Preview" loading="lazy" decoding="async" width="500" height="350" />
                                    </div>

                                </div>
                            </div>
                            <div className="tab-pane fade" id="inventory">
                                <div className="row align-items-center">
                                    <div className="col-lg-7">
                                        <div className="service-list">
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Every sale or purchase instantly updates stock levels, avoiding mismatches</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Auto-fetches product details, prices, and taxes from inventory during billing</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Ensures bills reflect current stock costs, discounts, and offers correctly</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Provides combined sales and stock reports for smarter business decisions</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Eliminates duplicate data entry in inventory and billing</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-5 text-center mt-4 mt-lg-0">
                                        <img src="/image copy 25.png" className="img-fluid rounded" alt="Software Preview" loading="lazy" decoding="async" width="500" height="350" />
                                    </div>

                                </div>
                            </div>
                            <div className="tab-pane fade" id="pricing-tab">
                                <div className="row align-items-center">
                                    <div className="col-lg-7">
                                        <div className="service-list">
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Businesses can choose a plan based on size and requirements</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Upgrade plans as the business grows without switching software</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Entry-level pricing makes software adoption easy, even for small businesses</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Some plans allow add-ons (extra users, modules) for tailored needs</span>
                                            </div>
                                            <div className="list-item">
                                                <i className="bi bi-patch-check-fill"></i>
                                                <span>Higher plans unlock advanced tools like multi-branch billing, analytics, or integrations</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-5 text-center mt-4 mt-lg-0">
                                        <img src="/image copy 4.png" className="img-fluid rounded" alt="Software Preview" loading="lazy" decoding="async" width="500" height="350" />
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* New Tiered Pricing Section */}
            <section id="pricing" className="py-5" style={{ background: 'linear-gradient(180deg, #f0f4ff 0%, #f8fafc 100%)', scrollMarginTop: '100px', borderTop: '1px solid #e8edf5' }}>
                <div className="container">
                    <div className="text-center mb-5">
                        <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(49,87,162,0.08)', color: '#3157a2', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '2px' }}>
                            <i className="bi bi-tag-fill me-2"></i> BILLING PLANS
                        </div>
                        <h2 className="section-title-center mb-3">Simple &amp; Transparent Pricing</h2>
                        <p className="text-muted">Choose the plan that fits your business stage.</p>
                    </div>

                    <div className="row g-4 justify-content-center pricing-row">
                        {/* Free Plan */}
                        <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12">
                            <div className="p-card-v2 border-light-subtle">
                                <div className="p-card-header">
                                    <h3 style={{ color: '#64748b', fontSize: '1.25rem' }}>Free Plan</h3>
                                    <div className="p-price" style={{ fontSize: '2.2rem', color: '#334155' }}>₹0</div>
                                    <p className="text-muted x-small">Lead Engine Plan</p>
                                </div>
                                <div className="p-card-features">
                                    <ul className="mb-0">
                                        <li><i className="bi bi-check2 opacity-75"></i> 50 invoices/mo</li>
                                        <li><i className="bi bi-check2 opacity-75"></i> Basic billing</li>
                                        <li><i className="bi bi-check2 opacity-75"></i> Limited inventory</li>
                                        <li><i className="bi bi-check2 opacity-75"></i> 1 user</li>
                                    </ul>
                                </div>
                                <div className="p-card-footer">
                                    <button onClick={handleAccessApp} className="btn btn-outline-secondary btn-sm w-100 rounded-pill fw-bold">Get Started</button>
                                </div>
                            </div>
                        </div>

                        {/* Starter Plan */}
                        <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12">
                            <div className="p-card-v2">
                                <div className="p-card-header">
                                    <h3 style={{ color: '#3157a2', fontSize: '1.25rem' }}>Starter</h3>
                                    <div className="p-price" style={{ fontSize: '2.2rem', color: '#0f172a' }}>₹399</div>
                                    <p className="text-muted x-small">Global: $10/mo</p>
                                </div>
                                <div className="p-card-features">
                                    <ul className="mb-0">
                                        <li><i className="bi bi-check2 text-primary"></i> 500 invoices</li>
                                        <li><i className="bi bi-check2 text-primary"></i> Basic reports</li>
                                        <li><i className="bi bi-check2 text-primary"></i> 3 users</li>
                                        <li><i className="bi bi-check2 text-primary"></i> Email support</li>
                                    </ul>
                                </div>
                                <div className="p-card-footer">
                                    <button onClick={handleBuyNow} className="btn btn-outline-primary w-100 rounded-pill fw-bold">Buy Now</button>
                                </div>
                            </div>
                        </div>

                        {/* Growth Plan - Featured */}
                        <div className="col-lg-3 col-md-6 col-12">
                            <div className="p-card-v2 featured shadow-lg" style={{ minHeight: '100%' }}>
                                <div className="badge-featured">MOST POPULAR</div>
                                <div className="p-card-header">
                                    <h3 style={{ color: '#3157a2' }}>Growth</h3>
                                    <div className="p-price" style={{ color: '#0f172a' }}>₹999<span className="fs-6 opacity-50">/mo</span></div>
                                    <p className="text-muted small">Global: $29/mo</p>
                                </div>
                                <div className="p-card-features">
                                    <ul className="mb-0">
                                        <li><i className="bi bi-check2-circle-fill text-primary"></i> Unlimited invoices</li>
                                        <li><i className="bi bi-check2-circle-fill text-primary"></i> Inventory management</li>
                                        <li><i className="bi bi-check2-circle-fill text-primary"></i> Customer tracking</li>
                                        <li><i className="bi bi-check2-circle-fill text-primary"></i> Desktop + Mobile</li>
                                        <li><i className="bi bi-check2-circle-fill text-primary text-bold"></i> GST Ready (Advantage)</li>
                                        <li><i className="bi bi-check2-circle-fill text-primary"></i> Basic analytics</li>
                                    </ul>
                                </div>
                                <div className="p-card-footer">
                                    <button onClick={handleBuyNow} className="btn btn-primary w-100 rounded-pill fw-bold">Buy Now</button>
                                </div>
                            </div>
                        </div>

                        {/* Pro Plan */}
                        <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12">
                            <div className="p-card-v2" style={{ borderColor: '#1e3a8a30' }}>
                                <div className="p-card-header">
                                    <h3 style={{ color: '#1e3a8a', fontSize: '1.25rem' }}>Pro</h3>
                                    <div className="p-price" style={{ fontSize: '2.2rem', color: '#0f172a' }}>₹2,499</div>
                                    <p className="text-muted x-small">Global: $79/mo</p>
                                </div>
                                <div className="p-card-features">
                                    <ul className="mb-0">
                                        <li><i className="bi bi-check2" style={{ color: '#1e3a8a' }}></i> Advanced analytics</li>
                                        <li><i className="bi bi-check2" style={{ color: '#1e3a8a' }}></i> Multi-user roles</li>
                                        <li><i className="bi bi-check2" style={{ color: '#1e3a8a' }}></i> Audit logs</li>
                                        <li><i className="bi bi-check2" style={{ color: '#1e3a8a' }}></i> Automation</li>
                                        <li><i className="bi bi-check2" style={{ color: '#1e3a8a' }}></i> API access</li>
                                    </ul>
                                </div>
                                <div className="p-card-footer">
                                    <button onClick={handleBuyNow} className="btn btn-outline-primary w-100 rounded-pill fw-bold" style={{ borderColor: '#1e3a8a', color: '#1e3a8a' }}>Buy Now</button>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12">
                            <div className="p-card-v2" style={{ borderColor: '#0f172a20' }}>
                                <div className="p-card-header">
                                    <h3 style={{ color: '#0f172a', fontSize: '1.25rem' }}>Enterprise</h3>
                                    <div className="p-price" style={{ fontSize: '2.2rem', color: '#0f172a' }}>Custom</div>
                                    <p className="text-muted x-small">Scale as you go</p>
                                </div>
                                <div className="p-card-features">
                                    <ul className="mb-0">
                                        <li><i className="bi bi-check2" style={{ color: '#0f172a' }}></i> Dedicated infra</li>
                                        <li><i className="bi bi-check2" style={{ color: '#0f172a' }}></i> SLA + Priority</li>
                                        <li><i className="bi bi-check2" style={{ color: '#0f172a' }}></i> Custom features</li>
                                        <li><i className="bi bi-check2" style={{ color: '#0f172a' }}></i> Training</li>
                                    </ul>
                                </div>
                                <div className="p-card-footer">
                                    <a href="mailto:support@agbtechnologies.com" className="btn btn-outline-dark btn-sm w-100 rounded-pill fw-bold">Contact Sales</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Improved Early Supporter Plan Luxury Section */}
                    <div className="mt-5 pt-5 row justify-content-center">
                        <div className="col-lg-10">
                            <div className="early-supporter-luxury-card shadow-2xl">
                                <div className="row g-0 align-items-center">
                                    <div className="col-lg-5 p-4 p-md-5 text-lg-start text-center">
                                        <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(0, 223, 216, 0.15)', color: '#00dfd8', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px' }}>
                                            <i className="bi bi-patch-check-fill me-2"></i> LIMITED OPPORTUNITY
                                        </div>
                                        <h2 className="display-6 fw-900 text-white mb-3">Early Supporter <br /> <span style={{ color: '#00dfd8' }}>Legacy Plan</span></h2>
                                        <p className="lead text-white opacity-75 mb-0" style={{ fontSize: '1rem' }}>Exclusive lifetime benefits for our first 1,000 pioneering users. Secure your legacy price today.</p>
                                    </div>
                                    <div className="col-lg-7 p-4 p-md-5">
                                        <div className="legacy-table-container shadow-lg">
                                            <div className="legacy-row header">
                                                <div className="plan-col">PLAN</div>
                                                <div className="price-col pe-4">STANDARD</div>
                                                <div className="price-col" style={{ color: '#00dfd8' }}>LEGACY</div>
                                            </div>
                                            <div className="legacy-row">
                                                <div className="plan-col fw-bold">Starter</div>
                                                <div className="price-col pe-4 opacity-50 text-decoration-line-through small">₹399</div>
                                                <div className="price-col fw-900 fs-4" style={{ color: '#00dfd8' }}>₹199</div>
                                            </div>
                                            <div className="legacy-row">
                                                <div className="plan-col fw-bold">Growth</div>
                                                <div className="price-col pe-4 opacity-50 text-decoration-line-through small">₹999</div>
                                                <div className="price-col fw-900 fs-4" style={{ color: '#00dfd8' }}>₹699</div>
                                            </div>
                                            <div className="legacy-row mb-0 border-bottom-0">
                                                <div className="plan-col fw-bold">Pro</div>
                                                <div className="price-col pe-4 opacity-50 text-decoration-line-through small">₹2,499</div>
                                                <div className="price-col fw-900 fs-4" style={{ color: '#00dfd8' }}>₹1,749</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-top border-white border-opacity-10" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    <div className="row text-center text-md-start">
                                        <div className="col-md-6 mb-3 mb-md-0 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                                            <i className="bi bi-calendar-check fs-5" style={{ color: '#00dfd8' }}></i>
                                            <span className="text-white opacity-75 x-small fw-bold text-uppercase">Qualify after &gt; 30 active days</span>
                                        </div>
                                        <div className="col-md-6 d-flex align-items-center justify-content-center justify-content-md-end gap-2">
                                            <i className="bi bi-shield-lock fs-5" style={{ color: '#00dfd8' }}></i>
                                            <span className="text-white opacity-75 x-small fw-bold text-uppercase">Price Locked while active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Demo Form Section & CTA combined */}
            <section id="contact" className="demo-section">
                <div className="container">
                    <div className="row align-items-center g-5 mb-5">
                        <div className="col-lg-7" data-aos="fade-right">
                            <div className="position-relative">
                                <video src="/marketing.mp4" className="img-fluid rounded shadow-lg" autoPlay loop muted playsInline></video>
                            </div>
                        </div>
                        <div className="col-lg-5">
                            <div className="demo-form shadow-lg p-5 bg-white rounded-4">
                                <h3 className="text-center mb-4 fw-bold">Book Live Demo</h3>
                                <ContactForm />
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-5 mb-3">
                        <h2 className="fw-bold mb-4">Ready to simplify your billing?</h2>
                        <button onClick={handleAccessApp} className="btn btn-signup btn-lg px-5" aria-label="Open BillSoft Application">Open Application Now</button>
                    </div>

                </div>
            </section>
        </main>

            <footer className="footer bg-dark text-white py-5">
                <div className="container text-center">
                    <p className="mb-0 opacity-50">&copy; 2026 BillSoft India. Powered by AGB TECHNOLOGIES LLP</p>
                </div>
            </footer>

            {/* Premium Mobile Menu Drawer for Landing Page */}
            <div className={`landing-mobile-drawer ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="drawer-header">
                    <img src="/Bill (1).svg" alt="BillSoft Logo" style={{ height: '40px' }} />
                    <button className="close-drawer" onClick={() => setIsMobileMenuOpen(false)}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="drawer-body">
                    <a href="#hero" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
                    <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
                    <a href="#customization" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                    <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                    <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
                    <hr />
                    <a href="/support" onClick={(e) => { e.preventDefault(); navigate('/support'); setIsMobileMenuOpen(false); }}>Support Hub</a>
                    <div className="mt-auto pt-4">
                        <button className="btn btn-try-now w-100 py-3" onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}>Try BillSoft For Free</button>
                    </div>
                </div>
            </div>
            <div className={`drawer-backdrop ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

            <style>{`
                .landing-mobile-drawer {
                    position: fixed;
                    top: 0;
                    right: -100%;
                    width: 300px;
                    height: 100vh;
                    background: white;
                    z-index: 2100;
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    padding: 30px 24px;
                    box-shadow: -10px 0 30px rgba(0,0,0,0.1);
                }
                .landing-mobile-drawer.active {
                    right: 0;
                }
                .drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }
                .close-drawer {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: var(--primary);
                }
                .drawer-body {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    height: 100%;
                }
                .drawer-body a {
                    font-family: 'Space Mono', monospace;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-main);
                    text-decoration: none;
                    padding: 12px 0;
                    border-bottom: 1px solid #f1f5f9;
                    display: block;
                }
                .drawer-backdrop {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    z-index: 2050;
                    display: none;
                }
                .drawer-backdrop.active {
                    display: block;
                }
                
                @media (max-width: 991px) {
                    .navbar-collapse { display: none !important; }
                }
            `}</style>
        </div>
    );
};


export default LandingPage;

