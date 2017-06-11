'use strict';

const LFU = require('tiny-lfu-cache');

module.exports = class TinyLFUSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = new LFU(options.maxSize);
	}

	receive(id) {
		id = String(id);
		const hit = this.cache.get(id);
		if(hit == null) {
			this.counter.miss();
			this.cache.put(id, id);
		} else {
			this.counter.hit();
		}
	}
};
