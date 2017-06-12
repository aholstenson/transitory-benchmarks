'use strict';

const LRU = require('lru-cache');

module.exports = class LRUCacheSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = LRU(options.maxSize);
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
