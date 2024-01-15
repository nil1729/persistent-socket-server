const os = require("os")
const { Server } = require("socket.io")
const { createAdapter } = require("@socket.io/redis-adapter")
const { Emitter } = require("@socket.io/redis-emitter")
const { createClient } = require("redis")
const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT
const MACHINE_ID =
  NODE_ENV === "docker" ? os.hostname() : process.env.MACHINE_ID
const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT
const rooms = ["room1", "room2"]
const socketRoomMap = {}

if (!PORT || !MACHINE_ID || !REDIS_HOST || !REDIS_PORT) {
  throw new Error(
    `PORT::${PORT}, MACHINE_ID::${MACHINE_ID}, REDIS_HOST::${REDIS_HOST}, REDIS_PORT::${REDIS_PORT} env variables are required`
  )
}

const io = new Server()

// redis > v3.0.6
const pubClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
})
const subClient = pubClient.duplicate()
const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
})
const emitter = new Emitter(redisClient)

Promise.all([
  pubClient.connect(),
  subClient.connect(),
  redisClient.connect(),
]).then(() => {
  io.adapter(createAdapter(pubClient, subClient))
  io.listen(PORT)
  console.log(`server started on ${MACHINE_ID} and listening on ${PORT}`)
})

io.on("connection", (socket) => {
  const randomNumberBetween0And1 = Math.floor(Math.random() * 2)
  const rndRoom = rooms[randomNumberBetween0And1]
  socket.join(rndRoom)
  console.log(
    `Socket ${socket.id} joined room ${rndRoom} via machine ${MACHINE_ID}`
  )
  socketRoomMap[socket.id] = rndRoom

  socket.on("event", function (...args) {
    args.push(MACHINE_ID)
    const room = socketRoomMap[socket.id]
    console.log(`Emitting event to ${room} via machine ${MACHINE_ID}`)
    emitter.to(room).emit("event", args)
  })
})
