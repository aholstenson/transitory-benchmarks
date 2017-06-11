Benchmarks for comparing hit rates of different caching libraries.

Caches included:

* [Transitory](https://github.com/aholstenson/transitory)
* [tiny-lfu-cache](https://github.com/ahume/tiny-lfu-cache)
* [lfu-cache](https://github.com/kapouer/node-lfu-cache)
* [Guild](https://www.npmjs.com/package/guild)
* [adaptative-replacement-cache](https://www.npmjs.com/package/adaptative-replacement-cache)
* [hashlru](https://github.com/dominictarr/hashlru)
* [tiny-lru](https://www.npmjs.com/package/tiny-lru)

Datasets:

* `random` -

## Running

Run all of the datasets and all of the caches:

`node --expose-gc index.js`

Running all of the datasets takes a long time, to run a single one use:

`node --expose-gc index.js --dataset idOfSet`
