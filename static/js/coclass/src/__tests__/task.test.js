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

import {Task} from '../task';
import {readFileSync} from 'fs';

const html = readFileSync('src/coclass_presenter.html');
const rawtask = {"info": {"c36": "", "c40": "", "c37": "", "c47": "", "c41": "", "c19": "", "c18": "", "c39": "", "c38": "", "c13": "", "c12": "", "c11": "", "c10": "", "c17": "", "c16": "", "c15": "", "c14": "", "c44": "", "c42": "", "c45": "", "c46": "", "c35": "", "c9": "", "c8": "", "c34": "", "c3": "referenslista", "c2": "referenskod", "c1": "byggemenskap", "c0": "brandegenskap", "c7": "", "c6": "teckensprak", "c5": "reflexband", "c4": "referensspanning", "c22": "", "c23": "", "c20": "", "c21": "", "c26": "", "c27": "", "c24": "", "c25": "", "c31": "", "c28": "", "c29": "", "c48": "", "c49": "", "c30": "", "c33": "", "target": "räl", "c43": "", "c32": ""}, "fav_user_ids": null, "n_answers": 30, "quorum": 0, "calibration": 0, "created": "2019-03-16T13:33:44.759319", "state": "ongoing", "project_id": 1, "id": 194353, "priority_0": 0.0};

beforeEach(() => {
    document.body.innerHTML = html.toString();
});

test('candidates do not include synonym because there is no synonym', () => {
    const t = new Task(rawtask);
    expect(t.candidatesIncludeSynonym([])).toBe(false);
});

test('candidates do not include synonym', () => {
    const t = new Task(rawtask);
    expect(t.candidatesIncludeSynonym(['a', 'b', 'c'])).toBe(false);
});

test('candidates do include a synonym', () => {
    const t = new Task(rawtask);
    expect(t.candidatesIncludeSynonym(['a', 'referenskod', 'c'])).toBe(true);
});

test('candidates do include several synonyms', () => {
    const t = new Task(rawtask);
    expect(t.candidatesIncludeSynonym(['referenslista', 'referenskod', 'c'])).toBe(true);
});

test('add seed increases number of candidates', () => {
    const t = new Task(rawtask);
    const numCandidates = t.candidates.length;
    t.addSeedToCandidates('aaa');
    expect(t.candidates.length).toBe(numCandidates + 1);
});

test('render task smoke test', () => {
    let t = new Task(rawtask);
    expect(t.renderTask(true, 'bla', 'blub')).toBe(true);
});


test('get answer no synonym selected', () => {
    const t = new Task(rawtask);
    expect(t.renderTask(true, 'bla', 'blub')).toBe(true);
    const answer = t.getAnswer('SUBMITTASK');
    expect(answer.synonymFound).toBe(false);
    expect(answer.answerString).toMatch(/^räl,(?:\w+:0,?){7}$/);
});

test('get answer one synonym selected', () => {
    const t = new Task(rawtask);
    expect(t.renderTask(true, 'bla', 'blub')).toBe(true);

    $('#c-1-0').prop('checked', true).trigger('click');

    const answer = t.getAnswer('SUBMITTASK');
    expect(answer.synonymFound).toBe(true);
    expect(answer.answerString).toMatch(/^räl,.*:1.*$/);
});

test('get answer more synonyms selected', () => {
    const t = new Task(rawtask);
    expect(t.renderTask(true, 'bla', 'blub')).toBe(true);

    $('#c-1-0').prop('checked', true).trigger('click');
    $('#c-1-2').prop('checked', true).trigger('click');

    const answer = t.getAnswer('SUBMITTASK');
    expect(answer.synonymFound).toBe(true);
    expect(answer.answerString).toMatch(/^räl,.*:1.*$/);
});

test('get answer with seeded synonym', () => {
    const t = new Task(rawtask);
    t.addSeedToCandidates('seeeeed');
    expect(t.renderTask(true, 'bla', 'blub')).toBe(true);

    const answer = t.getAnswer('SUBMITTASK');
    expect(answer.answerString).toMatch(/^räl,.*seeeeed:0:s.*$/);
});

test('get skip answer', () => {
    const t = new Task(rawtask);
    expect(t.renderTask(true, 'bla', 'blub')).toBe(true);

    const answer = t.getAnswer('SKIPTASK');
    expect(answer.synonymFound).toBe(false);
    expect(answer.answerString).toMatch(/^SKIPPED,räl$/);
});

test('get skip answer with seeded synonym', () => {
    const t = new Task(rawtask);
    t.addSeedToCandidates('seeeeed');
    expect(t.renderTask(true, 'bla', 'blub')).toBe(true);

    const answer = t.getAnswer('SKIPTASK');
    expect(answer.synonymFound).toBe(false);
    expect(answer.answerString).toMatch(/^SKIPPED,räl,seeeeed:0:s$/);
});

