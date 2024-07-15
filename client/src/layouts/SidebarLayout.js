import { useContext, useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { PlusIcon, MessageCircleIcon, LogOutIcon, CircleUserRoundIcon, MenuIcon } from "lucide-react";
//import { socket } from '../socket';
import { SocketContext } from "../App";

export function SidebarLayout() {
    const socket = useContext(SocketContext);

    const [showSidebar, setShowSidebar] = useState(false);
    const [rooms,       setRooms]       = useState([]);
    
    const [isMounted,   setIsMounted]   = useState(false);
    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
        socket.emit('sync_rooms', null);
        socket.on('sync_rooms', (rooms) => {
            setRooms(rooms);
        });

        return () => {
            socket.off('sync_rooms');
        }
    }, []);

    return (
        <>
            <div className="flex h-full">
                <div className="hidden md:block w-1/4 max-w-[250px] border-r border-zinc-800">
                    <SidebarContent rooms={rooms} />
                </div>
                <div className="grow">
                    <Outlet context={{}} />
                </div>
            </div>
            {showSidebar && (
                <Sidebar rooms={rooms} setParentShowSidebar={setShowSidebar} />
            )}
            {isMounted && createPortal(
                <button type="button" onClick={() => {setShowSidebar(!showSidebar)}} className="">
                    <MenuIcon size={20} />
                </button>,
                document.getElementById('sidebar-toggle-portal')
            )}
        </>
    )
}

function Sidebar({rooms, setParentShowSidebar}) {
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        setShowSidebar(true);
    }, []);

    const closeSidebar = () => {
        setShowSidebar(false);
        setTimeout(() => {
            setParentShowSidebar(false);
        }, 350);
    }

    return (
        <div onClick={() => {closeSidebar()}} className={`fixed inset-0 ${showSidebar ? 'bg-black/50' : 'bg-transparent'} transition-colors duration-300`}>
            <div className={`md:hidden absolute inset-0 right-auto z-10 w-3/4 max-w-[250px] bg-zinc-900 ${showSidebar ? "-translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
                <SidebarContent rooms={rooms} />
            </div>
        </div>
    )
}

function SidebarContent({rooms}) {
    const navigate = useNavigate();
    const authUser = useAuthUser();
    const signOut = useSignOut();

    return (
        <div className="h-full flex flex-col px-2 pb-2">
            <div className="px-4 py-2">
                <h2 className="text-lg font-bold py-1">Rooms</h2>
            </div>
            <div className="grow flex flex-col gap-[1px] overflow-auto">
                {rooms.map((room) => {
                    return (
                        <NavLink key={room.id} to={`/rooms/${room.slug}`} className={({isActive}) => {
                            return `flex gap-1 items-center px-4 py-2 rounded ${isActive ? "bg-white/10" : "hover:bg-white/5"} transition-colors`
                        }}>
                            <MessageCircleIcon size={18} /> {room.name}
                        </NavLink>
                    )
                })}
            </div>
            <NavLink to="/rooms/create" className={({isActive}) => {
                return `flex gap-1 items-center px-4 py-2 rounded ${isActive ? "bg-white/10" : ""} hover:bg-white/5 transition-colors`
            }}>
                <PlusIcon size={18} /> New room
            </NavLink>
            <div className="w-full h-[1px] bg-white/10 my-1"></div>
            <NavLink to="/profile" className={({isActive}) => {
                return `flex gap-1 items-center px-4 py-2 rounded ${isActive ? "bg-white/10" : "hover:bg-white/5"} transition-colors`
            }}>
                <CircleUserRoundIcon size={18} /> {authUser.name}
            </NavLink>
            <button type="button" onClick={() => {signOut(); navigate('/login');}} className="flex gap-1 items-center px-4 py-2 rounded hover:bg-white/5 transition-colors">
                <LogOutIcon size={18} /> Log out
            </button>
        </div>
    )
}
