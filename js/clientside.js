$(document).ready(function(){
	slidesObjOriginal = new Object();
	slidesObj = new Object();
	slidesCount = 0;
	var socket = io.connect('http://localhost:3000');

	socket.on('connect',function(){
		// $('#status-text').append('Soy Cliente, me conecte al server. YAHOO!!!');
		// $('#status-text').append('<br>');
	});

	socket.on('disconnect',function(){
		// $('#status-text').append('Soy Cliente, el server se MURIOOO :(');
		// 	$('#status-text').append('<br>');
	});

	socket.on('reconnect',function(){
		// $('#status-text').append('Soy Cliente, me RECONECTE al server. SALVADOO!!!');
		// $('#status-text').append('<br>');
	});

	socket.on('reconnect_attemp',function(){
		// $('#status-text').append('Intentado reconectar');
		// $('#status-text').append('<br>');
	});

	socket.on('reconnecting',function(times){
		// $('#status-text').append('Reconectando. Intento #: '+times);
		// $('#status-text').append('<br>');
	});


	socket.on('marquee', function(data){
		$('#bandaInfo').html(data);
		$('.marquee').marquee({
			duration:25000,
			gap:50,
			delayBeforeStart:0,
			direction:'left',
			duplicated:true
		});
	});

	socket.on('slide',function(data){
		slidesObjOriginal = data;
		socket.emit('getMarquee');
		slidesObj = slidesObjOriginal.slice(0);
		var slideSplashScreen = new Object();
		for(key in slidesObj){
			if(slidesObj[key].esSplashScreen == "1"){
				slidesCount = slidesObj[key].slidesCount;
				slideSplashScreen = slidesObj[key];
				//Se elimina la slide de SplashScreen para SIEMPRE
				slidesObj.splice(key, 1);
				slidesObjOriginal.splice(key, 1);
			}
		}
		$('#divPrincipal').html(slideSplashScreen.contenido);
		console.log('Duration SplashScreen Slide:'+slideSplashScreen.tiempo);
		setTimeout(function(){
			startCycle();
		},slideSplashScreen.tiempo);
	});

	
	video = $('#video');
	// video.on('ended',function(){
	// 	$("#panelVideo").hide();
	// 	$('#panelVideo').attr('src', '');
	// 	startCycle();		
	// });

	video.on('play',function(){
		var duracion = parseInt(this.duration)*1000;
		console.log('Duration Video:'+duracion);
		var videoP = document.getElementById('video');
		videoP.pause();
		socket.emit('startOMX', videoP.src);
		setTimeout(startCycle, duracion);
	});


	function startCycle(){
		//Se acabo el ciclo
		if(slidesObj.length == 0){
			socket.emit('getMarquee');
			slidesObj = slidesObjOriginal.slice(0);
			startCycle();
		}
		// Ciclo
		else{
			slidesObj.reverse();
			var slide = slidesObj.pop();
			slidesObj.reverse();

			if(slide.esVideo == "1"){
				// $("#panelVideo").show();
				$('#video').attr('src', slide.contenido);
			}
			else{
				$('#divPrincipal').html(slide.contenido);
				console.log('Duration Slide:'+slide.tiempo);
				setTimeout(function(){
					startCycle();
				}, slide.tiempo);
			}
		}
	}

});