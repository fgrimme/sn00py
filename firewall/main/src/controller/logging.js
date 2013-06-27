var winston = require('winston');
var conf = require('../conf/config.js');

var default_ = {console:{level:"info"},file:{filename:"../../log/server.log", level:"debug"}};
var logging  = conf.logging || default_ ;

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(logging.console),
      new (winston.transports.File)(logging.file)
    ]
});

exports.logger = logger;