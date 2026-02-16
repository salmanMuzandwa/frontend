import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
import axios from '../utils/axios';

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { nom: 'Test', prenom: 'User', role: 'admin' },
        hasPermission: () => true,
        isLoggedIn: true
    }),
    AuthProvider: ({ children }) => <>{children}</>
}));

// Mock axios
jest.mock('../utils/axios');

const mockStats = {
    membresActifs: 42,
    nouveauxMembres: 3,
    tresorerie: 12500,
    contributionsMois: 2300,
    activitesMois: 5,
    activitesAvenir: 2,
    tauxParticipation: 78,
    contributionsEvolution: [
        { mois: 'Jan', montant: 1000 },
        { mois: 'Feb', montant: 1200 },
    ],
    repartitionStatuts: [
        { name: 'Actifs', value: 60 },
        { name: 'Inactifs', value: 25 },
    ],
    alertes: [
        { message: 'Contribution en attente', date: '2025-10-20', type: 'Info' }
    ]
};

describe('Dashboard Component', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset localStorage mock
        localStorage.clear();
    });

    test('renders loading state initially', () => {
        axios.get.mockImplementation(() => new Promise(() => { })); // Never resolves
        render(
            <AuthProvider>
                <Dashboard />
            </AuthProvider>
        );
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders dashboard data after successful API call', async () => {
        // Mock successful API response
        axios.get.mockResolvedValueOnce({
            data: mockStats,
            status: 200
        });

        const { container } = render(
            <AuthProvider>
                <Dashboard />
            </AuthProvider>
        );

        // Wait for loading to finish and data to be rendered
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            expect(container.querySelector('.dashboard-card')).toBeInTheDocument();
        });

        // Verify specific content
        expect(container.querySelector('h4')).toHaveTextContent('Tableau de Bord');

        // Verify dashboard stats
        const statValues = container.querySelectorAll('[data-testid="stat-value"]');
        expect(statValues).toHaveLength(4);
        expect(statValues[0]).toHaveTextContent('42');
        expect(statValues[1]).toHaveTextContent('12500 $');
        expect(statValues[2]).toHaveTextContent('5');
        expect(statValues[3]).toHaveTextContent('78%');
        expect(screen.getByText('78%')).toBeInTheDocument(); // tauxParticipation
    });

    test('renders error state when API call fails', async () => {
        // Mock failed API response
        localStorage.setItem('token', 'test-token');
        axios.get.mockRejectedValueOnce(new Error('API Error'));

        render(
            <AuthProvider>
                <Dashboard />
            </AuthProvider>
        );

        // Wait for error message
        await waitFor(() => {
            expect(screen.getByText('Impossible de charger les statistiques. Vérifiez le Backend.')).toBeInTheDocument();
        });
    });

    test('renders development mock data when API fails in dev mode', async () => {
        // Save original env and set development mode
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        // Mock failed API response to trigger mock data
        localStorage.setItem('token', 'test-token');
        axios.get.mockRejectedValueOnce(new Error('API Error'));

        render(
            <AuthProvider>
                <Dashboard />
            </AuthProvider>
        );

        // Wait for dev mock data to be rendered
        await waitFor(() => {
            const stats = screen.getAllByTestId('stat-value');
            expect(stats[0]).toHaveTextContent('42'); // Mock membresActifs in dev mode
        });

        // Restore original env
        process.env.NODE_ENV = originalEnv;
    });

    test('renders alerts section only for users with all permissions', async () => {
        // Mock successful API response
        axios.get.mockResolvedValueOnce({ data: mockStats });

        render(
            <AuthProvider>
                <Dashboard />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText('Alertes Importantes')).toBeNull();
        });
    });
});