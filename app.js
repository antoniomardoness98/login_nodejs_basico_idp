const express = require('express')
const app = express()
const PORT = 3000

//settings
app.use(express.json())

//middlewares (url encoded nos permite capturar datos del formulario)
app.use(express.urlencoded({extended:false}))

//invocamos a dotenv
const dotenv = require('dotenv')
dotenv.config({path: './env/.env'})

//set direct public
app.use('/resources', express.static('public'))
app.use('/resources', express.static(__dirname + '/public/'))

//esbleciendo motor de plantillas
app.set('view engine', 'ejs');

//invocamos al modulo para hacer hashing de password
const bcryptjs = require('bcryptjs');

//configuramos modulo de sessión:
const session = require('express-session');
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))
//llamamos el modulo de conexión
const connection = require('./database/db');

//establecemos las rutas:

app.get('/login', (req,res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

//Registración
app.post('/register', async (req, res) => {
  const {user, name, rol, pass} = req.body
  let passwordHaash = await bcryptjs.hash(pass, 8)
  connection.query('INSERT INTO users SET ?', {user:user, name:name, rol:rol, pass:passwordHaash}, async(error, results) => {
    
    if(error){
      console.log("ERROR: " + error)
    } else {
      res.render('register', {
        alert: true,
        alertTitle: "Registrad@!",
        alertMessage: "El registro se ha completado con éxito!",
        alertIcon: 'success',
        showConfirmButton: false,
        time: 2000,
        ruta: 'login'
      })
    }

  })
})

//autentificacion
app.post('/auth', async (req, res) => {
  const {user, pass} = req.body
  let passwordHaash = await bcryptjs.hash(pass, 8)
  if(user && pass){
    connection.query('SELECT * FROM users WHERE user = ?', [user], async(error, results) => {
      if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))){
        //sobre que plantilla haremos el render?
        res.render('login', {
          alert: true,
          alertTitle: "Error!",
          alertMessage: "Usuario o contraseña incorrectas",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: 'login'
        })
      } else{
        req.session.loggedin = true
        req.session.name = results[0].name
        res.render('login', {
          alert: true,
          alertTitle: "Conexión exitosa!",
          alertMessage: "Bienvenido!",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 1500,
          ruta: ''
        })
      }
    })
  } else {
    res.render('login', {
      alert: true,
      alertTitle: "Advertencia",
      alertMessage: "Ingresa los campos solicitados",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: 5000,
      ruta: 'login'
    })
  }
})

//autentificando paginas
app.get('/', (req, res) => {
  if(req.session.loggedin){
    res.render('index',{
      login: true,
      name: req.session.name
    })
  } else {
    res.render('index',{
      login: false,
      name: 'Debe iniciar sesión'
    })
  }
})

//Salir de la app
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login')
  })
})

//app listennig
app.listen(PORT, (req, res) => {
  console.log(`Estamos escuchando en el puerto ${PORT}`);
})