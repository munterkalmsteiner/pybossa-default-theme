import {jQuery} from '../../vendor/jquery';
import {getSkipAnswer,getNumberOfTasksWithoutSynonymsFound} from './coclass';


test('adds 1 + 2 to equal 3', () => {
    expect(3).toBe(3);
});


test('test1', () => {
    getSkipAnswer(['abc']);
    console.log(getNumberOfTasksWithoutSynonymsFound());
});

test('test2', () => {
    getSkipAnswer(['abc']);
    console.log(getNumberOfTasksWithoutSynonymsFound());
}); 
