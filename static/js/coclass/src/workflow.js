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
    initial: 'initiatingLevel',
    context: {
        level: new Level(coclass, projectName, false)
    },
    states: {
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
                        cond: 'allTasksDone',
                        target: 'done'
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
            onEntry: ['newLevel', 'showLevel', 'saveLevel'],
            onExit: ['hideLevel'],
            after: {
                10: {
                    cond: 'allTasksDone',
                    target: 'done'
                },
                50: {
                    cond: 'skipQuizz',
                    target: 'doingTask'
                },
                2000: {
                    target: 'answeringPreQuestions'
                }
            }
        },
        doingTask: {
            onEntry: ['showTaskUI', 'updateTaskProgress'],
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
                    target: 'newLevel',
                    actions: ['showSavingTaskError']
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
                        cond: 'answerPostQuestions',
                        target: 'answeringPostQuestions'
                    },
                    {
                        cond: 'dontAnswerPostQuestions',
                        target: 'newLevel',
                    },
                    {
                        target: 'doingTask'
                    }
                ]
           }
        },
        answeringPreQuestions: {
            onEntry: ['showQuestionsUI', 'showPreQuestionsNextorFinished'],
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
            onEntry: ['showVerificationResult', 'showPostQuestionsNextorFinished'],
            onExit: ['hideVerificationResult', 'hideQuestionsNextorFinished'],
            on: {
                FINISHEDQUIZZ: {
                    target: 'newLevel',
                    actions: ['hideQuestionsUI'] 
                },
                NEXTQUESTION: {
                    target: 'answeringPostQuestions'
                }
            }
        },
        done: {
            onEntry: ['showDoneMessage'],
            type: 'final'
        }
    }
},
{
    actions: {
        newLevel: (ctx, event) => {
            ctx.level.newLevel();
        },
        saveLevel: (ctx, event) => {
            ctx.level.saveLevel();
        },
        showLevel: (ctx, event) => {
            if (!ctx.level.skipQuizz()) {
                $('#level').text(`Level ${ctx.level.userLevel}`);
                $('#level').hide();
                $('#level').show('fade', 1500);
            }
        },
        hideLevel: (ctx, event) => {
            $('#level').hide();
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
        showPreQuestionsNextorFinished: (ctx, event) => {
            if (ctx.level.hasNextQuestion()) {
                $('#next-question').removeClass('hidden');
                $('#finished-quizz').addClass('hidden');
            } else {
                $('#next-question').addClass('hidden');
                $('#finished-quizz').removeClass('hidden');
            }
        },
        showPostQuestionsNextorFinished: (ctx, event) => {
            if (ctx.level.hasQuestion()) {
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
            $('#taskresults').addClass('hidden');
            console.assert(ctx.level.renderTask() === true, 'Tasks not rendered');
        },
        hideTaskUI: (ctx, event) => {
            $('#task').addClass('hidden');
            $('#submittask').addClass('hidden');
        },
        showResultsUI: (ctx, event) => {
            $('#task').removeClass('hidden');
            $('#taskresults').removeClass('hidden');
            $('#submittask').addClass('hidden');
            console.assert(ctx.level.renderTaskResults() === true, 'Results not rendered');
        },
        hideResultsUI: (ctx, event) => {
            $('#task').addClass('hidden');
            $('#taskresults').addClass('hidden');
        },
        showSavingTaskError: (ctx, event) => {
            $('#errorAlert').show();
            if (event.data.status === 403) {
                $('#errorMsg').text('Due to inactivity of more than 60 minutes, the level has been restarted.');
            } else {
                $('#errorMsg').text('Due to an unknown error, the level will be restarted. Please contact mun@bth.se.');
            }
        },
        updateTaskProgress: (ctx, event) => {
            const lvl = ctx.level;
            $('#task-id').text(lvl.task.id);

            if (lvl.skipQuizz()) {
                lvl.getUserProgress().done(data => {
                    const pct = Math.round((data.done * 100) / data.total);
                    $('#progress').css('width', `${pct.toString()}%`);
                    $('#progress').attr('title', `${pct.toString()}% completed!`);
                    $('#total').text(data.total);
                    $('#done').text(data.done);
                });
            } else {
                const pct = Math.round(lvl.doneTasksInLevel * 100 / lvl.totalTasksPerLevel);
                $('#progress').css('width', `${pct.toString()}%`);
                $('#progress').attr('title', `${pct.toString()}% in level ${lvl.userLevel} completed!`);
                $('#total').text(`${lvl.totalTasksPerLevel}`);
                $('#inLevel').html(`&nbsp;in level ${lvl.userLevel}`);
                $('#done').text(lvl.doneTasksInLevel);
            }
            $('#progress').tooltip({'placement': 'left'}); 
        },
        showDoneMessage: (ctx, event) => {
            $('#finishAlert').show();
        }
    },
    guards: {
        answersSelected: (ctx, event) => {
            const selected = ctx.level.areAnswersSelected();

            if (selected) {
                $('#msgAnswerQuizz').addClass('hidden');
            } else {
                $('#msgAnswerQuizz').removeClass();
                $('#msgAnswerQuizz').addClass('alert alert-danger');
                $('#msgAnswerQuizz').html('Please answer all questions before proceeding');
            }

            return selected;
        },
        didSkipTask: (ctx, event) => {
            return ctx.level.wasTaskSkipped();
        },
        answerPostQuestions: (ctx, event) => {
            return !ctx.level.hasTask() && !ctx.level.skipQuizz();
        },
        dontAnswerPostQuestions: (ctx, event) => {
            return !ctx.level.hasTask() && ctx.level.skipQuizz();
        },
        allTasksDone: (ctx, event) => {
            return ctx.level.numTasks() ===  0;
        },
        arePreQuestionsNotAnswered: (ctx, event) => {
            return !ctx.level.arePreQuestionSetsAnswered() && !ctx.level.skipQuizz();
        },
        arePostQuestionsNotAnswered: (ctx, event) => {
            return !ctx.level.arePostQuestionSetsAnswered() && !ctx.level.skipQuizz();
        },
        isLevelNotFinished: (ctx, event) => {
            return ctx.level.hasTask();
        },
        skipQuizz: (ctx, event) => {
            return ctx.level.skipQuizz();
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

/* Helper functions */

// Dismissable, reappearing alerts 
// https://stackoverflow.com/a/13550556/2091625
$(function(){
    $("[data-hide]").on("click", function(){
        $("." + $(this).attr("data-hide")).hide();
    });
});
