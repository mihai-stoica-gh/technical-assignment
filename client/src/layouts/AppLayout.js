import { Outlet } from "react-router-dom";

export function AppLayout() {
    return (
        <>
            <div className="grid h-[100dvh] place-items-center md:p-4">
                <div className="w-full md:max-w-[1000px] h-full md:max-h-[700px] bg-zinc-900 border border-zinc-800 md:shadow-lg md:rounded-lg overflow-hidden">
                    <Outlet context={{}} />
                </div>
            </div>
        </>
    )
}
