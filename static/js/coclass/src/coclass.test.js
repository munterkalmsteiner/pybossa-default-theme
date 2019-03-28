import fs from 'fs';
import {CoClass} from './coclass';

let coclassData;
beforeAll(() => {
    coclassData = fs.readFileSync('../../data/coclass.json');
});

test('load coclass json data', () => {
    let c = new CoClass(coclassData);
    expect(c._data).toBeDefined();
    expect(c._data).not.toBeNull();
});


