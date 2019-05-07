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

import {MAXIMUM_TASKS_PER_REQUEST} from './constants';
import {isDefined} from './utils';

function getNewTasks(projectId, amount) {
    let tasks = [];
    let offset = 0;
    while (amount > 0) {
        const limit = Math.min(MAXIMUM_TASKS_PER_REQUEST, amount);
        const fetchedTasks = _fetchNewTasks(projectId, limit, offset);
        if (isDefined(fetchedTasks)) {
            if (Array.isArray(fetchedTasks)) {
                tasks.push(...fetchedTasks);
            } else {
                tasks.push(fetchedTasks);
            }
        }
        offset += limit;
        amount -= limit;
    }

    return tasks;
}

function saveTask(taskId, answer) {
    if (typeof(taskId) === "number") {
        return _fetchTask(taskId).then(_createTaskRun.bind(undefined, answer));
    }
    if (typeof(taskId) === "object") {
        const task = taskId;
        return _createTaskRun(answer, task);
    }
}

function getResults(projectName, taskId) {
    let data;
    $.ajax({
        type: 'GET',
        url: `/project/${projectName}/${taskId}/results.json`,
        dataType: 'json',
        contentType: 'application/json',
        cache: false,
        async: false,
        success: function(json) {
            data = json;
        },
        error: (err) => {
            console.error(err);
        }
    });

    return data;
}

function getQuizzResults(projectId, userId) {
    let data;
    $.ajax({
        type: 'GET',
        url: `/api/taskrun?project_id=${projectId}&user_id=${userId}&info={"_quizzResult": {"_answered": true}}`,
        dataType: 'json',
        contentType: 'application/json',
        cache: true,
        async: false,
        success: function(json) {
            data = json;
        },
        error: (err) => {
            console.error(err);
        }
    });

    return data;
}

function getUserId() {
    const data = _getUserData();
    return data.user.id;
}

function getProjectId(projectName) {
    let projectId = 1;
    const data = _getProjectData(projectName);

    if (data.length === 1) {
        projectId = data[0].id;
    } else {
        console.warn('Project %s not found. Using default id: %i', projectName, projectId);
    }

    return projectId;
}

/* converts a JQuery deferred Object to a native Promise */
function toPromise ($promise) {
    return new Promise((resolve, reject) => {
        $promise.then(resolve, reject);
    });
}

function _createTaskRun(answer, task) {
    task = _addAnswerToTask(task, answer);
    let taskrun = {
        'project_id': task.project_id,
        'task_id': task.id,
        'info': task.answer
    };
    taskrun = JSON.stringify(taskrun);
    return _saveTaskRun(taskrun).then((data) => { return data; });
}

function _addAnswerToTask(task, answer) {
    task.answer = answer;
    return task;
}

function _saveTaskRun(taskrun) {
    return $.ajax({
        type: 'POST',
        url: '/api/taskrun',
        dataType: 'json',
        contentType: 'application/json',
        data: taskrun,
        error: (err) => {
            console.error(err);
        }
    });
}

function _fetchTask(taskId) {
    return $.ajax({
        type: 'GET',
        url: `/api/task/${taskId}`,
        cache: false,
        dataType: 'json',
        contentType: 'application/json',
        error: (err) => {
            console.error(err);
        }
    });
}

function _fetchNewTasks(projectId, limit, offset) {
    let data = undefined;
    $.ajax({
        type: 'GET',
        url: `/api/project/${projectId}/newtask`,
        data: `limit=${limit}&offset=${offset}`,
        dataType: 'json',
        contentType: 'application/json',
        cache: false,
        async: false,
        success: function(json) {
            data = json;
        },
        error: (err) => {
            console.error(err);
        }
    });

    return data;
}

function _getUserData() {
    let data = undefined;
    $.ajax({
        type: 'GET',
        url: "/account/profile",
        dataType: "json",
        contentType: 'application/json',
        cache: false,
        async: false,
        success: function(json) {
            data = json;
        },
        error: (err) => {
            console.error(err);
        }
    });

    return data;
}

function _getProjectData(projectName) {
    let data = undefined;
    $.ajax({
        type: 'GET',
        url: '/api/project',
        data: `short_name=${projectName}`,
        dataType: "json",
        contentType: 'application/json',
        cache: true, // pybossa does not like the underscore parameter added to the request by jQuery in order to disable caching. Seems to be a problem for this and taskrun endpoint...
        async: false,
        success: function(json) {
            data = json;
        },
        error: (err) => {
            console.error(err);
        }
    });

    return data;
}

export {getNewTasks, saveTask, getUserId, getProjectId, getResults, getQuizzResults, toPromise};


