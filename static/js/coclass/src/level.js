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

import {Task} from './task';
import {getNewTasks, saveTask, getProjectId, getUserId, getResults} from './pybossa';
import {getRandomItems, isDefined, toPromise} from './utils';
import {TASKS_PER_LEVEL, QUESTIONED_TERMS_PER_LEVEL, MAXIMUM_TASKS_BEFORE_SEED} from './constants';

export class Level {
    constructor(coclass, projectName) {
        this._coclass = coclass;
        this._projectName = projectName;
        this._questions = [];
        this._questionIndex = 0;
        this._tasks = [];
        this._taskIndex = 0;
        this._streakNoSynonymsFound = 0;
        this._userId = getUserId();
        this._projectId = getProjectId(this._projectName);
    }

    newLevel() {
        this._tasks = [];
        this._taskIndex = 0;
        this._questions = [];
        this._questionIndex = 0;

        const rawtasks = getNewTasks(this._projectId, TASKS_PER_LEVEL);
        for (let rt of rawtasks) {
            this._tasks.push(new Task(rt));
        }

        const targetTerms = new Set();
        this._tasks.forEach((task) => {
            targetTerms.add(task.targetTerm);
        });

        const quizzTerms = getRandomItems(targetTerms, QUESTIONED_TERMS_PER_LEVEL);
        for (const term of quizzTerms) {
            this._questions.push(this._coclass.getQuestionsFor(term));
        }
    }

    /************************
      Task management
    *************************/

    hasTask() {
        return this._taskIndex < this._tasks.length;
    }

    get task() {
        let task = undefined;
        if (this.hasTask()) {
            task = this._tasks[this._taskIndex];
        }

        return task;
    }

    get doneTasks() {
        return this._tasks.slice(0, this._taskIndex);
    }

    nextTask() {
        return new Promise((resolve, reject) => {
            if (this.hasTask()) {
                this._taskIndex++;
            }

            resolve(this.hasTask());
        });
    }

    wasTaskSkipped() {
        return this.task.skipped;
    }

    saveTask(eventType) {
        const answer = this.task.getAnswer(eventType);

        if (eventType === 'SKIPTASK' || !answer.synonymFound) {
            this._streakNoSynonymsFound++;
        }

        // XState expects a native Promise, so we need to convert the JQuery deferred object
        return toPromise(saveTask(this.task.id, answer.answerString));
    }

    renderTask() {
        const task = this.task;
        console.assert(isDefined(task), 'Trying to render undefined task');
        const ccItem = this._coclass.findItem(task.targetTerm);

        if (!isDefined(ccItem)) {
            console.error(`Object ${task.targetTerm} not found in CoClass`);
            return false;
        }

        task.actualSynonyms = ccItem.synonyms;

        if (this.needSynonymSeed() && !task.candidatesIncludeSynonym(ccItem.synonyms)) {
            const seed = ccItem.getRandomSynonym();
            if (isDefined(seed)) {
                task.addSeedToCandidates(seed);
                this._streakNoSynonymsFound = 0;
            }
        }

        return task.renderTask(this.isNewTargetTerm(),
                               ccItem.description,
                               this._coclass.getPathString(task.targetTerm));
    }

    renderTaskResults() {
        const results = getResults(this._projectName, this.task.id);
        const userResult = results.find(r => r.user_id == this._userId);

        const userAssessment = {};
        if (isDefined(userResult)) {
            const assessments = userResult.info.split(',');

            for (let i = 1; i < assessments.length; i++) {
                const assessment = assessments[i];
                const item = assessment.split(':');
                userAssessment[item[0]] = item[1];
            }
        }

        const alignment = {};
        for (let i = 0; i < results.length; i++) {
            if (results[i].info.startsWith('SKIPPED')) {
                continue;
            }
            const assessments = results[i].info.split(',');
            for (let j = 1; j < assessments.length; j++) {
                const assessment = assessments[j].split(':');
                const candidate = assessment[0];
                const isSynonym = (assessment[1] === '1');
                const user_isSynonym = (userAssessment[candidate] === '1');
                alignment[candidate] = alignment[candidate] || {'a': 0, 'd': 0};
                if (user_isSynonym === isSynonym) {
                    alignment[candidate]['a'] += 1;
                } else {
                    alignment[candidate]['d'] += 1;
                }
            }
        }

        return this.task.renderResult(userResult, alignment);
    }

    needSynonymSeed() {
        return this._streakNoSynonymsFound >= MAXIMUM_TASKS_BEFORE_SEED;
    }

    isNewTargetTerm() {
        const doneTasks = this.doneTasks;
        if (doneTasks.length === 0) {
            return true;
        }

        const previousTask = doneTasks[doneTasks.length - 1];
        return this.task.targetTerm !== previousTask.targetTerm;
    }

    /************************
      Question management
    *************************/

    hasQuestion() {
        return this._questionIndex < this._questions.length;
    }

    hasNextQuestion() {
        return this._questionIndex < this._questions.length - 1;
    }

    getAnswersQuestionSet() {
        let allRetrieved = true;

        this.currentQuestionSet.forEach((q) => {
            if (!isDefined(q) || !q.getAnswer()) {
                allRetrieved = false;
            }
        });

        return allRetrieved;
    }

    nextQuestion() {
        let movedToNextQuestion = false;

        if (this.hasQuestion()) {
            this._questionIndex++;
            movedToNextQuestion = true;
        }

        return movedToNextQuestion;
    }

    resetQuestions() {
        this._questionIndex = 0;
    }

    areQuestionsAnswered() {
        return this.currentQuestionSet.every((q) => {
            return (isDefined(q) && q.isAnswerSelected());
        });
    }

    get currentQuestionSet() {
        let current = [undefined, undefined];
        if (this.hasQuestion()) {
            current = this._questions[this._questionIndex];
        }

        return current;
    }

    renderQuestionSet() {
        let allRendered = true;

        this.currentQuestionSet.forEach((q) => {
            if (!isDefined(q) || !q.render()) {
                allRendered = false;
            }
        });

        return allRendered;
    }
}
