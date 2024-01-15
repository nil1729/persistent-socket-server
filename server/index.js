const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { Emitter } = require("@socket.io/redis-emitter");
const { createClient } = require("redis");
const PORT = process.env.PORT;
const MACHINE_ID = process.env.MACHINE_ID;
const rooms = ["room1", "room2"];
const socketRoomMap = {};

if (!PORT || !MACHINE_ID) {
  throw new Error("PORT and MACHINE_ID env variables are required");
}

const io = new Server();

// redis > v3.0.6
const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();
const redisClient = createClient({ url: "redis://localhost:6379" });
const emitter = new Emitter(redisClient);

Promise.all([
  pubClient.connect(),
  subClient.connect(),
  redisClient.connect(),
]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  io.listen(PORT);
});

io.on("connection", (socket) => {
  const randomNumberBetween0And1 = Math.floor(Math.random() * 2);
  const rndRoom = rooms[randomNumberBetween0And1];
  socket.join(rndRoom);
  console.log(
    `Socket ${socket.id} joined room ${rndRoom} via machine ${MACHINE_ID}`
  );
  socketRoomMap[socket.id] = rndRoom;

  socket.on("event", function (...args) {
    args.push(MACHINE_ID);
    const room = socketRoomMap[socket.id];
    console.log(`Emitting event to ${room} via machine ${MACHINE_ID}`);
    emitter.to(room).emit("event", args);
  });
});
