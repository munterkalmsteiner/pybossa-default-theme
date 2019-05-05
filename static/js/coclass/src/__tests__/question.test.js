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
});

test('no answer selected', () => {
    dq.render();
    pq.render();
    expect(dq.isAnswerSelected()).toBe(false);
    expect(pq.isAnswerSelected()).toBe(false);
});

test('description answer selected, but path not', () => {
    dq.render();
    pq.render();
    $(`#${QUESTION_TYPE_DESCRIPTION}-2`).prop('checked', true);

    expect(dq.isAnswerSelected()).toBe(true);
    expect(pq.isAnswerSelected()).toBe(false);
});

test('path answer selected, but description not', () => {
    dq.render();
    pq.render();
    $(`#${QUESTION_TYPE_PATH}-2`).prop('checked', true);

    expect(dq.isAnswerSelected()).toBe(false);
    expect(pq.isAnswerSelected()).toBe(true);
});

test('both path and description answer selected', () => {
    dq.render();
    pq.render();
    $(`#${QUESTION_TYPE_DESCRIPTION}-2`).prop('checked', true);
    $(`#${QUESTION_TYPE_PATH}-3`).prop('checked', true);

    expect(dq.isAnswerSelected()).toBe(true);
    expect(pq.isAnswerSelected()).toBe(true);
});

test('pre question answered', () => {
    expect(dq.preQuestionsAnswered()).toBe(false);
    dq.addAnswer('something');
    expect(dq.preQuestionsAnswered()).toBe(true);
});

test('post question answered', () => {
    expect(dq.postQuestionsAnswered()).toBe(false);
    dq.addAnswer('something');
    expect(dq.postQuestionsAnswered()).toBe(false);
    dq.addAnswer('something else');
    expect(dq.postQuestionsAnswered()).toBe(true);
});

test('get answers if not answered', () => {
    dq.render();
    expect(dq.getAnswer()).toBe(false);
});

test('get answers if answered', () => {
    dq.render();
    $(`#${QUESTION_TYPE_DESCRIPTION}-2`).prop('checked', true);
    expect(dq.getAnswer()).toBe(true);
    expect(dq.preQuestionsAnswered()).toBe(true);
});

test('render post question with correct answer', () => {
    dq.answers = ['correct description', 'correct description'];
    dq.render();
    expect($('.fa-times').length).toBe(0);
    expect($('.fa-check').length).toBe(1);

    let elem = $('input[value="correct description"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(1);
    expect(elem.parent().parent().find('.fa-times').length).toBe(0);

    elem = $('input[value="incorrect description 1"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(0);
    expect(elem.parent().parent().find('.fa-times').length).toBe(0);

    elem = $('input[value="incorrect description 2"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(0);
    expect(elem.parent().parent().find('.fa-times').length).toBe(0);

    elem = $('input[value="incorrect description 3"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(0);
    expect(elem.parent().parent().find('.fa-times').length).toBe(0);
});

test('render post question with incorrect answer', () => {
    dq.answers = ['incorrect description 2', 'incorrect description 2'];
    dq.render();
    expect($('.fa-times').length).toBe(1);
    expect($('.fa-check').length).toBe(1);

    let elem = $('input[value="correct description"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(1);
    expect(elem.parent().parent().find('.fa-times').length).toBe(0);

    elem = $('input[value="incorrect description 1"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(0);
    expect(elem.parent().parent().find('.fa-times').length).toBe(0);

    elem = $('input[value="incorrect description 2"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(0);
    expect(elem.parent().parent().find('.fa-times').length).toBe(1);

    elem = $('input[value="incorrect description 3"]');
    expect(elem.length).toBe(1);
    expect(elem.parent().parent().find('.fa-check').length).toBe(0);
    expect(elem.parent().parent().find('.fa-times').length).toBe(0);
});


