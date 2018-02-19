import { parseFrame, Data, Collection, buildRows } from '../es6/utils'

describe('utils tests', () => {

    it('parseFrame should return a marshalled Data class instance', () => {
        const obj = { id: 1, name: 'abc' }
        const returned = parseFrame(JSON.stringify(obj))

        expect(returned instanceof Data).toBeTruthy();
    })

    it('Collection should hold the sorted representation of the data instances', () => {
        const array = generateDataArray().map(element => {
            return new Data(JSON.stringify(element))
        });
        const collection = new Collection(array)
        function testCollectionOrder(array) {
            const sortedDataArray = array.map(element => new Data(JSON.stringify(element))).sort((a, b) => {
                return a.lastChangeBid < b.lastChangeBid ? -1 : (a.lastChangeBid > b.lastChangeBid ? 1 : 0)
            });

            collection.array.forEach((item, index) => {
                const keys = Object.keys(item);
                keys.forEach(key => {
                    expect(item[key]).toEqual(sortedDataArray[index][key]);
                })
            })
        }
        testCollectionOrder(array);
        array.push(generateData());
        testCollectionOrder(array);
    });

    it('The data should keep a calculated value of the midPrice and an array of sparkline values', () => {
        const data = generateData(Math.random());
        const dataInstance = new Data(JSON.stringify(data));
        const { midPrice } = dataInstance;
        expect(midPrice).toBe((data.bestBid + data.bestAsk) / 2)
        expect(dataInstance.sparklineArray).toEqual([0, 0, 0, 0, 0, midPrice])
        const newData = generateData(Math.random())

        dataInstance.update(newData);
        expect(dataInstance.sparklineArray).toEqual([0, 0, 0, 0, midPrice, dataInstance.midPrice])

        expect(dataInstance.renderRow()).toBe(`<tr id="${dataInstance.name}">` +
            `<td class="${dataInstance.bidClass}">${dataInstance.name}</td>` +
            `<td>${dataInstance.bestBid}</td>` +
            `<td>${dataInstance.bestAsk}</td>` +
            `<td class="${dataInstance.bidClass}">${dataInstance.lastChangeBid}</td>` +
            `<td>${dataInstance.lastChangeAsk}</td>` +
            `<td id="sparkline-${dataInstance.name}" className="sparkline-cell"></td>` +
            `</tr>`);
    });

    it('buildRows should generate the html for the table and attach it to the DOM', () => {
        const remove = jest.fn();
        const appendChild = jest.fn();
        const node = { appendChild };
        document.querySelector = jest.fn(() => ({ remove }))
        document.getElementById = jest.fn(() => node);

        const draw = jest.fn();
        window.Sparkline = { draw }

        const collection = new Collection(generateDataArray().map(element => new Data(JSON.stringify(element))));
        buildRows(collection);

        expect(remove).toBeCalled();
        expect(appendChild).toBeCalled();

        collection.array.forEach(element => {
            expect(document.getElementById).toBeCalledWith(`sparkline-${element.name}`)
            expect(draw).toBeCalledWith(node, element.sparklineArray)
        });
    });

});

function generateData(id) {
    return {
        name: 'name-' + id,
        bestBid: id,
        bestAsk: id,
        openBid: id,
        openAsk: id,
        lastChangeBid: id,
        lastChangeAsk: id
    }
}

function generateDataArray(length = 4) {
    const instances = [];
    for (let i = 0; i < length; i++) {
        instances.push(generateData(i));
    }

    return instances;
}