'use strict';

module.exports = class Counter {
	constructor() {
		this.hits = 0;
		this.misses = 0;
	}

	hit() {
		this.hits++;
	}

	miss() {
		this.misses++;
	}

	get hitRate() {
		return this.hits / (this.hits + this.misses);
	}
}
