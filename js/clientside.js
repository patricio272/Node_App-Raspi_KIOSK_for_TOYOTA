$(document).ready(function(){
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



});