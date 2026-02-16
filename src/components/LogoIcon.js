import React from 'react';

const LogoIcon = ({ sx = {}, ...props }) => (
    <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        sx={{
            ...sx,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            padding: '8px'
        }}
        {...props}
    >
        <rect width="24" height="24" rx="4" fill="#558077" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">
            LJ
        </text>
    </svg>
);

export default LogoIcon;
