'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');

class OneNumberPerLine {
	constructor(file, sizes, description) {
		this.file = file;
		this.sizes = sizes;
		this.description = description;
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

const sets = [
	{
		id: '2_pools',
		sizes: [ 60, 120, 200, 250, 300, 350, 400, 450 ]
	},
	{
		id: 'cpp',
		sizes: [ 20, 35, 50, 80, 100, 200, 300, 400, 500, 600, 700, 800, 900 ]
	},
	{
		id: 'cs',
		sizes: [ 30, 200, 500, 1000, 1300, 1400 ]
	},
	{
		id: 'gli',
		sizes: [ 30, 200, 500, 1000, 1500, 200, 2400 ]
	},
	{
		id: 'multi1',
		sizes: [ 200, 600, 1000, 1200, 1400, 1600, 1800, 2000 ]
	},
	{
		id: 'multi2',
		sizes: [ 200, 600, 1200, 1800, 2200, 2600, 3000 ]
	},
	{
		id: 'multi3',
		sizes: [ 200, 500, 1000, 1800, 2400, 3200, 3600, 4000 ]
	},
	{
		id: 'ps',
		sizes: [ 30, 100, 350, 500, 750, 1000, 1500, 2000, 2700 ]
	},
	/*
	{
		id: 'sprite',
		sizes: [ 3000 ]
	}
	*/
]

const datasets = module.exports = {}
sets.forEach(set => datasets[set.id] = new OneNumberPerLine(
	path.join(__dirname, set.id + '.trc'),
	set.sizes,
	set.description
));
