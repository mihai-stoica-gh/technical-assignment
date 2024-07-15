import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { LogInIcon, BotMessageSquare } from "lucide-react";
import { SocketContext } from "../App";

export function Login() {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const signIn = useSignIn();

    const [fields, setFields] = useState({
        username: "",
        password: ""
    });
    const [errorMessage, setErrorMessage] = useState("");

    const handleTextInputChange = (e) => {
        setFields({
            ...fields,
            [e.target.name]: e.target.value
        });
    };
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        setErrorMessage('');
        try {
            const response = await fetch('http://localhost:3001/v1/login', {
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
                if(signIn({
                    auth: {
                        token: data.accessToken,
                        type: 'Bearer'
                    },
                    refresh: data.refreshToken,
                    userState: {
                        id: data.user.id,
                        name: data.user.name,
                        username: data.user.username,
                    }
                })){
                    console.log("Logged in");
                    socket.emit('handshake', data.user.id);
                    navigate("/rooms");
                }else {
                    setErrorMessage('Login failed')
                }
            }
        }
        catch(error){
            console.error('Error',error);
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="grid w-full h-full place-items-center">
            <div className="flex flex-col gap-12 w-full max-w-[250px]">
                <div className="flex justify-center">
                    <BotMessageSquare size={100} strokeWidth={1.25}></BotMessageSquare>
                </div>
                <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
                    <input type="text" name="username" placeholder="Username" value={fields.username} onChange={handleTextInputChange} required
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <input type="password" name="password" placeholder="Password" value={fields.password} onChange={handleTextInputChange} required
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <button type="submit" className="flex gap-1 items-center justify-center px-6 py-2 rounded bg-white/5 hover:bg-white/10">
                        <LogInIcon size={18} /> Log in
                    </button>
                    {errorMessage !== '' && (
                        <div className="text-center text-red-700">{errorMessage}</div>
                    )}
                </form>
                <div className="text-center text-neutral-500">
                    Don't have an account?  <Link to="/register" className="text-neutral-300">Register</Link>
                </div>
            </div>
        </div>
    )
}
