'use strict';

const chalk = require('chalk');
const Counter = require('./counter');
const Table = require('./table');

const simulators = {
	'optimal': require('./caches/optimal'),

	'transitory': require('./caches/transitory'),
	'tiny-lfu': require('./caches/tiny-lfu'),

	'hashlru': require('./caches/hashlru'),
	'tiny-lru': require('./caches/tiny-lru'),
};

const datasets = {};
pushDataset('random');
pushDataset('lirs');

const options = {
	10: { maxSize: 10 },
	50: { maxSize: 50 },
	100: { maxSize: 100 },
	250: { maxSize: 250 },
	500: { maxSize: 500 },
	1000: { maxSize: 1000 },
	2500: { maxSize: 2500 },
	5000: { maxSize: 5000 },
};

function pushDataset(file) {
	const ds = require('./datasets/' + file);
	if(typeof ds === 'function') {
		datasets[file] = ds;
	} else {
		Object.keys(ds).forEach(key => {
			let factory = toFactory(ds[key]);
			datasets[file + '.' + key] = factory;
		});
	}
}

function toFactory(f) {
	return typeof f === 'function' ? f : () => f;
}

function sequence(data, runner) {
	return new Promise((resolve, reject) => {
		const keys = Object.keys(data);
		let idx = 0;
		const result = {};

		let count = keys.length;
		function runNext() {
			if(count-- == 0) {
				resolve(result);
				return;
			}

			const key = keys[idx++];
			runner(data[key], key)
				.then(r => {
					result[key] = r;

					return runNext();
				})
				.catch(reject);
		}

		runNext();
	});
}

/**
 * Run a simulation of the given dataset over the given type of simulator.
 *
 * Will return basic stats about the time, hits and and misses.
 */
function simulate(dataset, simulator, options) {
	const counter = new Counter();
	const sim = new simulator(counter, options);
	const now = Date.now();
	return dataset.flush(sim)
		.then(() => {
			if(sim.finish) sim.finish();

			const time = Date.now() - now;

			return {
				time: time,
				hits: counter.hits,
				misses: counter.misses,
				hitRate: counter.hitRate
			};
		})
		.catch(err => {
			return err;
		});
}

function simulateDataset(dataset, options) {
	dataset = dataset();
	return sequence(simulators, sim => simulate(dataset, sim, options));
}

function report(dataset) {
	console.log('Dataset:', chalk.bold(dataset));
	console.log();
	return sequence(options, (opt, key) => {
		return simulateDataset(datasets[dataset], opt);
	})
	.then(results => {
		const table = new Table();
		const optionKeys = Object.keys(options)
		table.columns('Cache', ...optionKeys, 'Time');

		// Find the best value
		optionKeys.forEach(opt => {
			let best = 0;
			let allSame = true;
			Object.keys(results[opt]).forEach(key => {
				if(key === 'optimal') return;

				const res = results[opt][key];
				if(best !== 0 && res.hitRate && best.toFixed(2) !== res.hitRate.toFixed(2)) {
					allSame = false;
				}

				if(res.hitRate > best) {
					best = res.hitRate;
				}
			});
			options[opt].best = best.toFixed(2);
			options[opt].allSame = allSame;
		});

		Object.keys(simulators).forEach(key => {
			let time = 0;
			const mapped = optionKeys.map(opt => {
				const res = results[opt][key];
				if(res instanceof Error) {
					return chalk.red('-');
				}

				time += res.time;

				const rate = res.hitRate.toFixed(2);
				if(key == 'optimal') {
					return chalk.dim(rate);
				} else if(rate == options[opt].best) {
					if(options[opt].allSame) {
						return chalk.yellow(rate);
					}
					return chalk.green(rate) + '*';
				} else {
					return rate;
				}
			});
			table.row(key, ...mapped, time + ' ' + chalk.dim('ms'));
		});
		table.print();
		console.log('');
	});
}

sequence(datasets, (d, key) => {
	return report(key, { maxSize: 500 });
}).catch(console.error);
