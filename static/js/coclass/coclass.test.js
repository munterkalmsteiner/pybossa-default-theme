const jQuery = require('../../vendor/jquery.js');
const coclass = require('./coclass');

test('adds 1 + 2 to equal 3', () => {
    expect(3).toBe(3);
});

test('bla', () => {
    coclass.getSkipAnswer(['abc']);
});
