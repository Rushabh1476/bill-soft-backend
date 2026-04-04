import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="header">
            <h1>Billing SaaS</h1>
            <nav>
                <ul>
                    <li><Link to="/">Dashboard</Link></li>
                    <li><Link to="/bills">Bills</Link></li>
                    <li><Link to="/customers">Customers</Link></li>
                    <li><Link to="/products">Products</Link></li>
                    <li><Link to="/settings">Settings</Link></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;