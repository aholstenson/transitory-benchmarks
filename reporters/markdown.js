'use strict';

const table = require('markdown-table');
const fs = require('fs');

module.exports = class MarkdownRepoter {
	constructor(file) {
		this.file = file;

		this.parts = [];
	}

	addDataset(set) {
		this.parts.push('## ' + set.name);
		this.parts.push('');
		this.parts.push('* __Unique entries__: ' + set.stats.uniqueEntries);
		this.parts.push('* __Trace length__: ' + set.stats.length);
		this.parts.push('');

		const optionKeys = set.options.map(opt => opt.maxSize + '<br><sup>' + opt.ratio + '%</sup>');
		const t = table([
			[ 'Cache', ...optionKeys ],
			...set.simulators.map(sim => {
				return [
					sim == 'optimal' ? '_Optimal_' : sim,
					...set.options.map((opt, idx) => {
						const res = set.results[idx][sim];
						if(res instanceof Error) {
							if(res.message === 'Timeout') {
								return '_Slow_';
							}
							return '_-_';
						}

						let rate = res.hitRate;
						if(sim == 'optimal') {
							return rate;
						}

						if(res.isOptimal && res.allSame) {
						} else if(res.isBest) {
							rate = '**' + rate + '**';
						}

						let msg;
						if(res.hitRateVsBest != 1.0) {
							msg = rate + '<br><small>-' + ((1.0 - res.hitRateVsBest) * 100).toFixed(2) + '%</small>';
						} else {
							msg = rate + '<br><small>-0.0%</small>';
						}
						return msg;
					})
				]
			})
		], { align: [ 'l', ...set.simulators.map(() => 'r') ] });
		this.parts.push(t);
		this.parts.push('');
	}

	finish() {
		fs.writeFileSync(this.file, this.parts.join('\n'));
		console.log('Markdown written to', this.file);
	}
}
