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

import {insertAtRandomPosition, isDefined} from './utils';

export class Task {
    constructor(rawtask) {
        this._id = undefined;
        this._targetTerm = undefined;
        this._actualSynonyms = [];
        this._candidates = [];
        this._seed = undefined;
        this._skipped = false;
        this._answer = undefined;

        if(isDefined(rawtask)) {
            this._id = rawtask.id;
            this._targetTerm = rawtask.info.target;

            for (let key in rawtask.info) {
                if (rawtask.info.hasOwnProperty(key) && key !== 'target' && rawtask.info[key] !== '') {
                    this._candidates.push(rawtask.info[key]);
                }
            }
        }
    }

    get id() {
        return this._id;
    }

    set id(newId) {
        this._id = newId;
    }

    get targetTerm() {
        return this._targetTerm;
    }

    set targetTerm(newTerm) {
        this._targetTerm = newTerm;
    }

    set actualSynonyms(synonyms) {
        this._actualSynonyms = synonyms;
    }

    get candidates() {
        return this._candidates;
    }

    set candidates(newCandidates) {
        this._candidates = newCandidates;
    }

    set seed(newSeed) {
        this._seed = newSeed;
    }

    get skipped() {
        return this._skipped;
    }

    set skipped(skip) {
        this._skipped = skip;
    }

    set answer(newAnswer) {
        this._answer = newAnswer;
    }

    /* Returns true if the candidates contain at least one synonym */
    candidatesIncludeSynonym(synonyms) {
        return (synonyms.filter(synonym => this._candidates.includes(synonym))).length > 0; 
    }

    /* Adds a term to the candidates at a random position and returns the total number of candidates */
    addSeedToCandidates(seed) {
        this._candidates = insertAtRandomPosition(this._candidates, seed);
        this._seed = seed;
        return this._candidates.length;
    }

    renderTask(newTargetTerm, description, pathString) {
        $('.candidate').remove();
        $('#definition').html(description);
        $('#levels').html(pathString);
        if(newTargetTerm) {
            $('#target').effect("pulsate", {times: 1}).animate({color: '#d12e2c'}, 2000);
        }

        const elem = $('#candidates');
        this._candidates.forEach((candidate, index) => {
            let cbid = "select" + index;
            let seeded = (candidate === this._seed);
            elem.append(`<tr id="${cbid}" class="candidate ${(seeded ? ' seeded' : '')}" data-term="${candidate}"><td>${candidate} is</td><td><input type="radio" id="c-0-${index}" name="radio_${cbid}" value="0" checked></td><td><input type="radio" id="c-1-${index}" name="radio_${cbid}" value="1"></td><td><input type="radio" id="c-2-${index}" name="radio_${cbid}" value="2"></td><td><input type="radio" id="c-3-${index}" name="radio_${cbid}" value="3"></td><td class="target">${this.targetTerm}</td></tr>`); 
        });

        return elem.children().length > 0;
    }

    renderResult(userResult, alignment) {
        $('.result').remove();
        const elem = $('#results');
        this._candidates.forEach((candidate) => {
            const agreement = alignment[candidate]['a'];
            const disagreement = alignment[candidate]['d'];
            const isActualSynonym = this._actualSynonyms.includes(candidate);
            const isJudgedAsSynonym = (userResult[candidate] == 1);
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

            elem.append(`<tr class="result"><td>${candidate}</td><td>${resultSymbol}</td><td></span><span class="badge agreement">${agreement}</span><span class="badge disagreement">${disagreement}</span></td></tr>`);
        });

        return elem.children().length > 0;
    }

    getAnswer(eventType) {
        if (isDefined(this._answer)) {
            return this._answer;
        }

        let answer = 'Error: wrong event';
        let synonymFound = false;

        if (eventType === 'SUBMITTASK') {
            answer = this._targetTerm;
            this._candidates.forEach((candidate, index) => {
                const id = 'select' + index;
                const row = $('#' + id);
                const seeded = $(row).hasClass('seeded');
                const term = $(row).attr("data-term");
                const selection = $(row).find('input[name=radio_' + id + ']:checked').val();

                if (selection == 1) {
                    synonymFound = true;
                }

                answer += ',' + term + ':' + selection + (seeded ? ':s' : '');
            });
        }
        else if (eventType === 'SKIPTASK') {
            this._skipped = true;
            let seed = undefined;
            this._candidates.forEach((candidate, index) => {
                const id = 'select' + index;
                const row = $('#' + id);
                if (row.hasClass('seeded')) {
                    seed = $(row).attr("data-term");
                }
            });

            answer = "SKIPPED," + this._targetTerm;
            if (isDefined(seed)) {
                answer += ',' + seed + ':0:s';
            }
        }

        this._answer = { synonymFound: synonymFound, answerString: answer };

        return this._answer;
    }
}

function createTasksFrom(taskData) {
    const tasks = [];

    for (const tdata of taskData) {
        const t = new Task();
        t.id = tdata._id;
        t.targetTerm = tdata._targetTerm;
        t.actualSynonyms = tdata._actualSynonyms;
        t.candidates = tdata._candidates;
        t.seed = tdata._seed;
        t.skipped = tdata._skipped;
        t.answer = tdata._answer;
        tasks.push(t);
    }

    return tasks;

}

export {createTasksFrom};
