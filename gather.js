//Global Variables
slidesCount = 0; //Cant de slides INCLUYENDO la INICIAL id=0, id_categoria=0;
slidesAcum = 0;
id = 0;
id_categoria = 0;
slidesContentArray = new Array();

//Requires
var sys = require('sys');
var exec = require('child_process').exec;
var fs = require('fs');
var wget = require('wget');
var http = require('http');

console.log('GATHERING Script Initialized');

// GATHERING
//Delete Synchronously Previous Content from /img and /vid fodlers
console.log('Cleaning ./img/ and ./vid/ folders');
rmDir('./img/');
rmDir('./vid/');
rmDir('./slides/');

//Start Cycle
cycleSlides();

// getContent('mediaserver.intelimedia.cl', '/ajax/infoPantalla.jsp?id='+id+'&id_categoria='+id_categoria+'&id_instancia=1');


function exec_command(command){
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec(command, puts);
}

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

	function cycleSlides(){
		//First, lets get slidesCount
		var options = {
			hostname: 'mediaserver.intelimedia.cl',
			path: '/ajax/infoPantalla.jsp?id=0&id_categoria=0&id_instancia=1',
			method: 'GET'
		};

		var contenido = '';
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (content) {
				contenido += content;
			});

			res.on('end',function(){
				var obj = JSON.parse(contenido);
				var info = obj.info;
			//slidesCount GOTTEN!!
			slidesCount = parseInt(parseInt(info.slidesCount) + 1); //Son realmente 2 porque considera CASO INICIAL (id=0,id_categoria=0) y sgte (id=0, id_categoria=1), pero el cotenido de la ultima fila de la query es IGUAL al caso INICIAL.
			id = info.id;
			id_categoria = info.id_categoria;
			console.log('slidesCount:'+slidesCount+'\nStart Cycle!!\n\n');

			//Se comienza el ciclo
			getContent('mediaserver.intelimedia.cl', '/ajax/infoPantalla.jsp?id='+id+'&id_categoria='+id_categoria+'&id_instancia=1');
		});
		});

		req.on('error', function(e) {
			console.log('cycleSlides Request Error: ' + e.message);
			req.end();
			setTimeout(function(){
				cycleSlides();
			},1500)
		});

		req.end();
	}


	function getContent(_hostname, _path){
		slidesAcum++;

		var options = {
			hostname: _hostname,
			path: _path,
			method: 'GET'
		};

		console.log('GET: http://'+_hostname+_path);
		var contenido = '';
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (content) {
				contenido += content;
			});

			res.on('end',function(){
				var obj = JSON.parse(contenido);
				processContent(obj.info);
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
		id = info.id;
		id_categoria = info.id_categoria;

		var imgArray = new Array();
		var vidArray = new Array();

		// Download Images
		for(key in info.imagenes){
			var srcIncomplete = info.imagenes[key];
			var imgSrc = 'http://mediaserver.intelimedia.cl/'+srcIncomplete;
			console.log('Downloading Image: ' + imgSrc);

			//Detect JSP or direct IMG
			//JSP
			if(imgSrc.search('loadImagen.jsp')!=-1){
				var imgSrcPosInit = srcIncomplete.lastIndexOf('loadImagen.jsp?a=');
				imgSrcPosInit = parseInt(imgSrcPosInit+17);
				var imgSrcPosFin = srcIncomplete.lastIndexOf('&h');
				var imgOutputName = srcIncomplete.substring(imgSrcPosInit, imgSrcPosFin);

				exec_command("curl '"+imgSrc+"' >> ./img/"+imgOutputName+"");
				console.log('DOWNLOADED: ' + imgSrc);
				imgArray.push({originalPath : srcIncomplete, imgSola: imgOutputName, imgPath : "./img/"+imgOutputName});
			}
			//Direct Image
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

			var strPos = videoSrc.lastIndexOf("/");
			var output = './vid'+videoSrc.substr(strPos);
			var vidSolovar = videoSrc.substr(strPos+1);

			fileDownload(videoSrc, 'vid');
			// exec_command("curl '"+videoSrc+"' >> ./vid/"+vidSolovar);
			console.log('DOWNLOADED: ' + videoSrc);


			vidArray.push({vidSolo : vidSolovar, vidPath : output});
		}
		//Edit HTML Content, to match new local paths for BLOBS
		var htmlContent = info.contenido;
		var newhtmlContent = htmlContent;
		//Edit Images
		if(imgArray.length!=0){
			for(key in imgArray){
				var originalPath = imgArray[key].originalPath;
				var imgSola = imgArray[key].imgSola;
				var imgPath = imgArray[key].imgPath;
				newhtmlContent = newhtmlContent.replace(originalPath, imgPath);
			}
		}
		//Edit Video
		if(vidArray.length!=0){
			for(key in vidArray){
				var vidSolo = vidArray[key].vidSolo;
				var vidPath = vidArray[key].vidPath;
				newhtmlContent = newhtmlContent.replace('http://mediaserver.video.intelimedia.cl/'+vidSolo, vidPath);
			}
		}
		
		//Add to Global Array with all Slides content
		slidesContentArray.push(newhtmlContent);

		//Check Cycle
		console.log('###################################################################');
		console.log('###################################################################');
		console.log('##### slidesAcum:'+slidesAcum+' ; slidesCount:'+slidesCount+' #####');
		console.log('###################################################################');
		console.log('###################################################################');
		if(slidesAcum <= slidesCount){
			getContent('mediaserver.intelimedia.cl', '/ajax/infoPantalla.jsp?id='+id+'&id_categoria='+id_categoria+'&id_instancia=1');
		}
		else{
			console.log('======================= CYCLE FINISHED =======================');
			console.log('==== slidesContentArray ====:');
			for(key=0;key<slidesContentArray.length;key++){
				console.log('Slide: #'+key);
				console.log(slidesContentArray[key]);
			}
		}
	}