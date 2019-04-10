import {CoClass, CoClassItem} from './coclass';

let c;
beforeAll(() => {
    let coclassData = require('../../../data/coclass.json');
    c = new CoClass(coclassData);
});

test('load coclass json data', () => {
    expect(c._tree).toBeDefined();
    expect(c._tree).not.toBeNull();
});


test('find items in coclass', () => {
    let r = c.findItem('Thisitemdoesnotexist');
    expect(r).toBeUndefined();

    let name = 'Trafikanordningar';
    r = c.findItem(name);
    expect(r).toBeDefined();

    let codecomponent = 'T';
    let description = 'utrustande system som förser en trafikanläggning med anordningar för styrning och reglering av trafik';
    let synonyms = ['trafikutrustning', 'bommar', 'trafiksignaler', 'trafikskyltar'];
    let pathstring = 'Funktionella system >> 3:Utrustande system >> 3T:<strong id=\"target\">Trafikanordningar</strong>';

    let i1 = new CoClassItem(codecomponent, name, description, synonyms);

    expect(r.codecomponent).toEqual(i1.codecomponent);
    expect(r.description).toEqual(i1.description);
    expect(r.synonyms).toEqual(i1.synonyms);
    expect(c.getPathString(name)).toEqual(pathstring);

    name = 'Stegmotor';
    r = c.findItem(name);
    expect(r).toBeDefined();
    codecomponent = 'B';
    description = 'elektromagnetiskt rotationsdrivande objekt som åstadkommer diskreta rotationssteg';
    synonyms = [];
    pathstring = 'Komponenter >> M:Drivande objekt >> MA:Elektromagnetiskt rotationsdrivande objekt >> MAB:<strong id=\"target\">Stegmotor</strong>'

    let i2 = new CoClassItem(codecomponent, name, description, synonyms);

    expect(r.codecomponent).toEqual(i2.codecomponent);
    expect(r.description).toEqual(i2.description);
    expect(r.synonyms).toEqual(i2.synonyms);
    expect(c.getPathString(name)).toEqual(pathstring);
});
