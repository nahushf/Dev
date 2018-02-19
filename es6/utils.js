function isEmpty(obj) {
    return !obj || !Object.keys(obj).length;
}

function createElement(parent, tagName, props) {
    const element = document.createElement(tagName)
    if (!isEmpty(props)) {
        Object.keys(props).forEach(key => {
            element[key] = props[key];
        })
    }
    parent.appendChild(element)
    return element;
}

export function parseFrame(objString) {
    if (!isEmpty(objString)) {
        return new Data(objString);
    }
}

export function buildRows(collection) {
    const { array } = collection;
    if (isEmpty(array)) {
        return;
    }

    document.querySelector('#price-table tbody#content').remove()

    createElement(document.getElementById('price-table'), 'tbody', {
        innerHTML: `${array.map(element => element.renderRow()).join('')}`,
        id: 'content'
    });

    array.forEach(element => Sparkline.draw(
        document.getElementById(`sparkline-${element.name}`), element.sparklineArray)
    );

}

export class Collection {
    constructor(array) {
        this._collection = {};
        if (!isEmpty(array)) {
            array.forEach(this.push);
        }

        this.push = this.push.bind(this);
    }

    push = (element) => {
        const { name } = element;
        const { _collection } = this;
        if (_collection[name]) {
            _collection[name].update(element);
            return;
        }
        _collection[name] = element;
    }

    get array() {
        const elements = [];
        Object.keys(this._collection).forEach(key => {
            elements.push(this._collection[key]);
        })

        return elements.sort((a, b) => {
            return a.lastChangeBid < b.lastChangeBid ? -1 : (a.lastChangeBid > b.lastChangeBid ? 1 : 0)
        });
    }

}

export class Data {
    constructor(obj) {
        this.setValues(JSON.parse(obj));
        this.sparklineArray = [];
        for (let i = 0; i < 5; i++) {
            this.sparklineArray.push(0);
        }
        this.sparklineArray.push(this.midPrice);
    }

    get midPrice() {
        const { bestBid, bestAsk } = this;
        return (bestBid + bestAsk) / 2;
    }

    setValues({ name, bestBid, bestAsk, openBid, openAsk, lastChangeBid, lastChangeAsk }) {
        this.name = name;
        this.bidClass = lastChangeBid > this.lastChangeBid ? 'increase' : (
            lastChangeBid < this.lastChangeBid ? 'decrease' : ''
        );
        this.bestBid = bestBid;
        this.bestAsk = bestAsk;
        this.openBid = openBid;
        this.openAsk = openAsk;
        this.lastChangeBid = lastChangeBid;
        this.lastChangeAsk = lastChangeAsk;
    }

    update(obj) {
        this.setValues(obj);
        if (this.sparklineArray.length === 30 || this.sparklineArray[0] === 0) {
            this.sparklineArray.shift();
        }
        this.sparklineArray.push(this.midPrice);
    }

    renderRow() {
        const { name, bestBid, bestAsk, lastChangeBid, lastChangeAsk, bidClass } = this;
        return `<tr id="${name}">` +
            `<td class="${bidClass}">${name}</td>` +
            `<td>${bestBid}</td>` +
            `<td>${bestAsk}</td>` +
            `<td class="${bidClass}">${lastChangeBid}</td>` +
            `<td>${lastChangeAsk}</td>` +
            `<td id="sparkline-${name}" className="sparkline-cell"></td>` +
            `</tr>`;
    }

}