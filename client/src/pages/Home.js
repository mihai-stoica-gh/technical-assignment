import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

export function Home() {
    const navigate = useNavigate();
    const authUser = useAuthUser();

    useEffect(() => {
        if(authUser === null || authUser.id === null) {
            navigate('/login');
        } else {
            navigate('/rooms');
        }
    }, []);

    return (
        <>
        </>
    )
}
