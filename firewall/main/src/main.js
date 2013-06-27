var http = require('http');
var sys  = require('sys');
var PermContr = require('./controller/permissionController').PermissionController;
var BruteForce = require('./controller/bruteForce').BruteForce;
var logging = require('./controller/logging');

var permContr = new PermContr();
var bruteForce = new BruteForce();
var logger = logging.logger;

// create the proxy server
http.createServer(function(request, response) {
	sys.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
	
	// check the requests against black- & whitelist
	var ip = request.connection.remoteAddress;
	if (permContr.isBanned(ip)) {
		msg = "IP " + ip + " is banned!";
		permContr.deny(response, msg);
		sys.log(msg);
		return;
	}
	if (!permContr.isAllowed(ip)) {
		msg = "IP " + ip + " is not allowed to use this proxy";
		permContr.deny(response, msg);
		sys.log(msg);
		return;
	}
	// check the request for brute-force attacks
	if (bruteForce.check(ip)) {
		msg = "IP " + ip + " is blocked due to too many requests";
		permContr.deny(response, msg);
		sys.log(msg);
		return;
	}
	
	// options for the proxy request
	request.headers.host = '';
	var options = {
		hostname: 'localhost',
		port: 8080,
		path: request.url,
		method: request.method,
		headers: request.headers
	};
  
	// create the proxy request object
	var proxy_request = http.request(options); 
	// add listeners to the proxy request 
	proxy_request.addListener('response', function (proxy_response) {

		proxy_response.on('data', function(chunk) {
			response.write(chunk, 'binary');
		});

		proxy_response.on('end', function() {
			response.end();
		});

		proxy_response.on('error', function(error) {
			sys.log('request.listener - error: ' + error);
		});
		
		response.writeHead(proxy_response.statusCode, proxy_response.headers);
	});
	
	// add the listeners for the requests
	request.on('data', function(chunk) {
		proxy_request.write(chunk, 'binary');
	});

	request.on('end', function() {
		proxy_request.end();
	});
 
	request.on('error', function(error) {
	});
	
}).listen(8081);

permContr.updatePermissions();