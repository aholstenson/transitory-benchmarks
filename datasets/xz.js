'use strict';

const fs = require('fs');
const lzma = require('lzma-native');
const { WritableStreamBuffer } = require('stream-buffers');

module.exports = class BinaryXzTrace {
	constructor(file) {
		this.file = file;
	}

	flush(simulator, progress) {
		const init = progress.text;
		return new Promise((resolve, reject) => {
			const out = new WritableStreamBuffer();
			const stream = fs.createReadStream(this.file)
				.pipe(lzma.createDecompressor())
				.pipe(out);

			stream.on('finish', () => {
				const buffer = out.getContents();

				let i = 0;
				let n = buffer.length / 4;

				function chunk() {
					try {
						for(let c = 0; c<5 && i<n; c++, i++) {
							const id = buffer.readInt32BE(i * 4);
							simulator.receive(id);
						}
						const p = (i / (n-1)) * 100;
						progress.text = init + ' ' + p.toFixed(1) + '%';
					} catch(e) {
						reject(e);
						return;
					}

					if(i < n) {
						setImmediate(chunk);
					} else {
						progress.text = init + ' 100.0%';
						setImmediate(resolve);
					}
				}

				chunk();
			});
		});
	}
}
