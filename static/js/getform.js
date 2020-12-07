$( document ).ready(function() {
	document.getElementById('url').value = window.location.href;
})

$('form').submit(function() {
	event.preventDefault();
	grecaptcha.ready(function() {
		grecaptcha.execute('6LcWLsoZAAAAAEXpuHDLCIpM5bemiSMqQsON-ZND', {action: 'homepage'})
		.then(function(token) {
		  document.getElementById('captchaResponse').value = token;
		  $('form').unbind('submit').submit();
		});
	});
});
