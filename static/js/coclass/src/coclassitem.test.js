import {CoClassItem} from './coclass';

test('get a random synonym', () => {
    let i = new CoClassItem();

    expect(i.getRandomSynonym()).toBeUndefined();
    i.synonyms = ['a'];
    expect(i.getRandomSynonym()).toBe('a');
    i.synonyms = ['a', 'b'];
    expect(i.getRandomSynonym()).toEqual(expect.anything());
});

test('candidates do not include synonym because there is no synonym', () => {
    let i = new CoClassItem();
    i.addCandidate('aaa');
    i.addCandidate('bbb');
    expect(i.candidatesIncludeSynonym()).toBe(false);
});

test('candidates do not include synonym', () => {
    let i = new CoClassItem();
    i.addCandidate('aaa');
    i.addCandidate('bbb');
    i.synonyms = ['a', 'b', 'c'];
    expect(i.candidatesIncludeSynonym()).toBe(false);
});

test('candidates do include a synonym', () => {
    let i = new CoClassItem();
    i.addCandidate('aaa');
    i.addCandidate('bbb');
    i.synonyms = ['a', 'bbb', 'c'];
    expect(i.candidatesIncludeSynonym()).toBe(true);
});

test('candidates do include several synonyms', () => {
    let i = new CoClassItem();
    i.addCandidate('aaa');
    i.addCandidate('bbb');
    i.synonyms = ['aaa', 'bbb', 'c'];
    expect(i.candidatesIncludeSynonym()).toBe(true);
});
