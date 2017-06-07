'use strict';

const transitory = require('transitory');

module.exports = class TransitorySimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = transitory()
			.maxSize(options.maxSize)
			.build();
	}

	receive(id) {
		const hit = this.cache.get(id);
		if(! hit) {
			this.counter.miss();
			this.cache.set(id, id);
		} else {
			this.counter.hit();
		}
	}
};
