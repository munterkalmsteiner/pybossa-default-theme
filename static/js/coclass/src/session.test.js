import {Session} from './session';
import {readFileSync} from 'fs';

const html = readFileSync('src/coclass_presenter.html');

let info = {'c0': 'a', 'c1': 'bb', 'c2': 'ccc', 'c3': 'dddd', 'c4': '', 'target': 'tunna' };


let results = [{"info": "Tunna,a:0,bb:0,ccc:0,dddd:0", "external_uid": null, "user_id": 8, "task_id": 369326, "created": "2019-03-21T07:50:18.376039", "finish_time": "2019-03-21T07:51:55.529206", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 594, "media_url": null}, {"info": "Tunna,a:0,bb:1,ccc:0,dddd:0", "external_uid": null, "user_id": 10, "task_id": 369326, "created": "2019-03-21T09:37:27.477913", "finish_time": "2019-03-21T09:38:12.818251", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 628, "media_url": null}, {"info": "SKIPPED,Tunna", "external_uid": null, "user_id": 11, "task_id": 369326, "created": "2019-03-26T09:53:24.721937", "finish_time": "2019-03-26T09:53:41.232894", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 683, "media_url": null}, {"info": "Tunna,a:0,bb:0,ccc:0,dddd:0,flaska:1:s", "external_uid": null, "user_id": 12, "task_id": 369326, "created": "2019-03-26T09:53:24.721937", "finish_time": "2019-03-26T09:53:41.232894", "calibration": null, "user_ip": null, "timeout": null, "project_id": 1, "id": 683, "media_url": null}];

let coclassData;
beforeAll(() => {
    coclassData = require('../../../data/coclass.json');
});

beforeEach(() => {
    document.body.innerHTML = html.toString();
});

test('populate candidates and get answers with no seed', () => {
    let session = new Session(coclassData);
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
    let session = new Session(coclassData);
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
    let session = new Session(coclassData);
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
