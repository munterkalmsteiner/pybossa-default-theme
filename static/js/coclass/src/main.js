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

import {CoClass} from './coclass';
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

let projectId = 1;
let projectName = 'coclass';
$.ajax({
    url: '/api/project',
    data: `short_name=${projectName}`,
    dataType: 'json',
    async: false,
    success: function(json) {
        if (json.length == 1) {
            projectId = json[0].id;
        } else {
            console.warn('Project %s not found. Using default id: %i', projectName, projectId);
        }

    }
});

let session = new Session(coclassData);

(function() {
    function loadUserProgress() {
        pybossa.userProgress(projectName).done(function(data) {
            var pct = Math.round((data.done*100)/data.total);
            $("#progress").css("width", pct.toString() +"%");
            $("#progress").attr("title", pct.toString() + "% completed!");
            $("#progress").tooltip({'placement': 'left'}); 
            $("#total").text(data.total);
            $("#done").text(data.done);
        });
    }
     
    function showResults(taskid, userid) {
        $.getJSON(`/project/${projectName}/${taskid}/results.json`, function(data) {
            session.populateResults(userid, data, $('#results'));
        });
    }

    function getUserData() {
        return $.ajax({
            type: "GET",
            url: "/account/profile",
            contentType: "application/json",
            dataType: "json"
        });
    }
     
    pybossa.taskLoaded(function(task, deferred) {
        deferred.resolve(task);
    });

    pybossa.presentTask(function(task, deferred) {
        $('#unlreatedhelp').popover();
        $('#synonymhelp').popover();
        $('#generalizationhelp').popover();
        $('#specializationhelp').popover();
        if (!$.isEmptyObject(task)) {
            $('#submit').show();
            $('#next').hide();
            loadUserProgress();
            let targetTerm = task.info.target;
            if (session.findCurrentItem(targetTerm)) {
                $('#definition').html(session.currentItem.description);
                $('#levels').html(session.currentItem.hierarchy);
                if(session.isNewTargetTerm) {
                    $('#target').effect("pulsate", {times: 1}).animate({color: '#d12e2c'}, 2000);
                }
            } else {
                pybossa.saveTask(task.id, 'Error: ' + targetTerm +
         	                       ' not found in coclass data').done(function() {
                                     $('.candidate').remove();
                                     deferred.resolve();
                                 });
            }

            $('#task-id').html(task.id);


            session.populateCandidates(task.info, $('#candidates'));
            $('.btn').off('click').on('click', function(evt) {
                if ($(this).parent('#submit').length == 1) {
                    if ($(this).hasClass('btn-submit')) {
                        pybossa.saveTask(task.id, session.getSubmitAnswer()).done(function() {
                            getUserData()
                                   .then(data => data.user.id,
             		                         error => console.log('Error', error))
                                   .then(userid => showResults(task.id, userid));
                            $('#submit').hide();
                            $('#next').show();
                        });
                    } else { //user pressed skip
                        pybossa.saveTask(task.id, session.getSkipAnswer()).done(function() {
                            $('.candidate').remove();
                            deferred.resolve();
                        });
                    }
                } else if ($(this).parent('#next').length == 1) {
                    $('.candidate').remove();
                    $('.result').remove();
                    deferred.resolve();
                }
            });
        } else {
            $(".skeleton").hide();
            $("#loading").hide();
            $("#finish").fadeIn(500);
        }
    });

    pybossa.run(projectName);
})();
