'use strict';

const counter = Symbol('counter');
const SortedSet = require('js-sorted-set');

module.exports = class OptimalSimulator {
	constructor(counter, options) {
		this.maxSize = options.maxSize;

		this.counter = counter;

		this.count = 0;
		this.order = [];
		this.access = new Map();
		this.data = new SortedSet({ comparator: (a, b) => b - a });

		this.ts = Number.MAX_VALUE;
	}

	receive(id) {
		this.order.push(id);
		let access = this.access.get(id);
		if(! access) {
			access = [];
			access[counter] = 0;
			this.access.set(id, access);
		}
		access.push(this.count++);
	}

	finish() {
		for(let i=0; i<this.order.length; i++) {
			const id = this.order[i];
			const times = this.access.get(id);
			if(! times) continue;

			const idx = times[counter];
			const lastTime = times[idx];
			times[counter]++;
			const found = this.data.contains(lastTime);
			if(found) {
				this.data.remove(lastTime);
			}

			let v;
			if(idx + 1 < times.length) {
				v = times[idx + 1];
			} else {
				v = this.ts--;
			}

			if(! this.data.contains(v)) {
				this.data.insert(v);
			}

			if(found) {
				this.counter.hit();
			} else {
				this.counter.miss();
				if(this.data.length > this.maxSize) {
					let smallest = this.data.beginIterator().next().value();
					this.data.remove(smallest);
				}
			}
		}
	}
};
