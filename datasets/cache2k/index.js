'use strict';

const path = require('path');

const files = [ '20121220', '20130703', 'db-20160419-busy', 'db-20160419-night' ];
const datasets = module.exports = {};

const BinaryXzTrace = require('../xz');

files.forEach(f => datasets[f] = new BinaryXzTrace(path.join(__dirname, 'trace-mt-' + f + '.trc.bin.xz')));
