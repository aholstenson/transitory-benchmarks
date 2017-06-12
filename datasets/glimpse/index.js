'use strict';

const path = require('path');

const BinaryXzTrace = require('../xz');

module.exports = () => new BinaryXzTrace(
	path.join(__dirname, 'trace-glimpse.trc.bin.xz'),
	[ 250, 500, 750, 1000, 1250, 1500, 1750, 2000 ],
	'References to a CODASYL database for a one hour period. Provided by the authors of the ARC algorithm.'
);
