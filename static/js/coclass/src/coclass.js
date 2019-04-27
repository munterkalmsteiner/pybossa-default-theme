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

import {insertAtRandomPosition, findNode, getRandomInt, isDefined} from './utils';
import {DescriptionQuestion, PathQuestion} from './question';

var TreeModel = require('tree-model');

export class CoClass {
    constructor(data) {
        this._numNodes = 0;
        this._tree = new TreeModel();
        this._root = this._tree.parse({name: 'root'});
        this._buildTree(data, this._root);
    }

    _buildTree(obj, parent) {
        for (const key in obj) {
            if (!obj.hasOwnProperty(key) || key === 'term' || key === 'desc' || key === 'syns') {
                continue;
            }

            this._numNodes++;

            if (key.length > 1) { // handle special case top level tables
                const item = new CoClassItem(undefined, key);
                const childNode = this._tree.parse(item);
                parent.addChild(childNode);
                this._buildTree(obj[key], childNode);
            } else {
                const name = obj[key].term;
                const description = obj[key].desc;
                const synonyms = obj[key].syns;

                console.assert(isDefined(name), obj, 'Name not defined');
                console.assert(isDefined(description), obj, 'Description not defined');
                console.assert(isDefined(synonyms), obj, 'Synonyms not defined');

                const item = new CoClassItem(key, name, description, synonyms);
                const childNode = this._tree.parse(item);
                parent.addChild(childNode);

                if (typeof obj[key] === 'object') {
                    this._buildTree(obj[key], childNode);
                }
            }
        }
    }

    _getRandomNodesNotTarget(target, amount = 5) {
        const multiplier = 100;
        let attempts = amount * multiplier;
        let randomNodes = new Set();

        while (randomNodes.size < amount && attempts > 0) {
            const randomIndex = getRandomInt(this._numNodes, 1);
            let counter = 0;
            this._root.walk((node) => {
                counter++;
                if (counter === randomIndex && node.model.name !== target && !randomNodes.has(node)) {
                    randomNodes.add(node);
                    return false;
                }

                return true;
            });

            attempts--;
        }

        if (randomNodes.length < amount) {
            console.log(`Sampling ${amount} random nodes was not successful after ${amount * multiplier} attempts.`);
        }

        return randomNodes;
    }

    findItem(target) {
        const node = findNode(this._root, target);
        return isDefined(node) ? node.model : undefined;
    }

    getPathString(target) {
        const targetNode = findNode(this._root, target);

        let pathstring = '';
        if (isDefined(targetNode)) {
            const path = targetNode.getPath();
            let code = '';
            for (let i = 1; i < path.length; i++) { // start at 1 to omit root node
                const node = path[i];
                if (isDefined(node.model)) {
                    const codecomponent = node.model.codecomponent;

                    if (isDefined(codecomponent)) {
                        code += codecomponent;
                        pathstring += `${code}:`;
                    }

                    if (i == path.length - 1) {
                        pathstring += `<strong id=\"target\">${node.model.name}</strong>`;
                    } else {
                        pathstring += `${node.model.name} >> `;
                    }
                }
            }
        }

        return pathstring;
    }

    getQuestionsFor(target) {
        return [this.getDescriptionQuestion(target), this.getPathQuestion(target)];
    }

    getDescriptionQuestion(target) {
        const targetNode = findNode(this._root, target);

        if (!isDefined(targetNode)) {
            return undefined;
        }

        const path = targetNode.getPath();
        if (path.length <= 1) { // we have no parent node
            return undefined;
        }

        const description = targetNode.model.description;
        const incorrectDescriptions = [];
        const parentnode = path[path.length - 2];
        if (!isDefined(parentnode.children) || parentnode.children.length <= 1) { // we have no sibling
            if (targetNode.children.length > 0) { // but we have children
                for (const child of parentnode.children) {
                    incorrectDescriptions.push(child.model.description);
                }
            } else { // no children, so we get the description from the parent as incorrect answer
                incorrectDescriptions.push(parentnode.model.description);
            }
        } else { // we have siblings
            for (const child of parentnode.children) {
                if (child.model.name === targetNode.model.name) { // skip the correct answer
                    continue;
                }
                incorrectDescriptions.push(child.model.description);
            }
        }

        return new DescriptionQuestion(targetNode.model.name, description, incorrectDescriptions);
    }

    getPathQuestion(target) {
        const targetNode = findNode(this._root, target);

        if (!isDefined(targetNode)) {
            return undefined;
        }

        const path = targetNode.getPath();
        if (path.length <= 3) { // we have not enough path for a question
            return undefined;
        }

        // Node 0 is root, Node 1 are the object tables, hence we start at 2.
        const nodeToHide = getRandomInt(path.length - 1, 2);
        let hiddenNode;
        let code = '';
        let pathstring = '';
        for (let i = 1; i < path.length; i++) { // start at 1 to omit root node
            const node = path[i];
            if (isDefined(node.model)) {
                const codecomponent = node.model.codecomponent;

                if (isDefined(codecomponent)) {
                    code += codecomponent;
                    pathstring += `${code}:`;
                }

                if (i == path.length - 1) {
                    pathstring += `<strong id=\"target\">${node.model.name}</strong>`;
                } else if (i == nodeToHide) {
                    pathstring += '? ? ? >> ';
                    hiddenNode = node;
                } else {
                    pathstring += `${node.model.name} >> `;
                }
            }
        }

        let incorrectNames = [];
        for (const node of this._getRandomNodesNotTarget(target)) {
            incorrectNames.push(node.model.name);
        }

        return new PathQuestion(pathstring, hiddenNode.model.name, incorrectNames);
    }
}


export class CoClassItem {
    constructor(codecomponent, name, description, synonyms) {
        this._codecomponent = codecomponent;
        this._name = name;
        this._description = description;
        if (isDefined(synonyms) && synonyms.length != 0 && synonyms[0].length != 0) {
            this._synonyms = synonyms.map(syn => syn.toLowerCase());
        } else {
            this._synonyms = [];
        }
    }

    /* Returns a random synonym from the list, or undefined if the list is empty */
    getRandomSynonym() {
        let length = this._synonyms.length;
        if (length > 0) {
            return this._synonyms[Math.floor(Math.random() * length)];
        }

        return undefined;
    }

    get codecomponent() {
        return this._codecomponent;
    }

    get name() {
        return this._name;
    }

    set name(newName) {
        this._name = newName;
    }

    get description() {
        return this._description;
    }

    set description(newDescription) {
        this._description = newDescription;
    }

    get synonyms() {
        return this._synonyms;
    }

    set synonyms(newSynonyms) {
        this._synonyms = newSynonyms;
    }
}


