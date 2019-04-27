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

import {getRandomItems, insertAtRandomPosition} from '../utils';

test('get 1 random item less than in iterable', () => {
    const iterable = "Strings are iterables";
    const amount = iterable.length-1;
    const items = getRandomItems(iterable, amount);
    expect(items.length).toBe(amount);
    items.forEach((item) => {
        expect(iterable.includes(item)).toBe(true);
    });
});

test('get as many random items as in iterable', () => {
    const iterable = "Strings are iterables";
    const amount = iterable.length;
    const items = getRandomItems(iterable, amount);
    expect(items.length).toBe(amount);
    items.forEach((item) => {
        expect(iterable.includes(item)).toBe(true);
    });
});

test('get 1 random item more than in iterable', () => {
    const iterable = "Strings are iterables";
    const amount = iterable.length+1;
    const items = getRandomItems(iterable, amount);
    expect(items.length).toBe(iterable.length);
    items.forEach((item) => {
        expect(iterable.includes(item)).toBe(true);
    });
});

test('insert item at random position in array', () => {
    const arr = [1,2,3];
    const inserted = 4;
    const rarr = insertAtRandomPosition(arr, inserted);
    expect(arr.length).toBe(3);
    expect(rarr.length).toBe(4);
    expect(rarr.includes(inserted)).toBe(true);
});

test('insert item at random position in empty array', () => {
    const arr = [];
    const inserted = 4;
    const rarr = insertAtRandomPosition(arr, inserted);
    expect(arr.length).toBe(0);
    expect(rarr.length).toBe(1);
    expect(rarr.includes(inserted)).toBe(true);
});


