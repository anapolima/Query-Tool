const ValidateParameters = require("../validators/validate-parameters.js");
const ValidateOperators = require("../validators/validate-operators.js");

async function Update (_updateParam, _method, _connection)
{
    const validParameters = ValidateParameters({ ..._updateParam });

    let updateTable = undefined;
    let updateParams = undefined;
    let updateWhere = undefined;
    let updateReturning = undefined;

    if (validParameters)
    {
        const updateResult = {
            error: {
                transaction: false,
                commit: false,
                rollback: false,
                params: false,
            },
            success: {
                commit: false,
                rollback: false,
            },
            data: false,
        };

        const beginTransaction = _updateParam.beginTransaction;
        const table = _updateParam.table;
        const columns = _updateParam.columns;
        const where = _updateParam.where;
        const logicalOperators = _updateParam.logicalOperators || [];
        const returning = _updateParam.returning;

        if (typeof (table) !== "string")
        {
            throw new Error ("The 'table' must be a string");
        }

        if ( !( columns instanceof Object && !(columns instanceof Array) ))
        {
            throw new Error ("Columns need to be a JSON. Each key must be the name of a column in the databese and its value must be the value to be inserted");
        }
        
        if ( where && !( where instanceof Object && !(where instanceof Array) ))
        {
            throw new Error ("The 'where' must be a JSON, each key must be the name of a column and also a JSON with the keys 'operator' and 'value'");
        }
        
        if ( logicalOperators && !( Array.isArray(logicalOperators) ))
        {
            throw new Error ("The 'logical operators' must be an array");
        }

        if ( returning && !( Array.isArray(returning) ) )
        {
            throw new Error ("The returning must be an array containing the name of the columns to be returned");
        }

        if (typeof (beginTransaction) !== "boolean")
        {
            throw new Error ("The begin transaction must be a boolean");
        }

        updateTable = table;
        const columnsNames = Object.keys(columns);

        const updateParamsArray = [];
        const values = [];
        let param = 1;

        columnsNames.forEach( (_column) =>
        {
            const value = columns[_column].value;
            const type = columns[_column].type;

            if (isNaN(value))
            {
                if (type)
                {
                    const regexType = /number$|string$/;

                    if (regexType.test(type))
                    {
                        if (type.toLowerCase() === "number")
                        {
                            updateParamsArray.push(`${_column} = ${value}`);
                        }
                        else
                        {
                            updateParamsArray.push(`${_column} = $${param}`);
                            values.push(value);
                            param++;
                        }
                    }
                    else
                    {
                        updateResult.error.params = "Invalid type. Type must be 'number' or 'string'";
                    }
                }
                else
                {
                    updateResult.error.params = "When providing values as a string you need to specify its type. You can do that by adding a key 'type' with a value of 'string' or 'integer'";
                }
            }
            else
            {
                updateParamsArray.push(`${_column} = $${param}`);
                values.push(value);
                param++;
            }
        });

        if (updateResult.error.params)
        {
            return updateResult;
        }

        updateParams = updateParamsArray.join(", ");

        if (where)
        {
            const updateWhereArray = [];
            const whereColumns = Object.keys(where);

            if ( !logicalOperators)
            {
                throw new Error ("When using the WHERE clause, you must provide the logical operators");
            }

            const validOperators = ValidateOperators(where, whereColumns, logicalOperators, updateWhereArray, values, param, updateResult);

            if (validOperators)
            {
                updateWhere = updateWhereArray.join (" ");
                param = validOperators;
            }
            else
            {
                return updateResult;
            }
        }

        if (returning)
        {
            updateReturning = returning.join(", ");
        }

        if (_method === "client")
        {
            if (beginTransaction)
            {
                const result = _connection
                    .query("BEGIN;")
                    .then( () => _connection.query(`
                        UPDATE ${updateTable} SET ${updateParams}
                            ${updateWhere ? `WHERE ${updateWhere}` : ""}
                            ${updateReturning ? `RETURNING ${updateReturning}` : "" }
                    `, values))
                    .then(async (result) =>
                    {
                        updateResult.data = result.rows;

                        await _connection
                            .query("COMMIT;")
                            .then( () =>
                            {
                                updateResult.success.commit = true;
                            })
                            .catch( (err) =>
                            {
                                updateResult.error.commit = err.message;
                            });

                        return updateResult;
                    })
                    .catch(async (err) =>
                    {
                        updateResult.error.transaction = err.message;

                        await _connection
                            .query("ROLLBACK;")
                            .then( () =>
                            {
                                updateResult.success.rollback = true;
                            })
                            .catch( (err) =>
                            {
                                updateResult.error.rollback = err.message;
                            });

                        return updateResult;
                    })
                    .finally( () =>
                    {
                        updateTable = undefined;
                        updateParams = undefined;
                        updateWhere = undefined;
                        updateReturning = undefined;
                    });

                return result;
            }
            else
            {
                const result = _connection
                    .query(`
                        UPDATE ${updateTable} SET ${updateParams}
                            ${updateWhere ? `WHERE ${updateWhere}` : ""}
                            ${updateReturning ? `RETURNING ${updateReturning}` : "" }
                    `, values)
                    .then( (result) =>
                    {
                        updateResult.data = result.rows;
                        
                        return updateResult;
                    })
                    .catch( (err) =>
                    {
                        updateResult.error.transaction = err.message;
                        
                        return updateResult;
                    })
                    .finally( () =>
                    {
                        updateTable = undefined;
                        updateParams = undefined;
                        updateWhere = undefined;
                        updateReturning = undefined;
                    });

                return result;
            }
        }
        else
        {
            if (beginTransaction)
            {
                const result = _connection
                    .query("BEGIN;")
                    .then( () => _connection.query(`
                        UPDATE ${updateTable} SET ${updateParams}
                        ${updateWhere ? `WHERE ${updateWhere}` : ""}
                        ${updateReturning ? `RETURNING ${updateReturning}` : "" }
                    `, values))
                    .then(async (result) =>
                    {
                        updateResult.data = result.rows;

                        await _connection
                            .query("COMMIT;")
                            .then( () =>
                            {
                                updateResult.success.commit = true;
                            })
                            .catch( (err) =>
                            {
                                updateResult.error.commit = err.message;
                            });

                        return updateResult;
                    })
                    .catch(async (err) =>
                    {
                        updateResult.error.transaction = err.message;

                        await _connection
                            .query("ROLLBACK;")
                            .then( () =>
                            {
                                updateResult.success.rollback = true;
                            })
                            .catch( (err) =>
                            {
                                updateResult.error.rollback = err.message;
                            });

                        return updateResult;
                    })
                    .finally( () =>
                    {
                        try
                        {
                            _connection.release();
                            updateTable = undefined;
                            updateParams = undefined;
                            updateWhere = undefined;
                            updateReturning = undefined;
                        }
                        catch
                        {
                            updateTable = undefined;
                            updateParams = undefined;
                            updateWhere = undefined;
                            updateReturning = undefined;
                        }
                    });

                return result;
            }
            else
            {
                const result = _connection
                    .query(`
                        UPDATE ${updateTable} SET ${updateParams}
                        ${updateWhere ? `WHERE ${updateWhere}` : ""}
                        ${updateReturning ? `RETURNING ${updateReturning}` : "" }
                    `, values)
                    .then( (result) =>
                    {
                        updateResult.data = result.rows;
                        
                        return updateResult;
                    })
                    .catch( (err) =>
                    {
                        updateResult.error.transaction = err.message;
                        
                        return updateResult;
                    })
                    .finally( () =>
                    {
                        try
                        {
                            _connection.release();
                            updateTable = undefined;
                            updateParams = undefined;
                            updateWhere = undefined;
                            updateReturning = undefined;
                        }
                        catch
                        {
                            updateTable = undefined;
                            updateParams = undefined;
                            updateWhere = undefined;
                            updateReturning = undefined;
                        }
                    });

                return result;
            }
        }
    }
}

module.exports = Update;
