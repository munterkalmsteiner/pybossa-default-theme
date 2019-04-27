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

import {Session} from '../session';
import {CoClass} from '../coclass';
import {readFileSync} from 'fs';

const html = readFileSync('src/coclass_presenter.html');

const info = {'c0': 'a', 'c1': 'bb', 'c2': 'ccc', 'c3': 'dddd', 'c4': '', 'target': 'tunna' };


const results = [{"info": "Tunna,a:0,bb:0,ccc:0,dddd:0", "external_uid": null, "user_id": 8, "task_id": 369326, "created": "2019-03-21T07:50:18.376039", "finish_time": "2019-03-21T07:51:55.529206", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 594, "media_url": null}, {"info": "Tunna,a:0,bb:1,ccc:0,dddd:0", "external_uid": null, "user_id": 10, "task_id": 369326, "created": "2019-03-21T09:37:27.477913", "finish_time": "2019-03-21T09:38:12.818251", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 628, "media_url": null}, {"info": "SKIPPED,Tunna", "external_uid": null, "user_id": 11, "task_id": 369326, "created": "2019-03-26T09:53:24.721937", "finish_time": "2019-03-26T09:53:41.232894", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 683, "media_url": null}, {"info": "Tunna,a:0,bb:0,ccc:0,dddd:0,flaska:1:s", "external_uid": null, "user_id": 12, "task_id": 369326, "created": "2019-03-26T09:53:24.721937", "finish_time": "2019-03-26T09:53:41.232894", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 683, "media_url": null}];

let coclass;
beforeAll(() => {
    const data = require('../../../../data/coclass.json');
    coclass = new CoClass(data);
});

beforeEach(() => {
    document.body.innerHTML = html.toString();
});

test('populate candidates and get answers with no seed', () => {
    const session = new Session(coclass);
    expect(session.findCurrentItem('Tunna')).toBe(true);

    session.populateCandidates(info, $('#candidates'));

    $('.target').each( (i, e) => {
        expect($(e).text()).toEqual('Tunna'); 
    });
    expect($('.candidate').size()).toBe(4);
    expect($('.seeded').size()).toBe(0);

    expect(session.getSubmitAnswer()).toEqual('Tunna,a:0,bb:0,ccc:0,dddd:0');
    expect(session.getSkipAnswer()).toEqual('SKIPPED,Tunna');
});

test('populate candidates and get answers with seeded synonym', () => {
    const session = new Session(coclass);
    session.needSynonymSeed = jest.fn().mockImplementation(() => true);

    expect(session.findCurrentItem('Tunna')).toBe(true);

    session.populateCandidates(info, $('#candidates'));

    $('.target').each( (i, e) => {
        expect($(e).text()).toEqual('Tunna'); 
    });
    expect($('.candidate').size()).toBe(5);
    expect($('.seeded').size()).toBe(1);

    expect(session.getSubmitAnswer()).toMatch(/Tunna.*flaska:0:s.*/);
    expect(session.getSkipAnswer()).toEqual('SKIPPED,Tunna,flaska:0:s');
});

test('populate results user without seeded synonym', () => {
    const session = new Session(coclass);
    expect(session.findCurrentItem('Tunna')).toBe(true);

    // Based on the results, this is the agreement
    // n -> no synonym, y -> synonym
    // a -> agree, d -> disagree
    // User 8:  n,n,n,n -> 3a0d,2a1d,3a0d,3a0d -> 11a,1d
    // User 10: n,y,n,n -> 3a0d,1a2d,3a0d,3a0d -> 10a,2d
    // User 12: n,n,n,n,y -> 3a0d,2a1d,3a0d,3a0d,1a -> 12a,1d 

    session.populateCandidates(info, $('#candidates'));
    session.populateResults(8, results, $('#results'));
    expect($('.result').size()).toBe(4);
    expect($('.agreement').text()).toEqual('3233');
    expect($('.disagreement').text()).toEqual('0100');

    $('.result').remove();

    session.populateResults(10, results, $('#results'));
    expect($('.result').size()).toBe(4);
    expect($('.agreement').text()).toEqual('3133');
    expect($('.disagreement').text()).toEqual('0200');

    $('.result').remove();

    session.needSynonymSeed = jest.fn().mockImplementation(() => true);
    session.populateCandidates(info, $('#candidates'));
    session.populateResults(12, results, $('#results'));
    expect($('.result').size()).toBe(5);

    expect($('.agreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(12);

    expect($('.disagreement').get().reduce( (a,b) => {
        return a + parseInt($(b).text());
    }, 0)).toBe(1);
});
