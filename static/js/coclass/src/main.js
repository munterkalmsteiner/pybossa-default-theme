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

import CoClass from './coclass';

let coclassData;
$.ajax({
    url: '/static/data/coclass.json',
    dataType: 'json',
    async: false,
    success: function(json) {
        coclassData = json;
    }
});

var coclass = new CoClass(coclassData);

(function() {
    function loadUserProgress() {
        pybossa.userProgress('coclass').done(function(data) {
            var pct = Math.round((data.done*100)/data.total);
            $("#progress").css("width", pct.toString() +"%");
            $("#progress").attr("title", pct.toString() + "% completed!");
            $("#progress").tooltip({'placement': 'left'}); 
            $("#total").text(data.total);
            $("#done").text(data.done);
        });
    }
     
    function showResults(candidates, taskid, userid) {
        $.getJSON('/project/coclass/' + taskid + '/results.json', function(data) {
            let results = $('#results');
            let synonymAssessment = coclass.getUserResult(userid, data);
            let synonymAlignment = coclass.getUserAlignment(userid, data);
            candidates.forEach(function(candidate) {
                let agreement = synonymAlignment[candidate]['a'];
                let disagreement = synonymAlignment[candidate]['d'];
                let tr = '<tr class="result"><td>' + candidate + '</td><td>' +
                         coclass.evaluateResultSynonym(candidate, synonymAssessment) +
                         '</td><td></span><span class="badge">' + agreement +
                         '</span><span class="badge">' + disagreement +
                         '</span></td></tr>';
                results.append(tr);
            });
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
            if (!coclass.updateTargetInfo(task.info.target)) {
                pybossa.saveTask(task.id, 'Error: ' + task.info.target +
         	                                ' not found in coclass data').done(function() {
                                              $('.candidate').remove();
                                              deferred.resolve();
                                          });
            }
             
            $('#task-id').html(task.id);

            let candidates = coclass.extractCandidatesFromTaskInfo(task.info);
            let cbids = coclass.populateCandidates(candidates);
            $('.btn').off('click').on('click', function(evt) {
                if ($(this).parent('#submit').length == 1) {
                    if ($(this).hasClass('btn-submit')) {
                        pybossa.saveTask(task.id, coclass.getSubmitAnswer(cbids)).done(function() {
                            coclass.getUserData()
                                   .then(data => data.user.id,
             		                         error => console.log('Error', error))
                                   .then(userid => showResults(candidates, task.id, userid));
                            $('#submit').hide();
                            $('#next').show();
                        });
                    } else { //user pressed skip
                        pybossa.saveTask(task.id, coclass.getSkipAnswer(cbids)).done(function() {
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

    pybossa.run('coclass');
})();
