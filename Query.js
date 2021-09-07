const pg = require("pg");
const dotenv = require("dotenv");
dotenv.config();

class QueryTool 
{
    #method
    #config
    #client
    #insertResult
    #selectResult
    #updateResult

    #insertTable
    #insertColumns
    #insertReturning
    #insertParams

    #selectTable
    #selectColumns
    #selectJoin
    #selectWhere
    #selectGroupBy
    #selectOrderBy
    #selectHaving

    #updateTable
    #updateColumns
    #updateWhere
    #updateLogicalOperators
    #updateReturning

    constructor ()
    {
        this.#insertTable = undefined;
        this.#insertColumns = undefined;
        this.#insertReturning = undefined;
        this.#insertParams = undefined;
        this.#selectTable = undefined;
        this.#selectColumns = undefined;
        this.#selectJoin = undefined;
        this.#selectWhere = undefined;
        this.#selectGroupBy = undefined;
        this.#selectOrderBy = undefined;
        this.#selectHaving = undefined;
        this.#updateTable = undefined;
        this.#updateColumns = undefined;
        this.#updateWhere = undefined;
        this.#updateLogicalOperators = undefined;
        this.#updateReturning = undefined;
    }

    Config (_config)
    {
        this.#SetConfig(_config);
    }

    #SetConfig = (_config) =>
    {
        if (_config instanceof Object && !(_config instanceof Array))
        {
            if (_config.method)
            {
                this.#method = _config.method.toLowerCase();
                delete _config.method;
                this.#config = {
                    ..._config,
                }
            }
            else
            {
                throw new Error("You must provide a method to connect to the database. Choose between 'pool' or 'client'");
            }
        }
        else
        {
            throw new Error ("The config must be a JSON specifying how do you want to connect to the database, such as 'pool' or 'client'");
        }
    }

    #SetClient = () => {
        if (this.#method === "client")
        {
            this.#client = new pg.Client({
                ...this.#config
            });
        }
        else if (this.#method === "pool")
        {
            this.#client = new pg.Pool({
                ...this.#config
            });
        }
        else
        {
            throw new Error("Invalid connection method. Choose between Client or Pool");
        }
    }

    #ValidateParameters = (_param) =>
    {
        if (Array.isArray(_param.columns))
        {
            const arrayColumns = _param.columns;
            const specialRegex = /truncate$|drop$|$update$/i;
            const specialRegexCompound = /truncate table$|drop table$|drop column$|drop database$|alter table$|add column$|create table$|create database$|create view$|create index$|update table/i;

            if (specialRegex.test(JSON.stringify(arrayColumns)) || specialRegexCompound.test(JSON.stringify(arrayColumns)))
            {
                throw new Error ("It looks like you trying to modify the database.");
            }
            delete _param.column
        }

        const regex = /truncate$|drop$|select$|$update$/i;
        const regexCompound = /truncate table$|drop table$|drop column$|drop database$|select [a-zA-ZÀ-ü\W]+ from$|alter table$|add column$|create table$|create database$|create view$|create index$|update table/i;

        if (regex.test(JSON.stringify(_param)) || regexCompound.test(JSON.stringify(_param)))
        {
            throw new Error ("It looks like you trying to modify the database.");
        }

        return true;
    }
    
    #Insert = (_insertParam) =>
    {
        const validParameters = this.#ValidateParameters(_insertParam);

        if (validParameters)
        {
            this.#SetClient();
            this.#insertResult = {
                error: {
                    transaction: false,
                    commit: false,
                    rollback: false,
                    params: false,
                    connection: false,
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
                this.#insertReturning = returning.join(", ");
            }

            this.#insertTable = table;
            const columnsNames = Object.keys(columns);
            this.#insertColumns = columnsNames;

            const params = [];
            const values = [];

            columnsNames.forEach( (_column, _index) =>
            {
                params.push(`$${_index + 1}`);
                values.push(columns[_column]);
            });

            this.#insertParams = params.join(", ");

            if (this.#method === "client")
            {
                if (beginTransaction)
                {
                    const result = this.#client
                        .connect()
                        .then( () => this.#client.query("BEGIN;"))
                        .then( () => this.#client.query(`
                            INSERT INTO ${this.#insertTable} (${this.#insertColumns})
                             VALUES (${this.#insertParams})
                             ${this.#insertReturning ? `RETURNING ${this.#insertReturning}` : "" }
                        `, values))
                        .then(async (result) =>
                        {
                            this.#insertResult.data = result.rows;

                            await this.#client
                                .query("COMMIT;")
                                .then( () =>
                                {
                                    console.log("COMMIT SUCCESSFULLy");
                                })
                                .catch( (err) => {
                                    this.#insertResult.error.commit = err.message;
                                });

                            return this.#insertResult;
                        })
                        .catch(async (err) =>
                        {
                            this.#insertResult.error.transaction = err.message;

                            await this.#client
                                .query("ROLLBACK;")
                                .then( () =>
                                {
                                    console.log("ROLLBACK SUCCESSFULLy");
                                })
                                .catch( (err) => {
                                    this.#insertResult.error.rollback = err.message;
                                });

                            return this.#insertResult;
                        })
                        .finally( () =>
                        {
                            this.#client.end();
                            this.#insertTable = undefined;
                            this.#insertColumns = undefined;
                            this.#insertReturning = undefined;
                            this.#insertParams = undefined;
                        });

                    return result;
                }
                else
                {
                    const result = this.#client
                        .connect()
                        .then( () => this.#client.query(`
                            INSERT INTO ${this.#insertTable} (${this.#insertColumns})
                            VALUES (${this.#insertParams})
                            ${this.#insertReturning ? `RETURNING ${this.#insertReturning}` : "" }
                        `, values))
                        .then( (result) =>
                        {
                            this.#insertResult.data = result.rows;
                            return this.#insertResult;
                        })
                        .catch( (err) =>
                        {
                            this.#insertResult.error.transaction = err.message;
                            return this.#insertResult;
                        })
                        .finally( () =>
                        {
                            this.#client.end();
                            this.#insertTable = undefined;
                            this.#insertColumns = undefined;
                            this.#insertReturning = undefined;
                            this.#insertParams = undefined;
                        });

                    return result;
                }
            }
            else
            {
                if (beginTransaction)
                {
                    const result = this.#client
                        .connect()
                        .then( (connection) => connection.query("BEGIN;")
                            .then( () => connection.query(`
                                INSERT INTO ${this.#insertTable} (${this.#insertColumns})
                                VALUES (${this.#insertParams})
                                ${this.#insertReturning ? `RETURNING ${this.#insertReturning}` : "" }
                            `, values))
                            .then(async (result) =>
                            {
                                this.#insertResult.data = result.rows;

                                await connection
                                    .query("COMMIT;")
                                    .then( () =>
                                    {
                                        console.log("COMMIT SUCCESSFULLy");
                                    })
                                    .catch( (err) => {
                                        this.#insertResult.error.commit = err.message;
                                    });

                                return this.#insertResult;
                            })
                            .catch(async (err) =>
                            {
                                this.#insertResult.error.transaction = err.message;

                                await connection
                                    .query("ROLLBACK;")
                                    .then( () =>
                                    {
                                        console.log("ROLLBACK SUCCESSFULLy");
                                    })
                                    .catch( (err) => {
                                        this.#insertResult.error.rollback = err.message;
                                    });

                                return this.#insertResult;
                            })
                            .finally( () =>
                            {
                                connection.release();
                                this.#insertTable = undefined;
                                this.#insertColumns = undefined;
                                this.#insertReturning = undefined;
                                this.#insertParams = undefined;
                            })
                        )
                        .catch( (err) => {
                            this.#insertResult.error.connection = err.message;
                            return this.#insertResult;
                        })
                        .finally( () =>
                        {
                            this.#insertTable = undefined;
                            this.#insertColumns = undefined;
                            this.#insertReturning = undefined;
                            this.#insertParams = undefined;
                        });

                    return result;
                }
                else
                {
                    const result = this.#client
                        .connect()
                        .then( (connection) => connection.query(`
                                INSERT INTO ${this.#insertTable} (${this.#insertColumns})
                                VALUES (${this.#insertParams})
                                ${this.#insertReturning ? `RETURNING ${this.#insertReturning}` : "" }
                            `, values)
                            .then( (result) =>
                            {
                                this.#insertResult.data = result.rows;
                                return this.#insertResult;
                            })
                            .catch( (err) =>
                            {
                                this.#insertResult.error.transaction = err.message;
                                return this.#insertResult;
                            })
                            .finally( () =>
                            {
                                connection.release();
                                this.#insertTable = undefined;
                                this.#insertColumns = undefined;
                                this.#insertReturning = undefined;
                                this.#insertParams = undefined;
                            })
                        )
                        .catch( (err) => {
                            this.#insertResult.error.connection = err.message;
                            return this.#insertResult;
                        })
                        .finally( () =>
                        {
                            this.#insertTable = undefined;
                            this.#insertColumns = undefined;
                            this.#insertReturning = undefined;
                            this.#insertParams = undefined;
                        });
                    return result;
                }
            }
        }
    }

    Insert (_insertParam)
    {
        return this.#Insert(_insertParam);
    }

    #Select = (_selectParam) =>
    {
        const validParameters = this.#ValidateParameters(_selectParam);

        if (validParameters)
        {
            this.#SetClient();
            this.#selectResult = {
                error: {
                    transaction: false,
                    commit: false,
                    rollback: false,
                    params: false,
                    connection: false,
                },
                data: false,
            };

            const table = _selectParam.table;
            const columns = _selectParam.columns;
            const where = _selectParam.where;
            const logicalOperators = _selectParam.logicalOperators;
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

            this.#selectColumns = columns.join(", ");
            this.#selectTable = table;

            const selectParams = [];
            const values = [];
            let param = 1;
            
            if (where)
            {
                const whereColumns = Object.keys(where);

                if ( !logicalOperators)
                {
                    throw new Error ("When using the WHERE clause, you must provide the logical operators");
                }

                whereColumns.forEach( (_column, _index) =>
                {
                    const regexOperator = /=$|>$|<$|between$|like$|ilike$|is$|in$/i;
                    const regexCompoundOperator = /!=$|>=$|<=$|not between$|not like$|not ilike$|is not$|not in$/i;
    
                    const operator = where[_column].operator.toLowerCase();
                    const value = where[_column].value;
    
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
                        if (operator === "like" || operator === "not like"
                            || operator === "ilike" || operator === "not ilike")
                        {
                            selectParams.push(`
                                ${_column} ${operator.toUpperCase()} '%'||$${param}||'%'
                                 ${   logicalOperators[_index]
                                    ? logicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            param++;
                            values.push(value);
                        }
                        else if (operator === "between" || operator === "not between")
                        {
                            selectParams.push(`
                                ${_column} ${operator.toUpperCase()}
                                 $${param} AND $${param + 1}
                                 ${   logicalOperators[_index]
                                    ? logicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            param += 2;
                            values.push(value[0], value[1]);
                        }
                        else if (operator === "is" || operator === "is not")
                        {
                            selectParams.push(`
                                ${_column} ${operator.toUpperCase()}
                                 ${param}
                                 ${   logicalOperators[_index]
                                    ? logicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            param++;
                            values.push(value);
                        }
                        else if (operator === "in" || operator === "not in")
                        {
                            let inValues = undefined;
    
                            value.forEach( (_inValue, _inIndex) => 
                            {
                                if (_inIndex === 0)
                                {
                                    inValues = `($${param}`;
                                    param++;
                                    values.push(value[_inIndex]);
                                }
                                else
                                {
                                    inValues += `, $${param})`;
                                    param++;
                                    values.push(value[_inIndex]);
                                }
    
                                if (_inIndex === value.length - 1)
                                {
                                    inValues += ")";
                                }
                            });
    
                            selectParams.push(`
                                ${_column} ${operator.toUpperCase()}
                                 ${inValues}
                                 ${   logicalOperators[_index]
                                    ? logicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                        }
                        else
                        {
                            selectParams.push(`
                            ${_column} ${operator.toUpperCase()} $${param}
                             ${   logicalOperators[_index]
                                ? logicalOperators[_index].toUpperCase()
                                : "" }
                            `);
                            param++;
                            values.push(value);
                        }
                    }
                    else
                    {
                        this.#selectResult.error.params = "Invalid operator on WHERE params";
                        return this.#selectResult;
                    }
                });
    
                this.#selectWhere = selectParams.join (" ");
            }

            if (join)
            {
                const tables  = Object.keys (join);
                const regexJoin = /join$/i;
                const regexCompoundJoin = /inner join$|left join$|right join$|full outer join$/i;

                tables.forEach( (_table, _tableIndex) =>
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
                        const joinParams = [];
                        const joinOn = { ...join[_table].on };
                        const joinOnColumns = Object.keys(joinOn);
                        const joinLogicalOperators = [ ...join[_table].logicalOperators ];

                        joinParams.push(`
                            ${tableJoin.toUpperCase()} ${_table} ON
                        `);

                        joinOnColumns.forEach( (_column, _columnIndex) =>
                        {
                            const operator = joinOn[_column].operator;
                            const value = joinOn[_column].value;

                            const regexOperator = /=$|>$|<$|between$|like$|ilike$|is$|in$/i;
                            const regexCompoundOperator = /!=$|>=$|<=$|not between$|not like$|not ilike$|is not$|not in$/i;
    
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
                                if (operator === "like" || operator === "not like"
                                    || operator === "ilike" || operator === "not ilike")
                                {
                                    joinParams.push(`
                                        ${_column} ${operator.toUpperCase()} '%'||$${param}||'%'
                                         ${   joinLogicalOperators[_columnIndex]
                                            ? joinLogicalOperators[_columnIndex].toUpperCase()
                                            : "" }
                                    `);
                                    param++;
                                    values.push(value);
                                }
                                else if (operator === "between" || operator === "not between")
                                {
                                    joinParams.push(`
                                        ${_column} ${operator.toUpperCase()}
                                         $${param} AND $${param + 1}
                                         ${   joinLogicalOperators[_columnIndex]
                                            ? joinLogicalOperators[_columnIndex].toUpperCase()
                                            : "" }
                                    `);
                                    param += 2;
                                    values.push(value[0], value[1]);
                                }
                                else if (operator === "is" || operator === "is not")
                                {
                                    joinParams.push(`
                                        ${_column} ${operator.toUpperCase()}
                                         ${param}
                                         ${   joinLogicalOperators[_columnIndex]
                                            ? joinLogicalOperators[_columnIndex].toUpperCase()
                                            : "" }
                                    `);
                                    param++;
                                    values.push(value);
                                }
                                else if (operator === "in" || operator === "not in")
                                {
                                    let inValues = undefined;
            
                                    value.forEach( (_inValue, _inIndex) => 
                                    {
                                        if (_inIndex === 0)
                                        {
                                            inValues = `($${param}`;
                                            param++;
                                            values.push(value[_inIndex]);
                                        }
                                        else
                                        {
                                            inValues += `, $${param})`;
                                            param++;
                                            values.push(value[_inIndex]);
                                        }
            
                                        if (_inIndex === value.length - 1)
                                        {
                                            inValues += ")";
                                        }
                                    });
            
                                    joinParams.push(`
                                        ${_column} ${operator.toUpperCase()}
                                         ${inValues}
                                         ${   joinLogicalOperators[_columnIndex]
                                            ? joinLogicalOperators[_columnIndex].toUpperCase()
                                            : "" }
                                    `);
                                }
                                else
                                {
                                    joinParams.push(`
                                    ${_column} ${operator.toUpperCase()} $${param}
                                     ${   joinLogicalOperators[_columnIndex]
                                        ? joinLogicalOperators[_columnIndex].toUpperCase()
                                        : "" }
                                    `);
                                    param++;
                                    values.push(value);
                                }
                            }
                            else
                            {
                                this.#selectResult.error.params = "Invalid operator on JOIN params";
                                return this.#selectResult;
                            }
                        });

                        this.#selectJoin = joinParams.join(" ")
                    }
                    else
                    {
                        this.#selectResult.error.params = "Invalid join type on JOIN params";
                        return this.#selectResult;
                    }
                });
            }

            if (groupBy)
            {
                this.#selectGroupBy = groupBy.join(", ");
            }

            if (orderBy)
            {
                this.#selectOrderBy = orderBy.join(", ");
            }

            if (having)
            {
                const havingColumns = Object.keys(having.columns);
                const havingParams = [];
                const havingLogicalOperators = [ ...having.logicalOperators ];
                
                havingColumns.forEach( (_column, _index) =>
                {
                    const regexOperator = /=$|>$|<$|between$|like$|ilike$|is$|in$/i;
                    const regexCompoundOperator = /!=$|>=$|<=$|not between$|not like$|not ilike$|is not$|not in$/i;
    
                    const operator = having.columns[_column].operator.toLowerCase();
                    const value = having.columns[_column].value;
    
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
                        if (operator === "like" || operator === "not like"
                            || operator === "ilike" || operator === "not ilike")
                        {
                            havingParams.push(`
                                ${_column} ${operator.toUpperCase()} '%'||$${param}||'%'
                                 ${   havingLogicalOperators[_index]
                                    ? havingLogicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            param++;
                            values.push(value);
                        }
                        else if (operator === "between" || operator === "not between")
                        {
                            havingParams.push(`
                                ${_column} ${operator.toUpperCase()}
                                 $${param} AND $${param + 1}
                                 ${   havingLogicalOperators[_index]
                                    ? havingLogicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            param += 2;
                            values.push(value[0], value[1]);
                        }
                        else if (operator === "is" || operator === "is not")
                        {
                            havingParams.push(`
                                ${_column} ${operator.toUpperCase()}
                                 ${param}
                                 ${   havingLogicalOperators[_index]
                                    ? havingLogicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            param++;
                            values.push(value);
                        }
                        else if (operator === "in" || operator === "not in")
                        {
                            let inValues = undefined;
    
                            value.forEach( (_inValue, _inIndex) => 
                            {
                                if (_inIndex === 0)
                                {
                                    inValues = `($${param}`;
                                    param++;
                                    values.push(value[_inIndex]);
                                }
                                else
                                {
                                    inValues += `, $${param})`;
                                    param++;
                                    values.push(value[_inIndex]);
                                }
    
                                if (_inIndex === value.length - 1)
                                {
                                    inValues += ")";
                                }
                            });
    
                            havingParams.push(`
                                ${_column} ${operator.toUpperCase()}
                                 ${inValues}
                                 ${   havingLogicalOperators[_index]
                                    ? havingLogicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                        }
                        else
                        {
                            havingParams.push(`
                            ${_column} ${operator.toUpperCase()} $${param}
                             ${   havingLogicalOperators[_index]
                                ? havingLogicalOperators[_index].toUpperCase()
                                : "" }
                            `);
                            param++;
                            values.push(value);
                        }
                    }
                    else
                    {
                        this.#selectResult.error.params = "Invalid operator on HAVING params";
                        return this.#selectResult;
                    }
                });
    
                this.#selectHaving = havingParams.join (" ");
            }

            if (this.#method === "client")
            {
                const result = this.#client
                    .connect()
                    .then( () => this.#client.query(`
                        SELECT ${this.#selectColumns} FROM ${this.#selectTable}
                        ${ join ? this.#selectJoin : ""}
                        ${ where ? `WHERE ${this.#selectWhere} ` : ""}
                        ${ groupBy ? `GROUP BY ${this.#selectGroupBy}` : ""}
                        ${ having ? `HAVING ${this.#selectHaving}` : ""}
                        ${ orderBy ? `ORDER BY ${this.#selectOrderBy}` : ""}
                    `, values))
                    .then( (result) =>
                    {
                        this.#selectResult.data = result.rows;
                        return this.#selectResult;
                    })
                    .catch( (err) =>
                    {
                        this.#selectResult.error.transaction = err.message;
                        return this.#selectResult;
                    })
                    .finally( () =>
                    {
                        this.#client.end();
                        this.#selectTable = undefined;
                        this.#selectColumns = undefined;
                        this.#selectJoin = undefined;
                        this.#selectWhere = undefined;
                        this.#selectGroupBy = undefined;
                        this.#selectOrderBy = undefined;
                        this.#selectHaving = undefined;
                    });
                
                return result;
            }
            else
            {
                const result = this.#client
                    .connect()
                    .then( (connection) => connection.query(`
                            SELECT ${this.#selectColumns} FROM ${this.#selectTable}
                            ${ join ? this.#selectJoin : ""}
                            ${ where ? `WHERE ${this.#selectWhere} ` : ""}
                            ${ groupBy ? `GROUP BY ${this.#selectGroupBy}` : ""}
                            ${ having ? `HAVING ${this.#selectHaving}` : ""}
                            ${ orderBy ? `ORDER BY ${this.#selectOrderBy}` : ""}
                        `, values)
                        .then( (result) =>
                        {
                            this.#selectResult.data = result.rows;
                            return this.#selectResult;
                        })
                        .catch( (err) =>
                        {
                            this.#selectResult.error.transaction = err.message;
                            return this.#selectResult;
                        })
                        .finally( () =>
                        {
                            connection.release();
                            this.#selectTable = undefined;
                            this.#selectColumns = undefined;
                            this.#selectJoin = undefined;
                            this.#selectWhere = undefined;
                            this.#selectGroupBy = undefined;
                            this.#selectOrderBy = undefined;
                            this.#selectHaving = undefined;
                        })
                    )
                    .catch( (err) =>
                    {
                        this.#selectResult.error.connection = err.message;
                        return this.#selectResult;
                    })
                    .finally( () =>
                    {
                        this.#selectTable = undefined;
                        this.#selectColumns = undefined;
                        this.#selectJoin = undefined;
                        this.#selectWhere = undefined;
                        this.#selectGroupBy = undefined;
                        this.#selectOrderBy = undefined;
                        this.#selectHaving = undefined;
                    });
                
                return result;
            }
        }
    }

    Select (_selectParam)
    {
        return this.#Select(_selectParam);
    }
}

const config = {
    method: 'pool',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
}

const query = new QueryTool();
query.Config(config);
