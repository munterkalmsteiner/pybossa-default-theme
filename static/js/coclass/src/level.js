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

import {Task, createTasksFrom, getAlignment} from './task';
import {getNewTasks, saveTask, getProjectId, getUserId, getResults, toPromise} from './pybossa';
import {createQuestionsFrom} from './question';
import {getRandomItems, isDefined} from './utils';
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

    saveLevel() {
        localStorage.setItem('level', this.serialize()); 
    }

    restoreLevel() {
        return new Promise((resolve, reject) => {
            let data = localStorage.getItem('level');

            if(!isDefined(data)) {
                reject();
            }

            if (!this.deserialize(data)) {
                reject();
            }

            resolve();
        });


    }

    serialize() {
        return JSON.stringify({
            _questions: this._questions,
            _questionIndex: this._questionIndex,
            _tasks: this._tasks,
            _taskIndex: this._taskIndex,
            _streakNoSynonymsFound: this._streakNoSynonymsFound
        });
    }

    deserialize(data) {
        data = JSON.parse(data);

        this._questions = createQuestionsFrom(data._questions);
        this._questionIndex = data._questionIndex;
        this._tasks = createTasksFrom(data._tasks);
        this._taskIndex = data._taskIndex;
        this._streakNoSynonymsFound = data._streakNoSynonymsFound;

        return true;
    }

    /************************
      Task management
    *************************/

    hasTask() {
        return this._taskIndex < this._tasks.length;
    }

    numTasks() {
        return this._tasks.length;
    }

    get task() {
        let task = undefined;
        if (this.hasTask()) {
            task = this._tasks[this._taskIndex];
        }

        return task;
    }

    get previousTask() {
        const previousTaskIndex = this._taskIndex - 1;
        console.assert(previousTaskIndex >= 0, 'Previous task does not exist');
        return this._tasks[previousTaskIndex];
    }

    get doneTasks() {
        return this._tasks.slice(0, this._taskIndex);
    }

    wasTaskSkipped() {
        const task = this.previousTask;
        if (!isDefined(task)) {
            return true;
        }

        return task.skipped;
    }

    saveTask(eventType) {
        const answer = this.task.getAnswer(eventType);

        if (eventType === 'SKIPTASK' || (isDefined(answer) && !answer.foundSynonym())) {
            this._streakNoSynonymsFound++;
        }

        // XState expects a native Promise, so we need to convert the JQuery deferred object
        return toPromise(saveTask(this.task.id, answer)).then( () => ++this._taskIndex );
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
        const task = this.previousTask;
        if(!isDefined(task)) {
            return false;
        }

        const results = getResults(this._projectName, task.id);
        if (!isDefined(results)) {
            console.error('Could not retrieve results');
            return false;
        }

        const userResult = results.find(r => r.user_id == this._userId);

        if (!isDefined(userResult)) {
            console.error('Could not find user result');
            return false;
        }

        const userAnswer = userResult.info;
        const allAnswers = [];
        for (const result of results) {
            allAnswers.push(result.info);
        }

        return task.renderResult(getAlignment(userAnswer, allAnswers));
    }

    needSynonymSeed() {
        return this._streakNoSynonymsFound >= MAXIMUM_TASKS_BEFORE_SEED;
    }

    isNewTargetTerm() {
        const doneTasks = this.doneTasks;
        if (doneTasks.length === 0) {
            return true;
        }

        return this.task.targetTerm !== this.previousTask.targetTerm;
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
        const allRetrieved = this.currentQuestionSet.every((q) => {
            return isDefined(q) && q.getAnswer();
        });

        if (allRetrieved) {
            this._questionIndex++;
        }

        return allRetrieved;
    }

    resetQuestions() {
        this._questionIndex = 0;
    }

    areQuestionsAnswered(which) {
        return this._questions.every((questionSet) => {
            return questionSet.every((q) => {
                return isDefined(q) && q.isAnswered(which);
            });
        });
    }

    areAnswersSelected() {
        return this.currentQuestionSet.every((q) => {
            return (isDefined(q) && q.isAnswerSelected());
        });
    }

    get currentQuestionSet() {
        return this.getQuestionSet(this._questionIndex) || [undefined, undefined];
    }

    get previousQuestionSet() {
        return this.getQuestionSet(this._questionIndex - 1) || [undefined, undefined];
    }

    getQuestionSet(index) {
        return this._questions[index];
    }

    renderQuestionSet(questionSet) {
        let allRendered = true;

        questionSet.forEach((q) => {
            if (!isDefined(q) || !q.render()) {
                allRendered = false;
            }
        });

        return allRendered;
    }
}
