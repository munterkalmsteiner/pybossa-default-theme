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
import {getNewTasks, getProjectId, getUserId, getResults} from '../pybossa';
import {isDefined} from '../utils';
import {QUESTIONED_TERMS_PER_LEVEL} from '../constants';
import {readFileSync} from 'fs';

jest.mock('../pybossa');

const html = readFileSync('src/coclass_presenter.html');
const data = require('../../../../data/coclass.json');
const coclass = new CoClass(data);

getProjectId.mockImplementation(() => {
    return 1;
});

getUserId.mockImplementation(() => {
    return 1;
});


getResults.mockImplementation(() => {
    /* Based on the results, this is the agreement
       n -> no synonym, y -> synonym
       a -> agree, d -> disagree
       User 8:  n,n,n,n -> 3a0d,2a1d,3a0d,3a0d -> 11a,1d
       User 10: n,y,n,n -> 3a0d,1a2d,3a0d,3a0d -> 10a,2d
       User 11: SKIPPED
       User 12: n,n,n,n,y -> 3a0d,2a1d,3a0d,3a0d,1a -> 12a,1d
    */
    return [{"info": "lågspänningskabel,a:0,bb:0,ccc:0,dddd:0", "external_uid": null, "user_id": 8, "task_id": 369326, "created": "2019-03-21T07:50:18.376039", "finish_time": "2019-03-21T07:51:55.529206", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 594, "media_url": null}, {"info": "lågspänningskabel,a:0,bb:1,ccc:0,dddd:0", "external_uid": null, "user_id": 10, "task_id": 369326, "created": "2019-03-21T09:37:27.477913", "finish_time": "2019-03-21T09:38:12.818251", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 628, "media_url": null}, {"info": "SKIPPED,lågspänningskabel", "external_uid": null, "user_id": 11, "task_id": 369326, "created": "2019-03-26T09:53:24.721937", "finish_time": "2019-03-26T09:53:41.232894", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 683, "media_url": null}, {"info": "lågspänningskabel,a:0,bb:0,ccc:0,dddd:0,flaska:1:s", "external_uid": null, "user_id": 12, "task_id": 369326, "created": "2019-03-26T09:53:24.721937", "finish_time": "2019-03-26T09:53:41.232894", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 683, "media_url": null}];
});

beforeEach(() => {
    document.body.innerHTML = html.toString();

    getNewTasks.mockImplementation(() => {
        // We can't simply require the file as the object will be cached.
        // Each test needs a new tasks object as we modify it.
        const content = readFileSync('src/__tests__/tasks_sample.json');
        return JSON.parse(content);
    });
});

test('get next task until none are left', () => {
    const l = new Level(coclass, 'test');
    l.newLevel();
    expect(l.hasTask()).toBe(true);

    let numTasks = 0;
    while (l.hasTask()) {
        numTasks++;
        const task = l.task;
        expect(task).toBeDefined();
        l.nextTask();
    }
    l.nextTask().then((r) => {
        expect(r).toBe(false);
    });

    const doneTasks = l.doneTasks;
    expect(doneTasks.length).toBe(numTasks);
    expect(l.task).toBeUndefined();
    expect(l.hasTask()).toBe(false);
});

test('is new target term', () => {
    const l = new Level(coclass, 'test');
    l.newLevel();
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


test('render task results 1 disagreement', () => {
    getUserId.mockImplementation(() => {
        return 8;
    });
    getNewTasks.mockImplementation(() => {
        return [{"info": {"c36": "", "c40": "", "c37": "", "c47": "", "c41": "", "c19": "", "c18": "", "c39": "", "c38": "", "c13": "", "c12": "", "c11": "", "c10": "", "c17": "", "c16": "", "c15": "", "c14": "", "c44": "", "c42": "", "c45": "", "c46": "", "c35": "", "c9": "", "c8": "", "c34": "", "c3": "dddd", "c2": "ccc", "c1": "bb", "c0": "a", "c7": "", "c6": "", "c5": "", "c4": "", "c22": "", "c23": "", "c20": "", "c21": "", "c26": "", "c27": "", "c24": "", "c25": "", "c31": "", "c28": "", "c29": "", "c48": "", "c49": "", "c30": "", "c33": "", "target": "lågspänningskabel", "c43": "", "c32": ""}, "fav_user_ids": null, "n_answers": 30, "quorum": 0, "calibration": 0, "created": "2019-03-16T13:33:44.512974", "state": "ongoing", "project_id": 1, "id": 194338, "priority_0": 0.0}];
    });

    const l = new Level(coclass, 'test');
    l.newLevel();
    expect(l.renderTaskResults()).toBe(true);
    expect($('.result').size()).toBe(4);
    expect($('.agreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(11);
    expect($('.disagreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(1);
});

test('render task results 1 disagreement with seed', () => {
    getUserId.mockImplementation(() => {
        return 12;
    });
    getNewTasks.mockImplementation(() => {
        return [{"info": {"c36": "", "c40": "", "c37": "", "c47": "", "c41": "", "c19": "", "c18": "", "c39": "", "c38": "", "c13": "", "c12": "", "c11": "", "c10": "", "c17": "", "c16": "", "c15": "", "c14": "", "c44": "", "c42": "", "c45": "", "c46": "", "c35": "", "c9": "", "c8": "", "c34": "", "c3": "dddd", "c2": "ccc", "c1": "bb", "c0": "a", "c7": "", "c6": "", "c5": "", "c4": "", "c22": "", "c23": "", "c20": "", "c21": "", "c26": "", "c27": "", "c24": "", "c25": "", "c31": "", "c28": "", "c29": "", "c48": "", "c49": "", "c30": "", "c33": "", "target": "lågspänningskabel", "c43": "", "c32": ""}, "fav_user_ids": null, "n_answers": 30, "quorum": 0, "calibration": 0, "created": "2019-03-16T13:33:44.512974", "state": "ongoing", "project_id": 1, "id": 194338, "priority_0": 0.0}];
    });

    const l = new Level(coclass, 'test');
    l.newLevel();
    l.task.addSeedToCandidates('flaska');

    expect(l.renderTaskResults()).toBe(true);
    expect($('.result').size()).toBe(5);
    expect($('.agreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(12);
    expect($('.disagreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(1);
});

test('render task results 2 disagreements', () => {
    getUserId.mockImplementation(() => {
        return 10;
    });
    getNewTasks.mockImplementation(() => {
        return [{"info": {"c36": "", "c40": "", "c37": "", "c47": "", "c41": "", "c19": "", "c18": "", "c39": "", "c38": "", "c13": "", "c12": "", "c11": "", "c10": "", "c17": "", "c16": "", "c15": "", "c14": "", "c44": "", "c42": "", "c45": "", "c46": "", "c35": "", "c9": "", "c8": "", "c34": "", "c3": "dddd", "c2": "ccc", "c1": "bb", "c0": "a", "c7": "", "c6": "", "c5": "", "c4": "", "c22": "", "c23": "", "c20": "", "c21": "", "c26": "", "c27": "", "c24": "", "c25": "", "c31": "", "c28": "", "c29": "", "c48": "", "c49": "", "c30": "", "c33": "", "target": "lågspänningskabel", "c43": "", "c32": ""}, "fav_user_ids": null, "n_answers": 30, "quorum": 0, "calibration": 0, "created": "2019-03-16T13:33:44.512974", "state": "ongoing", "project_id": 1, "id": 194338, "priority_0": 0.0}];
    });

    const l = new Level(coclass, 'test');
    l.newLevel();
    expect(l.renderTaskResults()).toBe(true);
    expect($('.result').size()).toBe(4);
    expect($('.agreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(10);
    expect($('.disagreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(2);
});


test('render defined questions', () => {
    const l = new Level(coclass, 'test');
    l.newLevel();
    expect(l.renderQuestionSet()).toBe(true);
});

test('render one undefined question', () => {
    const l = new Level(coclass, 'test');
    l.newLevel();
    let qs = l.currentQuestionSet;
    qs[1] = undefined;
    expect(l.renderQuestionSet()).toBe(false);
});

test('get as many questions sets as requested', () => {
    const l = new Level(coclass, 'test');
    l.newLevel();
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
