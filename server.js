const http = require('http');
const express = require('express');
const server = express();
const parseurl = require('parseurl');
const session = require('express-session');
const mongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo')(express);
var bodyParser = require('body-parser');


const hostname = process.env.IP;
const port = process.env.PORT;

var userSession;

server.use(express.static('client'))
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use(session({
  secret: 'Orange and red keyboard fish',
  resave: false,
  store: new MongoStore({ url: 'mongodb://localhost:27017/databasegoeshere' }),
  saveUninitialized: true
}))

var logger = function(req, res, next) {
  var date = new Date().toLocaleString();
  console.log(date+' - Page requested: '+req.path);
  next();
}

server.use(logger)

server.get('/', function(req, res) {
  userSession = req.session;
  if (!userSession.email) {
    res.redirect('/login');
  }
  else {
    res.sendfile('client/dashboard.html')
  }
})

server.get('/login', function(req, res) {
  res.sendfile('client/login.html')
})

server.post('/login', function(req, res){
  userSession = req.session;
  userSession.email = req.body.emailaddress;
  res.redirect('/');
})

server.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/')
})

server.get('/dashboard', function(req, res) {
  userSession = req.session;
  if (!userSession.email) {
    res.redirect('/login');
  }
  else {
    res.sendfile('client/dashboard.html')
  }
})

server.listen(port, function() {
  console.log('Server is running!');
})
