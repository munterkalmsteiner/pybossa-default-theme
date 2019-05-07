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

import {DescriptionQuestion, PathQuestion, allAnswersCorrect} from '../question';
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

test('get pre and post answers if answered', () => {
    dq.render();
    $(`#${QUESTION_TYPE_DESCRIPTION}-2`).prop('checked', true);
    expect(dq.getAnswer()).toBe(true);
    expect(dq.preQuestionsAnswered()).toBe(true);
    expect(dq._answers.length).toBe(1);

    $(`#${QUESTION_TYPE_DESCRIPTION}-0`).prop('checked', true);
    expect(dq.getAnswer()).toBe(true);
    expect(dq.postQuestionsAnswered()).toBe(true);
    expect(dq._answers.length).toBe(2);
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

test('all answers are correct', () => {
    const questions = [];
    const dq1 = new DescriptionQuestion('target term', 'cd1', ['icd1', 'icd2', 'icd3']);
    dq1.answers = ['cd1', 'cd1'];
    const pq1 = new PathQuestion('target path', 'co1', ['ico1', 'ico2', 'ico3']);
    pq1.answers = ['co1', 'co1'];
    questions.push([dq1, pq1]);

    const dq2 = new DescriptionQuestion('target term', 'cd2', ['icd1', 'icd2', 'icd3']);
    dq2.answers = ['cd2', 'cd2'];
    const pq2 = new PathQuestion('target path', 'co2', ['ico1', 'ico2', 'ico3']);
    pq2.answers = ['co2', 'co2'];
    questions.push([dq2, pq2]);

    const dq3 = new DescriptionQuestion('target term', 'cd3', ['icd1', 'icd2', 'icd3']);
    dq3.answers = ['cd3', 'cd3'];
    const pq3 = new PathQuestion('target path', 'co3', ['ico1', 'ico2', 'ico3']);
    pq3.answers = ['co3', 'co3'];
    questions.push([dq3, pq3]);

    expect(allAnswersCorrect(questions)).toBe(true);
});

test('some answer are incorrect', () => {
    const questions = [];
    const dq1 = new DescriptionQuestion('target term', 'cd1', ['icd1', 'icd2', 'icd3']);
    dq1.answers = ['cd1', 'cd1'];
    const pq1 = new PathQuestion('target path', 'co1', ['ico1', 'ico2', 'ico3']);
    pq1.answers = ['co1', 'co1'];
    questions.push([dq1, pq1]);

    const dq2 = new DescriptionQuestion('target term', 'cd2', ['icd1', 'icd2', 'icd3']);
    dq2.answers = ['cd2', 'icd2']; // incorrect
    const pq2 = new PathQuestion('target path', 'co2', ['ico1', 'ico2', 'ico3']);
    pq2.answers = ['co2', 'co2'];
    questions.push([dq2, pq2]);

    const dq3 = new DescriptionQuestion('target term', 'cd3', ['icd1', 'icd2', 'icd3']);
    dq3.answers = ['cd3', 'cd3'];
    const pq3 = new PathQuestion('target path', 'co3', ['ico1', 'ico2', 'ico3']);
    pq3.answers = ['co3', 'co3'];
    questions.push([dq3, pq3]);

    expect(allAnswersCorrect(questions)).toBe(false);
});
