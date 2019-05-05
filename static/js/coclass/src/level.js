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
        if (this._questions.length !== data._questions.length) {
            console.error('Level deserialization: inconsistent number of questions');
            return false;
        }
        this._questionIndex = data._questionIndex;
        if(!isDefined(this._questionIndex)) {
            console.error('Level deserialization: question index not defined');
            return false;
        }
        this._tasks = createTasksFrom(data._tasks);
        this._taskIndex = data._taskIndex;
        if(!isDefined(this._taskIndex)) {
            console.error('Level deserialization: task index not defined');
            return false;
        }
        this._streakNoSynonymsFound = data._streakNoSynonymsFound;
        if(!isDefined(this._streakNoSynonymsFound)) {
            console.error('Level deserialization: streak count not defined');
            return false;
        }

        return true;
    }

    notStartedLevel() {
        return this._taskIndex === 0;
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

        if (eventType === 'SKIPTASK' || !answer.foundSynonym()) {
            this._streakNoSynonymsFound++;
        }

        // TODO increase index here

        // XState expects a native Promise, so we need to convert the JQuery deferred object
        return toPromise(saveTask(this.task.id, answer));
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

        return this.task.renderResult(getAlignment(userAnswer, allAnswers));
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
