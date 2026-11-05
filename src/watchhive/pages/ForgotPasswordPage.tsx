import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const email = searchParams.get('email');
        navigate(`/watch-hive/login${email ? `?email=${encodeURIComponent(email)}` : ''}`, { replace: true });
    }, [navigate, searchParams]);

    return null;
};

export default ForgotPasswordPage;
