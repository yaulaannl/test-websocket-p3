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

/* websocket connection group */
var devices = [];
var panels = [];


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
exp.use(session({
           secret: authentication.mySecret,
           resave: false,
           saveUninitialized: false
}));

/*Alan: use passport authentication */
exp.use(passport.initialize());
exp.use(passport.session());
authentication.init(exp);


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
/*login and authentication*/
exp.get('/login', index.login);
exp.post('/login', function (req,res,next){
        passport.authenticate('local', function(err,user,info) {
                if (err){
                        return next(err);
                }else if (!user){
                        return res.redirect('/login');
                }else{
                        req.logIn(user, function (err){
                                if(err){
                                        return next(err);
                                }
                                var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/login';
                                delete req.session.redirectTo;
                                res.redirect(redirectTo);

                        });
                }

        })(req,res,next);
});

//protect all endpoints except home and login
exp.all('*', function(req,res,next){
        //non authenticated routes
        //home and login
        if(req.url === '/' || req.url === '/login') return next();

        console.log(req.session);
        if (req.isAuthenticated()) {
                console.log('is authenticated');
                return next();
        }
        //remembering current path
        req.session.redirectTo = req.path;
        res.redirect('/login');

});

exp.get('/', index.home);  //home
exp.get('/panel', index.panel(devices));  //home


/**** 404 handler. Must be after the routes ****/
exp.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


/*

Starting http and ws server

*/
var port = process.env.PORT || 8081;
var server = http.createServer(exp);
server.listen(port);
console.log("http server listening on %d", port);

/* setting websocket options*/
var webSockOpts = 
  {	server: server,
	verifyClient: function(info){
		var question = url.parse(info.req.url, true, true);
		//1. verify keys
		var apiKey = question.query.API_KEY;
		return contains(apiKey, authentication.apiKeys);
	}
  };
	  
var wss = new WebSocketServer(webSockOpts);
console.log("websocket server created");


/*

Setting ws server callbacks

*/
wss.myBroadcast = function(data, group) {
  for(var i = 0; i < group.length; i++){
     this.clients[group[i]].send(data);
     console.log('sent to client[' + i + '] ' + data);
  }
};


/*device command*/
var cmdMeasure = "Hola!";

wss.on("connection", function(ws) {

  //get client properties upon connection
  var loc = ws.upgradeReq.url; 
  var parse1  = url.parse(loc ,true);
  var pathname = parse1.pathname.split("/");
  var lastpath = pathname[pathname.length - 1];

  console.log("websocket connection open to device: " + lastpath );
 
  //if device
  if(lastpath === "device"){
	//get id
	var did = wss.clients.indexOf(ws);
	console.log("connected device id: " + did);
	if(did != -1){
		devices.push(did);
	}
  }

  //if panel
  if(lastpath === "panel"){
	//get id
	var pid = wss.clients.indexOf(ws);
	console.log("connected panel id: " + pid);
	if(pid != -1){
		panels.push(pid);
	}
  }
  
	 
  //when receiving message  
  ws.on('message', function(message) {
      console.log('received: %s', message);
      //case panel
      if(lastpath === 'panel'){
		var idx = parseInt(message);
		//check 
		if(isNaN(idx)) return;
	        var client = wss.clients[idx];
		if(client == null) return;	
		wss.clients[idx].send(cmdMeasure);
		//echo
		var oidx = wss.clients.indexOf(ws);
		var echo = 'Panel #' + oidx + " sends to device #" + idx;
		wss.myBroadcast(echo,panels);
      }

      if(lastpath === 'device'){
		wss.myBroadcast(message,panels);
	      
      }
  });  
        

  //when a device closes
  ws.on("close", function() {
     console.log("websocket connection close");
     //remove from list
    var did = wss.clients.indexOf(ws);
    console.log("removing device id: " + did);
    if(did != -1 && lastpath === 'device' ){
	devices.splice(did,1);
    }
    if(did != -1 && lastpath === 'panel' ){
	panels.splice(did,1);
    }


	    
  });
  
  
})  // end wss.on


/* 
 *
 * helper functions 
 *
 *
 * */
function contains(key,keyA){
	var len1 = keyA.length;
	for(var i = 0; i < len1; i++ ){
		if(key === keyA[i]) return true;
	}
	return false;
			
}

