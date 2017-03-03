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
server.use(bodyParser.urlencoded({
  extended: true
}));

server.use(session({
  secret: 'Orange and red keyboard fish',
  resave: false,
  store: new MongoStore({
    url: 'mongodb://localhost:27017/session'
  }),
  saveUninitialized: true
}))

var logger = function(req, res, next) {
  var date = new Date().toLocaleString();
  console.log(date + ' - Page requested: ' + req.path);
  next();
}

server.use(logger)

server.get('/', function(req, res) {
  userSession = req.session;
  if (!userSession.user) {
    res.redirect('/login');
  }
  else {
    res.redirect('/dashboard');
  }
})

server.get('/login', function(req, res) {
  res.render('login')
})

server.post('/login', function(req, res) {
  userSession = req.session;
  mongoClient.connect("mongodb://localhost:27017/staff", function(error, db) {
    if (!error) {
      console.log("Connected successfully to MongoDB server");
      var collection = db.collection('logins');
      collection.findOne({
        username: req.body.username.toLowerCase()
      }, function(error, user) {
        if (user !== null) {
          if (bcrypt.compareSync(req.body.password, user.password)) {
            console.log("Password correct!")
            userSession.user = user.username;
            userSession.accessLevel = user.accesslvl
            collection = db.collection('info');
            collection.findOne({
              _id: user._id
            }, function(err,result){
            userSession.firstname = result.firstName
            userSession.lastname = result.lastName
            db.close();
            res.redirect("/dashboard")
            })
          }
          else {
            console.log("Login failed! Bad password")
            res.send(false)
          }
        }
        else {
          console.log("Login failed! Bad Username")
        }
      });
    }
    else {
      console.dir(error);
      res.send(error);
    }
  });
})

server.get('/register', function(req, res) {
  res.render('register')
})

server.post('/register', function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    if (!err) {
      mongoClient.connect("mongodb://localhost:27017/staff", function(error, db) {
        if (!error) {
          console.log("Connected successfully to MongoDB server");
          var collection = db.collection('logins');
          collection.insert({
            username: req.body.username.toLowerCase(),
            password: hash,
            accesslvl: req.body.test
          }, function(err, newuser) {
            var uniqueID = newuser.ops[0]._id;
            collection = db.collection('info');
            collection.insert({
              _id: uniqueID,
              firstName: req.body.first_name,
              lastName: req.body.last_name
            }, function(error, result) {
              db.close();
            });
          });
        }
        else {
          console.dir(error);
          res.send(error);
        }
      });
    }
    else console.log(err)
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
    res.render('dashboard', {
      title: 'Hello '+userSession.firstname+'! Your current level of access is: ' + userSession.accessLevel,
      fullname: userSession.firstname+" "+userSession.lastname
    })
  }
})

server.listen(port, function() {
  console.log('Server is running!');
})
