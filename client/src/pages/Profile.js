import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { CircleUserRoundIcon, SaveIcon } from "lucide-react";

export function Profile() {
    const navigate = useNavigate();
    const authUser = useAuthUser();
    if(authUser === null || authUser.id === null) {
        navigate('/login');
    }

    const [fields, setFields] = useState({
        id:                 authUser.id,
        name:               authUser.name,
        username:           authUser.username,
        password:           "",
        password_confirm:   "",
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleTextInputChange = (e) => {
        setFields({
            ...fields,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const response = await fetch('http://localhost:3001/v1/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(fields)
            });
            const data = await response.json();
            console.log('data', data);
            if(!response.ok) {
                setErrorMessage(data.message);
            } else {
                setSuccessMessage(data.message);
                setFields({
                    ...fields,
                    password: "",
                    password_confirm: "",
                })
            }
        }
        catch(error){
            console.error(error);
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex gap-4 items-center px-4 py-2">
                <div id="sidebar-toggle-portal" className="flex items-center md:hidden"></div>
                <h2 className="flex gap-1 items-center text-lg font-bold py-1">
                    <CircleUserRoundIcon size={18} /> Profile
                </h2>
            </div>
            <div className="grid w-full h-full place-items-center">
                <form className="flex flex-col gap-4 w-full max-w-[250px]" onSubmit={handleFormSubmit}>
                    <input type="text" name="name" placeholder="Display name" value={fields.name} onChange={handleTextInputChange} required autoFocus 
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <input type="text" name="username" placeholder="Username" value={fields.username} onChange={handleTextInputChange} required
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <input type="password" name="password" placeholder="Password" value={fields.password} onChange={handleTextInputChange}
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <input type="password" name="password_confirm" placeholder="Confirm password" value={fields.password_confirm} onChange={handleTextInputChange}
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <button type="submit" className="flex gap-1 items-center justify-center px-6 py-2 rounded bg-white/5 hover:bg-white/10">
                        <SaveIcon size={18} /> Save
                    </button>
                    {errorMessage !== '' && (
                        <div className="text-center text-red-700">{errorMessage}</div>
                    )}
                    {successMessage !== '' && (
                        <div className="text-center text-green-700">{successMessage}</div>
                    )}
                </form>
            </div>
        </div>
    )
}
