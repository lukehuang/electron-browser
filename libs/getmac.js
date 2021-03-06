// Generated by CoffeeScript 1.10.0
var exec, extractOptsAndCallback, getMac, isMac, isWindows, macRegex, zeroRegex,typeChecker;

exec = require('child_process').exec;
typeChecker = require('./typechecker')
function eachr (subject, callback) {
	// Handle
	if ( typeChecker.isArray(subject) ) {
		for ( let key = 0; key < subject.length; ++key ) {
			const value = subject[key]
			if ( callback.call(subject, value, key, subject) === false ) {
				break
			}
		}
	}
	else if ( typeChecker.isPlainObject(subject) ) {
		for ( const key in subject ) {
			if ( subject.hasOwnProperty(key) ) {
				const value = subject[key]
				if ( callback.call(subject, value, key, subject) === false ) {
					break
				}
			}
		}
	}
	else if ( typeChecker.isMap(subject) ) {
		const entries = subject.entries()
		let entry; while ( entry = entries.next().value ) {
			const [key, value] = entry  // destructuring
			if ( callback.call(subject, value, key, subject) === false ) {
				break
			}
		}
	}
	else {
		// Perhaps falling back to a `for of` loop here would be sensible
		throw new Error('eachr does not know how to iterate what was passed to it')
	}

	// Return
	return subject
}

extractOptsAndCallback = function (opts, next, config = {}) {
	// Empty, set default
	if ( config.completionCallbackNames == null ) {
		config.completionCallbackNames = ['next']
	}

	// Not array, make array
	else if ( typeChecker.isArray(config.completionCallbackNames) === false ) {
		config.completionCallbackNames = [config.completionCallbackNames]
	}

	// Arguments
	if ( typeChecker.isFunction(opts) && next == null ) {
		next = opts
		opts = {}
	}
	else if ( !opts ) {
		opts = {}
	}

	// Completion callback
	if ( !next ) {
		// Cycle the completionCallbackNames to check if the completion callback name exists in opts
		// if it does, then use it as the next and delete it's value
		eachr(config.completionCallbackNames, function (completionCallbackName) {
			if ( typeof opts[completionCallbackName] !== 'undefined' ) {
				next = opts[completionCallbackName]
				delete opts[completionCallbackName]
				return false  // break
				// ^ why this only does the first, and not all, using the last, I don't know ...
				// can be changed in a future major update
			}
		})
	}

	// Ensure
	if ( !next )  next = null

	// Return
	return [opts, next]
};

isWindows = process.platform.indexOf('win') === 0;

macRegex = /(?:[a-z0-9]{2}[:\-]){5}[a-z0-9]{2}/ig;

zeroRegex = /(?:[0]{2}[:\-]){5}[0]{2}/;

getMac = function(opts, next) {
  var command, data, extractMac, ref;
  ref = extractOptsAndCallback(opts, next), opts = ref[0], next = ref[1];
  data = opts.data;
  if (data == null) {
    data = null;
  }
  command = isWindows ? "getmac" : "ifconfig -a || ip link";
  extractMac = function(data, next) {
    var err, isZero, macAddress, match, result;
    result = null;
    while (match = macRegex.exec(data)) {
      macAddress = match[0];
      isZero = zeroRegex.test(macAddress);
      if (isZero === false) {
        if (result == null) {
          result = macAddress;
        }
      }
    }
    if (result === null) {
      err = new Error('could not determine the mac address from:\n' + data);
      return next(err);
    }
    return next(null, result);
  };
  if (data) {
    return extractMac(data, next);
  } else {
    return exec(command, function(err, stdout, stderr) {
      if (err) {
        return next(err);
      }
      return extractMac(stdout, next);
    });
  }
};

isMac = function(macAddress) {
  var ref;
  return ((ref = String(macAddress).match(macRegex)) != null ? ref.length : void 0) === 1;
};

module.exports = {
  macRegex: macRegex,
  getMac: getMac,
  isMac: isMac
};
