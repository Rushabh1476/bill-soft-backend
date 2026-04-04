/* eslint-disable */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PricingDetails = [
    {
        name: "FREE",
        price: "₹0",
        period: "LIFETIME",
        description: "Ideal for startups and small shops needing professional billing without the overhead.",
        features: [
            "Unlimited Sales Invoices",
            "GST & Non-GST Billing",
            "Professional A4/A5 Templates",
            "Basic Inventory Tracking",
            "Customer Management",
            "Email Support",
            "Basic Reports"
        ],
        buttonText: "GET STARTED FREE",
        popular: false,
        color: "#64748b",
        icon: "bi bi-rocket-takeoff"
    },
    {
        name: "STANDARD",
        price: "₹2,499",
        period: "ANNUAL",
        description: "Everything you need to grow your business with automation and WhatsApp.",
        features: [
            "Everything in FREE",
            "Instant WhatsApp Invoicing",
            "Advanced Inventory Management",
            "Low Stock Alerts & Reorders",
            "Supplier & Purchase Tracking",
            "Expense Management",
            "Priority WhatsApp Support"
        ],
        buttonText: "CHOOSE STANDARD",
        popular: true,
        gradient: "linear-gradient(135deg, #3157a2 0%, #1a3673 100%)",
        color: "#3157a2",
        icon: "bi bi-lightning-fill"
    },
    {
        name: "ENTERPRISE",
        price: "₹4,999",
        period: "ANNUAL",
        description: "Scale your operations with compliance tools and advanced multi-user support.",
        features: [
            "Everything in STANDARD",
            "E-Way Bill (1-Click Generation)",
            "E-Invoice API Integration",
            "Multi-User (Up to 5 Users)",
            "Barcode Scanning & Labels",
            "Advanced BI Reports",
            "Dedicated Account Manager"
        ],
        buttonText: "GO ENTERPRISE",
        popular: false,
        color: "#1e293b",
        icon: "bi bi-shield-check"
    }
];

const Pricing: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        // Initialize AOS
        if (window.AOS) {
            window.AOS.init({ duration: 800, once: true });
        }

        // Hide preloader
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    }, []);

    const handleAccessApp = () => {
        navigate('/login');
    };

    return (
        <div id="pricing-page-content" style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", background: '#f8fafc' }}>
            {/* PRE-LOADER */}
            <div className="preloader" id="preloader" style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: '#fff', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'opacity 0.5s ease'
            }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>

            {/* NAVBAR (Reused from Landing) */}
            <nav className="navbar navbar-expand-lg bg-white sticky-top shadow-sm">
                <div className="container">
                    <a className="navbar-brand d-flex align-items-center" href="/">
                        <img src="/logo.png" alt="BillSoft Logo" style={{ height: '45px', marginRight: '10px' }} />
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000' }}>Bill<span style={{ color: '#3157a2' }}>Soft</span></span>
                    </a>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto">
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="/#features">Features</a></li>
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link active" href="/pricing">Pricing</a></li>
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="/#faq">FAQ</a></li>
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="/#contact">Contact</a></li>
                        </ul>
                        <button onClick={handleAccessApp} className="btn btn-signup ml-2">App Access &rarr;</button>
                    </div>
                </div>
            </nav>

            {/* Header Section */}
            <section className="py-5 bg-white border-bottom">
                <div className="container text-center pt-5">
                    <h1 className="display-3 fw-900 mb-3" style={{ background: 'linear-gradient(to right, #1e293b, #3157a2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} data-aos="fade-down">
                        READY TO GROW YOUR BUSINESS?
                    </h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }} data-aos="fade-up" data-aos-delay="100">
                        Join 2,000+ Indian businesses using BillSoft to simplify their GST compliance, inventory and invoicing.
                        Choose a plan that scales with you.
                    </p>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-5 mt-n5">
                <div className="container">
                    <div className="row g-4 align-items-stretch justify-content-center">
                        {PricingDetails.map((plan, i) => (
                            <div key={i} className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={i * 100}>
                                <div className={`card h-100 border-0 shadow-lg ${plan.popular ? 'popular-scale' : ''}`} style={{ 
                                    borderRadius: '32px', 
                                    transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    zIndex: plan.popular ? 2 : 1,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    borderTop: `6px solid ${plan.color}`
                                }}>
                                    {plan.popular && (
                                        <div style={{
                                            position: 'absolute', top: '24px', right: '-38px', background: '#f59e0b',
                                            color: '#fff', fontSize: '11px', fontWeight: '900', padding: '6px 45px',
                                            transform: 'rotate(45deg)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                        }}>
                                            MOST POPULAR
                                        </div>
                                    )}
                                    
                                    <div className="card-body p-5 d-flex flex-column">
                                        <div className="mb-4">
                                            <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{
                                                width: '56px', height: '56px', borderRadius: '16px', 
                                                background: plan.popular ? 'rgba(49, 87, 162, 0.1)' : '#f1f5f9',
                                                color: plan.color, fontSize: '24px'
                                            }}>
                                                <i className={plan.icon}></i>
                                            </div>
                                            <h4 className="fw-900 mb-2" style={{ color: plan.popular ? '#3157a2' : '#1e293b' }}>{plan.name}</h4>
                                            <div className="d-flex align-items-baseline gap-1">
                                                <h1 className="fw-900 mb-0" style={{ fontSize: '3rem' }}>{plan.price}</h1>
                                                <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '12px' }}>/ {plan.period}</span>
                                            </div>
                                        </div>

                                        <p className="text-muted mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{plan.description}</p>
                                        
                                        <div className="mb-5 flex-grow-1">
                                            <h6 className="text-uppercase fw-bold small mb-4" style={{ letterSpacing: '1px' }}>What's Included:</h6>
                                            {plan.features.map((feature, fidx) => (
                                                <div key={fidx} className="d-flex align-items-center mb-3">
                                                    <i className="bi bi-patch-check-fill me-3" style={{ color: plan.popular ? '#3157a2' : '#cbd5e1' }}></i>
                                                    <span className="fw-500 text-secondary" style={{ fontSize: '14px' }}>{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={handleAccessApp}
                                            className="btn btn-lg w-100 py-3 rounded-pill fw-900 transition-all shadow-sm"
                                            style={{
                                                background: plan.popular ? plan.gradient : '#fff',
                                                color: plan.popular ? '#fff' : '#1e293b',
                                                border: plan.popular ? 'none' : '2px solid #e2e8f0',
                                                fontSize: '15px'
                                            }}
                                        >
                                            {plan.buttonText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="py-5 bg-white">
                <div className="container text-center">
                    <p className="text-muted text-uppercase fw-bold small mb-5" style={{ letterSpacing: '2px' }}>100% Secure & Compliant Invoicing</p>
                    <div className="row g-4 opacity-75">
                        <div className="col-md-3 col-6"><div className="p-3 shadow-sm rounded-4 border"><i className="bi bi-shield-lock-fill me-2 text-success"></i> ISO Certified</div></div>
                        <div className="col-md-3 col-6"><div className="p-3 shadow-sm rounded-4 border"><i className="bi bi-cloud-check-fill me-2 text-primary"></i> Real-time Sync</div></div>
                        <div className="col-md-3 col-6"><div className="p-3 shadow-sm rounded-4 border"><i className="bi bi-file-earmark-diff-fill me-2 text-warning"></i> GST Compliant</div></div>
                        <div className="col-md-3 col-6"><div className="p-3 shadow-sm rounded-4 border"><i className="bi bi-headset me-2 text-danger"></i> 24/7 Support</div></div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-5">
                <div className="container">
                    <div className="bg-dark text-white p-5 rounded-5 text-center shadow-lg position-relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #0c121e 0%, #3157a2 100%)' }}>
                        <div className="position-relative z-index-2" data-aos="zoom-in">
                            <h2 className="display-5 fw-900 mb-4">Still Not Sure? Start Your 15-Day Free Trial</h2>
                            <p className="lead mb-5 opacity-75">No credit card required. Experience the full power of BillSoft today.</p>
                            <button onClick={handleAccessApp} className="btn btn-light btn-lg px-5 py-3 rounded-pill fw-900 text-primary">GET STARTED NOW &rarr;</button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footer bg-dark text-white py-5 mt-5">
                <div className="container text-center">
                    <p className="mb-0 opacity-50">&copy; 2026 BillSoft India. Powered by {window.location.hostname.includes('agbitsolutions') ? 'Agb IT Solutions' : 'Agb Technologies'}</p>
                </div>
            </footer>

            <style>{`
                .fw-900 { font-weight: 800; }
                .fw-800 { font-weight: 800; }
                .fw-700 { font-weight: 700; }
                .fw-500 { font-weight: 500; }
                .popular-scale { transform: scale(1.05); }
                @media (max-width: 991px) {
                    .popular-scale { transform: scale(1); }
                }
                .transition-all { transition: all 0.3s ease; }
                .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
                .card:hover { transform: translateY(-10px); }
            `}</style>
        </div>
    );
};

export default Pricing;
