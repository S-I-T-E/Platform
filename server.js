const http = require('http');
const express = require('express');
const server = express();
const parseurl = require('parseurl');
const session = require('express-session');
const mongoClient = require('mongodb').MongoClient;
const MongoStore = require('connect-mongo')(express);
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');


const hostname = process.env.IP;
const port = process.env.PORT;
const saltRounds = 4;

var userSession;

server.set('view engine', 'pug')
server.use(express.static('client'))
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use(session({
  secret: 'Orange and red keyboard fish',
  resave: false,
  store: new MongoStore({ url: 'mongodb://localhost:27017/session' }),
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
  if (!userSession.user) {
    res.redirect('/login');
  }
  else {
    res.render('dashboard',{title:'This title was rendered from Node!'})
  }
})

server.get('/login', function(req, res) {
  res.render('login')
})

server.post('/login', function(req, res){
  userSession = req.session;
  mongoClient.connect("mongodb://localhost:27017/logins",function(error,db){
    if(!error){
      console.log("Connected successfully to MongoDB server");
      // console.log("LOGIN INFORMATION: "+JSON.stringify(req.body));
      var collection = db.collection('main');
      collection.findOne({username:req.body.username.toLowerCase()}, function(error,user){
          if(user !== null){
            if(bcrypt.compareSync(req.body.password, user.password)){
              console.log("Password correct!")
              userSession.user = user.username;
              console.log("session user name is "+userSession.user)
              res.redirect("/")
              } else {
              console.log("Login failed! Bad password")
              res.send(false)
              }
          } else { 
            console.log("Login failed! Bad Username")
          }
      });
    }else{
      console.dir(error);
      res.send(error);
    }
    db.close();
  });
})

server.get('/register', function(req, res) {
  res.render('register')
})

server.post('/register', function(req, res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  if(!err){
    mongoClient.connect("mongodb://localhost:27017/logins",function(error,db){
          if(!error){
            console.log("Connected successfully to MongoDB server");
            console.log("LOGIN INFORMATION: "+JSON.stringify(req.body));
            var collection = db.collection('main');
            collection.insert({username:req.body.username.toLowerCase(),password:hash})
          } else{
            console.dir(error);
            res.send(error);
          }
          db.close();
      });
    } else console.log(err)
  });
  res.redirect('/');
})

server.get('/logout', function(req, res) {
  req.session.destroy();
  console.log("session destroyed")
  res.redirect('/')
})

server.get('/dashboard', function(req, res) {
  userSession = req.session;
  if (!userSession.user) {
    res.redirect('/login');
  }
  else {
    res.redirect('/')
  }
})

server.listen(port, function() {
  console.log('Server is running!');
})
