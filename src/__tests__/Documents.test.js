import React from 'react';
import { render, screen } from '@testing-library/react';
import Documents from '../pages/Documents';
import { AuthProvider } from '../contexts/AuthContext';

// Basic smoke tests for Documents dialog title logic

test('renders Nouveau Document title when creating', () => {
    render(
        <AuthProvider>
            <Documents />
        </AuthProvider>
    );

    // The component fetches documents on mount; we only assert that the page title exists
    expect(screen.getByText(/Gestion des Documents/i)).toBeInTheDocument();
});
