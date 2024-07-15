import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRoundPlusIcon, BotMessageSquare } from "lucide-react";

export function Register() {
    const navigate = useNavigate();

    const [fields, setFields] = useState({
        name:       "",
        username:   "",
        password:   "",
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
            const response = await fetch('http://localhost:3001/v1/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(fields)
            });
            const data = await response.json();
            if(!response.ok) {
                setErrorMessage(data.message);
            } else {
                setSuccessMessage(data.message);
            }
        }
        catch(error){
            console.error(error);
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="grid w-full h-full place-items-center">
            <div className="flex flex-col gap-12 w-full max-w-[300px]">
                <div className="flex justify-center">
                    <BotMessageSquare size={100} strokeWidth={1.25}></BotMessageSquare>
                </div>
                <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
                    <input type="text" name="name" placeholder="Display name" value={fields.name} onChange={handleTextInputChange} required autoFocus 
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <input type="text" name="username" placeholder="Username" value={fields.username} onChange={handleTextInputChange} required
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <input type="password" name="password" placeholder="Password" value={fields.password} onChange={handleTextInputChange} required
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <button type="submit" className="flex gap-1 items-center justify-center px-6 py-2 rounded bg-white/5 hover:bg-white/10">
                        <UserRoundPlusIcon size={18} /> Register
                    </button>
                    {errorMessage !== '' && (
                        <div className="text-center text-red-700">{errorMessage}</div>
                    )}
                    {successMessage !== '' && (
                        <div className="text-center text-green-700">{successMessage}</div>
                    )}
                </form>
                <div className="text-center text-neutral-500">
                    Already have an account?  <Link to="/login" className="text-neutral-300">Log in</Link>
                </div>
            </div>
        </div>
    )
}
