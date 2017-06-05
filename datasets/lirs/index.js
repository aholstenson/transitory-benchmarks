'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');

class OneNumberPerLine {
	constructor(file) {
		this.file = file;
	}

	flush(simulator) {
		return new Promise((resolve, reject) => {
			let reader = readline.createInterface({
				input: fs.createReadStream(this.file)
			});

			reader.on('line', line => {
				const id = parseInt(line);
				try {
					simulator.receive(id);
				} catch(err) {
					reader.close();
					reject(err);
				}
			});

			reader.on('close', resolve);
		});
	}
}

const files = [ '2_pools', 'cpp', 'cs', 'gli', 'multi1', 'multi2', 'multi3', 'ps', 'sprite' ];
const datasets = module.exports = {};

files.forEach(f => datasets[f] = new OneNumberPerLine(path.join(__dirname, f + '.trc')));
