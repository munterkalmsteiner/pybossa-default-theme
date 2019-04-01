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

export class CoClass {
    constructor(data) {
        this._data = data;
    }

    findItem(target) {
        return this._findItem(this._data, target, new Array());
    }

    _findItem(obj, target, stack) {
        let item = undefined;
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }

            if (obj[key] !== undefined &&
                obj[key].hasOwnProperty('term') &&
                obj[key]['term'] !== undefined &&
                obj[key]['term'].toLowerCase() === target.toLowerCase()) {

                item = new CoClassItem();
                item.name = target;
                item.definition = obj[key].desc;


                let level = new Object();
                level.code = key;
                level.term = obj[key]['term'];
                stack.push(level);

                let cummulativecode = new String();
                let levels = new String();
                for (let i = 0; i < stack.length; i++) {
                    let code = stack[i].code;
                    if (code.length == 1) {
                        cummulativecode += code;
                        levels += cummulativecode + ':';
                        if (i == stack.length - 1) {
                            levels += '<strong id="target">' + stack[i].term + '</strong>';
                        } else {
                            levels += stack[i].term;
                        }

                        if (i < stack.length - 1) {
                            levels += ' >> ';
                        }
                    } else {
                        levels += code + ' >> ';
                    }

                }

                item.hierarchy = levels;

                let syns = obj[key]['syns'];
                if (syns !== undefined && syns.length != 0 && syns[0].length != 0) {
                    item.synonyms = syns.map(syn => syn.toLowerCase());
                } else {
                    item.synonyms = [];
                }
                break;
            } else if (typeof obj[key] === 'object') {
                let level = new Object();
                level.code = key;
                if (obj[key].hasOwnProperty('term')) {
                    level.term = obj[key]['term'];
                }
                stack.push(level);
                item = this._findItem(obj[key], target, stack);
                stack.pop();
             	  if (item !== undefined) {
               	   break;
                }
            }
        }

        return item;
    }
}

export class CoClassItem {
    constructor() {
        this._synonyms = [];
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
            element.append('<tr id="' + cbid + '" class="candidate' + (seeded ? ' seeded' : '') + '" data-term="' + candidate + '"><td>' + candidate + ' is</td><td><input type="radio" name="radio_' + cbid + '" value="0" checked></td><td><input type="radio" name="radio_' + cbid + '" value="1"></td><td><input type="radio" name="radio_' + cbid + '" value="2"></td><td><input type="radio" name="radio_' + cbid + '" value="3"></td><td>' + this.name + '</td></tr>'); 
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

            element.append('<tr class="result"><td>' + candidate + '</td><td>' + resultSymbol + '</td><td></span><span class="badge">' + agreement + '</span><span class="badge">' + disagreement + '</span></td></tr>');
        });
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

    get hierarchy() {
        return this._hierarchy;
    }

    set hierarchy(newHierarchy) {
        this._hierarchy = newHierarchy;
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


