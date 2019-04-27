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

import {insertAtRandomPosition, isDefined} from './utils';
import {QUESTION_TYPE_DESCRIPTION, QUESTION_TYPE_PATH, PRE_QUESTION, POST_QUESTION} from './constants';

class Question {
    constructor(data, correct, incorrect, question, type, element) {
        this._data = data;
        this._correct = correct;
        this._incorrect = incorrect;
        this._question = question;
        this._type = type;
        this._elem = element;
        this._answers = [];
    }

    hasMoreThanOneAnswerOption() {
        return (isDefined(this._incorrect) &&
                Array.isArray(this._incorrect) &&
                this._incorrect.length > 0);
    }

    isAnswerCorrect(which = PRE_QUESTION) {
        return (this._answers.length > 0 && this._answers[which] === this._correct);
    }

    arePrePostAnswersUnchanged() {
        return (this._answers.length == 2 && this._answers[PRE_QUESTION] === this._answers[POST_QUESTION]);
    }

    set answer(newAnswer) {
        this._answers.push(newAnswer);
    }

    get choices() {
        const choices = [...this._incorrect];
        return insertAtRandomPosition(choices, this._correct);
    }

    get data() {
        return this._data;
    }

    render() {
        const q = `<h2>${this._question}</h2>`;
        const d = `<h3>${this._data}</h3>`;
        const c = $('<p></p>');
        for (const [index, choice] of this.choices.entries()) {
            c.append(`<div class="radio"><label><input type="radio" name="${this._type}" id="${this._type}-${index}" value="${choice}">${choice}</label></div>`);
        }
        this._elem.append(q);
        this._elem.append(d);
        this._elem.append(c);

        return this._elem.children().length > 0;
    }

    isAnswerSelected() {
        return isDefined($(`input[type="radio"][name="${this._type}"]:checked`).val());
    }

    getAnswer() {
        let gotAnswer = false;

        if (this.isAnswerSelected()) {
            this._answers.push($(`input[type="radio"][name="${this._type}"]:checked`).val());
            gotAnswer = true;
        }

        return gotAnswer;
    }
}

export class DescriptionQuestion extends Question {
    constructor(data, correct, incorrect) {
        super(data, correct, incorrect,
              'Which is the correct description for the object?',
              QUESTION_TYPE_DESCRIPTION,
              $('#description-question'));
    }
}

export class PathQuestion extends Question {
    constructor(data, correct, incorrect) {
        super(data, correct, incorrect,
              'Which is the correct object in the hierarchy?',
              QUESTION_TYPE_PATH,
              $('#path-question'));
    }
}
