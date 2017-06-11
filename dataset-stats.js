'use strict';

module.exports = class DatasetStats {
	constructor() {
		this.data = new Set();
		this.min = 0xffffffff;
		this.max = 0;
		this.length = 0;
	}

	receive(id) {
		this.data.add(id);
		this.length++;
		this.min = Math.min(this.min, id);
		this.max = Math.max(this.max, id);
	}

	get uniqueEntries() {
		return this.data.size;
	}
}
