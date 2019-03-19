// coclass.js library
//
// Copyright (C) 2018 Michael Unterkalmsteiner
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

var coclass = (function($) {
    let _actualSynonyms = [];
    let _streakNoSynonymsFound = 0;
    let _synonymFound = false;
    let _target = undefined;

    var _findInCoClass = function (obj, target, stack) {
        let found = false;
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }

            if (obj[key] !== undefined &&
                obj[key].hasOwnProperty('term') &&
                obj[key]['term'] !== undefined &&
                obj[key]['term'].toLowerCase() === target.toLowerCase()) {

                $('#definition').html(obj[key].desc);
                let level = new Object();
                level.code = key;
                level.term = obj[key]['term'];
                stack.push(level);

                let cummulativecode = new String();
                let levels = new String();
                for (let i = 0; i < stack.length; i++) {
                    let code = stack[i].code;
                    if (code.length == 1) {
                        cummulativecode += code;
                        levels += cummulativecode + ':';
                        if (i == stack.length - 1) {
                            levels += '<strong id="target">' + stack[i].term + '</strong>';
                        } else {
                            levels += stack[i].term;
                        }

                        if (i < stack.length - 1) {
                            levels += ' >> ';
                        }
                    } else {
                        levels += code + ' >> ';
                    }

                }

                $('#levels').html(levels);

                if(_target !== target) {
                    $('#target').effect("pulsate", {times: 1}).animate({color: '#d12e2c'}, 2000);
                    _target = target;
                }


                let syns = obj[key]['syns'];
                if (syns !== undefined && syns.length != 0 && syns[0].length != 0) {
                    _actualSynonyms = syns.map(syn => syn.toLowerCase());
                } else {
                    _actualSynonyms = [];
                }
                found = true;
                break;
            } else if (typeof obj[key] === 'object') {
                let level = new Object();
                level.code = key;
                if (obj[key].hasOwnProperty('term')) {
                    level.term = obj[key]['term'];
                }
                stack.push(level);
                found = _findInCoClass(obj[key], target, stack);
                stack.pop();
             	  if (found) {
               	   break;
                }
            }
        }

        return found;
    };

    var _extractCandidatesFromTaskInfo = function(info) {
        let candidates = new Array();
        for (let key in info) {
            if (info.hasOwnProperty(key) && key !== 'target' && info[key] !== '') {
                candidates.push(info[key]);
            }
        }

        return candidates;
    };

    var _updateTargetInfo = function(target) {
        let found = false;
        $.ajax({
            url: '/static/data/coclass.json',
            dataType: 'json',
            async: false,
            success: function(json) {
                found = _findInCoClass(json, target, new Array());
         	  }
        });

        return found;
    };

    var _getUserData = function() {
        return $.ajax({
            type: "GET",
            url: "/account/profile",
            contentType: "application/json",
            dataType: "json"
        });
    };

    var _getUserResult = function(userid, results) {
        let result = results.find(r => r.user_id == userid);

        let processedAssessment = {};
        if (result !== undefined) {
            let assessments = result.info.split(',');

            for (let i = 1; i < assessments.length; i++) {
                let assessment = assessments[i];
                let item = assessment.split(':');
                processedAssessment[item[0]] = item[1];
            }
        }

        return processedAssessment;
    };

    var _getUserAlignment = function(userid, results) {
        let alignment = {};
        let user = _getUserResult(userid, results);
        //let others = results.filter(r => r.user_id != userid);
        for (let i = 0; i < results.length; i++) {
            let assessments = results[i].info.split(',');
            for (let j = 1; j < assessments.length; j++) {
                let assessment = assessments[j].split(':');
                let candidate = assessment[0];
                let isSynonym = (assessment[1] == 1);
                let user_isSynonym = (user[candidate] == 1);
                alignment[candidate] = alignment[candidate] || {'a': 0, 'd': 0};
                if (user_isSynonym == isSynonym) {
                    alignment[candidate]['a'] += 1;
                } else {
                    alignment[candidate]['d'] += 1;
                }
            }
        }

        return alignment;
    };

    var _evaluateResultSynonym = function(term, synonymAssessment) {
        let isActualSynonym = _actualSynonyms.includes(term);
        let isJudgedAsSynonym = (synonymAssessment[term] == 1);

        let result = '<i class="fas fa-';

        if (isActualSynonym && isJudgedAsSynonym) {
            return result + 'check"></i>';
        } else if (isActualSynonym && !isJudgedAsSynonym) {
            return result + 'times"></i>';
        } else if (!isActualSynonym && isJudgedAsSynonym) {
            return result + 'star"></i>';
        }

        return result + 'minus"></i>';
    };

    var _populateCandidates = function(candidates) {
        _synonymFound = false;
        let cds = $('#candidates');
        let cbids = new Array();
        let seed;

        if (_needSynonymSeed() && !_candidatesIncludeActualSynonym(candidates)) {
            seed = _getRandomSynonym();
            if (seed !== undefined) {
                candidates.splice(Math.floor(Math.random() * candidates.length), 0, seed);
                _streakNoSynonymsFound = 0;
            }
        }

        candidates.forEach(function(candidate, index) {
            cbids.push("select" + index);
            cds.append(_getCandidateSelection(candidate, cbids[index], candidate === seed));
        });

        return cbids;
    };

    var _getCandidateSelection = function(term, cbid, seeded) {
        return '<tr id="' + cbid + '" class="candidate' + (seeded ? ' seeded' : '') + '" data-term="' + term + '"><td>' + term + ' is</td><td><input type="radio" name="radio_' + cbid + '" value="0" checked></td><td><input type="radio" name="radio_' + cbid + '" value="1"></td><td><input type="radio" name="radio_' + cbid + '" value="2"></td><td><input type="radio" name="radio_' + cbid + '" value="3"></td><td>' + _target + '</td></tr>';
    };

    var _getRandomSynonym = function() {
        let length = _actualSynonyms.length;
        if (_actualSynonyms !== undefined && length > 0) {
            return _actualSynonyms[Math.floor(Math.random() * length)];
        }

        return undefined;
    };

    var _candidatesIncludeActualSynonym = function(candidates) {
        if (_actualSynonyms !== undefined && _actualSynonyms.length > 0) {
            for (let i = 0; i < candidates.length; i++) {
                if (_actualSynonyms.includes(candidates[i])) {
                        return true;
                }
            }
        }

        return false;
    };

    var _getSubmitAnswer = function(cbids) {
        let answer = _target;
        cbids.forEach(function(id) {
            let row = $('#' + id);
            let seeded = $(row).hasClass('seeded');
            let term = $(row).attr("data-term");
            let selection = $(row).find('input[name=radio_' + id + ']:checked').val();
            _updateSynonymFound(selection);
            answer += ',' + term + ':' + selection + (seeded ? ':s' : '');
        });

        if(!_synonymFound) {
            _streakNoSynonymsFound++;
        }

        return answer;
    };

    var _updateSynonymFound = function(selection) {
        if (!_synonymFound && selection == 1) {
            _synonymFound = true;
            _streakNoSynonymsFound = 0;
        }
    };

    var _getSkipAnswer = function(cbids) {
        _streakNoSynonymsFound++;
        let seed;
        cbids.forEach(function(id) {
            let row = $('#' + id);
            if (row.hasClass('seeded')) {
                seed = $(row).attr("data-term");
            }
        });

        let answer = "SKIPPED," + _target;
        if (seed !== undefined) {
            answer += answer + ',' + seed + ':0:s';
        }

        return answer;
    };

    var _needSynonymSeed = function() {
        return _streakNoSynonymsFound >= 10;
    };

    var _getTargetTerm = function() {
        return $('#target').text();
    };

    return {
        extractCandidatesFromTaskInfo: _extractCandidatesFromTaskInfo,
        updateTargetInfo: _updateTargetInfo,
        getUserData: _getUserData,
        getUserResult: _getUserResult,
        getUserAlignment: _getUserAlignment,
        evaluateResultSynonym: _evaluateResultSynonym,
        populateCandidates: _populateCandidates,
        getSubmitAnswer: _getSubmitAnswer,
        getSkipAnswer: _getSkipAnswer
    };

})(jQuery);
