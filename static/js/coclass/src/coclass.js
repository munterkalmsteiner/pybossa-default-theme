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

var TreeModel = require('tree-model');

export class CoClass {
    constructor(data) {
        this._tree = new TreeModel();
        this._root = this._tree.parse({name: 'root'});
        this._buildTree(data, this._root);
    }

    _buildTree(obj, parent) {
        for (let key in obj) {
            if (!obj.hasOwnProperty(key) || key === 'term' || key === 'desc' || key === 'syns') {
                continue; 
            }

            if (key.length > 1) { // handle special case top level tables
                let item = new CoClassItem(undefined, key);
                let childNode = this._tree.parse(item);
                parent.addChild(childNode);
                this._buildTree(obj[key], childNode);
            } else {
                let item = new CoClassItem(key, obj[key].term, obj[key].desc, obj[key].syns); 
                let childNode = this._tree.parse(item);
                parent.addChild(childNode);

                if (typeof obj[key] === 'object') {
                    this._buildTree(obj[key], childNode);
                }
            }
        }
    }

    findItem(target) {
        let node = this._root.first((node) => {
            return node.model.name === target;
        });

        return node !== undefined ? node.model : undefined;
    }

    getPathString(target) {
        let targetnode = this._root.first((node) => {
            return node.model.name === target;
        });

        let pathstring = '';
        if (targetnode !== undefined) {
            let path = targetnode.getPath();
            let code = '';
            for (let i = 1; i < path.length; i++) { // start at 1 to omit root node
                const node = path[i];
                if (node.model !== undefined) {
                    let codecomponent = node.model.codecomponent;

                    if (codecomponent !== undefined) {
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
}


export class CoClassItem {
    constructor(codecomponent, name, description, synonyms) {
        this._codecomponent = codecomponent;
        this._name = name;
        this._description = description;
        if (synonyms !== undefined && synonyms.length != 0 && synonyms[0].length != 0) {
            this._synonyms = synonyms.map(syn => syn.toLowerCase());
        } else {
            this._synonyms = [];
        }

        this._candidates = [];
        this._seed = undefined;
    }

    /* Returns true if a synonym was successfully seeded into the candidate list */
    seed() {
        this._seed = this.getRandomSynonym();
        if (this._seed !== undefined) {
            this._candidates.splice(Math.floor(Math.random() * this._candidates.length), 0, this._seed);
            return true;
        }

        return false;
    }

    /* Returns true if the candidates contain at least one synonym */
    candidatesIncludeSynonym() {
        return (this._synonyms.filter(synonym => this._candidates.includes(synonym))).length > 0; 
    }

    /* Returns a random synonym from the list, or undefined if the list is empty */
    getRandomSynonym() {
        let length = this._synonyms.length;
        if (length > 0) {
            return this._synonyms[Math.floor(Math.random() * length)];
        }

        return undefined;
    }

    setCandidateMarkup(element) {
        this._candidates.forEach((candidate, index) => {
            let cbid = "select" + index;
            let seeded = (candidate === this._seed);
            element.append(`<tr id="${cbid}" class="candidate ${(seeded ? ' seeded' : '')}" data-term="${candidate}"><td>${candidate} is</td><td><input type="radio" name="radio_${cbid}" value="0" checked></td><td><input type="radio" name="radio_${cbid}" value="1"></td><td><input type="radio" name="radio_${cbid}" value="2"></td><td><input type="radio" name="radio_${cbid}" value="3"></td><td class="target">${this.name}</td></tr>`); 
        });
    }

    setResultMarkup(userResult, alignment, element) {
        this._candidates.forEach((candidate) => {
            let agreement = alignment[candidate]['a'];
            let disagreement = alignment[candidate]['d'];
            let isActualSynonym = this._synonyms.includes(candidate);
            let isJudgedAsSynonym = (userResult[candidate] == 1);
            let resultSymbol = '<i class="fas fa-';

            if (isActualSynonym && isJudgedAsSynonym) {
                resultSymbol += 'check"></i>';
            } else if (isActualSynonym && !isJudgedAsSynonym) {
                resultSymbol += 'times"></i>';
            } else if (!isActualSynonym && isJudgedAsSynonym) {
                resultSymbol += 'star"></i>';
            } else {
                resultSymbol += 'minus"></i>';
            }

            element.append(`<tr class="result"><td>${candidate}</td><td>${resultSymbol}</td><td></span><span class="badge agreement">${agreement}</span><span class="badge disagreement">${disagreement}</span></td></tr>`);
        });
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

    addCandidate(c) {
        this._candidates.push(c);
    }

    clearCandidates() {
        this._candidates = [];
    }

    get candidates() {
        return this._candidates;
    }
}


