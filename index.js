'use strict';

const chalk = require('chalk');
const Counter = require('./counter');
const Table = require('./table');
const DatasetStats = require('./dataset-stats');

const MarkdownReporter = require('./reporters/markdown');

const ora = require('ora');

const simulators = {
	'optimal': require('./caches/optimal'),

	'transitory': require('./caches/transitory'),
	'tiny-lfu-cache': require('./caches/tiny-lfu'),
	'lfu-cache': require('./caches/lfu-cache'),
	'guild': require('./caches/guild'),
	'arc': require('./caches/arc'),

	//'hashlru': require('./caches/hashlru'), // Disabled due to exceeding max size
	'tiny-lru': require('./caches/tiny-lru'),
};

const datasets = {};
pushDataset('random');
pushDataset('lirs');
//pushDataset('oltp');
pushDataset('glimpse');
//pushDataset('cache2k');

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

function sequenceArray(data, runner) {
	return new Promise((resolve, reject) => {
		let idx = 0;
		const result = [];

		let count = data.length;
		function runNext() {
			if(count-- == 0) {
				resolve(result);
				return;
			}

			const value = data[idx++];
			runner(value)
				.then(r => {
					result.push(r);

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
function simulate(dataset, simulator, options, progress) {
	const counter = new Counter();
	const sim = new simulators[simulator](counter, options);
	const now = Date.now();
	const spinner = ora(progress.current + '/' + progress.total + ' maxSize=' + options.maxSize + ' ' + simulator).start();
	let promise = dataset.flush(sim, spinner);

	if(promise.abort) {
		const flush = promise;
		promise = new Promise((resolve, reject) => {
			// Schedule a timeout if the cache can not sustain 10k ops / sec
			let time = setTimeout(() => {
				reject(new Error('Timeout'));
				flush.abort();
			}, Math.ceil(options.length / 10000) * 1000);

			flush
				.then(resolve)
				.catch(reject)
				.then(() => clearTimeout(time));
		});
	}

	return promise
		.then(() => {
			if(sim.finish) {
				spinner.text = simulator + ' maxSize=' + options.maxSize + ' Finishing';
				sim.finish();
			}

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
		}).then(v => {
			// Force GC if we can
			if(global.gc) global.gc();

			spinner.stop();
			return v;
		});
}

function toPowerOfN(n) {
	return Math.pow(2, Math.floor(Math.log(n) / Math.LN2));
}

function simulateDataset(dataset) {
	dataset = dataset();
	const stats = new DatasetStats();
	const spinner = ora('Collecting statistics').start();
	return dataset.flush(stats, spinner)
		.then(() => {
			spinner.stop();

			console.log('  Unique Entries:', stats.uniqueEntries, 'Length:', stats.length)
			console.log();

			const entries = stats.uniqueEntries;
			const sizes = [ 0.1, 0.25, 0.5, 0.75, 0.80, 0.90 ];

			const options = [];
			const addedSizes = new Set();
			function push(size) {
				if(size < 5 || size >= entries) return;
				if(addedSizes.has(size)) return;

				addedSizes.add(size);
				options.push({
					maxSize: size,
					length: stats.length,
					ratio: ((size / entries) * 100).toFixed(1)
				});
			}

			sizes.forEach(s => {
				const size = Math.floor(entries * s);
				const powerOfN = toPowerOfN(size);

				// Add a version adjusted to nearest 250
				push(Math.floor(size / 250) * 250);

				// Add the nearest power of N
				push(powerOfN);
			});

			options.sort((a, b) => a.maxSize - b.maxSize);

			const progress = {
				current: 0,
				total: options.length * Object.keys(simulators).length
			};
			return sequenceArray(options, opt => {
				return sequence(simulators, (sim, key) => {
					progress.current++;
					return simulate(dataset, key, opt, progress)
				});
			}).then(r => ({
				stats: stats,
				simulators: Object.keys(simulators),
				options: options,
				results: r
			}));
		});
}

function report(dataset, reporter) {
	console.log('Dataset:', chalk.bold(dataset));
	return simulateDataset(datasets[dataset])
	.then(set => {
		set.name = dataset;
		const options = set.options;
		const results = set.results;

		/*
		 * Enhance every option with details about the best hit rate, the
		 * optimal hit rate and the difference between them.
		 */
		options.forEach((opt, idx) => {
			let best = 0;
			let allSame = true;
			const optimal = results[idx]['optimal'] ? results[idx]['optimal'].hitRate : null;
			Object.keys(results[idx]).forEach(key => {
				if(key === 'optimal') return;

				const res = results[idx][key];
				if(best !== 0 && res.hitRate && best.toFixed(4) !== res.hitRate.toFixed(4)) {
					allSame = false;
				}

				if(res.hitRate > best) {
					best = res.hitRate;
				}
			});

			opt.hitRate = {
				optimal: optimal ? optimal.toFixed(4) : null,
				best: best.toFixed(4),

				allSame: allSame
			};

			Object.keys(results[idx]).forEach(key => {
				const res = results[idx][key];
				if(! res.hitRate) return;

				if(optimal) {
					res.hitRateVsOptimal = res.hitRate / optimal;
				}

				if(best > 0) {
					res.hitRateVsBest = res.hitRate / best;
				}

				res.hitRate = res.hitRate.toFixed(4);
				res.isBest = res.hitRate == opt.hitRate.best;
				res.isOptimal = res.hitRate == opt.hitRate.optimal;
			});
		});


		const table = new Table();
		const optionKeys = options.map(opt => opt.maxSize);
		table.columns('Cache', ...optionKeys, 'Time');

		Object.keys(simulators).forEach(key => {
			let time = 0;
			const mapped = options.map((opt, idx) => {
				const res = results[idx][key];
				if(res instanceof Error) {
					if(res.message === 'Timeout') {
						return chalk.yellow('Slow');
					}
					return chalk.red('-');
				}

				time += res.time;

				const rate = res.hitRate;
				if(key == 'optimal') {
					return chalk.dim(rate);
				} else if(res.isOptimal && res.allSame) {
					return chalk.yellow(rate);
				} else if(res.isBest) {
					return chalk.green(rate) + '*';
				} else {
					return rate;
				}
			});
			table.row(key, ...mapped, time + ' ' + chalk.dim('ms'));
		});
		table.print();
		console.log('');

		if(reporter) {
			reporter.addDataset(set);
		}
	});
}

const args = require('yargs').argv;
const reporter = args.markdown ? new MarkdownReporter(args.markdown) : null;

if(args.dataset) {
	report(args.dataset, reporter)
		.then(() => reporter && reporter.finish())
		.catch(console.error);
} else {
	sequence(datasets, (d, key) => {
		return report(key, reporter);
	})
		.then(() => reporter && reporter.finish())
		.catch(console.error);
}
