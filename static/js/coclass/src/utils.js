// Copyright (C) 2018+ Michael Unterkalmsteiner
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/* Returns from an iterable amount number of random items in an array  */
function getRandomItems(iterable, amount) {
    const items = [...iterable];
    const numItemsPicked = Math.min(amount, items.length);
    let pickedItems = [];
    for (let i = 0; i < numItemsPicked; i++) {
        const randomIndex = getRandomInt(items.length);
        pickedItems.push(items.splice(randomIndex, 1)[0]);
    }

    return pickedItems;
}

/* Returns a new array with item inserted at a random position.
   The original array stays unchanged.
 */
function insertAtRandomPosition(array, item) {
    const copy = [...array];
    copy.splice(getRandomInt(copy.length), 0, item);
    return copy;
}

function findNode(treemodel, target) {
    return treemodel.first((node) => {
        return node.model.name.toLowerCase() === target.toLowerCase();
    });
}

/* The maximum is exclusive and the minimum is inclusive */
function getRandomInt(max, min = 0) {
    max = Math.floor(max);
    min = Math.ceil(min);
    return Math.floor(Math.random() * (max - min)) + min; 
}

function isDefined(variable) {
    return (typeof variable !== 'undefined');
}

/* converts a JQuery deferred Object to a native Promise */
function toPromise ($promise) {
    return new Promise((resolve, reject) => {
        $promise.then(resolve, reject);
    });
}

export {getRandomItems, insertAtRandomPosition, findNode, getRandomInt, isDefined, toPromise};
