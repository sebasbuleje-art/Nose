const socket = io();

const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const usuarioInput = document.getElementById("usuario");
const contraseñaInput = document.getElementById("contraseña");
const claveMaestraInput = document.getElementById("claveMaestra");
const modoBtn = document.getElementById("modoBtn");
const notif = document.getElementById("notif");

let usuarioActual = "";
let modoOscuro = true;

// 🔐 LOGIN
loginBtn.addEventListener("click", async () => {
  const usuario = usuarioInput.value.trim();
  const contraseña = contraseñaInput.value.trim();
  const claveMaestra = claveMaestraInput.value.trim();

  if (!usuario || !contraseña || !claveMaestra) {
    loginError.textContent = "Por favor completa todos los campos.";
    return;
  }

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contraseña, claveMaestra })
  });
  const data = await res.json();

  if (data.success) {
    usuarioActual = usuario;
    loginDiv.classList.add("hidden");
    chatDiv.classList.remove("hidden");
  } else {
    loginError.textContent = data.message || "Acceso denegado.";
  }
});

// 💬 CHAT
const form = document.getElementById("chat-form");
const input = document.getElementById("msg");
const messages = document.getElementById("messages");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    const msg = `${usuarioActual}: ${input.value}`;
    socket.emit("chat message", msg);
    input.value = "";
  }
});

socket.on("chat message", (msg) => {
  const p = document.createElement("p");
  p.innerHTML = msg;
  messages.appendChild(p);
  messages.scrollTop = messages.scrollHeight;

  if (!msg.startsWith(usuarioActual)) notif.play();
});

socket.on("historial", (historial) => {
  messages.innerHTML = "";
  historial.forEach((msg) => {
    const p = document.createElement("p");
    p.innerHTML = msg;
    messages.appendChild(p);
  });
  messages.scrollTop = messages.scrollHeight;
});

// 📎 Subida de archivos
const fileForm = document.getElementById("file-form");
const fileInput = document.getElementById("file");

fileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();

  if (data.filePath) {
    const link = `<a href="${data.filePath}" target="_blank">${file.name}</a>`;
    socket.emit("chat message", `${usuarioActual} envió un archivo: ${link}`);
  }

  fileInput.value = "";
});

// 🌙/☀️ Modo oscuro/claro
modoBtn.addEventListener("click", () => {
  modoOscuro = !modoOscuro;
  document.body.classList.toggle("light", !modoOscuro);
  modoBtn.textContent = modoOscuro ? "🌙 Modo oscuro" : "☀️ Modo claro";
});