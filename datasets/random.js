'use strict';

const random = require('random-seed');

class RandomDataset {
	constructor() {
		this.seed = Math.random();
		this.rand = random.create();

		this.items = 50000;
		this.range = 2500 - 1;
	}

	flush(simulator) {
		this.rand.seed(this.seed);
		try {
			for(let i=0; i<this.items; i++) {
				simulator.receive(this.rand.intBetween(0, this.range));
			}
		} catch(err) {
			return Promise.reject(err);
		}
		return Promise.resolve();
	}

	destroy() {
	}
}

module.exports = () => new RandomDataset();
