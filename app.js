var slidesArray = new Array();

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


// GATHERING
//Delete Synchronously Previous Content from /img and /vid fodlers
console.log('Cleaning ./img/ and ./vid/ folders');
rmDir('./img/');
rmDir('./vid/');

getContent('mediaserver.intelimedia.cl', '/ajax/infoPantalla.jsp?id=244&id_categoria=19&id_instancia=1');




//Socket.io Code
io.on('connection', function (socket) {
	console.log('Connected Client: '+socket.id);


// PLAYING
// Getting Marquee (Indicadores)
getMarquee(socket);




socket.on('disconnect', function () {
	console.log('Disconnected Client: '+socket.id);
});
});


function rmDir(dirPath){
	try { var files = fs.readdirSync(dirPath); }
	catch(e) { return; }
	if (files.length > 0)
		for (var i = 0; i < files.length; i++) {
			var filePath = dirPath + '/' + files[i];
			if (fs.statSync(filePath).isFile())
				fs.unlinkSync(filePath);
			else
				rmDir(filePath);
		}
	};

	function fileDownload(src, filetype){
		var strPos = src.lastIndexOf("/");
		var output = './'+filetype+src.substr(strPos);
		var download = wget.download(src, output);
		download.on('error', function(err) {
			console.log('fileDownload ERROR:' + err + '\nsrc:'+src);
			setTimeout(function(){
				fileDownload(src, filetype);
			},1500);
		});
		download.on('end', function(output) {
			console.log('DOWNLOADED: ' + output);
		});
	}

	function getMarquee(socket){
		var options = {
			hostname: 'mediaserver.intelimedia.cl',
			path: '/ajax/getMarquee.jsp?quien=1',
			method: 'GET'
		};

		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (content) {
				socket.emit('marquee', content);
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

	function getContent(_hostname, _path){
		var options = {
			hostname: _hostname,
			path: _path,
			method: 'GET'
		};

		console.log('GET: http://'+_hostname+_path);
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (content) {
				var contenido = JSON.parse(content);
				processContent(contenido.info);
			});
		});

		req.on('error', function(e) {
			console.log('Request Error: ' + e.message);
			req.end();
			setTimeout(function(){
				getContent(_hostname, _path);
			},1500)
		});

		req.end();
	}

	function processContent(info){
		var imgArray = new Array();
		var vidArray = new Array();

		// Download Images
		for(key in info.imagenes){
			var srcIncomplete = info.imagenes[key];
			var imgSrc = 'http://mediaserver.intelimedia.cl/'+srcIncomplete;
			console.log('Downloading Image: ' + imgSrc);

			//Detect JSP or direct IMG
			if(imgSrc.search('loadImagen.jsp')!=-1){
				var imgSrcPosInit = srcIncomplete.lastIndexOf('loadImagen.jsp?a=');
				imgSrcPosInit = parseInt(imgSrcPosInit+17);
				var imgSrcPosFin = srcIncomplete.lastIndexOf('&h');
				var imgOutputName = srcIncomplete.substring(imgSrcPosInit, imgSrcPosFin);

				exec_command("curl '"+imgSrc+"' >> ./img/"+imgOutputName+"");
				console.log('DOWNLOADED: ' + imgSrc);
				imgArray.push({originalPath : srcIncomplete, imgSola: imgOutputName, imgPath : "./img/"+imgOutputName});
			}
			else{
				var imgSrcPosInit = srcIncomplete.lastIndexOf("/");
				var imgOutputName = './img'+srcIncomplete.substr(imgSrcPosInit);

				exec_command("curl '"+imgSrc+"' >> "+imgOutputName+"");
				console.log('DOWNLOADED: ' + imgSrc);
				var imgSolavar = srcIncomplete.substr(imgSrcPosInit+1);
				imgArray.push({originalPath : srcIncomplete, imgSola: imgSolavar, imgPath : imgOutputName});
			}
		}
		// If there is Video, download it
		if(info.esVideo == "1"){
			var videoPosInit = info.contenido.lastIndexOf('http://mediaserver.video.intelimedia.cl');
			var videoPosFin = info.contenido.lastIndexOf('</div>');
			var videoSrc = info.contenido.substring(videoPosInit, videoPosFin);
			console.log('Downloading Video: ' + videoSrc);
			fileDownload(videoSrc, 'vid');

			var strPos = videoSrc.lastIndexOf("/");
			var output = './vid'+videoSrc.substr(strPos);
			var vidSolovar = videoSrc.substr(strPos+1);
			vidArray.push({vidSolo : vidSolovar, vidPath : output});
		}
		//Edit HTML Content, to match new local paths for BLOBS
		var htmlContent = info.contenido;
		var newhtmlContent = htmlContent;
		//Edit Images
		for(key in imgArray){
			var originalPath = imgArray[key].originalPath;
			var imgSola = imgArray[key].imgSola;
			var imgPath = imgArray[key].imgPath;
			newhtmlContent = newhtmlContent.replace(originalPath, imgPath);
		}
		//Edit Video
		var vidSolo = vidArray[0].vidSolo;
		var vidPath = vidArray[0].vidPath;
		newhtmlContent = newhtmlContent.replace('http://mediaserver.video.intelimedia.cl/'+vidSolo, vidPath);
		

	}

	function exec_command(command){
		function puts(error, stdout, stderr) { sys.puts(stdout) }
		exec(command, puts);
	}

	function cycleSlides(id, id_categoria){
		
	}