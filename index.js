const express = require("express");
const app = express();
const http = require("http");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ===================
// 📁 Configuración
// ===================
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

// ===================
// 🔐 Usuarios
// ===================
const usuariosPermitidos = { "Sebas": "1234", "Admin": "0000" , "Flavia": "2024"};
const CLAVE_MAESTRA = "FyS"; // cámbiala si quieres

// ===================
// 💾 Historial
// ===================
const historialPath = "./messages.json";
let mensajesGuardados = fs.existsSync(historialPath)
  ? JSON.parse(fs.readFileSync(historialPath))
  : [];

const guardarHistorial = () =>
  fs.writeFileSync(historialPath, JSON.stringify(mensajesGuardados, null, 2));

// ===================
// 🔑 Login
// ===================
app.post("/login", (req, res) => {
  const { usuario, contraseña, claveMaestra } = req.body;
  if (usuariosPermitidos[usuario] === contraseña && claveMaestra === CLAVE_MAESTRA) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Credenciales incorrectas." });
  }
});

// ===================
// 📎 Subida de archivos
// ===================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// ===================
// 💬 Chat
// ===================
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado");

  // enviar historial
  socket.emit("historial", mensajesGuardados);

  // recibir mensajes
  socket.on("chat message", (msg) => {
    mensajesGuardados.push(msg);
    guardarHistorial();
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado");
  });
});

server.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));