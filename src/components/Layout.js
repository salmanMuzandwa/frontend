// src/components/Layout.js

import React, { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Avatar,
    Divider,
    useTheme,
    useMediaQuery,
    Badge,
    Button
} from '@mui/material';
import { Dashboard as DashboardIcon, Group, People, Paid, Event, Description, Book, ExitToApp, Person, MenuBook, Menu as MenuIcon, HowToReg, AccountBalance } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePhotoUrl } from '../utils/urlHelper';
import api from '../api/axiosConfig';
import LogoIcon from './LogoIcon';

const menuItems = [
    { text: 'Tableau de Bord', icon: <DashboardIcon />, path: '/dashboard', permission: 'dashboard' },
    { text: 'Membres', icon: <Group />, path: '/membres', permission: 'membres' },
    { text: 'Demandes d\'inscription', icon: <HowToReg />, path: '/registration-requests', permission: 'membres', badge: true },
    { text: 'Finance', icon: <AccountBalance />, path: '/contributions', permission: 'contributions' },
    { text: 'Présences', icon: <People />, path: '/presences', permission: 'presences' },
    { text: 'Activités', icon: <Event />, path: '/activites', permission: 'activites' },
    { text: 'Documents', icon: <Description />, path: '/documents', permission: 'documents' },
    { text: 'Rapports', icon: <MenuBook />, path: '/rapports', permission: 'rapports' },
    { text: 'Cas Sociaux', icon: <Book />, path: '/cas-sociaux', permission: 'cas_sociaux' },
    { text: 'Mon Profil', icon: <Person />, path: '/profil', permission: 'profil' },
];

const Layout = () => {
    const { logout, user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [logoLoaded, setLogoLoaded] = useState(true);

    // Dynamic drawer width based on screen size
    const getDrawerWidth = () => {
        if (isMobile) return 280;
        if (isTablet) return 220;
        if (isDesktop) return 240;
        return 240;
    };

    const drawerWidth = getDrawerWidth();

    // Charger le nombre de demandes en attente
    useEffect(() => {
        if (hasPermission('membres')) {
            const fetchPendingRequests = async () => {
                try {
                    const response = await api.get('/registration-requests');
                    const pendingCount = response.data?.filter(req => req.status === 'pending').length || 0;
                    setPendingRequestsCount(pendingCount);
                } catch (error) {
                    console.error('Erreur lors du chargement des demandes:', error);
                }
            };

            fetchPendingRequests();
            // Rafraîchir toutes les 30 secondes
            const interval = setInterval(fetchPendingRequests, 30000);
            return () => clearInterval(interval);
        }
    }, [hasPermission]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Affiche uniquement les liens pour lesquels l'utilisateur a la permission
    const filteredMenuItems = menuItems.filter(item =>
        item.permission === 'dashboard' || hasPermission(item.permission)
    );

    const drawer = (
        <Box>
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 2,
                    flexDirection: 'column',
                    gap: 1
                }}
            >
                {logoLoaded ? (
                    <Box
                        component="img"
                        src="/assets/logo.png"
                        alt="Logo LJMDI"
                        sx={{
                            height: { xs: 40, sm: 45, md: 50 },
                            width: 'auto',
                            maxWidth: { xs: 100, sm: 120, md: 140 },
                            objectFit: 'contain',
                            borderRadius: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                backgroundColor: 'rgba(255, 255, 255, 1)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            }
                        }}
                        onLoad={() => setLogoLoaded(true)}
                        onError={(e) => {
                            console.error('Erreur de chargement du logo dans le drawer');
                            setLogoLoaded(false);
                        }}
                    />
                ) : (
                    <LogoIcon
                        sx={{
                            height: { xs: 40, sm: 45, md: 50 },
                            '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            }
                        }}
                    />
                )}
                <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    sx={{
                        fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                        fontWeight: 'bold',
                        letterSpacing: 1,
                        color: 'white',
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                    }}
                >
                    LJMDI
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {filteredMenuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={RouterLink}
                                to={item.path}
                                className="sidebar-link"
                                onClick={() => isMobile && setMobileOpen(false)}
                                sx={{
                                    borderRadius: 0,
                                    bgcolor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                                    '&:hover': {
                                        bgcolor: isActive ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.12)',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>
                                    {item.badge && item.path === '/registration-requests' && pendingRequestsCount > 0 ? (
                                        <Badge badgeContent={pendingRequestsCount} color="error">
                                            {item.icon}
                                        </Badge>
                                    ) : (
                                        item.icon
                                    )}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                color="primary"
                sx={{
                    width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
                    ml: isMobile ? 0 : `${drawerWidth}px`,
                    bgcolor: '#558077',
                    height: { xs: 56, sm: 64 },
                    '& .MuiToolbar-root': {
                        minHeight: { xs: 56, sm: 64 },
                        paddingLeft: { xs: 1, sm: 2 },
                        paddingRight: { xs: 1, sm: 2 },
                    }
                }}
            >
                <Toolbar>
                    {logoLoaded ? (
                        <Box
                            component="img"
                            src="/assets/logo.png"
                            alt="Logo LJMDI"
                            sx={{
                                height: { xs: 32, sm: 40, md: 48 },
                                width: 'auto',
                                maxWidth: { xs: 120, sm: 150, md: 180 },
                                mr: { xs: 1, sm: 2 },
                                display: { xs: 'flex', sm: 'flex' },
                                objectFit: 'contain',
                                transition: 'all 0.3s ease',
                                borderRadius: 1,
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                padding: 0.5,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    backgroundColor: 'rgba(255, 255, 255, 1)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                }
                            }}
                            onLoad={() => setLogoLoaded(true)}
                            onError={(e) => {
                                console.error('Erreur de chargement du logo dans la barre supérieure');
                                setLogoLoaded(false);
                            }}
                        />
                    ) : (
                        <LogoIcon
                            sx={{
                                height: { xs: 32, sm: 40, md: 48 },
                                mr: { xs: 1, sm: 2 },
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                }
                            }}
                        />
                    )}
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                            fontWeight: 'bold',
                            letterSpacing: 1,
                            color: 'white'
                        }}
                    >
                        LJMDI
                    </Typography>
                    {user && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                            gap: { xs: 0.5, sm: 1 }
                        }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                                    display: { xs: 'none', md: 'block' }
                                }}
                            >
                                {user.prenom} {user.nom}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                                    display: { xs: 'none', lg: 'block' }
                                }}
                            >
                                ({user.role})
                            </Typography>
                            {user.member_id && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.7rem',
                                        display: { xs: 'none', lg: 'block' },
                                        color: 'rgba(255,255,255,0.7)'
                                    }}
                                >
                                    ID: {user.member_id}
                                </Typography>
                            )}
                            <Avatar
                                sx={{
                                    width: { xs: 24, sm: 28, md: 32 },
                                    height: { xs: 24, sm: 28, md: 32 },
                                    bgcolor: 'secondary.main'
                                }}
                                src={getProfilePhotoUrl(user.photo_url)}
                            >
                                {user.prenom?.charAt(0) || 'U'}
                            </Avatar>
                            <Button
                                color="inherit"
                                onClick={handleLogout}
                                startIcon={<ExitToApp />}
                                sx={{
                                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '1rem' },
                                    padding: { xs: '4px 6px', sm: '4px 8px', md: '6px 16px' },
                                    minWidth: { xs: 'auto', sm: 'auto', md: '64px' }
                                }}
                            >
                                {isMobile ? '' : 'Déconnexion'}
                            </Button>
                            {isMobile && (
                                <IconButton
                                    color="inherit"
                                    aria-label="open drawer"
                                    edge="end"
                                    onClick={handleDrawerToggle}
                                    className="mobile-menu-button"
                                    sx={{ ml: 0.5 }}
                                >
                                    <MenuIcon />
                                </IconButton>
                            )}
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            bgcolor: '#558077',
                        },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            bgcolor: '#558077',
                            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                className="main-content"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: { xs: 1, sm: 2, md: 3 },
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    mt: { xs: '56px', sm: '64px' }, // Dynamic height based on AppBar
                    minHeight: `calc(100vh - ${isMobile ? '56px' : '64px'})`,
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
