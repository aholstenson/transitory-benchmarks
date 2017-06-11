'use strict';

const lru = require('tiny-lru');

module.exports = class TinyLRUSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = lru(options.maxSize);
	}

	receive(id) {
		id = String(id);
		const hit = this.cache.get(id);
		if(hit == null) {
			this.counter.miss();
			this.cache.set(id, id);
		} else {
			this.counter.hit();
		}
	}
};
