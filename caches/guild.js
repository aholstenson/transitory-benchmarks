'use strict';

const Guild = require('guild');

module.exports = class GuildSimulator {
	constructor(counter, options) {
		this.counter = counter;
		this.cache = Guild.cacheWithSize(options.maxSize);
	}

	receive(id) {
		const hit = this.cache.get(id);
		if(hit == null) {
			this.counter.miss();
			this.cache.put(id, id);
		} else {
			this.counter.hit();
		}
	}
};
