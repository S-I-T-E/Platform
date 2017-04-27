const http = require('http');
const express = require('express');
const server = express();
const parseurl = require('parseurl');
const session = require('express-session');
const mongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const MongoStore = require('connect-mongo')(express);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const spawn = require('child_process').spawn;
var terminalProcess;
const hostname = process.env.IP;
const port = 8080;
const saltRounds = 4;

var userSession;
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
  }
})

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

var upload = multer({
  storage: storage
})

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


server.get('/announcementOpened', function(req, res) {
  var objId = new ObjectID(userSession.userID)
  mongoClient.connect("mongodb://localhost:27017/staff", function(error, db) {
    if (!error) {
      var collection = db.collection('info');
      collection.update({
        '_id': objId
      }, {
        $set: {
            hasSeenAnnouncement: true
        }
      });
      db.close();
    }
  });
  res.send(200)
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
            userSession.userID = user._id;
            userSession.accessLevel = user.accesslvl
            collection = db.collection('info');
            collection.findOne({
              _id: user._id
            }, function(err, result) {
              userSession.firstname = result.firstName
              userSession.lastname = result.lastName
              db.close();
              res.send(200)
            })
          }
          else {
            console.log("Login failed! Bad password")
            res.send(500, 'Login failed! Bad password.')
          }
        }
        else {
          console.log("Login failed! Bad Username")
          res.send(500, 'Login failed! Bad username.')
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
              lastName: req.body.last_name,
              'hasSeenAnnouncement': false,
              userSettings: {
                'fav1': '',
                'fave2': '',
                'fave3': '',
                'fave4': ''
              }
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

server.post('/studentSearch', function(req, res) {
  var query = req.body.search;
  console.log(query);
  mongoClient.connect("mongodb://localhost:27017/students", function(error, db) {
    if (!error) {
      console.log("Connected successfully to MongoDB server");
      var collection = db.collection('demographics');
      collection.find({
        $or: [{
          "Student ID": parseInt(query)
        }, {
          "Student Full Name": {
            $in: [new RegExp(query.toUpperCase())]
          }
        }]
      }, {
        'First Name': true,
        'Last Name': true,
        Grade: true,
        'Student ID': true,
        _id: false
      }).toArray(function(err, docs) {
        console.log("retrieved records:");
        console.log(docs);
        res.send(docs)
      });
      db.close();
    }
  });
});
server.get('/studentlocator', function(req, res) {
  res.render('studentlocator')
})

server.post('/uploadCSV', upload.array('3v7465OC$UsX', 2), function(req, res) {
  console.dir(req.files);
  res.send(200)
  console.log("UPLOADED")
})

server.post('/displayStudentInfo', function(req, res) {
  var id = req.body.studentID
  mongoClient.connect("mongodb://localhost:27017/students", function(error, db) {
    if (!error) {
      console.log("Connected successfully to MongoDB server");
      var collection = db.collection('demographics');
      collection.findOne({
        'Student ID': parseInt(id)
      }, function(err, document) {
        res.send({
          name: document["First Name"] + " " + document["First Name"],
          id: document["Student ID"],
          grade: document.Grade
        })
      });
      db.close();
    }
  });
})

server.post('/updateDB', function(req, res) {
  mongoClient.connect("mongodb://localhost:27017/students", function(error, db) {
    if (!error) {
      console.log("Connected successfully to MongoDB server");
      var collection = db.collection('demographics');
      console.log("about to remove collection...")
      collection.remove({})
      db.close();
      console.log("collection removed.")
      console.log("Now about to spawn child process...")
      terminalProcess = spawn('mongoimport', ['-d=students', '-c=demographics', '--type=csv', '--headerline', '--file=uploads/Demographics.csv']);

      terminalProcess.stdout.on('data', data => {
        console.log(`stdout: ${data}`);
      });

      terminalProcess.stderr.on('data', data => {
        console.log(`stderr: ${data}`);
      });

      terminalProcess.on('close', code => {
        console.log(`child process exited with code ${code}`);
      });
    }
    else {
      console.dir(error);
      res.send(error);
    }
  });
})
server.get('/dashboard', function(req, res) {
  var hasseenannouncementbool;
  userSession = req.session;
  if (!userSession.user) {
    res.redirect('/login');
  }
  else {
    var objId = new ObjectID(userSession.userID)
    mongoClient.connect("mongodb://localhost:27017/staff", function(error, db) {
      if (!error) {
        console.log("Connected successfully to MongoDB server");
        var collection = db.collection('info');
        collection.findOne({
          '_id': objId
        }, function(err, document) {
          if (err) {
            console.log("EROORRR" + err)
            res.send(500)
          }
          else if (document) {
            hasseenannouncementbool = document.hasSeenAnnouncement
            var d = new Date();
            var day = d.getDay();
            var m = d.getMonth();
            var date = d.getDate();
            var y = d.getFullYear();
            switch (day) {
              case 0:
                day = "Sunday";
                break;
              case 1:
                day = "Monday";
                break;
              case 2:
                day = "Tuesday";
                break;
              case 3:
                day = "Wednesday";
                break;
              case 4:
                day = "Thursday";
                break;
              case 5:
                day = "Friday";
                break;
              case 6:
                day = "Saturday";
            }
            switch (m) {
              case 0:
                m = "January";
                break;
              case 1:
                m = "February";
                break;
              case 2:
                m = "March";
                break;
              case 3:
                m = "April";
                break;
              case 4:
                m = "May";
                break;
              case 5:
                m = "June";
                break;
              case 6:
                m = "July";
                break;
              case 7:
                m = "August";
                break;
              case 8:
                m = "September";
                break;
              case 9:
                m = "October";
                break;
              case 10:
                m = "November";
                break;
              case 11:
                m = "December";
                break;
              default:
                m = "Invalid month";
            }
            var dateStr = day + ", " + m + " " + date + ", " + y;
            res.render('dashboard', {
              title: 'Hello ' + userSession.firstname + '! Your current level of access is: ' + userSession.accessLevel,
              accesslevel: userSession.accessLevel,
              fullname: userSession.firstname + " " + userSession.lastname,
              fullDate: dateStr,
              newAnnouncement: !hasseenannouncementbool
            })
            db.close();
          }
        });
      }
    });
  }
})

server.listen(port, function() {
  console.log('Server is running!');
})
