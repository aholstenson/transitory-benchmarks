'use strict';

const ARC = require('adaptative-replacement-cache');

module.exports = class ARCSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = new ARC(options.maxSize);
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
