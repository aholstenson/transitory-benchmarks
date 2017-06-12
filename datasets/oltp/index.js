'use strict';

const path = require('path');

const BinaryXzTrace = require('../xz');

module.exports = () => new BinaryXzTrace(
	path.join(__dirname, 'trace-oltp.trc.bin.xz'),
	[ 250, 500, 750, 1000, 2000, 5000, 10000, 15000 ],
	'References to a CODASYL database for a one hour period. Provided by the authors of the ARC algorithm.'
);
