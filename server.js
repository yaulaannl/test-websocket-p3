/**** Module dependencies ****/
var express = require('express'),
  path = require('path'),
  util = require('util'),
  url = require('url'),
  events = require('events'),
  favicon = require('serve-favicon'),
  bodyParser = require('body-parser'),
  exphbs = require('express-handlebars'),
  passport = require('passport'),
  session = require('express-session'),
  authentication = require('./authentication');

/**** helpers ****/
var handlebars = require('./helpers/handlebars');

/**** routes ****/
var index = require('./routes');


var WebSocketServer = require("ws").Server;
var http = require("http")
var exp = express();

/*
 *Setting up express
 *
 * */

//wiring handlebar templates and helpers
exp.engine('handlebars', exphbs({
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    defaultLayout: 'main',
    helpers: handlebars	    
}));
exp.set('view engine', 'handlebars');
exp.set('views', path.join(__dirname, 'views'));

//use favicon  
exp.use(
    favicon(
      path.join(__dirname, 'public', 'img', 'mbhlogo.png'), {
        maxAge: 2592000000
      } // 1 month
    )
);

exp.use(bodyParser.json());
exp.use(bodyParser.urlencoded({
    extended: true
}));

exp.enable('view cache');

exp.use(express.static(
  path.join(__dirname, 'public'), {
    maxAge: 604800000
  }
));

/* Alan: session and passport session */
/*
exp.use(session({
           secret: authentication.mySecret,
           resave: false,
           saveUninitialized: false
}));
*/
  /*Alan: use passport authentication */
  //exp.use(passport.initialize());
  //exp.use(passport.session());
  //authentication.init(exp);


/**** error handler ****/
exp.use(function(err, req, res, next) {

    var status = err.status || 200;

    res.format({
      html: function() {
        res.status(status).render('error', {
          message: err.stack,
          error: {}
        });
      },
      json: function() {
        res.json(status, {
          success: (status === 200 ? true : false),
          message: err.message
        });
      }
    });

});

/*
 *
 * Adding routes
 *
 */
exp.get('/', index.home);  //home

/**** 404 handler ****/
exp.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


/*

Starting http and ws server

*/
var port = process.env.PORT || 8081;
var server = http.createServer(exp)
server.listen(port)
console.log("http server listening on %d", port)
var wss = new WebSocketServer({server: server})
console.log("websocket server created")


/*

Setting ws server callbacks

*/
wss.myBroadcast = function(data) {
  for (var i in this.clients){
     this.clients[i].send(data);
     console.log('sent to client[' + i + '] ' + data);
  }
};


wss.on("connection", function(ws) {

  //get url
  var loc = ws.upgradeReq.url; 
  var query  = url.parse(loc ,true).query;
  var device = query.device;
  //var device = ws.upgradeReq.headers.device;

  //constantlu pinging clients
  /*
  var id = setInterval(function() {
      console.log("send ping: C")
      //ws.send(JSON.stringify(new Date()), function() {  })
      ws.send("C",function() {  })
    
  }, 12000);
  */ 
     
  
  
  console.log("websocket connection open to device: " + device );
  console.log(ws.upgradeReq.headers);
  
  ws.on('message', function(message) {
      console.log('received: %s', message);
      //make decision based on device parameter
      if( device === 'panel')	wss.myBroadcast(message);
      if( device === 'photon')  console.log("received " + message + " from photon");   
  });  
        

  ws.on("close", function() {
     console.log("websocket connection close")
     clearInterval(id)
  })
  
  
})  // end wss.on
