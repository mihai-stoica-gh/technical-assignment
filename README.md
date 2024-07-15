# Technical Assignment: Real time chat app

Features:
- Users can register and log in based on username and password
- Users can edit their profile
- Users can create and join rooms
- Users can send and receive messages
- Users can see the online status of other users

## Server

Tech: 
- express
- prisma
- sqlite
- jsonwebtoken
- socket.io

Auth uses REST endpoints.
Messaging uses Web Sockets.

To run the server:

```
cd server
npm install
npm start
```

## Client

Tech:
- react
- react-router
- react-auth-kit
- tailwind
- socket.io-client

To run the client:

```
cd client
npm install
npm start
```

## Test accounts

| Username | Password |
|----------|----------|
| johndoe  | johndoe  |
| janedoe  | janedoe  |
