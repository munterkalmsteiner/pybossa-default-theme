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
        this._doneQuestions = [];
        this._tasks = [];
        this._doneTasks = [];
        this._streakNoSynonymsFound = 0;

        this._projectId = getProjectId(this._projectName);
        this.newLevel();
    }

    newLevel() {
        const numTasks = this._tasks.length;
        console.assert(numTasks === 0, `Getting new tasks while we still have ${numTasks} left.`);
        const rawtasks = getNewTasks(this._projectId, TASKS_PER_LEVEL);
        for (let rt of rawtasks) {
            this._tasks.push(new Task(rt));
        }
        this._doneTasks.length = 0;

        const targetTerms = new Set();
        this._tasks.forEach((task) => {
            targetTerms.add(task.targetTerm);
        });

        this._questions.length = 0;
        this._doneQuestions.length = 0;
        const quizzTerms = getRandomItems(targetTerms, QUESTIONED_TERMS_PER_LEVEL);
        for (const term of quizzTerms) {
            this._questions.push(this._coclass.getQuestionsFor(term));
        }
    }

    /************************
      Task management
    *************************/

    hasTask() {
        return this._tasks.length >= 1;
    }

    get task() {
        let task = undefined;
        if (this.hasTask()) {
            task = this._tasks[this._tasks.length - 1];
        }

        return task;
    }

    get doneTasks() {
        return this._doneTasks;
    }

    nextTask() {
        let movedToNextTask = false;
        if (this.hasTask()) {
            this._doneTasks.push(this._tasks.pop());
            movedToNextTask = true;
        }

        return movedToNextTask;
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
        getUserId().then( (id) => {
            getResults('', this.task.id);
        });
    }

    needSynonymSeed() {
        return this._streakNoSynonymsFound >= MAXIMUM_TASKS_BEFORE_SEED;
    }

    isNewTargetTerm() {
        if (this._doneTasks.length === 0) {
            return true;
        }

        const previousTask = this._doneTasks[this._doneTasks.length - 1];
        return this.task.targetTerm !== previousTask.targetTerm;
    }

    /************************
      Question management
    *************************/

    hasQuestion() {
        return this._questions.length >= 1;
    }

    hasNextQuestion() {
        return this._questions.length >= 2;
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
            this._doneQuestions.push(this._questions.shift());
            movedToNextQuestion = true;
        }

        return movedToNextQuestion;
    }

    areQuestionsAnswered() {
        return this.currentQuestionSet.every((q) => {
            return (isDefined(q) && q.isAnswerSelected());
        });
    }

    get currentQuestionSet() {
        let current = [undefined, undefined];
        if (this.hasQuestion()) {
            current = this._questions[0];
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
