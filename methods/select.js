const ValidateParameters = require('../validators/validate-parameters.js');
const ValidateOperators = require('../validators/validate-operators.js');

function Select (_selectParam, _method, _connection)
{
    let selectTable = undefined;
    let selectColumns = undefined;
    let selectJoin = undefined;
    let selectWhere = undefined;
    let selectGroupBy = undefined;
    let selectOrderBy = undefined;
    let selectHaving = undefined;

    const validParameters = ValidateParameters({ ..._selectParam });

    if (validParameters)
    {
        const selectResult = {
            error: {
                transaction: false,
                params: false,
            },
            data: false,
        };

        const table = _selectParam.table;
        const columns = _selectParam.columns;
        const where = _selectParam.where;
        const logicalOperators = _selectParam.logicalOperators || [];
        const join = _selectParam.join;
        const groupBy = _selectParam.groupBy;
        const orderBy = _selectParam.orderBy;
        const having = _selectParam.having;

        if (typeof (table) !== "string")
        {
            throw new Error ("The 'table' must be a string");
        }

        if ( !( Array.isArray(columns) ))
        {
            throw new Error ("The 'columns' must be an array");
        }

        if ( where && !( where instanceof Object && !(where instanceof Array) ))
        {
            throw new Error ("The 'where' must be a JSON, each key must be the name of a column and also a JSON with the keys 'operator' and 'value'");
        }

        if ( logicalOperators && !( Array.isArray(logicalOperators) ))
        {
            throw new Error ("The 'logical operators' must be an array");
        }

        if ( join && !( join instanceof Object && !(join instanceof Array) ))
        {
            throw new Error ("The 'join' must be a JSON, each key must be the name of the table to join and also a JSON with the keys 'join', 'on', and 'logicalOperators'");
        }

        if ( groupBy && !( Array.isArray(groupBy) ))
        {
            throw new Error ("The 'group by' must be an array");
        }

        if ( orderBy && !( Array.isArray(orderBy) ))
        {
            throw new Error ("The 'order by' must be an array");
        }

        if ( having && !( having instanceof Object && !(having instanceof Array) ))
        {
            throw new Error ("The 'having' must be a JSON, each key must be the name of a column and also a JSON with the keys 'operator' and 'value'");
        }

        selectColumns = columns.join(", ");
        selectTable = table;

        const selectParams = [];
        const values = [];
        let param = 1;

        if (join)
        {
            const tables  = Object.keys (join);
            const regexJoin = /join$/i;
            const regexCompoundJoin = /inner join$|left join$|right join$|full outer join$/i;
            const joinParams = [];

            tables.forEach( (_table) =>
            {
                const tableJoin = join[_table].join;
                let isValidJoin = undefined;

                if (tableJoin.split(" ").length > 1)
                {
                    isValidJoin = regexCompoundJoin.test(tableJoin);
                }
                else
                {
                    isValidJoin = regexJoin.test(tableJoin);
                }

                if (isValidJoin)
                {
                    const joinOn = { ...join[_table].on };
                    const joinOnColumns = Object.keys(joinOn);
                    const joinLogicalOperators = join[_table].logicalOperators ? [ ...join[_table].logicalOperators ] : [];

                    joinParams.push(`
                        ${tableJoin.toUpperCase()} ${_table} ON
                    `);

                    const validOparators = ValidateOperators(joinOn, joinOnColumns, joinLogicalOperators, joinParams, values, param, selectResult, _table);
                    if (validOparators)
                    {
                        param = validOparators;
                    }
                }
                else
                {
                    selectResult.error.params = "Invalid join type on JOIN params";
                    
                    return selectResult;
                }
            });

            if (joinParams.length > 0)
            {
                selectJoin = joinParams.join(" ");
            }
            else
            {
                return selectResult;
            }
        }

        if (where)
        {
            const whereColumns = Object.keys(where);

            if ( !logicalOperators)
            {
                throw new Error ("When using the WHERE clause, you must provide the logical operators");
            }

            const validOperators = ValidateOperators(where, whereColumns, logicalOperators, selectParams, values, param, selectResult);

            if (validOperators)
            {
                selectWhere = selectParams.join (" ");
                param = validOperators;
            }
            else
            {
                return selectResult;
            }
        }

        if (groupBy)
        {
            selectGroupBy = groupBy.join(", ");
        }

        if (orderBy)
        {
            selectOrderBy = orderBy.join(", ");
        }

        if (having)
        {
            const havingColumns = Object.keys(having.columns);
            const havingParams = [];
            const havingLogicalOperators = having.logicalOperators ? [ ...having.logicalOperators ] : [];

            const validOperators = ValidateOperators(having.columns, havingColumns, havingLogicalOperators, havingParams, values, param, selectResult);

            if (validOperators)
            {
                selectHaving = havingParams.join (" ");
                param = validOperators;
            }
            else
            {
                return selectResult;
            }
        }

        if (_method === "client")
        {
            const result = _connection
                .query(`
                    SELECT ${selectColumns} FROM ${selectTable}
                    ${ join ? selectJoin : ""}
                    ${ where ? `WHERE ${selectWhere} ` : ""}
                    ${ groupBy ? `GROUP BY ${selectGroupBy}` : ""}
                    ${ having ? `HAVING ${selectHaving}` : ""}
                    ${ orderBy ? `ORDER BY ${selectOrderBy}` : ""}
                `, values)
                .then( (result) =>
                {
                    selectResult.data = result.rows;
                    
                    return selectResult;
                })
                .catch( (err) =>
                {
                    selectResult.error.transaction = err.message;
                    
                    return selectResult;
                })
                .finally( () =>
                {
                    selectTable = undefined;
                    selectColumns = undefined;
                    selectJoin = undefined;
                    selectWhere = undefined;
                    selectGroupBy = undefined;
                    selectOrderBy = undefined;
                    selectHaving = undefined;
                });
            
            return result;
        }
        else
        {
            const result = _connection
                .query(`
                    SELECT ${selectColumns} FROM ${selectTable}
                    ${ join ? selectJoin : ""}
                    ${ where ? `WHERE ${selectWhere} ` : ""}
                    ${ groupBy ? `GROUP BY ${selectGroupBy}` : ""}
                    ${ having ? `HAVING ${selectHaving}` : ""}
                    ${ orderBy ? `ORDER BY ${selectOrderBy}` : ""}
                `, values)
                .then( (result) =>
                {
                    selectResult.data = result.rows;
                    
                    return selectResult;
                })
                .catch( (err) =>
                {
                    selectResult.error.transaction = err.message;
                    
                    return selectResult;
                })
                .finally( () =>
                {
                    try
                    {
                        _connection.release();
                        selectTable = undefined;
                        selectColumns = undefined;
                        selectJoin = undefined;
                        selectWhere = undefined;
                        selectGroupBy = undefined;
                        selectOrderBy = undefined;
                        selectHaving = undefined;
                    }
                    catch
                    {
                        selectTable = undefined;
                        selectColumns = undefined;
                        selectJoin = undefined;
                        selectWhere = undefined;
                        selectGroupBy = undefined;
                        selectOrderBy = undefined;
                        selectHaving = undefined;
                    }
                });
            
            return result;
        }
    }
}

module.exports = Select;
