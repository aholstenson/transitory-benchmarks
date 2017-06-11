'use strict';

const LFU = require('lfu-cache');

module.exports = class LFUCacheSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = LFU(options.maxSize);
	}

	receive(id) {
		const hit = this.cache.get(id);
		if(hit == null) {
			this.counter.miss();
			this.cache.set(id, id);
		} else {
			this.counter.hit();
		}
	}
};
