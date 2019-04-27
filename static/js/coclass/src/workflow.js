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
import {Level} from './level';
import {CoClass} from './coclass';

let coclass;
$.ajax({
    url: '/static/data/coclass.json',
    dataType: 'json',
    async: false,
    success: function(json) {
        coclass = new CoClass(json);
    }
});

const projectName = 'coclass';

const taskMachine = Machine({
    id: 'ccsfsm',
    initial: 'init',
    context: {
        level: new Level(coclass, projectName)
    },
    states: {
        init: {
            onEntry: ['initUI'],
            on: {
                '': 'showingPreQuestion'
            }
        },
        showingTask: {
            onEntry: ['showTaskUI'],
            on: {
                SUBMITTASK: 'savingTask',
                SKIPTASK: 'savingTask'
            }
        },
        savingTask: {
            invoke: {
                id: 'saveTask',
                src: (ctx, event) => ctx.level.saveTask(event.type),
                onDone: {
                    target: 'showresultOrNexttask',
                },
                onError: {
                    //TODO What now? Show error message...
                }
            }
        },
        showresultOrNexttask: {
            on: {
                '': [
                    { target: 'taskOrQuestionsOrDone', cond: 'didSkipTask' },
                    { target: 'showingTaskResults' }
                ]
            }
        },
        showingTaskResults: {
            on: {
                NEXTTASK: 'taskOrQuestionsOrDone'
            }
        },
        taskOrQuestionsOrDone: {
            on: {
                '': [
                    { target: 'showingPostQuestions', cond: 'allTasksInLevelDone' },
                    { target: 'done', cond: 'allTasksDone' }, // TODO implement correctly
                    { target: 'showingTask', actions: ['getNextTask'] }
                ]
           }
        },
        showingPreQuestion: {
            onEntry: ['showPrequestionUI'],
            onExit: ['getPreQuestionsAnswer'],
            on: {
                FINISHEDQUIZZ: { target: 'showingTask', actions: ['hideQuestions'] },
                NEXTQUESTION: { target: 'showingPreQuestion', cond: 'answersSelected' }
            }
        },
        showingPostQuestions: {
            on: {
                ANSWER: 'showingQuestionsResults'
            }
        },
        showingQuestionsResults: {
            on: {
                CONTINUE: 'showingPreQuestion'
            }
        },
        done: {
            type: 'final'
        }
    }
},
{
    actions: {
        initUI: (ctx, event) => {
            $('#unlreatedhelp').popover();
            $('#synonymhelp').popover();
            $('#generalizationhelp').popover();
            $('#specializationhelp').popover();
        },
        showPrequestionUI: (ctx, event) => {
            const lvl = ctx.level;
            $('#quizz').removeClass('hidden');
            if (lvl.hasNextQuestion()) {
                $('#next-question').removeClass('hidden');
                $('#finished-quizz').addClass('hidden');
            } else {
                $('#next-question').addClass('hidden');
                $('#finished-quizz').removeClass('hidden');
            }

            $('.quizzquestion').empty();
            console.assert(lvl.renderQuestionSet() === true, 'Questions not rendered');
        },
        getPreQuestionsAnswer: (ctx, event) => {
            ctx.level.getAnswersQuestionSet();
            ctx.level.nextQuestion();
        },
        hideQuestions: (ctx, event) => {
            $('#quizz').addClass('hidden');
        },
        showTaskUI: (ctx, event) => {
            $('#task').removeClass('hidden');
            $('#submittask').removeClass('hidden');
            ctx.level.renderTask();
        },
        getNextTask: (ctx, event) => {
            ctx.level.nextTask();
        }
    },
    guards: {
        answersSelected: (ctx, event) => {
            const selected = ctx.level.areQuestionsAnswered();

            if (selected) {
                $('#msgNoAnswers').addClass('hidden');
            } else {
                $('#msgNoAnswers').removeClass('hidden');
            }

            return selected;
        },
        didSkipTask: (ctx, event) => {
            return ctx.level.wasTaskSkipped();
        },
        allTasksInLevelDone: (ctx, event) => {
            return !ctx.level.hasTask();
        },
        allTasksDone: (ctx, event) => {
            return false;
            // after level change, check if we got new tasks.
        }
    }
}
);

const fsm = interpret(taskMachine).onTransition(state => console.log(state.value)).start();

/* Attaching event handlers to UI elements and sending events to state machine */
$('#next-question').click(function(event) {
    fsm.send('NEXTQUESTION');
});

$('#finished-quizz').click(function(event) {
    fsm.send('FINISHEDQUIZZ');
});

$('#submit-task-button').click(function(event) {
    fsm.send('SUBMITTASK');
});

$('#skip-task-button').click(function(event) {
    fsm.send('SKIPTASK');
});

$('#next-task-button').click(function(event) {
    fsm.send('NEXTTASK');
});
