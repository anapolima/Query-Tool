const ValidateParameters = require("../validators/validate-parameters.js");
const ValidateOperators = require("../validators/validate-operators.js");

async function Delete (_deleteParam, _method, _connection)
{
    const validParameters = ValidateParameters({ ..._deleteParam });

    let deleteTable = undefined;
    let deleteUsing = undefined;
    let deleteWhere = undefined;
    let deleteReturning = undefined;

    if (validParameters)
    {
        const deleteResult = {
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

        const beginTransaction = _deleteParam.beginTransaction;
        const table = _deleteParam.table;
        const using = _deleteParam.using;
        const where = _deleteParam.where;
        const logicalOperators = _deleteParam.logicalOperators || [];
        const returning = _deleteParam.returning;

        if (typeof (table) !== "string")
        {
            throw new Error ("The 'table' must be a string");
        }

        if ( using && typeof (using) !== "string")
        {
            throw new Error ("The 'using' must be a string");
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

        deleteTable = table;
        const values = [];
        let param = 1;

        if (using)
        {
            deleteUsing = using;
        }

        if (where)
        {
            const deleteWhereArray = [];
            const whereColumns = Object.keys(where);

            if ( !logicalOperators)
            {
                throw new Error ("When using the WHERE clause, you must provide the logical operators");
            }

            const validOperators = ValidateOperators(where, whereColumns, logicalOperators, deleteWhereArray, values, param, deleteResult);

            if (validOperators)
            {
                deleteWhere = deleteWhereArray.join (" ");
                param = validOperators;
            }
            else
            {
                return deleteResult;
            }

        }

        if (returning)
        {
            deleteReturning = returning.join(", ");
        }

        if (_method === "client")
        {
            if (beginTransaction)
            {
                const result = _connection
                    .query("BEGIN;")
                    .then( () => _connection.query(`
                        DELETE FROM ${deleteTable}
                         ${deleteUsing ? `USING ${deleteUsing}` : ""}
                         ${deleteWhere ? `WHERE ${deleteWhere}` : ""}
                         ${deleteReturning ? `RETURNING ${deleteReturning}` : ""}
                    `, values))
                    .then(async (result) =>
                    {
                        deleteResult.data = result.rows;

                        await _connection
                            .query("COMMIT;")
                            .then( () =>
                            {
                                deleteResult.success.commit = true;
                            })
                            .catch( (err) =>
                            {
                                deleteResult.error.commit = err.message;
                            });

                        return deleteResult;
                    })
                    .catch(async (err) =>
                    {
                        deleteResult.error.transaction = err.message;

                        await _connection
                            .query("ROLLBACK;")
                            .then( () =>
                            {
                                deleteResult.success.rollback = true;
                            })
                            .catch( (err) =>
                            {
                                deleteResult.error.rollback = err.message;
                            });

                        return deleteResult;
                    })
                    .finally( () =>
                    {
                        deleteTable = undefined;
                        deleteUsing = undefined;
                        deleteWhere = undefined;
                        deleteReturning = undefined;
                    });

                return result;
            }
            else
            {
                const result = _connection
                    .query(`
                        DELETE FROM ${deleteTable}
                         ${deleteUsing ? `USING ${deleteUsing}` : ""}
                         ${deleteWhere ? `WHERE ${deleteWhere}` : ""}
                         ${deleteReturning ? `RETURNING ${deleteReturning}` : ""}
                    `, values)
                    .then( (result) =>
                    {
                        deleteResult.data = result.rows;
                        
                        return deleteResult;
                    })
                    .catch( (err) =>
                    {
                        deleteResult.error.transaction = err.message;
                        
                        return deleteResult;
                    })
                    .finally( () =>
                    {
                        deleteTable = undefined;
                        deleteUsing = undefined;
                        deleteWhere = undefined;
                        deleteReturning = undefined;
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
                        DELETE FROM ${deleteTable}
                         ${deleteUsing ? `USING ${deleteUsing}` : ""}
                         ${deleteWhere ? `WHERE ${deleteWhere}` : ""}
                         ${deleteReturning ? `RETURNING ${deleteReturning}` : ""}
                    `, values))
                    .then(async (result) =>
                    {
                        deleteResult.data = result.rows;

                        await _connection
                            .query("COMMIT;")
                            .then( () =>
                            {
                                deleteResult.success.commit = true;
                            })
                            .catch( (err) =>
                            {
                                deleteResult.error.commit = err.message;
                            });

                        return deleteResult;
                    })
                    .catch(async (err) =>
                    {
                        deleteResult.error.transaction = err.message;

                        await _connection
                            .query("ROLLBACK;")
                            .then( () =>
                            {
                                deleteResult.success.rollback = true;
                            })
                            .catch( (err) =>
                            {
                                deleteResult.error.rollback = err.message;
                            });

                        return deleteResult;
                    })
                    .finally( () =>
                    {
                        try
                        {
                            _connection.release();
                            deleteTable = undefined;
                            deleteUsing = undefined;
                            deleteWhere = undefined;
                            deleteReturning = undefined;
                        }
                        catch
                        {
                            deleteTable = undefined;
                            deleteUsing = undefined;
                            deleteWhere = undefined;
                            deleteReturning = undefined;
                        }
                    });

                return result;
            }
            else
            {
                const result = _connection
                    .query(`
                        DELETE FROM ${deleteTable}
                         ${deleteUsing ? `USING ${deleteUsing}` : ""}
                         ${deleteWhere ? `WHERE ${deleteWhere}` : ""}
                         ${deleteReturning ? `RETURNING ${deleteReturning}` : ""}
                    `, values)
                    .then( (result) =>
                    {
                        deleteResult.data = result.rows;
                        
                        return deleteResult;
                    })
                    .catch( (err) =>
                    {
                        deleteResult.error.transaction = err.message;
                        
                        return deleteResult;
                    })
                    .finally( () =>
                    {
                        try
                        {
                            _connection.release();
                            deleteTable = undefined;
                            deleteUsing = undefined;
                            deleteWhere = undefined;
                            deleteReturning = undefined;    
                        }
                        catch
                        {
                            deleteTable = undefined;
                            deleteUsing = undefined;
                            deleteWhere = undefined;
                            deleteReturning = undefined;    
                        }
                    });

                return result;
            }
        }

    }
}

module.exports = Delete;
