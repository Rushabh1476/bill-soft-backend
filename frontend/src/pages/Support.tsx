import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const Support: React.FC = () => {
  const navigate = useNavigate();

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState({ show: false, title: '', text: '' });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'account', label: 'Account' },
    { id: 'billing', label: 'Billing & GST' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'software', label: 'Software Sync' }
  ];

  const faqs = [
    { category: 'account', question: "How do I reset my password?", answer: "You can reset your password by clicking 'Forgot Password' on the login page and following the instructions sent to your email." },
    { category: 'account', question: "How can I update my profile?", answer: "Navigate to the 'Profile' section in your dashboard to update your personal information, contact details, and company logo." },
    { category: 'inventory', question: "Where can I see my bills and inventory?", answer: "All your generated bills are listed in the 'Bills' section. Inventory can be managed under the 'Products' or 'Inventory' tab in your main dashboard." },
    { category: 'billing', question: "How do I generate a GST report for filing?", answer: "Go to the 'Reports' section, select 'GST Reports', chooses the desired month/quarter, and click 'Export' to get your data in Excel or PDF format." },
    { category: 'billing', question: "Is my billing data secure on BillSoft?", answer: "Yes, we use industry-standard encryption and secure database systems. Regular backups are performed to ensure your data is safe and always accessible." },
    { category: 'billing', question: "Can I customize the design of my invoices?", answer: "Absolutely! Go to 'Settings' > 'Invoice Settings' to choose templates, add your logo, specify bank details, and customize colors to match your brand." },
    { category: 'account', question: "How do I add multiple users or staff to my account?", answer: "Administrators can add sub-users by navigating to 'User Management'. You can assign specific roles like 'Operator' or 'Accountant' with restricted permissions." },
    { category: 'hardware', question: "Do you support barcode scanning for faster billing?", answer: "Yes, BillSoft is compatible with most standard USB and Bluetooth barcode scanners for quick product lookup and billing." },
    { category: 'inventory', question: "How do I import my existing product list?", answer: "In the 'Products' section, click the 'Import' button. You can download our Excel template, fill in your product details, and upload it back for bulk entry." },
    { category: 'software', question: "Can I manage multiple business branches?", answer: "Yes, the 'Multi-Branch' module allows you to track sales, stock, and staff across different locations with centralized management." },
    { category: 'inventory', question: "How do I set up low-stock alerts?", answer: "Go to 'Inventory Settings' and define a 'Minimum Quantity' for each product. The system will alert you when stock levels fall below this threshold." },
    { category: 'billing', question: "Can I track customer loyalty points?", answer: "Our CRM module allows you to award points for every purchase. Customers can later redeem these points for discounts on future bills." },
    { category: 'billing', question: "How do I record business expenses?", answer: "Use the 'Expenses' module to log daily costs like rent, electricity, and salaries to get an accurate view of your net profit." },
    { category: 'account', question: "Can I export my customer list for marketing?", answer: "Yes, you can export your entire customer database to Excel from the 'Customers' section to run email or SMS campaigns." },
    { category: 'software', question: "Is there an offline mode for BillSoft?", answer: "Currently, BillSoft is a cloud-based application requiring an internet connection. This ensures your data is always synced and backed up in real-time." },
    { category: 'billing', question: "How do I create quotations for clients?", answer: "Navigate to the 'Invoices' section and choose 'Create Quotation'. Once approved, you can convert it into a final bill with a single click." },
    { category: 'billing', question: "Does the system support credit/debit note entry?", answer: "Yes, you can issue credit notes for customer returns and debit notes for purchase adjustments in the 'Accounts' module." },
    { category: 'inventory', question: "Can I track product expiry dates?", answer: "Absolutely! You can record expiry dates for batches, and the system will notify you of upcoming expirations in the inventory dashboard." },
    { category: 'account', question: "How do I cancel my subscription?", answer: "You can manage your plan under 'Subscription Settings'. You can cancel or downgrade your plan at any time; your data remains yours." },
    { category: 'software', question: "Do you offer custom software development?", answer: "If your business has unique requirements, contact our enterprise support via this form for information on custom integrations and private hosting." }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/web/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: '',
          message: `Category: ${formData.category}\n\n${formData.message}`,
        }),
      });
      if (!response.ok) throw new Error('Failed');
      setShowSuccessModal({ show: true, title: 'Request Sent!', text: 'Our team will reach out within 24 hours.' });
      setFormData({ name: '', email: '', category: 'General Inquiry', message: '' });
    } catch (error) {
      alert('Error sending message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = (e.target as any).querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value : '';
    
    setShowGuideModal(false);
    
    // Optional: Log this as a lead
    try {
      await fetch(`${API_URL}/web/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Guide Requester',
          email: email,
          phone: '',
          message: 'Requested BillSoft User Guide PDF',
        }),
      });
    } catch (e) {
      console.error('Lead log failed', e);
    }

    // Trigger the PDF download/open
    window.open('/Billsoft_guide.pdf', '_blank');

    setShowSuccessModal({
      show: true,
      title: 'Guide Dispatched!',
      text: 'The User Guide has been opened in a new tab and sent to your email queue.'
    });
  };

  return (
    <div className="support-page-container">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        :root {
          --primary-blue: #3157a2;
          --accent-cyan: #00dfd8;
          --dark-navy: #111827;
          --text-main: #1e293b;
          --text-muted: #64748b;
          --bg-soft: #f8fafc;
          --glass-bg: rgba(255, 255, 255, 0.8);
          --gradient-main: linear-gradient(135deg, #3157a2 0%, #00dfd8 100%);
        }

        .support-page-container {
          font-family: 'Inter', sans-serif !important;
          background-color: var(--bg-soft);
          min-height: 100vh;
          color: var(--text-main);
          overflow-x: hidden;
        }

        /* Layout & Navigation */
        nav {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 5%;
          position: sticky;
          top: 0;
          z-index: 1000;
          justify-content: space-between;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          font-size: 24px;
          color: var(--text-main);
          cursor: pointer;
          padding: 8px;
        }

        .nav-links-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        @media (max-width: 991px) {
          .nav-links-container {
            display: none;
          }
          .mobile-menu-btn {
            display: block;
          }
        }

        /* Mobile Drawer */
        .mobile-drawer {
          position: fixed;
          top: 0;
          right: -100%;
          width: 280px;
          height: 100vh;
          background: white;
          z-index: 2000;
          transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: -10px 0 30px rgba(0,0,0,0.1);
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mobile-drawer.active {
          right: 0;
        }

        .drawer-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 1999;
          display: none;
        }

        .drawer-overlay.active {
          display: block;
        }

        .drawer-link {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .back-btn-container {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background-color: #f1f5f9;
          color: var(--text-muted);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0;
        }

        .back-btn-container:hover {
          background-color: var(--primary-blue);
          color: white;
          transform: translateX(-4px);
          border-color: var(--primary-blue);
          box-shadow: 0 4px 12px rgba(49, 87, 162, 0.2);
        }

        .nav-socials {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .nav-socials a {
          color: var(--text-muted);
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.3s;
          font-size: 16px;
          background: #f8fafc;
        }

        .nav-socials a:hover {
          color: var(--primary-blue);
          background: #eff6ff;
          transform: translateY(-2px);
        }

        /* Hero Section */
        .hero {
          background: var(--dark-navy);
          position: relative;
          padding: 100px 20px 140px;
          text-align: center;
          color: white;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(49, 87, 162, 0.25) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-title {
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 900;
          margin-bottom: 20px;
          background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fillColor: transparent;
        }

        .search-area {
          max-width: 640px;
          margin: 40px auto 0;
          position: absolute;
          left: 50%;
          bottom: -24px;
          transform: translateX(-50%);
          width: calc(100% - 40px);
          z-index: 10;
        }

        .search-area input {
          width: 100%;
          padding: 20px 25px 20px 65px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          font-size: 18px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          outline: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
        }

        .search-area input:focus {
          box-shadow: 0 25px 50px -12px rgba(49, 87, 162, 0.15);
          transform: translateY(-4px);
          border-color: var(--primary-blue);
        }

        .search-area i {
          position: absolute;
          left: 25px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 20px;
          transition: color 0.3s;
        }

        .search-area input:focus + i {
          color: var(--primary-blue);
        }

        /* Grid Layouts */
        .content-wrap {
          max-width: 1200px;
          margin: 80px auto;
          padding: 0 5%;
        }

        .channel-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 80px;
        }

        .card-link { text-decoration: none; color: inherit; display: block; }
        
        .channel-card {
          background: white;
          padding: 32px;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          transition: all 0.4s;
          display: flex;
          align-items: center;
          gap: 20px;
          height: 100%;
        }

        .channel-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
          border-color: #e2e8f0;
        }

        .icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .blue-icon { background: #eff6ff; color: #2563eb; }
        .purple-icon { background: #f5f3ff; color: #7c3aed; }
        .green-icon { background: #ecfdf5; color: #10b981; }

        /* FAQ Section */
        .faq-section {
          background: white;
          padding: 80px 5%;
          border-radius: 48px;
          margin: 40px auto;
          max-width: 1000px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .category-filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 50px;
        }

        .pill {
          padding: 10px 22px;
          border-radius: 100px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.3s;
          font-size: 14px;
        }

        .pill.active {
          background: var(--gradient-main);
          color: white;
          border-color: transparent;
          box-shadow: 0 8px 20px rgba(49, 87, 162, 0.25);
        }

        .faq-item {
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 5px;
        }

        .faq-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 10px;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-main);
          transition: 0.3s;
        }

        .faq-header:hover { color: var(--primary-blue); }

        .faq-body {
          padding: 0 10px 24px;
          color: var(--text-muted);
          line-height: 1.7;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Forms */
        .contact-wrap {
          background: white;
          border-radius: 40px;
          padding: 80px;
          max-width: 900px;
          margin: 100px auto;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.04);
        }

        .contact-wrap input, 
        .contact-wrap select, 
        .contact-wrap textarea {
          width: 100%;
          padding: 16px 20px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #fdfdfd;
          outline: none;
          font-family: inherit;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-main);
        }

        .contact-wrap input:focus, 
        .contact-wrap select:focus, 
        .contact-wrap textarea:focus {
           border-color: var(--primary-blue);
           background: white;
           box-shadow: 0 0 0 4px rgba(49, 87, 162, 0.08);
           transform: translateY(-1px);
        }

        .contact-wrap label {
          display: block;
          margin-bottom: 10px;
          font-weight: 700;
          font-size: 14px;
          color: var(--text-main);
          letter-spacing: 0.2px;
        }

        .btn-gradient {
          width: 100%;
          padding: 18px;
          border-radius: 16px;
          border: none;
          background: var(--gradient-main);
          color: white;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 10px 25px rgba(49, 87, 162, 0.2);
        }

        .btn-gradient:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(49, 87, 162, 0.3);
          opacity: 0.95;
        }

        /* Responsive Fixes */
        @media (max-width: 768px) {
          nav { padding: 0 20px; }
          .nav-socials { display: none; }
          .hero { padding: 60px 20px 100px; }
          .contact-wrap { padding: 30px 20px; border-radius: 24px; }
          .extra-grid { grid-template-columns: 1fr !important; }
          .faq-section { border-radius: 24px; padding: 40px 20px; }
          .channel-card { padding: 20px; }
          .form-grid { grid-template-columns: 1fr !important; }
        }

        .extra-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 40px;
        }

        .extra-card {
          background: #ffffff;
          padding: 40px;
          border-radius: 32px;
          border: 1px solid #f1f5f9;
          transition: 0.3s;
        }

        .extra-card:hover { border-color: var(--accent-cyan); transform: translateY(-5px); }

        .extra-card h3 { font-size: 22px; font-weight: 800; margin-bottom: 12px; }

        .gradient-text {
          background: var(--gradient-main);
          -webkit-background-clip: text;
          -webkit-text-fillColor: transparent;
        }

        /* Modal Styles */
        .bs-modal-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }

        .bs-modal-card {
          background: white;
          padding: 48px;
          border-radius: 32px;
          width: 90%;
          max-width: 480px;
          position: relative;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
          text-align: center;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .mobile-menu-btn { display: none; background: none; border: none; font-size: 24px; cursor: pointer; }
        .drawer-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; opacity: 0; visibility: hidden; transition: 0.3s; }
        .drawer-overlay.active { opacity: 1; visibility: visible; }
        .mobile-drawer { position: fixed; top: 0; right: -300px; width: 300px; height: 100%; background: white; z-index: 1000; padding: 30px; transition: 0.3s; display: flex; flex-direction: column; gap: 20px; }
        .mobile-drawer.active { right: 0; }
        .drawer-link { display: flex; align-items: center; gap: 15px; font-weight: 700; color: var(--text-main); text-decoration: none; padding: 15px 0; border-bottom: 1px solid #f1f5f9; }

        @media (max-width: 768px) {
          .nav-links-container { display: none; }
          .mobile-menu-btn { display: block; }
        }

      `}</style>

      <nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div onClick={() => navigate('/')} className="back-btn-container" title="Back to Home">
            <i className="fas fa-arrow-left"></i>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/Bill (1).svg" alt="BillSoft Logo" style={{ height: '48px' }} />
            <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
              BillSoft <span style={{ color: 'var(--primary-blue)' }}>Support</span>
            </span>
          </div>
        </div>
        
        <div className="nav-links-container" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span 
            onClick={() => setShowGuideModal(true)} 
            style={{ cursor: 'pointer', fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}
          >
            User Guide
          </span>
          <div className="nav-socials">
            <a href="https://www.instagram.com/agb_technologies/" target="_blank" rel="noreferrer"><i className="fab fa-instagram"></i></a>
            <a href="https://www.linkedin.com/in/agb-technologies/" target="_blank" rel="noreferrer"><i className="fab fa-linkedin-in"></i></a>
            <a href="mailto:support@agbtechnologies.com"><i className="far fa-envelope"></i></a>
            <a href="tel:+919069074780"><i className="fas fa-phone-alt"></i></a>
          </div>
        </div>

        <button className="mobile-menu-btn" onClick={() => setIsDrawerOpen(true)}>
          <i className="fas fa-bars"></i>
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
      <div className={`mobile-drawer ${isDrawerOpen ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <img src="/Bill (1).svg" alt="Logo" style={{ height: '35px' }} />
          <button style={{ background: 'none', border: 'none', fontSize: '24px' }} onClick={() => setIsDrawerOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="drawer-link"><i className="fas fa-home"></i> Home</a>
        <div onClick={() => { setShowGuideModal(true); setIsDrawerOpen(false); }} className="drawer-link" style={{ cursor: 'pointer' }}><i className="fas fa-file-pdf"></i> User Guide</div>
        <a href="tel:+919069074780" className="drawer-link"><i className="fas fa-phone-alt"></i> Call Support</a>
        <a href="https://wa.me/9069074780" className="drawer-link"><i className="fab fa-whatsapp"></i> WhatsApp</a>
        <div style={{ marginTop: 'auto', textAlign: 'center' }}>
          <button className="btn-gradient" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>

      <header className="hero">
        <h1 className="hero-title">How can we help?</h1>
        <p style={{ color: '#94a3b8', fontSize: '19px', maxWidth: '600px', margin: '0 auto 40px' }}>
          Search our knowledge base or reach out to our dedicated support team.
        </p>
        <div className="search-area">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search for answers (e.g. GST, Inventory, Backup)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="content-wrap">
        <div className="channel-cards">
          <a href="tel:+919069074780" className="card-link">
            <div className="channel-card">
              <div className="icon-circle blue-icon"><i className="fas fa-headset"></i></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Tech Support</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Call us: +91 90690 74780</p>
              </div>
            </div>
          </a>
          <a href="mailto:support@agbtechnologies.com" className="card-link">
            <div className="channel-card">
              <div className="icon-circle purple-icon"><i className="fas fa-envelope-open-text"></i></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Email Inquiry</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>support@agbtechnologies.com</p>
              </div>
            </div>
          </a>
          <a href="https://wa.me/9069074780" target="_blank" rel="noreferrer" className="card-link">
            <div className="channel-card">
              <div className="icon-circle green-icon"><i className="fab fa-whatsapp"></i></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>WhatsApp</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Chat with our experts</p>
              </div>
            </div>
          </a>
        </div>

        <section className="faq-section">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '15px' }}>Frequently Asked Questions</h2>
            <div className="category-filters">
              {categories.map(cat => (
                <button key={cat.id} className={`pill ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="faq-accordion">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <button className="faq-header" onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}>
                    <span>{faq.question}</span>
                    <i className={`fas fa-chevron-${expandedFaq === idx ? 'up' : 'down'}`} style={{ color: expandedFaq === idx ? 'var(--primary-blue)' : '#94a3b8' }}></i>
                  </button>
                  {expandedFaq === idx && <div className="faq-body">{faq.answer}</div>}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <i className="fas fa-search" style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.2 }}></i>
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </section>

        <div className="extra-grid">
          <div className="extra-card">
            <h3 className="gradient-text">Customization Requests</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              Need a tailored billing workflow or a custom report? Our engineers can build specialized modules exactly for your business logic.
            </p>
            <div onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} style={{ color: 'var(--primary-blue)', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Contact for Customization <i className="fas fa-arrow-right"></i>
            </div>
          </div>
          <div className="extra-card">
            <h3 className="gradient-text">Product Updates</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              Stay ahead with the latest feature releases, tax compliance updates, and security patches. Join our monthly newsletter.
            </p>
            <a href="https://agbtechnologies.com/newsletter" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--primary-blue)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Join Product Newsletter <i className="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>

        <section className="contact-wrap">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '14px', letterSpacing: '-1px' }}>Drop us a message</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Our technical team usually responds within 24 business hours.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
              <div>
                <label>Full Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label>Email Address</label>
                <input type="email" placeholder="name@company.com" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label>How can we help?</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option>General Inquiry</option>
                <option>Technical Issue</option>
                <option>Customization Request</option>
                <option>Feature Feedback</option>
                <option>Billing & Subscription</option>
              </select>
            </div>
            <div style={{ marginBottom: '40px' }}>
              <label>Message Details</label>
              <textarea rows={6} placeholder="Describe your issue or request in detail..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}></textarea>
            </div>
            <button type="submit" className="btn-gradient" disabled={isSubmitting} style={{ fontSize: '18px', padding: '20px' }}>
              {isSubmitting ? <><i className="fas fa-spinner fa-spin me-2"></i> Processing Request...</> : 'Send Support Message'}
            </button>
          </form>
        </section>
      </main>

      <footer style={{ padding: '80px 20px', textAlign: 'center', background: 'white', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ marginBottom: '24px', opacity: 0.8 }}>
          <img src="/Bill (1).svg" alt="BillSoft Logo" style={{ height: '40px' }} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, fontWeight: 500 }}>
          © {new Date().getFullYear()} <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>AGB TECHNOLOGIES LLP</span>. All rights reserved.
        </p>
      </footer>

      {showGuideModal && (
        <div className="bs-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="bs-modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowGuideModal(false)}><i className="fas fa-times"></i></button>
            <div style={{ width: '70px', height: '70px', background: '#eff6ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', color: '#2563eb', margin: '0 auto 25px' }}>
              <i className="fas fa-file-pdf"></i>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>User Guide</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Enter your email to download the complete BillSoft manual.</p>
            <form onSubmit={handleModalSubmit}>
              <input type="email" placeholder="Enter your email" required style={{ marginBottom: '20px', textAlign: 'center' }} />
              <button type="submit" className="btn-gradient">Download PDF Guide</button>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal.show && (
        <div className="bs-modal-overlay" onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })}>
          <div className="bs-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ width: '70px', height: '70px', background: '#f0fdf4', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', color: '#22c55e', margin: '0 auto 25px' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>{showSuccessModal.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{showSuccessModal.text}</p>
            <button onClick={() => setShowSuccessModal({ ...showSuccessModal, show: false })} className="btn-gradient" style={{ background: '#22c55e', border: 'none', boxShadow: '0 10px 20px rgba(34,197,94,0.2)' }}>
              Awesome
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
