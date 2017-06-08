'use strict';

module.exports = class OptimalSimulator {
	constructor(counter, options) {
		this.maxSize = options.maxSize;

		this.counter = counter;

		this.count = 0;
		this.order = [];
		this.access = new Map();
		this.data = new Set();

		this.ts = Number.MAX_VALUE;
	}

	receive(id) {
		this.order.push(id);
		let access = this.access.get(id);
		if(! access) {
			this.access.set(id, access = []);
		}
		access.push(this.count++);
	}

	finish() {
		for(let i=0; i<this.order.length; i++) {
			const id = this.order[i];
			const times = this.access.get(id);
			if(! times) continue;

			const lastTime = times.shift();
			const found = this.data.delete(lastTime);

			if(times.length) {
				this.data.add(times[0]);
			} else {
				this.data.add(this.ts--);
			}

			if(found) {
				this.counter.hit();
			} else {
				this.counter.miss();
				if(this.data.size > this.maxSize) {
					let smallest = 0;
					this.data.forEach(d => {
						smallest = Math.max(smallest, d);
					})
					this.data.delete(smallest);
				}
			}
		}
	}
};
