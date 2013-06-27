var sys  = require('sys');

BruteForce = function() {
	var _this = this;
	var _time = 30;
	var _maxTries = 2;
	var _connections = {};

	var addConnection = function(ip){
		sys.log('Adding ' + ip + ' to connections');
		if (_connections[ip])  _connections[ip] += 1;
		else _connections[ip] = 1;
		sys.log(_connections[ip]);
	};
	
	this.check = function(ip){
		sys.log('BruteForce check ...');
		if (_connections[ip] && _connections[ip] >= _maxTries) {
			sys.log('Brute-Force detected - Culprit: ' + ip);
			return true;
		} else {
			addConnection(ip);
			return false;
		}
	};
};
exports.BruteForce = BruteForce;