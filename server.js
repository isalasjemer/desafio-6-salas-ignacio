const express = require("express");
const app = express();
//const multer = require('multer')
const {Server : ioServer} = require('socket.io')
const http = require('http')
const Productos = require("./productos")
const Mensajes = require('./mensajes')

const archivoNuevo = new Productos();
const mensajesLlegados = new Mensajes('mensajes.txt')

//Creo los servidores
const httpServer = http.createServer(app)
const io = new ioServer(httpServer) 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname+"/public"));

//Rutas
app.get("/", (req, resp) => {
  const productos = archivoNuevo.getAll();
  resp.render('pages/index', {productos: productos}) // lo busca en views
})

app.set('views', './views') // este no es necesario??
app.set('view engine', 'ejs')


let messages = []
let productos = []

async function devolverMensajes(){
  messages = await mensajesLlegados.getAll()
  io.sockets.emit('mensajesEnviados', messages)
}

//Levanto el servidor io
io.on('connection', socket => {
  console.log("cliente conectado")
  
  io.sockets.emit('productos', productos)

  socket.on('newProduct', (product) =>{
    archivoNuevo.save(product);
    productos = archivoNuevo.getAll()
    io.sockets.emit('productosEnviados', productos);
  })

  devolverMensajes()
  socket.on('newMessage', async data =>{
    await mensajesLlegados.save(data)
    messages = await mensajesLlegados.getAll()
    io.sockets.emit('mensajesEnviados', messages)
  })
});

//empiezo el server
const PORT = 8080;
const server = httpServer.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});

server.on('error', error => console.log(`Error en el servidor ${error}`))