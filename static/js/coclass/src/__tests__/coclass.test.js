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

import {CoClass, CoClassItem} from '../coclass';
import {DescriptionQuestion} from '../question';

let c;
beforeAll(() => {
    const coclassData = require('../../../../data/coclass.json');
    c = new CoClass(coclassData);
});

test('load coclass json data', () => {
    expect(c._tree).toBeDefined();
    expect(c._tree).not.toBeNull();
});

test('find non existing item in coclass', () => {
    const r = c.findItem('Thisitemdoesnotexist');
    expect(r).toBeUndefined();
});

test('find item with synonyms', () => {
    const name = 'Trafikanordningar';
    const r = c.findItem(name);
    expect(r).toBeDefined();

    const codecomponent = 'T';
    const description = 'utrustande system som förser en trafikanläggning med anordningar för styrning och reglering av trafik';
    const synonyms = ['trafikutrustning', 'bommar', 'trafiksignaler', 'trafikskyltar'];
    const pathstring = 'Funktionella system >> 3:Utrustande system >> 3T:<strong id=\"target\">Trafikanordningar</strong>';

    let i1 = new CoClassItem(codecomponent, name, description, synonyms);

    expect(r.codecomponent).toEqual(i1.codecomponent);
    expect(r.description).toEqual(i1.description);
    expect(r.synonyms).toEqual(i1.synonyms);
    expect(c.getPathString(name)).toEqual(pathstring);
});

test('find item without synonyms', () => {
    const name = 'Stegmotor';
    const r = c.findItem(name);
    expect(r).toBeDefined();

    const codecomponent = 'B';
    const description = 'elektromagnetiskt rotationsdrivande objekt som åstadkommer diskreta rotationssteg';
    const synonyms = [];
    const pathstring = 'Komponenter >> M:Drivande objekt >> MA:Elektromagnetiskt rotationsdrivande objekt >> MAB:<strong id=\"target\">Stegmotor</strong>';

    let i2 = new CoClassItem(codecomponent, name, description, synonyms);

    expect(r.codecomponent).toEqual(i2.codecomponent);
    expect(r.description).toEqual(i2.description);
    expect(r.synonyms).toEqual(i2.synonyms);
    expect(c.getPathString(name)).toEqual(pathstring);
});

test('description question of non existing target', () => {
    expect(c.getDescriptionQuestion('TargetDoesNotExist')).toBeUndefined();
});

test('description question for target with no siblings or children', () => {
    const targetterm = 'Dammlucka';
    const q = c.getDescriptionQuestion(targetterm);
    expect(q).toBeDefined();
    expect(q.hasMoreThanOneAnswerOption()).toBe(true);
    expect(q.choices.length).toBe(2);
});

/* CoClass seems not to contain targets with no siblings but children. Keeping the
   code anyway for now.
test('description question for target with no siblings but children', () => {

}); */

test('sibling description question with one sibling', () => {
    const targetterm = 'Elmotor';
    const q = c.getDescriptionQuestion(targetterm);
    expect(q).toBeDefined();
    expect(q.hasMoreThanOneAnswerOption()).toBe(true);
    expect(q.choices.length).toBe(2);
});

test('sibling description question with several siblings', () => {
    const targetterm = 'Vindturbin';
    const q = c.getDescriptionQuestion(targetterm);
    expect(q).toBeDefined();
    expect(q.hasMoreThanOneAnswerOption()).toBe(true);
    expect(q.choices.length).toBe(5);
});

test('sibling description question with correct answer', () => {
    const targetterm = 'Pneumatisk cylinder';
    const q = c.getDescriptionQuestion(targetterm);
    q.addAnswer('flödesdrivande objekt som åstadkommer rörelse till ändpositioner beroende på gastryck');
    expect(q.isAnswerCorrect()).toBe(true);
});

test('sibling description question with incorrect answer', () => {
    const targetterm = 'Pneumatisk cylinder';
    const q = c.getDescriptionQuestion(targetterm);
    q.addAnswer('flödesdrivande objekt som åstadkommer rotation genom en strömmande vätska');
    expect(q.isAnswerCorrect()).toBe(false);
});

test('path question with path.length <= 3', () => {
    const targetterm = 'Informationsbehandlande objekt';
    const q = c.getPathQuestion(targetterm);
    expect(q).toBeUndefined();
});

test('path question with path.length = 4', () => {
    const targetterm = 'Elektrisk signalbehandlande objekt';
    const q = c.getPathQuestion(targetterm);
    expect(q).toBeDefined();
    expect(q.hasMoreThanOneAnswerOption()).toBe(true);
    expect(q.choices.length).toBe(6);
    expect(q.data).toMatch(/\? \? \?/);
});

test('path question with path.length > 4', () => {
    const targetterm = 'Dator';
    const q = c.getPathQuestion(targetterm);
    expect(q).toBeDefined();
    expect(q.hasMoreThanOneAnswerOption()).toBe(true);
    expect(q.choices.length).toBe(6);
    expect(q.data).toMatch(/\? \? \?/);
});


test('get 1000 random nodes', () => {
    const numberOfRandomNodes = 9;
    let targetterm = 'Pneumatisk cylinder';
    for(let i = 0; i < 1000; i++) {
        const randomNodes = c._getRandomNodesNotTarget(targetterm, numberOfRandomNodes);
        expect(randomNodes.size).toBe(numberOfRandomNodes);
        /* Turns out that object names are not unique in CoClass. We have "Betonglining" both in Konstruktiva System and Komponenter. Since we are working in practice only with Komponenter, this is not an issue now. However, keep in mind that targetterms are, in Coclass, not unique! Hence the assertion below fails (randomly).
        const randomNodeNames = new Set();
        for (const node of randomNodes) {
            expect(node.model.name).not.toBe(targetterm);
            randomNodeNames.add(node.model.name);
        }
        expect(randomNodeNames.size).toBe(numberOfRandomNodes);
        */

        targetterm = randomNodes.values().next().value.model.name;
    }
});
