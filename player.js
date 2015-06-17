//Global Variables
resultObj = new Object();
// slidesContentArray = new Array();

//Requires
var sys = require('sys');
var exec = require('child_process').exec;
var fs = require('fs');
var wget = require('wget');
var http = require('http');
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
	console.log('Listening on port ' + app.get('port'));
});

app.use(express.static(__dirname + '/'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});


//Read ./slides/slides.json
var resultStr = fs.readFileSync('./slides/slides.json').toString();
resultObj = JSON.parse(resultStr);



//Socket.io Code
io.on('connection', function (socket) {
	console.log('Connected Client: '+socket.id);

// PLAYING
//Send COMPLETE resultObj to client
startCycle(socket);


socket.on('getMarquee', function(){
	getMarquee(socket);
});

socket.on('disconnect', function () {
	console.log('Disconnected Client: '+socket.id);
});
});



function startCycle(socket){
	socket.emit('slide', resultObj);
}

function getMarquee(socket){
	var options = {
		hostname: 'mediaserver.intelimedia.cl',
		path: '/ajax/getMarquee.jsp?quien=1',
		method: 'GET'
	};

	var contenido = '';
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (content) {
			contenido += content;
		});

		res.on('end',function(){
			var obj = contenido;
			socket.emit('marquee', obj);
		});
	});

	req.on('error', function(e) {
		console.log('Request Error: ' + e.message);
		req.end();
		setTimeout(function(){
			getMarquee(socket);
		},1500)
	});

	req.end();
}