'use strict';

const HLRU = require('hashlru');

module.exports = class HLRUSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = new HLRU(options.maxSize);
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
