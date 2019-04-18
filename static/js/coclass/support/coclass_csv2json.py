#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Nov 19 10:26:11 2018

@author: mun
"""

import csv
import json

with open('data/coclass_20190418.csv', 'r', newline='') as inputf:
    with open('data/coclass.json', 'w') as outputf:
        reader = csv.reader(inputf, delimiter=';')
        next(reader) #skip header line
        coclass = {}
        emptycodecounter = 0
        for row in reader:
            dimension, code, term, description, synonym_string = row
            dimnode = coclass.get(dimension, {})
            codepointer = dimnode
            
            if len(code) == 0:
                emptycodecounter = emptycodecounter + 1
            
            if dimension == 'Funktionella system':
                code = f'{str(emptycodecounter)}{code}'
                
            for index, c in enumerate(code):
                node = codepointer.get(c, {})
                
                if index == len(code) - 1:
                    #print(f'{dimension}|{code}')
                    assert not node #check that the leaf node is empty
                    node['term'] = term.strip()
                    node['desc'] = description.strip()
                    node['syns'] = [s.strip() for s in synonym_string.split(',')]
                
                codepointer[c] = node
                codepointer = node
            coclass[dimension] = dimnode
        json.dump(coclass, outputf)
                
                
        
