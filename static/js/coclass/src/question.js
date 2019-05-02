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
    constructor(number, data, correct, incorrect, question, type, element) {
        this._data = data;
        this._correct = correct;
        this._incorrect = incorrect;
        this._question = question;
        this._type = type;
        this._elem = element;
        this._answers = [];
        this._number = number;

        this._choices = insertAtRandomPosition(this._incorrect, this._correct);
    }

    hasMoreThanOneAnswerOption() {
        return (isDefined(this._incorrect) &&
                Array.isArray(this._incorrect) &&
                this._incorrect.length > 0);
    }

    isAnswerCorrect(which = PRE_QUESTION) {
        return (this._answers.length > 0 && this._answers[which] === this._correct);
    }

    set answer(newAnswer) {
        this._answers.push(newAnswer);
    }

    get choices() {
        return this._choices;
    }

    get data() {
        return this._data;
    }

    render() {
        const q = `<h4>${this._number}.&nbsp;${this._question}</h4>`;
        const d = `${this._data}`;
        const c = $('<form style="margin-bottom:40px;"></form>');
        for (const [index, selection] of this.choices.entries()) {
            let checked = '';
            let result = '';

            if (this.preQuestionsAnswered() && selection === this._answers[PRE_QUESTION]) {
                checked = 'checked';
            } else if (this.postQuestionsAnswered()) {
                const answer = this._answers[POST_QUESTION];
                const correctAnswer = this._correct;

                if (selection === answer) {
                    checked = 'checked';
                }

                if ((selection === answer && answer === correctAnswer) || selection === correctAnswer)  {
                    result = '<i class="fas fa-check"></i>';
                } else if (selection === answer) {
                    result = '<i class="fas fa-times"></i>';
                }
            }

            c.append(`<div class="radio"><label><input type="radio" class="coclassquestion" name="${this._type}" id="${this._type}-${index}" value="${selection}" ${checked}>${selection}</label><span class="coclassquestionresult hidden" style="margin-left:5px;">${result}</span></div>`);
        }
        this._elem.append(q);
        this._elem.append(d);
        this._elem.append(c);

        return this._elem.children().length > 0;
    }

    preQuestionsAnswered() {
        return isDefined(this._answers[PRE_QUESTION]) && !isDefined(this._answers[POST_QUESTION]);
    }

    postQuestionsAnswered() {
        return isDefined(this._answers[PRE_QUESTION]) && isDefined(this._answers[POST_QUESTION]);
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
        super(1, data, correct, incorrect,
              'Which is the correct description for the object?',
              QUESTION_TYPE_DESCRIPTION,
              $('#description-question'));
    }
}

export class PathQuestion extends Question {
    constructor(data, correct, incorrect) {
        super(2, data, correct, incorrect,
              'Which is the correct object in the hierarchy?',
              QUESTION_TYPE_PATH,
              $('#path-question'));
    }
}
