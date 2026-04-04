/* eslint-disable */
import React, { useEffect } from 'react';
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

    useEffect(() => {
        if (!isLoading && user) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);

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

        // Initialize counters
        const counters = document.querySelectorAll('.count');
        const speed = 200;

        const startCounter = (counter: any) => {
            const target = +counter.innerText;
            counter.innerText = '0';

            const updateCount = () => {
                const current = +counter.innerText;
                const inc = target / speed;

                if (current < target) {
                    counter.innerText = Math.ceil(current + inc);
                    setTimeout(updateCount, 10);
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

    return (
        <div id="landing-page-content" style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
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

            {/* NAVBAR */}
            <nav className="navbar navbar-expand-lg">
                <div className="container">
                    <a className="navbar-brand d-flex align-items-center" href="/">
                        <img
                            src="/logo.png"
                            alt="BillSoft Logo"
                            style={{
                                height: '45px',
                                width: 'auto',
                                marginRight: '10px'
                            }}
                        />
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000' }}>Bill<span style={{ color: '#3157a2' }}>Soft</span></span>
                    </a>
                    <div className="d-flex align-items-center ms-auto">
                        <button
                            onClick={handleAccessApp}
                            className="btn d-lg-none"
                            style={{
                                background: '#25d366',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '25px',
                                padding: '8px 18px',
                                fontSize: '13px',
                                fontWeight: '700',
                                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                marginRight: '10px',
                                display: 'block',
                                visibility: 'visible',
                                opacity: 1,
                                zIndex: 1050
                            }}
                        >
                            App Access
                        </button>
                        <button
                            className="navbar-toggler border-0 p-2 shadow-sm bg-white rounded-3"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarNav"
                            style={{ zIndex: 1050 }}
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>
                    </div>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto">
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="#features">Features</a></li>
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="/pricing">Pricing</a></li>
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="#about">About</a></li>
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="#customization">Workflows</a></li>
                            <li className="nav-item mx-2 text-uppercase"><a className="nav-link" href="#faq">FAQ</a></li>
                            <li className="nav-item d-flex align-items-center me-3">
                                <a href="#contact" className="nav-link text-uppercase">CONTACT</a>
                                <img src="/calling_gif.gif" alt="calling" style={{ width: 25, height: 25, marginLeft: 2 }} />
                            </li>
                        </ul>
                        <button
                            onClick={handleAccessApp}
                            className="btn btn-signup d-none d-lg-flex"
                        >
                            App Access &rarr;
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Slider */}
            <section className="p-0">
                <div id="homepageSlider" className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner slider-bg">
                        <div className="carousel-item active">
                            <div className="container">
                                <div className="row align-items-center g-5 pt-0 pb-5">
                                    <div className="col-lg-6" data-aos="fade-right">
                                        <h1 className="hero-title">EXPERIENCE BILLSOFT FREE <br /> TRY BEFORE YOU BUY</h1>
                                        <div className="mt-4">
                                            <HeroForm />
                                        </div>
                                    </div>
                                    <div className="col-lg-6" data-aos="fade-left">
                                        <img src="/image copy 11.png" className="img-fluid rounded" alt="BillSoft Billing Demo" />
                                    </div>
                                </div>
                            </div>
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

            {/* Features */}
            <section id="features" className="bg-light">
                <div className="container">
                    <div className="text-center mb-5">
                        <h1 className="section-title-center" data-aos="fade-down">Features of GST Billing and Accounting</h1>
                        <p className="text-muted text-uppercase">Powerful tools designed to simplify invoicing and compliance.</p>
                    </div>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="feature-card shadow-sm border-0">
                                <div className="feature-icon"><i className="bi bi-lightning-charge-fill"></i></div>
                                <h5 className="fw-bold">1 Click E-Way Bill</h5>
                                <p>Generate waybills instantly with a single click ensuring accurate documentation.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="feature-card shadow-sm border-0">
                                <div className="feature-icon"><i className="bi bi-file-earmark-check-fill"></i></div>
                                <h5 className="fw-bold">Professional Invoices</h5>
                                <p>Create fully customized invoices that reflect your professional business identity.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="feature-card shadow-sm border-0">
                                <div className="feature-icon"><i className="bi bi-whatsapp"></i></div>
                                <h5 className="fw-bold">WhatsApp Integration</h5>
                                <p>Share invoices directly via WhatsApp. No extra steps or manual exports needed.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Branded Invoices Section */}
            <section className="bg-light pt-0">
                <div className="container text-center">
                    <h2 className="section-title-center">Your bill, Your Brand</h2>
                    <p className="text-muted text-uppercase mb-5">Professional, fully customized invoices in multiple formats.</p>

                    <ul className="nav nav-tabs justify-content-center mb-5" id="printTabs" role="tablist">
                        <li className="nav-item"><button className="nav-link active" data-bs-toggle="tab" data-bs-target="#thermal">Thermal Prints</button></li>
                        <li className="nav-item"><button className="nav-link" data-bs-toggle="tab" data-bs-target="#a4">A4 Prints</button></li>
                        <li className="nav-item"><button className="nav-link" data-bs-toggle="tab" data-bs-target="#a5">A5 Prints</button></li>
                    </ul>

                    <div className="tab-content">
                        <div className="tab-pane fade show active" id="thermal">
                            <img src="/image copy 15.png" className="img-fluid rounded shadow-sm w-100" alt="Thermal Print" />
                        </div>
                        <div className="tab-pane fade" id="a4">
                            <div className="row g-4 justify-content-center">
                                <div className="col-md-4"><img src="/image copy 3.png" className="img-fluid rounded shadow-sm" alt="A4 Format" /></div>
                                <div className="col-md-4"><img src="/image copy 4.png" className="img-fluid rounded shadow-sm" alt="A4 Format 2" /></div>
                                <div className="col-md-4"><img src="/image copy 18.png" className="img-fluid rounded shadow-sm" alt="A4 Format 3" /></div>
                            </div>
                        </div>
                        <div className="tab-pane fade" id="a5">
                            <div className="row g-4 justify-content-center">
                                <div className="col-md-4"><img src="/image copy 20.png" className="img-fluid rounded shadow-sm" alt="A5 Format" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Industry Solutions */}
            <section id="customization" className="bg-white">
                <div className="container text-center">
                    <h1 className="section-title-center">Industry Specific Workflows</h1>
                    <p className="text-muted text-uppercase mb-5">Manage any business with one smart solution.</p>

                    <div className="row align-items-center g-5 text-start bg-light p-4 rounded-4 shadow-sm mx-1">
                        <div className="col-lg-5">
                            <h3 className="fw-bold mb-3">RETAIL & WHOLESALE</h3>
                            <p className="text-muted">Optimize operations with fast billing, inventory tracking, and automatic GST compliance.</p>
                            <ul className="check-list mt-3 list-unstyled">
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-primary me-2"></i> Real-time stock tracking</li>
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-primary me-2"></i> WhatsApp invoice sharing</li>
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-primary me-2"></i> E-Invoice & E-Way Bill</li>
                            </ul>
                        </div>
                        <div className="col-lg-7">
                            <img src="/image copy 10.png" className="img-fluid rounded shadow" alt="Software Preview" />
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="bg-light">
                <div className="container">
                    <h1 className="section-title-center mb-5">Frequently Asked Questions</h1>
                    <div className="accordion shadow-sm rounded-4 overflow-hidden" id="faqAccordion">
                        <div className="accordion-item border-0 border-bottom">
                            <h2 className="accordion-header"><button className="accordion-button collapsed py-4 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#q1">What is BillSoft and who can use it?</button></h2>
                            <div id="q1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                <div className="accordion-body text-muted px-4">BillSoft is a smart GST billing software designed for businesses of all sizes, from small shops to large manufacturing enterprises.</div>
                            </div>
                        </div>
                        <div className="accordion-item border-0">
                            <h2 className="accordion-header"><button className="accordion-button collapsed py-4 fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#q2">Can I send invoices via WhatsApp?</button></h2>
                            <div id="q2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                <div className="accordion-body text-muted px-4">Yes! You can share professional invoices instantly on WhatsApp directly from the billing screen.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Form Section & CTA combined */}
            <section id="contact" className="demo-section">
                <div className="container">
                    <div className="row align-items-center g-5 mb-5">
                        <div className="col-lg-7">
                            <div className="position-relative">
                                <video src="/marketing.mp4" className="img-fluid rounded shadow-lg" autoPlay loop muted playsInline></video>
                            </div>
                        </div>
                        <div className="col-lg-5">
                            <div className="demo-form shadow-lg p-5 bg-white rounded-4">
                                <h4 className="text-center mb-4 fw-bold">Book Live Demo</h4>
                                <ContactForm />
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-5 mb-3">
                        <h2 className="fw-bold mb-4">Ready to simplify your billing?</h2>
                        <button onClick={handleAccessApp} className="btn btn-signup btn-lg px-5">Open Application Now</button>
                    </div>
                </div>
            </section>

            <footer className="footer bg-dark text-white py-5">
                <div className="container text-center">
                    <p className="mb-0 opacity-50">&copy; 2026 BillSoft India. Powered by {window.location.hostname.includes('agbitsolutions') ? 'Agb IT Solutions' : 'Agb Technologies'}</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
