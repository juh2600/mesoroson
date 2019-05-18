/**
 * Usage:
 * var logger = require('logger').get('context_name')
 * logger.log('stuff') // yields a message prefixed with '[context_name]'
 */
exports.get = function(role, o = {}) {
	var defaults = {path: './logs/'};
	for(i in defaults) if(!o.hasOwnProperty(i)) o[i] = defaults[i];
	var winston = require('winston');
	var log_format = winston.format.printf(
		info => {info.message = '[' + role + '] ' + info.message; return info;}
	);
	var logger = winston.createLogger({
		level: 'debug',
		format: winston.format.combine(
			log_format,
			winston.format.align()
			),
		transports: []
	});
	logger.add(new winston.transports.File({
		filename: o.path + role + '-error.log',
		level: 'error',
		format: winston.format.simple()
	}));
	logger.add(new winston.transports.File({
		filename: o.path + role + '-combined.log',
		format: winston.format.simple()
	}));
	if(process.env.NODE_ENV !== 'production') {
		logger.add(new winston.transports.Console({
			format: winston.format.simple()
		}));
	}
	return logger;
};
