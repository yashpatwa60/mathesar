import pytest
from db.filters.base import (
    allPredicateSubClasses, Leaf, Branch, MultiParameter, SingleParameter, NoParameter, Empty, BadFilterFormat
)

def instantiate_subclass(subclass, column=None, parameter=None):
    if issubclass(subclass, Leaf):
        if issubclass(subclass, MultiParameter):
            return subclass(column=column, parameters=parameter)
        elif issubclass(subclass, SingleParameter):
            return subclass(column=column, parameter=parameter)
        elif issubclass(subclass, NoParameter):
            return subclass(column=column)
        else:
            raise Exception("This should never happen")
    elif issubclass(subclass, Branch):
        if issubclass(subclass, MultiParameter):
            return subclass(parameters=parameter)
        elif issubclass(subclass, SingleParameter):
            return subclass(parameter=parameter)
        else:
            raise Exception("This should never happen")
    else:
        raise Exception("This should never happen")

someLeafPredicate = Empty(column="x")

parametersSpec = {
    'leaf': {
        'multi': {
            'valid': [[1], [1,2,3]],
            'invalid': [1, [], someLeafPredicate, [someLeafPredicate, someLeafPredicate], None]
        },
        'single': {
            'valid': [1],
            'invalid': [None, [], someLeafPredicate],
        },
    },
    'branch': {
        'multi': {
            'valid': [[someLeafPredicate, someLeafPredicate], [someLeafPredicate]],
            'invalid': [[1], [1,2,3], [], someLeafPredicate, None],
        },
        'single': {
            'valid': [someLeafPredicate],
            'invalid': [None, [], 1],
        },
    },
}

def getSpecParams(predicateSubClass, valid):
    validityKey = 'valid' if valid else 'invalid'
    if issubclass(predicateSubClass, Leaf):
        if issubclass(predicateSubClass, MultiParameter):
            return parametersSpec['leaf']['multi'][validityKey]
        elif issubclass(predicateSubClass, SingleParameter):
            return parametersSpec['leaf']['single'][validityKey]
    elif issubclass(predicateSubClass, Branch):
        if issubclass(predicateSubClass, MultiParameter):
            return parametersSpec['branch']['multi'][validityKey]
        elif issubclass(predicateSubClass, SingleParameter):
            return parametersSpec['branch']['single'][validityKey]
    return []

testCases = []
for valid in [True, False]:
    for predicateSubClass in allPredicateSubClasses:
        for param in getSpecParams(predicateSubClass, valid=valid):
            testCases.append([predicateSubClass, param, valid])

@pytest.mark.parametrize("columnName, valid", [["", False],[None, False],["col1", True]])
def test_column_name(columnName, valid):
    if valid:
        instantiate_subclass(Empty, columnName)
    else:
        with pytest.raises(BadFilterFormat):
            instantiate_subclass(Empty, columnName)

@pytest.mark.parametrize("predicateSubClass, param, valid", testCases)
def test_params(predicateSubClass, param, valid):
    validColumnName = "col1"
    if valid:
        instantiate_subclass(predicateSubClass, validColumnName, parameter=param)
    else:
        with pytest.raises(BadFilterFormat):
            instantiate_subclass(predicateSubClass, validColumnName, parameter=param)