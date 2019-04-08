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

import {Machine, interpret} from 'xstate';
import {Session} from './session';

let coclassData;
$.ajax({
    url: '/static/data/coclass.json',
    dataType: 'json',
    async: false,
    success: function(json) {
        coclassData = json;
    }
});

const taskMachine = Machine({
    id: 'ccsfsm',
    initial: 'init',
    context: {
        session: new Session(coclassData)
    },
    states: {
        init: {
            onEntry:  ['hideUI'],
            on: {
                '': 'showingPreQuestions'
            } 
        },
        showingTask: {
            on: {
                SUBMIT: 'showingTaskResults',
                SKIP: 'taskOrQuestionsOrDone'
            }
        },
        showingTaskResults: {
            on: {
                CONTINUE: 'taskOrQuestionsOrDone'
            }
        },
        taskOrQuestionsOrDone: {
            on: {
                '': [
                    { target: 'showingTask', cond: 'levelIsNotFinished' },
                    { target: 'showingPostQuestions', cond: 'levelIsFinished' },
                    { target: 'done', cond: 'allTasksDone' }
                ]
            }
        },
        showingPreQuestions: {
            onEntry: ['showPrequestionsUI'],
            on: {
                ANSWER: 'showingTask'
            }
        },
        showingPostQuestions: {
            on: {
                ANSWER: 'showingQuestionsResults'
            }
        },
        showingQuestionsResults: {
            on: {
                CONTINUE: 'showingPreQuestions'
            }
        },
        done: {
            type: 'final'
        }
    }
},
{
    actions: {
        hideUI: (ctx, event) => {
            $('#task').hide();
            $('#question').hide();
            $('#questionresults').hide();
            $('#progress').hide();
        },
        showPrequestionsUI: (ctx, event) => {
            $('#question').show();
            // create class pybossa with static API methods
            // fetch the next X tasks (get number from session constant)
            // choose 1 term from tasks and create a question based on in with coclass data -> create class QuestionGenerator
            // show question and on user answer transition to next state
        }
   }
}
);

const fsm = interpret(taskMachine).onTransition(state => console.log(state.value)).start();

/* Attaching event handlers to UI elements and sending events to state machine */
$('#qs').click(function(event) {
    fsm.send('ANSWER');
});
