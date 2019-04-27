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

import {DescriptionQuestion, PathQuestion} from '../question';
import {QUESTION_TYPE_DESCRIPTION, QUESTION_TYPE_PATH} from '../constants';

let dq, pq;
beforeEach(() => {
    document.body.innerHTML = '<div id="description-question"></div><div id="path-question"></div>';

    dq = new DescriptionQuestion('target term', 'correct description',
                                 ['incorrect description 1', 'incorrect description 2', 'incorrect description 3']);
    pq = new PathQuestion('target path', 'correct object',
                          ['incorrect object 1', 'incorrect object 2', 'incorrect object 3']);

    dq.render();
    pq.render();
});

test('no answer selected', () => {
    expect(dq.isAnswerSelected()).toBe(false);
    expect(pq.isAnswerSelected()).toBe(false);
});

test('description answer selected, but path not', () => {
    $(`#${QUESTION_TYPE_DESCRIPTION}-2`).prop('checked', true);

    expect(dq.isAnswerSelected()).toBe(true);
    expect(pq.isAnswerSelected()).toBe(false);
});

test('path answer selected, but description not', () => {
    $(`#${QUESTION_TYPE_PATH}-2`).prop('checked', true);

    expect(dq.isAnswerSelected()).toBe(false);
    expect(pq.isAnswerSelected()).toBe(true);
});

test('both path and description answer selected', () => {
    $(`#${QUESTION_TYPE_DESCRIPTION}-2`).prop('checked', true);
    $(`#${QUESTION_TYPE_PATH}-3`).prop('checked', true);

    expect(dq.isAnswerSelected()).toBe(true);
    expect(pq.isAnswerSelected()).toBe(true);
});
