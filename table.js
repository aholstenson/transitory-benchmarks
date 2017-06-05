'use strict';

const chalk = require('chalk');
const COLUMN_SPACE = 2;

function padValue(value, length, c) {
    c = c || ' ';
    let vLength = chalk.stripColor(value).length;
    return value + (length > vLength ? Array(length - vLength+1).join(c) : '');
}

class Table {
    constructor() {
        this._rows = [];
    }

    columns() {
        this._columns = Array.prototype.slice.call(arguments);
        return this;
    }

    row() {
        if(! this._columns) {
            throw 'You need to set the columns before adding rows';
        }

        const row = Array.prototype.slice.call(arguments);
        if(row.length !== this._columns.length) {
            throw 'Number of entries in row does not match number of columns';
        }

        this._rows.push(row);

        return this;
    }

    print() {
        const widths = [];
        for(let i=0; i<this._columns.length; i++) {
            this._columns[i] = chalk.bold(this._columns[i]);
            widths[i] = chalk.stripColor(this._columns[i]).length + COLUMN_SPACE;
        }

        this._rows.forEach(row => {
            for(let i=0; i<row.length; i++) {
                widths[i] = Math.max(widths[i], chalk.stripColor(row[i]).length + COLUMN_SPACE);
            }
        });

        let pad = (value, i) => padValue(value, widths[i]);

        console.log(...this._columns.map(pad));
        console.log(...this._columns.map((c, i) =>
            padValue(padValue('', chalk.stripColor(c).length + 2, '='), widths[i]))
        );
        this._rows.forEach(row => console.log(...row.map(pad)));
    }
}

module.exports = Table;
