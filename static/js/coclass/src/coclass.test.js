import {CoClass, CoClassItem} from './coclass';

let c;
beforeAll(() => {
    let coclassData = require('../../../data/coclass.json');
    c = new CoClass(coclassData);
});

test('load coclass json data', () => {
    expect(c._data).toBeDefined();
    expect(c._data).not.toBeNull();
});


test('find items in coclass', () => {
    let r = c.findItem('Thisitemdoesnotexist');
    expect(r).toBeUndefined();

    r = c.findItem('Trafikanordningar');
    expect(r).toBeDefined();
    let i1 = new CoClassItem();
    i1.name = 'Trafikanordningar';
    i1.definition = 'utrustande system som förser en trafikanläggning med anordningar för styrning och reglering av trafik';
    i1.synonyms = ['trafikutrustning', 'bommar', 'trafiksignaler', 'trafikskyltar'];
    i1.hierarchy = 'Funktionella system >> 3:Utrustande system >> 3T:<strong id=\"target\">Trafikanordningar</strong>';
    expect(r).toEqual(i1);

    r = c.findItem('Stegmotor');
    expect(r).toBeDefined();
    let i2 = new CoClassItem();
    i2.name = 'Stegmotor';
    i2.definition = 'elektromagnetiskt rotationsdrivande objekt som åstadkommer diskreta rotationssteg';
    i2.hierarchy = 'Komponenter >> M:Drivande objekt >> MA:Elektromagnetiskt rotationsdrivande objekt >> MAB:<strong id=\"target\">Stegmotor</strong>';
    expect(r).toEqual(i2);
});
