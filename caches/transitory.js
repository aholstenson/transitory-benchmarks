'use strict';

const transitory = require('transitory');

module.exports = class TransitorySimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = transitory.newCache()
			.maxSize(options.maxSize)
			.build();
	}

	receive(id) {
		id = String(id);
		const hit = this.cache.getIfPresent(id);
		if(hit === null) {
			this.counter.miss();
			this.cache.set(id, id);

			// Call await to make sure everything is evicted directly
			this.cache.cleanUp();
		} else {
			this.counter.hit();
		}
	}
};
