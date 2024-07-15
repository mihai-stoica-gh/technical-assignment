import { Routes, Route } from "react-router-dom";
import { createContext, useEffect } from "react";
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import AuthOutlet from '@auth-kit/react-router/AuthOutlet';
import { socket } from './socket';

import { AppLayout } from "./layouts/AppLayout";
import { SidebarLayout } from "./layouts/SidebarLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { RoomIndex } from "./pages/RoomIndex";
import { Room } from "./pages/Room";
import { RoomCreate } from "./pages/RoomCreate";
import { NotFound } from "./pages/NotFound";

export const SocketContext = createContext();

function App() {
    const authUser = useAuthUser();

    useEffect(() => {
        //socket.connect();
        socket.on('handshake', () => {
            socket.emit('handshake', authUser?.id ?? "");
        });
        return () => {
            socket.off('handshake');
            //socket.disconnect();
        }
    }, [])

    return (
        <SocketContext.Provider value={socket}>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login/>} />
                    <Route path="/register" element={<Register/>} />
                    <Route element={<AuthOutlet fallbackPath='/login' />}>
                        <Route element={<SidebarLayout />}>
                            <Route path="/profile" element={<Profile/>} />
                            <Route path="/rooms">
                                <Route index element={<RoomIndex />} />
                                <Route path="create" element={<RoomCreate />} />
                                <Route path=":roomSlug" element={<Room />} />
                            </Route>
                        </Route>
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </SocketContext.Provider>
    )
}

export default App;
