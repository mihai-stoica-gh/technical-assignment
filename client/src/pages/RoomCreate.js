import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { MessageCircleIcon } from "lucide-react";
//import { socket } from "../socket";
import { SocketContext } from "../App";

export function RoomCreate() {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();

    const [fields, setFields] = useState({
        name:   "",
        slug:   "",
    });
    const [errorMessage, setErrorMessage] = useState("");

    const handleTextInputChange = (e) => {
        if(e.target.name === 'slug') {
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/gi, '');
        }
        setFields({
            ...fields,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        setErrorMessage('');
        socket.emit('create_room', fields, (response) => {
            if(response.status === 'error') {
                setErrorMessage(response.message);
            }
            if(response.status === 'ok') {
                navigate(`/rooms/${response.room.slug}`);
            }
        });
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex gap-4 items-center px-4 py-2">
                <div id="sidebar-toggle-portal" className="flex items-center md:hidden"></div>
                <h2 className="flex gap-1 items-center text-lg font-bold py-1">
                    <MessageCircleIcon size={18} /> Create room
                </h2>
            </div>
            <div className="grid w-full h-full place-items-center">
                <form className="flex flex-col gap-4 w-full max-w-[250px]" onSubmit={handleFormSubmit}>
                    <input type="text" name="name" placeholder="Room name" onChange={handleTextInputChange} required autoFocus 
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <input type="text" name="slug" placeholder="Room slug" onChange={handleTextInputChange} required 
                        className="px-4 py-2 bg-transparent border border-white/10 rounded"></input>
                    <button type="submit" className="flex gap-1 items-center justify-center px-6 py-2 rounded bg-white/5 hover:bg-white/10">
                        Create
                    </button>
                    {errorMessage !== '' && (
                        <div className="text-center text-red-700">{errorMessage}</div>
                    )}
                </form>
            </div>
        </div>
    )
}
