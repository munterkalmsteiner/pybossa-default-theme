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

import {Machine, interpret, assign} from 'xstate';
import {Level} from './level';
import {CoClass} from './coclass';
import {PRE_QUESTION, POST_QUESTION} from './constants';

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
                '': 'initiatingLevel'
            }
        },
        initiatingLevel: {
            invoke: {
                id: 'initiateLevel',
                src: (ctx, event) => ctx.level.restoreLevel(),
                onDone: {
                    target: 'jumpTo'
                },
                onError: {
                    target: 'newLevel'
                }
            }
        },
        jumpTo: {
            on: {
                '': [
                    {
                        cond: 'arePreQuestionsNotAnswered',
                        target: 'answeringPreQuestions'
                    },
                    {
                        cond: 'isLevelNotFinished',
                        target: 'doingTask'
                    },
                    {
                        cond: 'arePostQuestionsNotAnswered',
                        target: 'answeringPostQuestions'
                    },
                    {
                        target: 'newLevel'
                    }
                    ]
            }
        },
        newLevel: {
            onEntry: ['populateLevel', 'saveLevel'],
            on: {
                '': 'answeringPreQuestions'
            }
        },
        doingTask: {
            onEntry: ['showTaskUI'],
            onExit: ['hideTaskUI'],
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
                    target: 'showresultOrNexttask'
                },
                onError: {
                    actions: (ctx, event) => { console.error('Could not save task'); }
                }
            }
        },
        showresultOrNexttask: {
            onEntry: ['saveLevel'],
            on: {
                '': [
                    {
                        cond: 'didSkipTask',
                        target: 'taskOrQuestionsOrDone'
                    },
                    {
                        target: 'showingTaskResults'
                    }
                ]
            }
        },
        showingTaskResults: {
            onEntry: ['showResultsUI'],
            onExit: ['hideResultsUI'],
            on: {
                NEXTTASK: {
                    target: 'taskOrQuestionsOrDone'
                }
            }
        },
        taskOrQuestionsOrDone: {
            on: {
                '': [
                    {
                        cond: 'isLevelfinished',
                        target: 'answeringPostQuestions'
                    },
                    {
                        cond: 'allTasksDone', // TODO implement correctly
                        target: 'done'
                    },
                    {
                        target: 'doingTask'
                    }
                ]
           }
        },
        answeringPreQuestions: {
            onEntry: ['showQuestionsUI', 'showQuestionsNextorFinished'],
            onExit: ['getAnswersQuestionSet', 'hideQuestionsUI', 'hideQuestionsNextorFinished'],
            on: {
                FINISHEDQUIZZ: {
                    cond: 'answersSelected',
                    target: 'doingTask',
                    actions: ['hideQuestionsUI', 'resetQuestions', 'saveLevel']
                },
                NEXTQUESTION: {
                    cond: 'answersSelected',
                    target: 'answeringPreQuestions',
                    actions: ['saveLevel']
                }
            }
        },
        answeringPostQuestions: {
            onEntry: ['showQuestionsUI', 'showQuestionsVerify'],
            onExit: ['getAnswersQuestionSet', 'hideQuestionsUI', 'hideQuestionsVerify'],
            on: {
                VERIFYANSWER: {
                    cond: 'answersSelected',
                    target: 'verifyingPostQuestions',
                    actions: ['saveLevel']
                },
            }
        },
        verifyingPostQuestions: {
            onEntry: ['showVerificationResult', 'showQuestionsNextorFinished'],
            onExit: ['hideVerificationResult', 'hideQuestionsNextorFinished'],
            on: {
                FINISHEDQUIZZ: {
                    target: 'showLevel',
                    actions: ['hideQuestionsUI', 'saveLevel']
                },
                NEXTQUESTION: {
                    target: 'answeringPostQuestions',
                    actions: ['saveLevel']
                }
            }
        },
        showLevel: {
            on: {
                '': 'newLevel'
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
        populateLevel: (ctx, event) => {
            ctx.level.newLevel();
        },
        saveLevel: (ctx, event) => {
            ctx.level.saveLevel();
        },
        showQuestionsUI: (ctx, event) => {
            const lvl = ctx.level;
            $('#quizz').removeClass('hidden');
            $('.quizzquestion').empty();
            console.assert(lvl.renderQuestionSet(lvl.currentQuestionSet) === true, 'Questions not rendered');
        },
        hideQuestionsUI: (ctx, event) => {
            $('#quizz').addClass('hidden');
        },
        showQuestionsNextorFinished: (ctx, event) => {
            if (ctx.level.hasNextQuestion()) {
                $('#next-question').removeClass('hidden');
                $('#finished-quizz').addClass('hidden');
            } else {
                $('#next-question').addClass('hidden');
                $('#finished-quizz').removeClass('hidden');
            }
        },
        hideQuestionsNextorFinished: (ctx, event) => {
            $('#next-question').addClass('hidden');
            $('#finished-quizz').addClass('hidden');
        },
        showQuestionsVerify: (ctx, event) => {
            $('#verify-answer').removeClass('hidden');
        },
        hideQuestionsVerify: (ctx, event) => {
            $('#verify-answer').addClass('hidden');
        },
        showVerificationResult: (ctx, event) => {
            const lvl = ctx.level;
            $('#quizz').removeClass('hidden');
            $('.quizzquestion').empty();
            console.assert(lvl.renderQuestionSet(lvl.previousQuestionSet) === true, 'Questions not rendered');

            $('.coclassquestion').attr('disabled', true);
            $('.coclassquestionresult').removeClass('hidden');
        },
        hideVerificationResult: (ctx, event) => {
            $('#quizz').addClass('hidden');
            $('.coclassquestion').attr('disabled', false);
            $('.coclassquestionresult').addClass('hidden');
        },
        getAnswersQuestionSet: (ctx, event) => {
            ctx.level.getAnswersQuestionSet();
        },
        resetQuestions: (ctx, event) => {
            ctx.level.resetQuestions();
        },
        showTaskUI: (ctx, event) => {
            $('#task').removeClass('hidden');
            $('#submittask').removeClass('hidden');
            console.assert(ctx.level.renderTask() === true, 'Tasks not rendered');
        },
        hideTaskUI: (ctx, event) => {
            $('#task').addClass('hidden');
            $('#submittask').addClass('hidden');
        },
        showResultsUI: (ctx, event) => {
            $('#task').removeClass('hidden');
            $('#taskresults').removeClass('hidden');
            console.assert(ctx.level.renderTaskResults() === true, 'Results not rendered');
        },
        hideResultsUI: (ctx, event) => {
            $('#task').addClass('hidden');
            $('#taskresults').addClass('hidden');
        }
    },
    guards: {
        answersSelected: (ctx, event) => {
            const selected = ctx.level.areAnswersSelected();

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
        isLevelfinished: (ctx, event) => {
            return !ctx.level.hasTask();
        },
        allTasksDone: (ctx, event) => {
            return false;
            // after level change, check if we got new tasks.
        },
        arePreQuestionsNotAnswered: (ctx, event) => {
            return !ctx.level.arePreQuestionSetsAnswered();
        },
        arePostQuestionsNotAnswered: (ctx, event) => {
            return !ctx.level.arePostQuestionSetsAnswered();
        },
        isLevelNotFinished: (ctx, event) => {
            return ctx.level.hasTask();
        }
    }
}
);

const fsm = interpret(taskMachine).onTransition(state => console.log(state.value)).start();

/* Attaching event handlers to UI elements and sending events to state machine */
$('#next-question').click((event) => {
    fsm.send('NEXTQUESTION');
});

$('#finished-quizz').click((event) => {
    fsm.send('FINISHEDQUIZZ');
});

$('#verify-answer-button').click((event) => {
    fsm.send('VERIFYANSWER');
});

$('#submit-task-button').click((event) => {
    fsm.send('SUBMITTASK');
});

$('#skip-task-button').click((event) => {
    fsm.send('SKIPTASK');
});

$('#next-task-button').click((event) => {
    fsm.send('NEXTTASK');
});
