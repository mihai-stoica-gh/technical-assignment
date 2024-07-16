const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');

dotenv.config();
const db = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

/* REST endpoints */
app.get('/v1/test', (req, res) => {
    return res
        .status(200)
        .json({
            message: "Hello"
        });
});

app.post('/v1/register', async (req, res) => {
    try {
        let user = await db.user.findFirst({
            where: {
                username: req.body.username
            }
        });
        if(user !== null) {
            return res
                .status(400)
                .json({
                    message: "Username is already taken."
                });
        }

        //const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(req.body.password, 10);

        user = await db.user.create({
            data: {
                name:       req.body.name,
                username:   req.body.username,
                password:   hash,
            }
        });
        
        return res
            .status(200)
            .json({
                message: "Registration successful. You can now log in.",
            });
    } catch(error) {
        console.log(error);
        return res
            .status(500)
            .json({
                message: "Server error"
            });
    }
});

app.post('/v1/login', async (req, res) => {
    try {
        const user = await db.user.findFirst({
            where: {
                username: req.body.username
            }
        });
        if(user === null) {
            return res
                .status(400)
                .json({
                    message: "Invalid username or password."
                });
        }

        if(await bcrypt.compare(req.body.password, user.password)) {
            const accessToken = jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                }, 
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1d"}
            );
            const refreshToken = jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                }, 
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "30d"}
            );
            return res
                .status(200)
                .json({
                    message: "Login successful.",
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                    }
                });
        } else {
            return res
                .status(400)
                .json({
                    message: "Invalid username or password."
                });
        }
    } catch {
        return res
            .status(500)
            .json({
                message: "Server error."
            });
    }
});

app.post('/v1/profile', async (req, res) => {
    try {
        let user = await db.user.findFirst({
            where: {
                id: req.body.user_id
            }
        });
        if(user == null) {
            return res
                .status(400)
                .json({
                    message: "User not found."
                });
        }
        let user2 = await db.user.findFirst({
            where: {
                id: {
                    not: user.id
                },
                username: req.body.username
            }
        });
        if(user2 !== null) {
            return res
                .status(400)
                .json({
                    message: "Username is already taken."
                });
        }

        let hash = "";
        if(req.body.password !== '') {
            if(req.body.password !== req.body.password_confirm) {
                return res
                    .status(400)
                    .json({
                        message: "Password confirmation doesn't match."
                    });
            } else {
                hash = await bcrypt.hash(req.body.password, 10);
            }
        }
        await db.user.update({
            where: {
                id: user.id
            },
            data: {
                name:       req.body.name,
                username:   req.body.username,
                ...(hash === '' ? {} : {
                    password: hash
                })
            }
        });
        
        return res
            .status(200)
            .json({
                message: "Profile updated. Changes will take effect on your next login.",
            });
    } catch(error) {
        console.log(error);
        return res
            .status(500)
            .json({
                message: "Server error."
            });
    }
});

app.post('/v1/token', (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;
        if(refreshToken === null) {
            return res
                .status(401)
                .json({
                    message: "Invalid refresh token."
                });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if(err) {
                return res
                    .status(403)
                    .json({
                        message: "Invalid refresh token."
                    });
            }
            const accessToken = jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                }, 
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1d"}
            );
            const refreshToken = jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                }, 
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "30d"}
            );
            return res
                .status(200)
                .json({
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                });
        });
    } catch(err) {
        console.log(err);
        return res
            .status(500)
            .json({
                message: "Server error.",
            });
    }
});

/* WS Server */
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000'
    }
});

io.on('connection', async (socket) => {
    console.log(`Socket ${socket.id} connected`);

    socket.emit('handshake', null);
    socket.on('handshake', async (userId) => {
        try {
            const user = await db.user.findFirst({
                where: {
                    id: userId
                }
            });
            if(user === null) {
                return;
            }
            socket.user = {
                id: user.id,
                name: user.name,
                username: user.username,
            };
        } catch(err) {
            console.log(err);
        }
    });

    socket.on("sync_rooms", async () => {
        try {
            const rooms = await db.room.findMany();
            socket.emit("sync_rooms", rooms);
            //console.log(`User ${socket.id} synced rooms`);
        } catch(err) {
            console.log(err);
        }
    });

    socket.on("join_room", async (roomSlug) => {
        try {
            const room = await db.room.findFirst({
                where: {
                    slug: roomSlug
                },
                include: {
                    messages: {
                        include: {
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'asc'
                        }
                    }
                }
            });
            if(room !== null) {
                socket.join(room.slug);
                socket.emit("room_info", {
                    id:     room.id,
                    slug:   room.slug,
                    name:   room.name,
                });
                socket.emit("sync_messages", 
                    room.messages.map((message) => {
                        return {
                            user_id:    message.user_id,
                            user_name:  message.user.name,
                            content:    message.content,
                            datetime:   message.created_at,
                        };
                    })
                );
                const socketIds = io.sockets.adapter.rooms.get(room.slug);
                if(typeof socketIds !== 'undefined') {
                    io.to(room.slug).emit('sync_users', 
                        [...socketIds]
                            .filter((socketId) => typeof io.sockets.sockets.get(socketId).user !== 'undefined')
                            .map((socketId) => {
                                return io.sockets.sockets.get(socketId).user;
                            })
                    );
                }
                //console.log(`User ${socket.id} joined room: ${room.slug}`);
            } else {
                socket.emit("invalid_room", null);
            }
        } catch(err) {
            console.log(err);
        }
    });

    socket.on("leave_room", async (roomSlug) => {
        try {
            const room = await db.room.findFirst({
                where: {
                    slug: roomSlug
                },
            });
            if(room === null) {
                return;
            }
            socket.leave(room.slug);

            const socketIds = io.sockets.adapter.rooms.get(room.slug);
            if(typeof socketIds !== 'undefined') {
                io.to(room.slug).emit('sync_users', 
                    [...socketIds]
                        .filter((socketId) => typeof io.sockets.sockets.get(socketId).user !== 'undefined')
                        .map((socketId) => {
                            return io.sockets.sockets.get(socketId).user;
                        })
                );
            }
            //console.log(`User ${socket.id} left room: ${room.slug}`);
        } catch(err) {
            console.log(err);
        }
    });

    socket.on('send_message', async (message) => {
        try {
            const user = await db.user.findFirst({
                where: {
                    id: message.user_id
                }
            });
            if(user === null) {
                return;
            }
            const room = await db.room.findFirst({
                where: {
                    id: message.room_id
                }
            });
            if(room === null) {
                return;
            }
            const dbMessage = await db.message.create({
                data: {
                    user: {
                        connect: {
                            id: user.id
                        }
                    },
                    room: {
                        connect: {
                            id: room.id
                        }
                    },
                    content: message.content
                },
                include: {
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            socket.to(room.slug).emit("receive_message", {
                user_id:    user.id,
                user_name:  user.name,
                content:    dbMessage.content,
                datetime:   dbMessage.created_at,
            });
        } catch(err) {
            console.log(err);
        }
    });

    socket.on('create_room', async (fields, callback) => {
        try {
            // To do: Validate slug
            let room = await db.room.findFirst({
                where: {
                    slug: fields.slug
                }
            });
            if(room !== null) {
                callback({
                    status: "error",
                    message: "Room slug already exists.",
                });
                return;
            }
            room = await db.room.create({
                data: {
                    slug: fields.slug,
                    name: fields.name,
                }
            });
            callback({
                status: "ok",
                room: room,
            });
            const rooms = await db.room.findMany();
            io.emit('sync_rooms', rooms);
        } catch(err) {
            console.log(err);
            callback({
                status: "error",
                message: "Server error",
            });
        }
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            socket.emit('leave_room', room);
        });
    });

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected`);
    });
});

server.listen(3001, () => {
    console.log("Server is running on port 3001");
});;
