import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { MessageCircleIcon } from "lucide-react";

export function RoomIndex() {
    const authUser = useAuthUser()

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex gap-4 items-center px-4 py-2">
                <div id="sidebar-toggle-portal" className="flex items-center md:hidden"></div>
                <h2 className="flex gap-1 items-center text-lg font-bold py-1">
                    &nbsp;
                </h2>
                <div className="grow"></div>
                <div className="flex flex-row gap-2 items-center">
                </div>
            </div>
            <div className="grid w-full h-full place-items-center">
                <div className="flex flex-col items-center">
                    <MessageCircleIcon size={64} color="#333" /><br></br>
                    <div>Hi, <span className="text-white font-semibold">{authUser.name}</span>!</div>
                    <div>Join a room or create one.</div>
                </div>
            </div>
        </div>
    )
}
