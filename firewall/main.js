var http = require('http');
var sys  = require('sys');
var fs   = require('fs');

// list all ip addresses that should be blocked
var blacklist = [];
// list all ip addresses that should be allowed
var whitelist = [];

// watch the config files for black- and whitelist
// if a file changes update the list at runtime - no restart required
try {
	fs.watchFile('./conf/blacklist', function(c,p) { updatePermissions(); });
	fs.watchFile('./conf/whitelist', function(c,p) { updatePermissions(); });
} catch (err){
	sys.log(err);
}

// read the allowed and blocked ip addresses from the config files
// triggered once when server starts & and everytime the config changes
function updatePermissions() {
	sys.log("Updating permissions");
	try {
		blacklist = fs.readFileSync('./conf/blacklist', encoding='utf8').split('\n')
						.filter(function(ip) { return ip.length });
		whitelist = fs.readFileSync('./conf/whitelist', encoding='utf8').split('\n')
						.filter(function(ip) { return ip.length });
	} catch (err) {
		sys.log(err);
	}
}

// check if the ip is blacklisted/banned
// @param ip: the ip address to check
function isBanned(ip){
	for (i in blacklist) {
		if (blacklist[i] == ip) {
			return true;
		}
	} 
	return false;
}

// if the config file is not empty check if the ip is whitelisted/allowed
// @param ip: the ip address to check
function isAllowed(ip) {
	if (whitelist.length == 0) return true;
	for (i in whitelist) {
		if (whitelist[i] == ip) {
			return true;
		}
	}
	return false;
}

// when invalid client deny the response
function deny(response, msg) {
  response.writeHead(403);
  response.write(msg);
  response.end();
}

// create the proxy server
http.createServer(function(request, response) {
	sys.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);
	
	// check the incoming requests against black- & whitelist
	var ip = request.connection.remoteAddress;
	if (isBanned(ip)) {
		msg = "IP " + ip + " is banned!";
		deny(response, msg);
		sys.log(msg);
		return;
	}
	if (!isAllowed(ip)) {
		msg = "IP " + ip + " is not allowed to use this proxy";
		deny(response, msg);
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

		proxy_response.addListener('data', function(chunk) {
			response.write(chunk, 'binary');
		});

		proxy_response.addListener('end', function() {
			response.end();
		});

		proxy_response.addListener('error', function(error) {
			sys.log('request.listener - error: ' + error);
		});
		
		response.writeHead(proxy_response.statusCode, proxy_response.headers);
	});
	
	// add the listeners for the requests
	request.addListener('data', function(chunk) {
		proxy_request.write(chunk, 'binary');
	});

	request.addListener('end', function() {
		proxy_request.end();
	});
 
	request.addListener('error', function(error) {
	});
	
}).listen(8081);

updatePermissions();