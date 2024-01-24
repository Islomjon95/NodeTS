import express from 'express';
import "dotenv/config";
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import userRouter from './userRoutes';
import { Server } from 'socket.io'
import { User } from './userModels';
import jwt from 'jsonwebtoken'
const app = express()
const server = http.createServer(app)
const PORT  = process.env.PORT || 4000

app.use(cors())
app.use(express.json())



mongoose.connect(process.env.MONGO_URL!)
const db = mongoose.connection

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Connected to Mongo');  
    server.listen(PORT, () => {
     console.log('listening on port');        
    }) 
})

const io = new Server(server, {
    cors: {
        origin:"https://master--tourmaline-beijinho-d5f39a.netlify.app/"
    }
})

io.on("connection", (socket) => {
    socket.on("private message", async(to, message, myself) => {
        const user = await User.find({email: to})
        const decoded = jwt.verify(myself, process.env.ACCESS_TOKEN_SECRET!)
        const sender = await User.findById(decoded)
        io.sockets.emit("refresh", "new Message");

        if (user) {
            user[0].messages.push({
                reciver: user[0].email,
                message,
                sender: sender?.email,
                time: new Date()
            })
            sender?.messages.push({
                reciver: user[0].email,
                message,
                sender: sender?.email,
                time: new Date()
            })
            await user[0].save();
            await sender?.save();
        }
    })
})

app.use('/', userRouter)