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

import * as pybossa from '../pybossa';
import {__RewireAPI__ as pybossaRewireAPI} from '../pybossa';
import {MAXIMUM_TASKS_PER_REQUEST} from '../constants';

let data;
let callCounter = 0;
beforeAll(() => {
    data = [...Array(1234)];
    pybossaRewireAPI.__Rewire__('_fetchNewTasks', (projectId, limit, offset) => {
        callCounter++;
        return data.slice(offset, offset+limit);
    });
});

beforeEach(() => {
    callCounter = 0;
});

test('get 10 new tasks', () => {
    const amount = 10;
    expect(pybossa.getNewTasks('1', amount).length).toBe(amount);
    expect(callCounter).toBe(1);
});

test('get MAX-1 new tasks', () => {
    const amount = MAXIMUM_TASKS_PER_REQUEST-1;
    expect(pybossa.getNewTasks('1', amount).length).toBe(amount);
    expect(callCounter).toBe(1);
});

test('get MAX new tasks', () => {
    const amount = MAXIMUM_TASKS_PER_REQUEST;
    expect(pybossa.getNewTasks('1', amount).length).toBe(amount);
    expect(callCounter).toBe(1);
});

test('get MAX+1 new tasks', () => {
    const amount = MAXIMUM_TASKS_PER_REQUEST+1;
    expect(pybossa.getNewTasks('1', amount).length).toBe(amount);
    expect(callCounter).toBe(2);
});

test('get 5*MAX+10 new tasks', () => {
    const amount = 5*MAXIMUM_TASKS_PER_REQUEST+10;
    expect(pybossa.getNewTasks('1', amount).length).toBe(amount);
    expect(callCounter).toBe(6);
});

test('get 0 new tasks', () => {
    const amount = 0;
    expect(pybossa.getNewTasks('1', amount).length).toBe(amount);
    expect(callCounter).toBe(amount);
});

test('get negative new tasks', () => {
    const amount = -10;
    expect(pybossa.getNewTasks('1', 0).length).toBe(0);
    expect(callCounter).toBe(0);
});
