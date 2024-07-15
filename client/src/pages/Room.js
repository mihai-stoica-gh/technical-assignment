import React, { useContext, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { MessageCircleIcon, CircleUserRoundIcon, SearchIcon, SendHorizontalIcon, SmileIcon, PaperclipIcon, UsersIcon } from "lucide-react";
import { Tooltip } from 'react-tooltip';
import { emojis } from '../emojis';
import moment from "moment";
//import { socket } from '../socket';
import { SocketContext } from "../App";

export function Room() {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const authUser = useAuthUser();
    if(authUser === null || authUser.id === null) {
        navigate('/login');
    }
    const { roomSlug } = useParams();

    const [room,            setRoom]           = useState(null);
    const [messages,        setMessages]       = useState([]);
    const [users,           setUsers]          = useState([]);
    const [inputMessage,    setInputMessage]   = useState("");
    const [showEmojis,      setShowEmojis]     = useState(false);
    const [showUsers,       setShowUsers]      = useState(false);

    const prevRoomSlug  = useRef("");
    const messagesRef   = useRef();
    const bottomRef     = useRef();

    useEffect(() => {
        if(prevRoomSlug.current !== '') {
            socket.emit("leave_room", prevRoomSlug.current);
            //console.log(`Left room: ${prevRoomSlug.current}`);
        }

        prevRoomSlug.current = roomSlug;
        socket.emit("join_room", roomSlug);
        //console.log(`Joined room: ${roomSlug}`);
    }, [roomSlug]);

    useEffect(() => {
        socket.on('invalid_room', (room) => {
            navigate("/rooms");
        });
        socket.on('room_info', (room) => {
            setRoom(room);
        });
        socket.on('sync_messages', (messages) => {
            setMessages(
                messages.map((message) => {
                    return {
                        ...message,
                        own: message.user_id === authUser.id
                    }
                })
            );
            scrollToBottom(true);
        });
        socket.on('sync_users', (users) => {
            setUsers(users);
        });
        socket.on('receive_message', (message) => {
            setMessages((prev) => {
                return [
                    ...prev,
                    {
                        ...message,
                        own: message.user_id === authUser.id
                    }
                ]
            });
            scrollToBottom();
        });

        return () => {
            socket.off('invalid_room');
            socket.off('room_info');
            socket.off('sync_messages');
            socket.off('receive_message');

            socket.emit("leave_room", prevRoomSlug.current);
            //console.log(`Left room: ${prevRoomSlug.current}`);
        }
    }, []);
    
    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        const message = {
            user_id:    authUser.id,
            user_name:  authUser.name,
            room_id:    room.id,
            room_name:  room.name,
            content:    inputMessage,
            datetime:   moment().format('YYYY-MM-DD HH:mm:ss'),
        }
        socket.emit("send_message", message);
        setMessages((prev) => {
            return [
                ...prev,
                {
                    user_id:    message.user_id,
                    user_name:  message.user_name,
                    content:    message.content,
                    datetime:   message.datetime,
                    own:        true,
                }
            ]
        });
        scrollToBottom();
        setInputMessage("");
    };

    // Scroll to bottom of messages when a new message appears
    // To do: Unless user scrolled up to look at older messages
    const scrollToBottom = (jump = false) => {
        setTimeout(() => {
            if(jump === true) {
                if(messagesRef.current != null) {
                    messagesRef.current.scrollTo(0, messagesRef.current.scrollHeight);
                }
            } else {
                if(bottomRef.current != null) {
                    bottomRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }
        }, 0);
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex gap-4 items-center px-4 py-2 border-b border-zinc-800">
                <div id="sidebar-toggle-portal" className="flex items-center md:hidden"></div>
                <h2 className="flex gap-1 items-center text-lg font-bold py-1">
                    <MessageCircleIcon size={18} /> <span className="capitalize">{roomSlug}</span>
                </h2>
                <div className="grow"></div>
                <div className="flex flex-row gap-2 items-center">
                    <button className="p-2 rounded hover:bg-white/5 tooltip-search">
                        <SearchIcon size={18} />
                    </button>
                    <button onClick={() => {setShowUsers(!showUsers)}} className="p-2 rounded hover:bg-white/5 tooltip-users">
                        <UsersIcon size={18} />
                    </button>
                </div>
            </div>
            <div className="grow flex flex-row items-stretch relative overflow-hidden">
                <div ref={messagesRef} className="grow flex flex-col gap-2 px-4 py-4 bg-black/20 overflow-auto">
                    {messages.map((message, index, array) => {
                        const showUser = !(index > 0 && array[index-1].user_id === message.user_id);
                        const user = users.find((user) => user.id === message.user_id);
                        const isOnline = typeof user !== 'undefined';
                        //return <Message message={message} showUser isOnline></Message>;
                        return (
                            <React.Fragment key={index}>
                                {showUser && (
                                    <div className={`${message.own ? "ms-auto" : ""} flex gap-1 items-center pt-2`}>
                                        <div className="relative">
                                            <CircleUserRoundIcon size={20} /> 
                                            {isOnline && (
                                                <span className="block absolute w-2 h-2 bg-green-600 rounded-full top-3 left-3 shadow"></span>
                                            )}
                                        </div>
                                        {message.user_name}
                                    </div>
                                )}
                                <div className={`group w-400px w-3/4 max-w-[600px] ${message.own ? "ms-auto" : ""} bg-white/5 px-3 py-2 rounded`}>
                                    <div className="text-[0.92rem] whitespace-pre-line">{message.content}</div>
                                    <div className="text-[0.7rem] leading-none text-end text-neutral-500 -my-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{moment(message.datetime).format('YYYY-MM-DD HH:mm')}</div>
                                </div>
                            </React.Fragment>
                        )
                    })}
                    <div ref={bottomRef}></div>
                </div>
                <div className={`absolute inset-0 z-10 left-full ${showUsers ? 'transform: -translate-x-full' : ''} w-3/4 max-w-[250px] flex flex-col bg-zinc-900 transition-all duration-300`}>
                    <div className="grow flex flex-col gap-2 px-2 py-4 overflow-auto">
                        <div className="flex flex-col gap-[1px] overflow-x-hidden">
                            {users.map((user) => {
                                return (
                                    <div key={user.id} className="flex items-center gap-1 px-4 py-2">
                                        <CircleUserRoundIcon size={18} /> {user.name}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-zinc-800">
                <div className="flex flex-row gap-2 items-center px-4 py-2">
                    <div className="flex flex-row gap-2 items-center">
                        <button type="button" onClick={() => {setShowEmojis(!showEmojis)}} className="p-2 rounded hover:bg-white/5 tooltip-emoji">
                            <SmileIcon size={18} />
                        </button>
                        <button className="p-2 rounded hover:bg-white/5 tooltip-file">
                            <PaperclipIcon size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleFormSubmit} className="grow flex flex-row gap-2 items-center">
                        <textarea rows="1" placeholder="Type a message..." value={inputMessage}
                            onChange={(e) => {setInputMessage(e.target.value)}}
                            onKeyDown={(e) => {
                                if(e.key === "Enter" && !e.shiftKey && "form" in e.target) {
                                    e.preventDefault();
                                    e.target.form.requestSubmit();
                                }
                            }} 
                            className="grow bg-transparent focus:border-white/50 focus:outline-none transition-colors resize-none"></textarea>
                        <button type="submit" className="p-2 rounded hover:bg-white/5 tooltip-send">
                            <SendHorizontalIcon size={18} />
                        </button>
                    </form>
                </div>
                <div className={`grid transition-all duration-300 ease-in-out ${showEmojis ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className='overflow-hidden'>
                        <div className="h-24 px-4 overflow-auto border-t border-white/10">
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(40px,1fr))] gap-1">
                                {emojis.map((emoji, index) => {
                                    return (
                                        <button key={index} type="button" onClick={() => {setInputMessage(inputMessage + emoji)}} className="p-1 hover:bg-white/5 text-2xl">{emoji}</button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Tooltip anchorSelect=".tooltip-search" content="Search (To do)"></Tooltip>
            <Tooltip anchorSelect=".tooltip-users" content="Online users"></Tooltip>
            <Tooltip anchorSelect=".tooltip-emoji" content="Emoji"></Tooltip>
            <Tooltip anchorSelect=".tooltip-file" content="File (To do)"></Tooltip>
            <Tooltip anchorSelect=".tooltip-send" content="Send"></Tooltip>
        </div>
    )
}
