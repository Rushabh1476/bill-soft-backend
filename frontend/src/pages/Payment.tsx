import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="payment-page" style={{ 
            minHeight: '100vh', 
            background: '#f8fafc',
            fontFamily: "'Geist', sans-serif"
        }}>
            {/* Navbar for consistency */}
            <nav className="navbar bg-white py-2 py-sm-3 shadow-sm">
                <div className="container d-flex justify-content-between align-items-center">
                    <a className="navbar-brand d-flex align-items-center" href="/">
                        <img src="/Bill (1).svg" alt="BillSoft Logo" style={{ height: '40px', marginRight: '8px' }} />
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000' }}>Bill<span style={{ color: '#3157a2' }}>Soft</span></span>
                    </a>
                    <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => navigate('/')}>
                        <i className="bi bi-arrow-left me-1"></i> <span className="d-none d-sm-inline">Back to Home</span>
                        <span className="d-inline d-sm-none">Home</span>
                    </button>
                </div>
            </nav>

            <div className="container py-4 py-sm-5 mt-lg-5">
                <div className="row justify-content-center">
                    <div className="col-lg-7 text-center">
                        <div className="card border-0 shadow-lg p-4 p-sm-5 rounded-4" style={{ background: '#fff' }}>
                            <div className="mb-4">
                                <div className="bg-warning bg-opacity-10 text-warning d-inline-flex p-3 p-sm-4 rounded-circle mb-3">
                                    <i className="bi bi-exclamation-triangle-fill display-4 display-sm-3"></i>
                                </div>
                                <h1 className="fw-bold mb-3" style={{ color: '#0c121e', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Maintenance in Progress</h1>
                                <p className="text-muted lead px-lg-5" style={{ fontSize: '1rem' }}>
                                    Our payment gateways are currently undergoing scheduled maintenance to improve your experience.
                                </p>
                            </div>

                            <div className="alert alert-warning border-0 p-3 p-sm-4 mb-4 text-start rounded-4" style={{ borderLeft: '4px solid #ffc107 !important' }}>
                                <div className="d-flex gap-3">
                                    <i className="bi bi-tools fs-4 mt-1"></i>
                                    <div>
                                        <h6 className="fw-bold mb-1">We'll be back shortly!</h6>
                                        <p className="mb-0 small opacity-75">
                                            The direct "Buy Now" feature is temporarily disabled. We are recreating the payment experience to make it faster and more secure. 
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 p-sm-4 bg-light rounded-4 mb-4">
                                <h5 className="fw-bold mb-3">Need to purchase right away?</h5>
                                <p className="text-muted small mb-4">You can still purchase by contacting our support team directly via WhatsApp or Email.</p>
                                <div className="d-grid d-sm-flex justify-content-sm-center gap-3">
                                    <a href="https://wa.me/919049874780" className="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-sm">
                                        <i className="bi bi-whatsapp me-2"></i> WhatsApp Support
                                    </a>
                                    <a href="mailto:support@agbtechnologies.com" className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold">
                                        Email Support
                                    </a>
                                </div>
                            </div>


                            <div className="text-muted small">
                                <p className="mb-0">Estimated downtime: 2 hours</p>
                                <p className="mb-0">Powered by AGB TECHNOLOGIES LLP</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
