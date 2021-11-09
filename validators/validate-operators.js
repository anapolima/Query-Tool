/* eslint-disable no-param-reassign */
const ValidateLIKEpercent = require("./validate-like-percent");

function ValidateOperators (_object, _objectKeys, _logicalOperators, _arrayParams, _arrayValues, _paramNumber, _errorsObject, _join)
{
    _objectKeys.forEach( (_column, _index) =>
    {
        const regexOperator = /[=]$|>$|<$|between$|like$|ilike$|is$|in$/i;
        const regexCompoundOperator = /!=$|>=$|<=$|not between$|not like$|not ilike$|is not$|not in$/i;

        const operator = _object[_column].operator.toLowerCase();
        const value = _object[_column].value;

        let isValidOperator = false;

        if ( (operator.length === 2 || operator.split(" ").length > 1) && operator !== "in" && operator !== "is") 
        {
            isValidOperator = regexCompoundOperator.test(operator);
        }
        else
        {
            isValidOperator = regexOperator.test(operator);
        }

        if (isValidOperator)
        {
            if (operator === "like" || operator === "not like" ||
                operator === "ilike" || operator === "not ilike")
            {
                const percent = _object[_column].percent;
                if (percent)
                {
                    const validPercent = ValidateLIKEpercent(_object[_column], _paramNumber);

                    if (validPercent)
                    {
                        if (_join)
                        {
                            _arrayParams.push(
                                `${_join}.${_column} ${operator.toUpperCase()} ${validPercent} 
                                ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                            );
                            _paramNumber++;
                            _arrayValues.push(value);
                        }
                        else
                        {
                            _arrayParams.push(
                                `${_column} ${operator.toUpperCase()} ${validPercent}
                                 ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : ""  }`
                            );
                            _paramNumber++;
                            _arrayValues.push(value);
                        }
                    }
                    else
                    {
                        _errorsObject.error.params = "Invalid value for 'percent'. You must choose between 'start', 'end', and 'both'";
                    }
                }
                else
                {
                    if (_join)
                    {
                        _arrayParams.push(
                            `${_join}.${_column} ${operator.toUpperCase()} $${_paramNumber}
                             ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                        );
                        _paramNumber++;
                        _arrayValues.push(value);
                    }
                    else
                    {
                        _arrayParams.push(
                            `${_column} ${operator.toUpperCase()} $${_paramNumber}
                             ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                        );
                        _paramNumber++;
                        _arrayValues.push(value);
                    }
                }
            }
            else if (operator === "between" || operator === "not between")
            {
                if (_join)
                {
                    _arrayParams.push(
                        `${_join}.${_column} ${operator.toUpperCase()} $${_paramNumber} AND $${_paramNumber + 1}
                         ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                    );
                    _paramNumber += 2;
                    _arrayValues.push(value[0], value[1]);
                }
                else
                {
                    _arrayParams.push(
                        `${_column} ${operator.toUpperCase()} $${_paramNumber} AND $${_paramNumber + 1}
                         ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                    );
                    _paramNumber += 2;
                    _arrayValues.push(value[0], value[1]);
                }
            }
            else if (operator === "is" || operator === "is not")
            {
                if (_join)
                {
                    _arrayParams.push(
                        `${_join}.${_column} ${operator.toUpperCase()} ${value}
                         ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                    );
                }
                else
                {
                    _arrayParams.push(
                        `${_column} ${operator.toUpperCase()} ${value}
                         ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                    );
                }
            }
            else if (operator === "in" || operator === "not in")
            {
                let inValues = undefined;

                value.forEach( (_inValue, _inIndex) => 
                {
                    if (_inIndex === 0)
                    {
                        inValues = `($${_paramNumber}`;
                        _paramNumber++;
                        _arrayValues.push(value[_inIndex]);
                    }
                    else
                    {
                        inValues += `, $${_paramNumber})`;
                        _paramNumber++;
                        _arrayValues.push(value[_inIndex]);
                    }

                    if (_inIndex === value.length - 1)
                    {
                        inValues += ")";
                    }
                });

                if (_join)
                {
                    _arrayParams.push(
                        `${_join}.${_column} ${operator.toUpperCase()}
                            ${inValues}
                            ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                    );
                }
                else
                {
                    _arrayParams.push(
                        `${_column} ${operator.toUpperCase()}
                            ${inValues}
                            ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                    );
                }
            }
            else
            {
                if (isNaN(value))
                {
                    if (_join)
                    {
                        _arrayParams.push(
                            `${_join}.${_column} ${operator.toUpperCase()} ${value}
                             ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                        );
                    }
                    else
                    {
                        _arrayParams.push(
                            `${_column} ${operator.toUpperCase()} ${value}
                             ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                        );
                    }
                }
                else
                {
                    if (_join)
                    {
                        _arrayParams.push(
                            `${_join}.${_column} ${operator.toUpperCase()} $${_paramNumber}
                             ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                        );
                        _paramNumber++;
                        _arrayValues.push(value);
                    }
                    else
                    {
                        _arrayParams.push(
                            `${_column} ${operator.toUpperCase()} $${_paramNumber}
                             ${ _logicalOperators[_index] ? _logicalOperators[_index].toUpperCase() : "" }`
                        );
                        _paramNumber++;
                        _arrayValues.push(value);
                    }
                }
            }
        }
        else
        {
            _errorsObject.error.params = "Invalid operator on WHERE params";
        }
    });

    if (_errorsObject.error.params)
    {
        return false;
    }
    else
    {
        return _paramNumber;
    }
}

module.exports = ValidateOperators;
