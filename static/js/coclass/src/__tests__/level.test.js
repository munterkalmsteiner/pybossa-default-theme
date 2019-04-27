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

import {CoClass} from '../coclass';
import {Level} from '../level';
import {getNewTasks, getProjectId} from '../pybossa';
import {isDefined} from '../utils';
import {QUESTIONED_TERMS_PER_LEVEL} from '../constants';
import {readFileSync} from 'fs';

jest.mock('../pybossa');

const html = readFileSync('src/coclass_presenter.html');
const data = require('../../../../data/coclass.json');
const coclass = new CoClass(data);

getNewTasks.mockImplementation(() => {
    // We can't simply require the file as the object will be cached.
    // Each test needs a new tasks object as we modify it.
    const content = readFileSync('src/__tests__/tasks_sample.json');
    return JSON.parse(content);
});

getProjectId.mockImplementation(() => {
    return 1;
});

beforeEach(() => {
    document.body.innerHTML = html.toString();
});

test('get next task until none are left', () => {
    const l = new Level(coclass, 'test');
    expect(l.hasTask()).toBe(true);

    let numTasks = 0;
    while (l.hasTask()) {
        numTasks++;
        const task = l.task;
        expect(task).toBeDefined();
        expect(l.nextTask()).toBe(true);
    }

    const doneTasks = l.doneTasks;
    expect(doneTasks.length).toBe(numTasks);
    expect(l.task).toBeUndefined();
    expect(l.hasTask()).toBe(false);
});

test('is new target term', () => {
    const l = new Level(coclass, 'test');
    expect(l.isNewTargetTerm()).toBe(true);
    const oldTargetTerm = l.task.targetTerm;
    const blocksize = 10; // our data has 10 terms in a row
    for (let i = 0; i < blocksize - 1; i++) {
        l.nextTask();
        expect(l.isNewTargetTerm()).toBe(false);
    }
    l.nextTask();
    expect(l.isNewTargetTerm()).toBe(true);
    expect(l.task.targetTerm).not.toBe(oldTargetTerm);
});

test('render defined questions', () => {
    const l = new Level(coclass, 'test');
    expect(l.renderQuestionSet()).toBe(true);
});

test('render one undefined question', () => {
    const l = new Level(coclass, 'test');
    let qs = l.currentQuestionSet;
    qs[1] = undefined;
    expect(l.renderQuestionSet()).toBe(false);
});

test('get as many questions sets as requested', () => {
    const l = new Level(coclass, 'test');
    let numQS = 0;
    expect(l.hasQuestion()).toBe(true);
    while (l.hasQuestion()) {
        numQS++;
        for (let q in l.currentQuestionSet) {
            expect(isDefined(q)).toBe(true);
        }

        expect(l.nextQuestion()).toBe(true);
    }

    expect(l.hasQuestion()).toBe(false);
    expect(l.hasNextQuestion()).toBe(false);
    expect(l.nextQuestion()).toBe(false);
    expect(numQS).toBe(QUESTIONED_TERMS_PER_LEVEL);
});
