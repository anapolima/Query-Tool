const ValidateParameters = require('../validators/validate-parameters.js');

async function Insert (_insertParam, _method, _connection)
{
    const validParameters = ValidateParameters({ ..._insertParam });

    let insertTable = undefined;
    let insertColumns = undefined;
    let insertReturning = undefined;
    let insertParams = undefined;

    if (validParameters)
    {
        const insertResult = {
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
        const table = _insertParam.table;
        const columns = _insertParam.columns;
        const returning = _insertParam.returning;
        const beginTransaction = _insertParam.beginTransaction;


        if ( typeof (table) !== "string" )
        {
            throw new Error ("The table name must be a string");
        }

        if ( !( columns instanceof Object && !(columns instanceof Array) ))
        {
            throw new Error ("Columns need to be a JSON. Each key must be the name of a column in the databese and its value must be the value to be inserted");
        }

        if ( returning && !( Array.isArray(returning) ) )
        {
            throw new Error ("The returning must be an array containing the name of the columns to be returned");
        }

        if (typeof (beginTransaction) !== "boolean")
        {
            throw new Error ("The begin transaction must be a boolean");
        }

        if (returning)
        {
            insertReturning = returning.join(", ");
        }

        insertTable = table;
        const columnsNames = Object.keys(columns);
        insertColumns = columnsNames;

        const params = [];
        const values = [];

        columnsNames.forEach( (_column, _index) =>
        {
            params.push(`$${_index + 1}`);
            values.push(columns[_column]);
        });

        insertParams = params.join(", ");

        if (_method === "client")
        {
            if (beginTransaction)
            {
                const result = _connection
                    .query("BEGIN;")
                    .then( () => _connection.query(`
                        INSERT INTO ${insertTable} (${insertColumns})
                            VALUES (${insertParams})
                            ${insertReturning ? `RETURNING ${insertReturning}` : "" }
                    `, values))
                    .then(async (result) =>
                    {
                        insertResult.data = result.rows;

                        await _connection
                            .query("COMMIT;")
                            .then( () =>
                            {
                                insertResult.success.commit = true;
                            })
                            .catch( (err) =>
                            {
                                insertResult.error.commit = err.message;
                            });

                        return insertResult;
                    })
                    .catch(async (err) =>
                    {
                        insertResult.error.transaction = err.message;

                        await _connection
                            .query("ROLLBACK;")
                            .then( () =>
                            {
                                insertResult.success.rollback = true;
                            })
                            .catch( (err) =>
                            {
                                insertResult.error.rollback = err.message;
                            });

                        return insertResult;
                    })
                    .finally( () =>
                    {
                        insertTable = undefined;
                        insertColumns = undefined;
                        insertReturning = undefined;
                        insertParams = undefined;
                    });

                return result;
            }
            else
            {
                const result = _connection
                    .query(`
                        INSERT INTO ${insertTable} (${insertColumns})
                        VALUES (${insertParams})
                        ${insertReturning ? `RETURNING ${insertReturning}` : "" }
                    `, values)
                    .then( (result) =>
                    {
                        insertResult.data = result.rows;
                        
                        return insertResult;
                    })
                    .catch( (err) =>
                    {
                        insertResult.error.transaction = err.message;
                        
                        return insertResult;
                    })
                    .finally( () =>
                    {
                        insertTable = undefined;
                        insertColumns = undefined;
                        insertReturning = undefined;
                        insertParams = undefined;
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
                        INSERT INTO ${insertTable} (${insertColumns})
                        VALUES (${insertParams})
                        ${insertReturning ? `RETURNING ${insertReturning}` : "" }
                    `, values))
                    .then(async (result) =>
                    {
                        insertResult.data = result.rows;

                        await _connection
                            .query("COMMIT;")
                            .then( () =>
                            {
                                insertResult.success.commit = true;
                            })
                            .catch( (err) =>
                            {
                                insertResult.error.commit = err.message;
                            });

                        return insertResult;
                    })
                    .catch(async (err) =>
                    {
                        insertResult.error.transaction = err.message;

                        await _connection
                            .query("ROLLBACK;")
                            .then( () =>
                            {
                                insertResult.success.rollback = true;
                            })
                            .catch( (err) =>
                            {
                                insertResult.error.rollback = err.message;
                            });

                        return insertResult;
                    })
                    .finally( () =>
                    {
                        try
                        {
                            _connection.release();
                            insertTable = undefined;
                            insertColumns = undefined;
                            insertReturning = undefined;
                            insertParams = undefined;
                        }
                        catch
                        {
                            insertTable = undefined;
                            insertColumns = undefined;
                            insertReturning = undefined;
                            insertParams = undefined;
                        }
                    });

                return result;
            }
            else
            {
                const result = _connection
                    .query(`
                            INSERT INTO ${insertTable} (${insertColumns})
                            VALUES (${insertParams})
                            ${insertReturning ? `RETURNING ${insertReturning}` : "" }
                        `, values)
                    .then( (result) =>
                    {
                        insertResult.data = result.rows;
                        
                        return insertResult;
                    })
                    .catch( (err) =>
                    {
                        insertResult.error.transaction = err.message;
                        
                        return insertResult;
                    })
                    .finally( () =>
                    {
                        try
                        {
                            _connection.release();
                            insertTable = undefined;
                            insertColumns = undefined;
                            insertReturning = undefined;
                            insertParams = undefined;
                        }
                        catch
                        {
                            insertTable = undefined;
                            insertColumns = undefined;
                            insertReturning = undefined;
                            insertParams = undefined;
                        }
                    });
                
                return result;
            }
        }
    }
}

module.exports = Insert;
