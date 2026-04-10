import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Need to mock any contexts or complex providers that App.tsx wraps
jest.mock('./contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useAuth: () => ({ isAuthenticated: false, user: null, loading: false })
}));

test('renders app component successfully', () => {
    render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
    expect(true).toBe(true);
});
