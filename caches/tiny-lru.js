'use strict';

const lru = require('tiny-lru');

module.exports = class TinyLRUSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = lru(options.maxSize);
	}

	receive(id) {
		let str = String(id);

		const hit = this.cache.get(str);
		if(hit == null) {
			this.counter.miss();
			this.cache.set(str, id);
		} else {
			this.counter.hit();
		}
	}
};
