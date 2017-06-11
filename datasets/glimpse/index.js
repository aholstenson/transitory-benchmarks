'use strict';

const path = require('path');

const BinaryXzTrace = require('../xz');

module.exports = () => new BinaryXzTrace(path.join(__dirname, 'trace-glimpse.trc.bin.xz'));
