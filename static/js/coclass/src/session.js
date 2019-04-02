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

import {CoClass} from './coclass';

const MAXIMUM_TASKS_BEFORE_SEED = 10;

export class Session {
    constructor(coclassData) {
        this._coclass = new CoClass(coclassData);
        this._isNewTargetTerm = true;
        this._streakNoSynonymsFound = 0;
        this._synonymFound = false;
        this._currentItem = undefined;
    }

    findCurrentItem(term) {
        let found = false;
        if (this._currentItem === undefined || this._currentItem.name !== term) {
            this._currentItem = this._coclass.findItem(term);
            if (this._currentItem !== undefined) {
                this._isNewTargetTerm = true;
                found = true;
            }
        } else {
            this._isNewTargetTerm = false;
            found = true;
        }

        return found;
    }

    populateCandidates(info, element) {
        this._synonymFound = false;
        this._currentItem.clearCandidates();
        for (let key in info) {
            if (info.hasOwnProperty(key) && key !== 'target' && info[key] !== '') {
                this._currentItem.addCandidate(info[key]);
            }
        }

        if (this.needSynonymSeed() &&
            !this._currentItem.candidatesIncludeSynonym() &&
            this._currentItem.seed()) {

            this._streakNoSynonymsFound = 0;
        }

        this._currentItem.setCandidateMarkup(element);
    }

    getSubmitAnswer() {
        let answer = this._currentItem.name;
        this._currentItem.candidates.forEach((candidate, index) => {
            let id = 'select' + index;
            let row = $('#' + id);
            let seeded = $(row).hasClass('seeded');
            let term = $(row).attr("data-term");
            let selection = $(row).find('input[name=radio_' + id + ']:checked').val();

            if (!this._synonymFound && selection == 1) {
                this._synonymFound = true;
                this._streakNoSynonymsFound = 0;
            }

            answer += ',' + term + ':' + selection + (seeded ? ':s' : '');
        });

        if(!this._synonymFound) {
            this._streakNoSynonymsFound++;
        }

        return answer;
    }

    getSkipAnswer() {
        this._streakNoSynonymsFound++;
        let seed = undefined;
        this._currentItem.candidates.forEach((candidate, index) => {
            let id = 'select' + index;
            let row = $('#' + id);
            if (row.hasClass('seeded')) {
                seed = $(row).attr("data-term");
            }
        });

        let answer = "SKIPPED," + this._currentItem.name;
        if (seed !== undefined) {
            answer += ',' + seed + ':0:s';
        }

        return answer;
    }

    populateResults(userid, results, element) {
        let userResult = results.find(r => r.user_id == userid);

        let userAssessment = {};
        if (userResult !== undefined) {
            let assessments = userResult.info.split(',');

            for (let i = 1; i < assessments.length; i++) {
                let assessment = assessments[i];
                let item = assessment.split(':');
                userAssessment[item[0]] = item[1];
            }
        }

        let alignment = {};
        for (let i = 0; i < results.length; i++) {
            let assessments = results[i].info.split(',');
            for (let j = 1; j < assessments.length; j++) {
                let assessment = assessments[j].split(':');
                let candidate = assessment[0];
                let isSynonym = (assessment[1] == 1);
                let user_isSynonym = (userAssessment[candidate] == 1);
                alignment[candidate] = alignment[candidate] || {'a': 0, 'd': 0};
                if (user_isSynonym == isSynonym) {
                    alignment[candidate]['a'] += 1;
                } else {
                    alignment[candidate]['d'] += 1;
                }
            }
        }

        this._currentItem.setResultMarkup(userResult, alignment, element);
    }

    needSynonymSeed() {
        return this._streakNoSynonymsFound >= MAXIMUM_TASKS_BEFORE_SEED;
    }

    get currentItem() {
        return this._currentItem;
    }

    get isNewTargetTerm() {
        return this._isNewTargetTerm;
    }
}
