import React from 'react';
import './Avatar.css';

interface AvatarProps {
    src?: string | null;
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onClick?: () => void;
    showBorder?: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

function resolveAvatarUrl(src: string | null | undefined): string | null {
    if (!src) return null;
    // If it's already a full URL (e.g. Google profile pic), return as-is
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        return src;
    }
    // Otherwise it's a relative path from our server
    return `${API_BASE}${src}`;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

// Deterministic color from name
function getAvatarColor(name: string): string {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    size = 'md',
    className = '',
    onClick,
    showBorder = false,
}) => {
    const resolvedSrc = resolveAvatarUrl(src);
    const [imgError, setImgError] = React.useState(false);

    const showImage = resolvedSrc && !imgError;

    return (
        <div
            className={`avatar avatar--${size} ${showBorder ? 'avatar--bordered' : ''} ${onClick ? 'avatar--clickable' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            {showImage ? (
                <img
                    src={resolvedSrc}
                    alt={name}
                    className="avatar__image"
                    onError={() => setImgError(true)}
                    draggable={false}
                />
            ) : (
                <div
                    className="avatar__placeholder"
                    style={{ background: getAvatarColor(name) }}
                >
                    <span className="avatar__initials">{getInitials(name)}</span>
                </div>
            )}
        </div>
    );
};

export default Avatar;
