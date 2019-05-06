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
        this._answer = undefined;

        if(isDefined(rawtask)) {
            this._id = rawtask.id;
            this._targetTerm = rawtask.info.target;

            for (let key in rawtask.info) {
                if (rawtask.info.hasOwnProperty(key) && key !== 'target' && rawtask.info[key] !== '') {
                    this._candidates.push(new Candidate(rawtask.info[key]));
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

    addCandidate(newCandidate) {
        this._candidates.push(newCandidate);
    }

    get skipped() {
        if (isDefined(this._answer)) {
            return this._answer.skipped;
        }

        return false;
    }

    set answer(newAnswer) {
        this._answer = newAnswer;
    }

    get answer() {
        return this._answer;
    }

    /* Returns true if the candidates contain at least one synonym */
    candidatesIncludeSynonym(synonyms) {
        //return (synonyms.filter(synonym => this._candidates.includes(synonym))).length > 0;
        return synonyms.some(s => {
            return this._candidates.some(c => {
                return c.term === s;
            });
        });
    }

    /* Adds a term to the candidates at a random position and returns the total number of candidates */
    addSeedToCandidates(seed) {
        this._candidates = insertAtRandomPosition(this._candidates, new Candidate(seed, true));
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
            elem.append(`<tr id="${cbid}" class="candidate"><td>${candidate.term}</td><td><input type="radio" id="c-0-${index}" name="radio_${cbid}" value="0" checked></td><td><input type="radio" id="c-1-${index}" name="radio_${cbid}" value="1"></td><td><input type="radio" id="c-2-${index}" name="radio_${cbid}" value="2"></td><td><input type="radio" id="c-3-${index}" name="radio_${cbid}" value="3"></td><td class="target">${this.targetTerm}</td></tr>`); 
        });

        return elem.children().length > 0;
    }

    renderResult(alignment) {
        $('.result').remove();
        const elem = $('#results');
        this._candidates.forEach((candidate) => {
            const agreement = alignment[candidate.term]['a'];
            const disagreement = alignment[candidate.term]['d'];
            const isActualSynonym = this._actualSynonyms.includes(candidate.term);
            const isJudgedAsSynonym = this._answer.findCandidate(candidate.term).isSynonym;
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

            elem.append(`<tr class="result"><td>${candidate.term}</td><td>${resultSymbol}</td><td></span><span class="badge agreement">${agreement}</span><span class="badge disagreement">${disagreement}</span></td></tr>`);
        });

        return elem.children().length > 0;
    }

    getAnswer(eventType) {
        if (isDefined(this._answer)) {
            return this._answer;
        }

        if (eventType === 'SUBMITTASK') {
            this._answer = new TaskAnswer(this._targetTerm);
            this._candidates.forEach((candidate, index) => {
                const id = 'select' + index;
                const row = $('#' + id);
                const selection = $(row).find('input[name=radio_' + id + ']:checked').val();
                candidate.isSynonym = (selection === '1');
                candidate.isGeneralization = (selection === '2');
                candidate.isSpecialization = (selection === '3');
                this._answer.addCandidate(candidate);
            });
        }
        else if (eventType === 'SKIPTASK') {
            this._answer = new TaskAnswer(this._targetTerm, true);

            this._candidates.forEach(candidate => {
                this._answer.addCandidate(candidate);
            });
        } 

        return this._answer;
    }
}

export class TaskAnswer {
    constructor(targetTerm, skipped = false) {
        this._targetTerm = targetTerm;
        this._skipped = skipped;
        this._candidates = [];
        this._quizz = undefined;
    }

    set targetTerm(newTerm) {
        this._targetTerm = newTerm;
    }

    set skipped(s) {
        this._skipped = s;
    }

    get skipped() {
        return this._skipped;
    }

    set candidates(newCandidates) {
        this._candidates = newCandidates;
    }

    get candidates() {
        return this._candidates;
    }

    set quiz(newQuizz) {
        this._quiz = newQuizz;
    }

    get quiz() {
        return this._quizz;
    }

    addCandidate(candidate) {
        this._candidates.push(candidate);
    }

    findCandidate(term) {
        return this._candidates.find(elem => {
            return elem.term === term;
        });
    }

    foundSynonym() {
        return this._candidates.some(c => {
            return c.isSynonym;
        });
    }
}

export class Candidate {
    constructor(term, isSeeded = false) {
        this._term = term;
        this._isSynonym = false;
        this._isGeneralization = false;
        this._isSpecialization = false;
        this._isSeeded = isSeeded;
    }

    set term(newTerm) {
        this._term = newTerm;
    }

    get term() {
        return this._term;
    }

    set isSynonym(isSyn) {
        this._isSynonym = isSyn;
    }

    get isSynonym() {
        return this._isSynonym;
    }

    set isGeneralization(isGen) {
        this._isGeneralization = isGen;
    }

    get isGeneralization() {
        return this._isGeneralization;
    }

    set isSpecialization(isSpec) {
        this._isSpecialization = isSpec;
    }

    get isSpecialization() {
        return this._isSpecialization;
    }

    set isSeeded(seeded) {
        this._isSeeded = seeded;
    }

    get isSeeded() {
        return this._isSeeded;
    }
}

function createTasksFrom(taskData) {
    const tasks = [];

    for (const tdata of taskData) {
        const t = new Task();
        t.id = tdata._id;
        t.targetTerm = tdata._targetTerm;
        t.actualSynonyms = tdata._actualSynonyms;
        t.candidates = _getCandidatesFromData(tdata._candidates);

        if (isDefined(tdata._answer)) {
            t.answer = new TaskAnswer(tdata._answer._targetTerm, tdata._answer._skipped);
            t.answer.candidates = _getCandidatesFromData(tdata._answer._candidates);
        }

        tasks.push(t);
    }

    return tasks;
}

function _getCandidatesFromData(tdata) {
    const candidates = [];
    for (const cdata of tdata) {
        const candidate = new Candidate();
        candidate.term = cdata._term;
        candidate.isSynonym = cdata._isSynonym;
        candidate.isGeneralization = cdata._isGeneralization;
        candidate.isSpecialization = cdata._isSpecialization;
        candidate.isSeeded = cdata._isSeeded;

        candidates.push(candidate);
    }

    return candidates;
}

function getAlignment(userAnswer, allAnswers) {
    const alignment = {};

    if (!userAnswer._skipped) {
        for (const answer of allAnswers) {
            if (answer._skipped) {
                continue;
            }

            for (const userCandidate of userAnswer._candidates) {
                alignment[userCandidate._term] = alignment[userCandidate._term] || {'a': 0, 'd': 0};

                const otherCandidate = answer._candidates.find(elem => {
                    return elem._term === userCandidate._term;
                });

                if (isDefined(otherCandidate)) {
                    if (userCandidate._isSynonym === otherCandidate._isSynonym) {
                        alignment[userCandidate._term]['a'] += 1;
                    } else {
                        alignment[userCandidate._term]['d'] += 1;
                    }
                }
            }
        }
    }

    return alignment;
}

export {createTasksFrom, getAlignment};
