const pg = require("pg");
import pg from ("pg");

class QueryTool 
{
    #method
    #config
    #client
    #pool
    #connection
    #connectionStatus
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
    #updateParams
    #updateWhere
    #updateReturning

    #deleteTable
    #deleteUsing
    #deleteWhere
    #deleteReturning

    constructor ()
    {
        this.#method = undefined;
        this.#config = undefined;
        this.#client = undefined;
        this.#pool = undefined;
        this.#connection = undefined;
        this.#connectionStatus = undefined;
        this.#insertResult = undefined;
        this.#selectResult = undefined;
        this.#updateResult = undefined;

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
        this.#updateParams = undefined;
        this.#updateWhere = undefined;
        this.#updateReturning = undefined;

        this.#deleteTable = undefined;
        this.#deleteUsing = undefined;
        this.#deleteWhere = undefined;
        this.#deleteReturning = undefined;
    }

    Config (_config)
    {
        this.#SetConfig(_config);
    }

    #SetConfig = (_config) =>
    {
        if (_config instanceof Object && !(_config instanceof Array))
        {
            const config = { ..._config };
            if (config.method)
            {
                this.#method = config.method.toLowerCase();
                delete config.method;
                this.#config = {
                    ...config,
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

    StartConnection ()
    {
        return this.#SetClient();
    }

    #SetClient = () =>
    {
        this.#connectionStatus = {
            beginTransaction: {
                success: false,
                error: false,
            },
            start: {
                success: false,
                error: false,
            },
            end: {
                success: false,
                error: false,
            },
            commit: {
                success: false,
                error: false,
            },
            rollback: {
                success: false,
                error: false,
            },
        };

        if (this.#method === "client")
        {
            const client = new pg.Client({
                ...this.#config
            });

            const connecting = client
                .connect()
                .then( () =>
                {   
                    this.#connectionStatus.start.success = true;
                    this.#client =  client;
                    return this.#connectionStatus.start;
                })
                .catch( (err) =>
                {
                    this.#connectionStatus.start.error = err.message;
                    return this.#connectionStatus.start;
                });

            return connecting;
        }
        else if (this.#method === "pool")
        {
            const client = new pg.Pool({
                ...this.#config
            });

            const connecting = client
                .connect()
                .then( (connection) => 
                {
                    this.#connection = connection;
                    this.#pool = client;
                    this.#connectionStatus.start.success = true;
                    return this.#connectionStatus.start;
                })
                .catch( (err) =>
                {
                    this.#connectionStatus.start.error = err.message;
                    return this.#connectionStatus.start;
                });

            return connecting;
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
            const specialRegex = /[;|\s]?truncate$|[;|\s]?drop$|[;|\s]?update$|[;|\s]?insert$/i;
            const specialRegexCompound = /[;|\s]?truncate table$|[;|\s]?drop table$|[;|\s]?drop column$|[;|\s]?drop database$|[;|\s]?alter table$|[;|\s]?add column$|[;|\s]?create table$|[;|\s]?create database$|[;|\s]?create view$|[;|\s]?create index$|[;|\s]?update table$/i;

            if (specialRegex.test(JSON.stringify(arrayColumns)) || specialRegexCompound.test(JSON.stringify(arrayColumns)))
            {
                throw new Error ("It looks like you trying to modify the database.");
            }
            delete _param.columns;
        }

        const regex = /[;|\s]?truncate$|[;|\s]?drop$|[;|\s]?update$|[;|\s]?insert$|[;|\s]?select$/i;
        const regexCompound = /[;|\s]?truncate table$|[;|\s]?drop table$|[;|\s]?drop column$|[;|\s]?drop database$|[;|\s]?alter table$|[;|\s]?add column$|[;|\s]?create table$|[;|\s]?create database$|[;|\s]?create view$|[;|\s]?create index$|[;|\s]?update table$|[;|\s]?select [a-zA-ZÀ-ü\W]+ from$/i;

        if (regex.test(JSON.stringify(_param)) || regexCompound.test(JSON.stringify(_param)))
        {
            throw new Error ("It looks like you trying to modify the database.");
        }

        return true;
    }
    
    #Insert = (_insertParam) =>
    {
        const validParameters = this.#ValidateParameters({ ..._insertParam });

        if (validParameters)
        {
            this.#insertResult = {
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
                        .query("BEGIN;")
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
                                    this.#insertResult.success.commit = true;
                                })
                                .catch( (err) =>
                                {
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
                                    this.#insertResult.success.rollback = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#insertResult.error.rollback = err.message;
                                });

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
                        .query(`
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
                    const result = this.#connection
                        .query("BEGIN;")
                        .then( () => this.#connection.query(`
                            INSERT INTO ${this.#insertTable} (${this.#insertColumns})
                            VALUES (${this.#insertParams})
                            ${this.#insertReturning ? `RETURNING ${this.#insertReturning}` : "" }
                        `, values))
                        .then(async (result) =>
                        {
                            this.#insertResult.data = result.rows;

                            await this.#connection
                                .query("COMMIT;")
                                .then( () =>
                                {
                                    this.#insertResult.success.commit = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#insertResult.error.commit = err.message;
                                });

                            return this.#insertResult;
                        })
                        .catch(async (err) =>
                        {
                            this.#insertResult.error.transaction = err.message;

                            await this.#connection
                                .query("ROLLBACK;")
                                .then( () =>
                                {
                                    this.#insertResult.success.rollback = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#insertResult.error.rollback = err.message;
                                });

                            return this.#insertResult;
                        })
                        .finally( () =>
                        {
                            try
                            {
                                this.#connection.release();
                                this.#insertTable = undefined;
                                this.#insertColumns = undefined;
                                this.#insertReturning = undefined;
                                this.#insertParams = undefined;
                            }
                            catch
                            {
                                this.#insertTable = undefined;
                                this.#insertColumns = undefined;
                                this.#insertReturning = undefined;
                                this.#insertParams = undefined;
                            }
                        });

                    return result;
                }
                else
                {
                    const result = this.#connection
                        .query(`
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
                            try
                            {
                                this.#connection.release();
                                this.#insertTable = undefined;
                                this.#insertColumns = undefined;
                                this.#insertReturning = undefined;
                                this.#insertParams = undefined;
                            }
                            catch
                            {
                                this.#insertTable = undefined;
                                this.#insertColumns = undefined;
                                this.#insertReturning = undefined;
                                this.#insertParams = undefined;
                            }
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
        const validParameters = this.#ValidateParameters({ ..._selectParam });

        if (validParameters)
        {
            this.#selectResult = {
                error: {
                    transaction: false,
                    params: false,
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

            if (join)
            {
                const tables  = Object.keys (join);
                const regexJoin = /join$/i;
                const regexCompoundJoin = /inner join$|left join$|right join$|full outer join$/i;
                const joinParams = [];

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
                        const joinOn = { ...join[_table].on };
                        const joinOnColumns = Object.keys(joinOn);
                        const joinLogicalOperators = [ ...join[_table].logicalOperators ];

                        joinParams.push(`
                            ${tableJoin.toUpperCase()} ${_table} ON
                        `);

                        const validOparators = this.#ValidateOperators(joinOn, joinOnColumns, joinLogicalOperators, joinParams, values, param, this.#selectResult, _table);
                        if (validOparators)
                        {
                            param = validOparators;
                        }
                    }
                    else
                    {
                        this.#selectResult.error.params = "Invalid join type on JOIN params";
                        return this.#selectResult;
                    }
                });

                if (joinParams.length > 0)
                {
                    this.#selectJoin = joinParams.join(" ");
                }
                else
                {
                    return this.#selectResult;
                }
            }

            if (where)
            {
                const whereColumns = Object.keys(where);

                if ( !logicalOperators)
                {
                    throw new Error ("When using the WHERE clause, you must provide the logical operators");
                }

                const validOperators = this.#ValidateOperators(where, whereColumns, logicalOperators, selectParams, values, param, this.#selectResult);

                if (validOperators)
                {
                    this.#selectWhere = selectParams.join (" ");
                    param = validOperators;
                }
                else
                {
                    return this.#selectResult;
                }
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

                const validOperators = this.#ValidateOperators(having.columns, havingColumns, havingLogicalOperators, havingParams, values, param, this.#selectResult);

                if (validOperators)
                {
                    this.#selectHaving = havingParams.join (" ");
                    param = validOperators;
                }
                else
                {
                    return this.#selectResult;
                }
            }

            if (this.#method === "client")
            {
                const result = this.#client
                    .query(`
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
                const result = this.#connection
                    .query(`
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
                        try
                        {
                            this.#connection.release();
                            this.#selectTable = undefined;
                            this.#selectColumns = undefined;
                            this.#selectJoin = undefined;
                            this.#selectWhere = undefined;
                            this.#selectGroupBy = undefined;
                            this.#selectOrderBy = undefined;
                            this.#selectHaving = undefined;
                        }
                        catch
                        {
                            this.#selectTable = undefined;
                            this.#selectColumns = undefined;
                            this.#selectJoin = undefined;
                            this.#selectWhere = undefined;
                            this.#selectGroupBy = undefined;
                            this.#selectOrderBy = undefined;
                            this.#selectHaving = undefined;
                        }
                    });
                
                return result;
            }
        }
    }

    Select (_selectParam)
    {
        return this.#Select(_selectParam);
    }

    #Update = (_updateParam) =>
    {
        const validParameters = this.#ValidateParameters({ ..._updateParam });

        if (validParameters)
        {
            this.#updateResult = {
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
            const logicalOperators = _updateParam.logicalOperators;
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

            this.#updateTable = table;
            const columnsNames = Object.keys(columns);

            const updateParams = [];
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
                        const regexType = /integer$|string$/;

                        if (regexType.test(type))
                        {
                            if (type.toLowerCase() === "integer")
                            {
                                updateParams.push(`${_column} = ${value}`);
                            }
                            else
                            {
                                updateParams.push(`${_column} = $${param}`);
                                values.push(value);
                                param++;
                            }
                        }
                        else
                        {
                            this.#updateResult.error.params = "Invalid type. Type must be 'integer' or 'string'";
                        }
                    }
                    else
                    {
                        this.#updateResult.error.params = "When providing values as a string you need to specify its type. You can do that by adding a key 'type' with a value of 'string' or 'integer'";
                    }
                }
                else
                {
                    updateParams.push(`${_column} = $${param}`);
                    values.push(value);
                    param++;
                }
            });

            if (this.#updateResult.error.params)
            {
                return this.#updateResult;
            }

            this.#updateParams = updateParams.join(", ");

            if (where)
            {
                const updateWhere = [];
                const whereColumns = Object.keys(where);

                if ( !logicalOperators)
                {
                    throw new Error ("When using the WHERE clause, you must provide the logical operators");
                }

                const validOperators = this.#ValidateOperators(where, whereColumns, logicalOperators, updateWhere, values, param, this.#updateResult);

                if (validOperators)
                {
                    this.#updateWhere = updateWhere.join (" ");
                    param = validOperators;
                }
                else
                {
                    return this.#updateResult;
                }
    
            }

            if (returning)
            {
                this.#updateReturning = returning.join(", ");
            }

            if (this.#method === "client")
            {
                if (beginTransaction)
                {
                    const result = this.#client
                        .query("BEGIN;")
                        .then( () => this.#client.query(`
                            UPDATE ${this.#updateTable} SET ${this.#updateParams}
                             ${this.#updateWhere ? `WHERE ${this.#updateWhere}` : ""}
                             ${this.#updateReturning ? `RETURNING ${this.#updateReturning}` : "" }
                        `, values))
                        .then(async (result) =>
                        {
                            this.#updateResult.data = result.rows;

                            await this.#client
                                .query("COMMIT;")
                                .then( () =>
                                {
                                    this.#updateResult.success.commit = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#updateResult.error.commit = err.message;
                                });

                            return this.#updateResult;
                        })
                        .catch(async (err) =>
                        {
                            this.#updateResult.error.transaction = err.message;

                            await this.#client
                                .query("ROLLBACK;")
                                .then( () =>
                                {
                                    this.#updateResult.success.rollback = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#updateResult.error.rollback = err.message;
                                });

                            return this.#updateResult;
                        })
                        .finally( () =>
                        {
                            this.#updateTable = undefined;
                            this.#updateParams = undefined;
                            this.#updateWhere = undefined;
                            this.#updateReturning = undefined;
                        });

                    return result;
                }
                else
                {
                    const result = this.#client
                        .query(`
                            UPDATE ${this.#updateTable} SET ${this.#updateParams}
                             ${this.#updateWhere ? `WHERE ${this.#updateWhere}` : ""}
                             ${this.#updateReturning ? `RETURNING ${this.#updateReturning}` : "" }
                        `, values)
                        .then( (result) =>
                        {
                            this.#updateResult.data = result.rows;
                            return this.#updateResult;
                        })
                        .catch( (err) =>
                        {
                            this.#updateResult.error.transaction = err.message;
                            return this.#updateResult;
                        })
                        .finally( () =>
                        {
                            this.#updateTable = undefined;
                            this.#updateParams = undefined;
                            this.#updateWhere = undefined;
                            this.#updateReturning = undefined;
                        });

                    return result;
                }
            }
            else
            {
                if (beginTransaction)
                {
                    const result = this.#connection
                        .query("BEGIN;")
                        .then( () => this.#connection.query(`
                            UPDATE ${this.#updateTable} SET ${this.#updateParams}
                            ${this.#updateWhere ? `WHERE ${this.#updateWhere}` : ""}
                            ${this.#updateReturning ? `RETURNING ${this.#updateReturning}` : "" }
                        `, values))
                        .then(async (result) =>
                        {
                            this.#updateResult.data = result.rows;

                            await this.#connection
                                .query("COMMIT;")
                                .then( () =>
                                {
                                    this.#updateResult.success.commit = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#updateResult.error.commit = err.message;
                                });

                            return this.#updateResult;
                        })
                        .catch(async (err) =>
                        {
                            this.#updateResult.error.transaction = err.message;

                            await this.#connection
                                .query("ROLLBACK;")
                                .then( () =>
                                {
                                    this.#updateResult.success.rollback = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#updateResult.error.rollback = err.message;
                                });

                            return this.#updateResult;
                        })
                        .finally( () =>
                        {
                            try
                            {
                                this.#connection.release();
                                this.#updateTable = undefined;
                                this.#updateParams = undefined;
                                this.#updateWhere = undefined;
                                this.#updateReturning = undefined;
                            }
                            catch
                            {
                                this.#updateTable = undefined;
                                this.#updateParams = undefined;
                                this.#updateWhere = undefined;
                                this.#updateReturning = undefined;

                            }
                        });

                    return result;
                }
                else
                {
                    const result = this.#connection
                        .query(`
                            UPDATE ${this.#updateTable} SET ${this.#updateParams}
                            ${this.#updateWhere ? `WHERE ${this.#updateWhere}` : ""}
                            ${this.#updateReturning ? `RETURNING ${this.#updateReturning}` : "" }
                        `, values)
                        .then( (result) =>
                        {
                            this.#updateResult.data = result.rows;
                            return this.#updateResult;
                        })
                        .catch( (err) =>
                        {
                            this.#updateResult.error.transaction = err.message;
                            return this.#updateResult;
                        })
                        .finally( () =>
                        {
                            try
                            {
                                this.#connection.release();
                                this.#updateTable = undefined;
                                this.#updateParams = undefined;
                                this.#updateWhere = undefined;
                                this.#updateReturning = undefined;
                            }
                            catch
                            {
                                this.#updateTable = undefined;
                                this.#updateParams = undefined;
                                this.#updateWhere = undefined;
                                this.#updateReturning = undefined;
                            }
                        });

                    return result;
                }
            }
        }
    }

    Update (_updateParam)
    {
        return this.#Update(_updateParam);
    }

    #Delete = (_deleteParam) =>
    {
        const validParameters = this.#ValidateParameters({ ..._deleteParam });

        if (validParameters)
        {
            this.#deleteResult = {
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
            const logicalOperators = _deleteParam.logicalOperators;
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

            this.#deleteTable = table;
            const values = [];
            let param = 1;

            if (using)
            {
                this.#deleteUsing = using;
            }

            if (where)
            {
                const deleteWhere = [];
                const whereColumns = Object.keys(where);

                if ( !logicalOperators)
                {
                    throw new Error ("When using the WHERE clause, you must provide the logical operators");
                }

                const validOperators = this.#ValidateOperators(where, whereColumns, logicalOperators, deleteWhere, values, param, this.#deleteResult);

                if (validOperators)
                {
                    this.#deleteWhere = deleteWhere.join (" ");
                    param = validOperators;
                }
                else
                {
                    return this.#deleteResult;
                }
    
            }

            if (returning)
            {
                this.#deleteReturning = returning.join(", ");
            }

            if (this.#method === "client")
            {
                if (beginTransaction)
                {
                    const result = this.#client
                        .query("BEGIN;")
                        .then( () => this.#client.query(`
                            DELETE FROM ${this.#deleteTable}
                             ${this.#deleteUsing ? `USING ${this.#deleteUsing}` : ""}
                             ${this.#deleteWhere ? `WHERE ${this.#deleteWhere}` : ""}
                             ${this.#deleteReturning ? `RETURNING ${this.#deleteReturning}` : ""}
                        `, values))
                        .then(async (result) =>
                        {
                            this.#deleteResult.data = result.rows;

                            await this.#client
                                .query("COMMIT;")
                                .then( () =>
                                {
                                    this.#deleteResult.success.commit = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#deleteResult.error.commit = err.message;
                                });

                            return this.#deleteResult;
                        })
                        .catch(async (err) =>
                        {
                            this.#deleteResult.error.transaction = err.message;

                            await this.#client
                                .query("ROLLBACK;")
                                .then( () =>
                                {
                                    this.#deleteResult.success.rollback = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#deleteResult.error.rollback = err.message;
                                });

                            return this.#deleteResult;
                        })
                        .finally( () =>
                        {
                            this.#deleteTable = undefined;
                            this.#deleteUsing = undefined;
                            this.#deleteWhere = undefined;
                            this.#deleteReturning = undefined;
                        });

                    return result;
                }
                else
                {
                    const result = this.#client
                        .query(`
                            DELETE FROM ${this.#deleteTable}
                             ${this.#deleteUsing ? `USING ${this.#deleteUsing}` : ""}
                             ${this.#deleteWhere ? `WHERE ${this.#deleteWhere}` : ""}
                             ${this.#deleteReturning ? `RETURNING ${this.#deleteReturning}` : ""}
                        `, values)
                        .then( (result) =>
                        {
                            this.#deleteResult.data = result.rows;
                            return this.#deleteResult;
                        })
                        .catch( (err) =>
                        {
                            this.#deleteResult.error.transaction = err.message;
                            return this.#deleteResult;
                        })
                        .finally( () =>
                        {
                            this.#deleteTable = undefined;
                            this.#deleteUsing = undefined;
                            this.#deleteWhere = undefined;
                            this.#deleteReturning = undefined;
                        });

                    return result;
                }
            }
            else
            {
                if (beginTransaction)
                {
                    const result = this.#connection
                        .query("BEGIN;")
                        .then( () => this.#connection.query(`
                            DELETE FROM ${this.#deleteTable}
                             ${this.#deleteUsing ? `USING ${this.#deleteUsing}` : ""}
                             ${this.#deleteWhere ? `WHERE ${this.#deleteWhere}` : ""}
                             ${this.#deleteReturning ? `RETURNING ${this.#deleteReturning}` : ""}
                        `, values))
                        .then(async (result) =>
                        {
                            this.#deleteResult.data = result.rows;

                            await this.#connection
                                .query("COMMIT;")
                                .then( () =>
                                {
                                    this.#deleteResult.success.commit = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#deleteResult.error.commit = err.message;
                                });

                            return this.#deleteResult;
                        })
                        .catch(async (err) =>
                        {
                            this.#deleteResult.error.transaction = err.message;

                            await this.#connection
                                .query("ROLLBACK;")
                                .then( () =>
                                {
                                    this.#deleteResult.success.rollback = true;
                                })
                                .catch( (err) =>
                                {
                                    this.#deleteResult.error.rollback = err.message;
                                });

                            return this.#deleteResult;
                        })
                        .finally( () =>
                        {
                            try
                            {
                                this.#connection.release();
                                this.#deleteTable = undefined;
                                this.#deleteUsing = undefined;
                                this.#deleteWhere = undefined;
                                this.#deleteReturning = undefined;
                            }
                            catch
                            {
                                this.#deleteTable = undefined;
                                this.#deleteUsing = undefined;
                                this.#deleteWhere = undefined;
                                this.#deleteReturning = undefined;
                            }
                        });

                    return result;
                }
                else
                {
                    const result = this.#connection
                        .query(`
                            DELETE FROM ${this.#deleteTable}
                             ${this.#deleteUsing ? `USING ${this.#deleteUsing}` : ""}
                             ${this.#deleteWhere ? `WHERE ${this.#deleteWhere}` : ""}
                             ${this.#deleteReturning ? `RETURNING ${this.#deleteReturning}` : ""}
                        `, values)
                        .then( (result) =>
                        {
                            this.#deleteResult.data = result.rows;
                            return this.#deleteResult;
                        })
                        .catch( (err) =>
                        {
                            this.#deleteResult.error.transaction = err.message;
                            return this.#deleteResult;
                        })
                        .finally( () =>
                        {
                            try
                            {
                                this.#connection.release();
                                this.#deleteTable = undefined;
                                this.#deleteUsing = undefined;
                                this.#deleteWhere = undefined;
                                this.#deleteReturning = undefined;    
                            }
                            catch
                            {
                                this.#deleteTable = undefined;
                                this.#deleteUsing = undefined;
                                this.#deleteWhere = undefined;
                                this.#deleteReturning = undefined;    
                            }
                        });

                    return result;
                }
            }

        }
    }

    Delete (_deleteParam)
    {
        return this.#Delete(_deleteParam)
    }

    #BeginTransaction = () =>
    {
        this.#connectionStatus = {
            beginTransaction: {
                success: false,
                error: false,
            },
            start: {
                success: false,
                error: false,
            },
            end: {
                success: false,
                error: false,
            },
            commit: {
                success: false,
                error: false,
            },
            rollback: {
                success: false,
                error: false,
            },
        };

        if (this.#method === "client")
        {
            const beginTransaction = this.#client
                .query("BEGIN;")
                .then( () =>
                {
                    this.#connectionStatus.beginTransaction.success = true;
                    return this.#connectionStatus.beginTransaction;
                })
                .catch( (err) => 
                {
                    this.#connectionStatus.beginTransaction.error = err.message;
                    return this.#connectionStatus.beginTransaction;
                });
            
            return beginTransaction;
        }
        else
        {
            const beginTransaction = this.#connection
                .query("BEGIN;")
                .then( () =>
                {
                    this.#connectionStatus.beginTransaction.success = true;
                    return this.#connectionStatus.beginTransaction;
                })
                .catch( (err) => 
                {
                    this.#connectionStatus.beginTransaction.error = err.message;
                    return this.#connectionStatus.beginTransaction;
                });

            return beginTransaction;
        }
    }

    BeginTransaction ()
    {
        return this.#BeginTransaction();
    }

    #Commit = async () =>
    {
        this.#connectionStatus = {
            beginTransaction: {
                success: false,
                error: false,
            },
            start: {
                success: false,
                error: false,
            },
            end: {
                success: false,
                error: false,
            },
            commit: {
                success: false,
                error: false,
            },
            rollback: {
                success: false,
                error: false,
            },
        };
        
        if (this.#method === "client")
        {
            const commit = await this.#client
                .query("COMMIT;")
                .then( () =>
                {
                    this.#connectionStatus.commit.success = true;
                    return this.#connectionStatus.commit;
                })
                .catch( (err) =>
                {
                    this.#connectionStatus.commit.error = err.message;
                    return this.#connectionStatus.commit;
                });

            return commit;
        }
        else
        {
            const commit = this.#connection
                .query("COMMIT;")
                .then( () =>
                {
                    this.#connectionStatus.commit.success = true;
                    return this.#connectionStatus.commit;
                })
                .catch( (err) =>
                {
                    this.#connectionStatus.commit.error = err.message;
                    return this.#connectionStatus.commit;
                })
                .finally( () =>
                {
                    try
                    {
                        this.#connection.release();
                        return this.#connectionStatus.commit;
                    }
                    catch
                    {
                        return this.#connectionStatus.commit;
                    }
                });

            return commit;
        }
    }

    Commit ()
    {
        return this.#Commit();
    }

    #Rollback = () =>
    {
        this.#connectionStatus = {
            beginTransaction: {
                success: false,
                error: false,
            },
            start: {
                success: false,
                error: false,
            },
            end: {
                success: false,
                error: false,
            },
            commit: {
                success: false,
                error: false,
            },
            rollback: {
                success: false,
                error: false,
            },
        };

        if (this.#method === "client")
        {
            const rollback = this.#client
                .query("ROLLBACK;")
                .then( () =>
                {
                    this.#connectionStatus.rollback.success = true;
                    return this.#connectionStatus.rollback;
                })
                .catch( (err) => 
                {
                    this.#connectionStatus.rollback.error = err.message;
                    return this.#connectionStatus.rollback;
                });
            return rollback;
        }
        else
        {
            const rollback = this.#connection
                .query("ROLLBACK;")
                .then( () =>
                {
                    this.#connectionStatus.rollback.success = true;
                    return this.#connectionStatus.rollback;
                })
                .catch( (err) => 
                {
                    this.#connectionStatus.rollback.error = err.message;
                    return this.#connectionStatus.rollback;
                })
                .finally( () =>
                {
                    try
                    {
                        this.#connection.release();
                        return this.#connectionStatus.rollback;
                    }
                    catch
                    {
                        return this.#connectionStatus.rollback;
                    }
                });
            
            return rollback;
        }
    }

    Rollback ()
    {
        return this.#Rollback();
    }

    EndClient ()
    {
        this.#connectionStatus = {
            beginTransaction: {
                success: false,
                error: false,
            },
            start: {
                success: false,
                error: false,
            },
            end: {
                success: false,
                error: false,
            },
            commit: {
                success: false,
                error: false,
            },
            rollback: {
                success: false,
                error: false,
            },
        };

        const end = this.#client.end()
            .then( () => 
            {
                this.#connectionStatus.end.success = true;
                return this.#connectionStatus.end;
            })
            .catch( (err) =>
            {
                this.#connectionStatus.end.error = err.message;
                return this.#connectionStatus.end;
            });

        return end;
    }

    EndPool ()
    {
        this.#connectionStatus = {
            beginTransaction: {
                success: false,
                error: false,
            },
            start: {
                success: false,
                error: false,
            },
            end: {
                success: false,
                error: false,
            },
            commit: {
                success: false,
                error: false,
            },
            rollback: {
                success: false,
                error: false,
            },
        };

        const end = this.#pool.end()
            .then( () => 
            {
                this.#connectionStatus.end.success = true;
                return this.#connectionStatus.end;
            })
            .catch( (err) =>
            {
                this.#connectionStatus.end.error = err.message;
                return this.#connectionStatus.end;
            });
        
        return end;
    }

    #ValidateOperators = (_object, _objectKeys, _logicalOperators, _arrayParams, _arrayValues, _paramNumber, _errorsObject, _join) =>
    {
        _objectKeys.forEach( (_column, _index) =>
        {
            const regexOperator = /=$|>$|<$|between$|like$|ilike$|is$|in$/i;
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
                if (operator === "like" || operator === "not like"
                    || operator === "ilike" || operator === "not ilike")
                {
                    const percent = _object[_column].percent;
                    if (percent)
                    {
                        const validPercent = this.#ValidateLIKEpercent(_object[_column], _paramNumber);

                        if (validPercent)
                        {
                            if (_join)
                            {
                                _arrayParams.push(`
                                    ${_join}.${_column} ${operator.toUpperCase()} ${validPercent}
                                        ${   _logicalOperators[_index]
                                        ? _logicalOperators[_index].toUpperCase()
                                        : "" }
                                `);
                                _paramNumber++;
                                _arrayValues.push(value);
                            }
                            else
                            {
                                _arrayParams.push(`
                                    ${_column} ${operator.toUpperCase()} ${validPercent}
                                        ${   _logicalOperators[_index]
                                        ? _logicalOperators[_index].toUpperCase()
                                        : "" }
                                `);
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
                            _arrayParams.push(`
                                ${_join}.${_column} ${operator.toUpperCase()} $${_paramNumber}
                                    ${   _logicalOperators[_index]
                                    ? _logicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            _paramNumber++;
                            _arrayValues.push(value);
                        }
                        else
                        {
                            _arrayParams.push(`
                                ${_column} ${operator.toUpperCase()} $${_paramNumber}
                                    ${   _logicalOperators[_index]
                                    ? _logicalOperators[_index].toUpperCase()
                                    : "" }
                            `);
                            _paramNumber++;
                            _arrayValues.push(value);
                        }
                    }
                }
                else if (operator === "between" || operator === "not between")
                {
                    if (_join)
                    {
                        _arrayParams.push(`
                        ${_join}.${_column} ${operator.toUpperCase()}
                                $${_paramNumber} AND $${_paramNumber + 1}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                        `);
                        _paramNumber += 2;
                        _arrayValues.push(value[0], value[1]);
                    }
                    else
                    {
                        _arrayParams.push(`
                            ${_column} ${operator.toUpperCase()}
                                $${_paramNumber} AND $${_paramNumber + 1}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                        `);
                        _paramNumber += 2;
                        _arrayValues.push(value[0], value[1]);
                    }
                }
                else if (operator === "is" || operator === "is not")
                {
                    if (_join)
                    {
                        _arrayParams.push(`
                        ${_join}.${_column} ${operator.toUpperCase()}
                                ${value}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                        `);
                    }
                    else
                    {
                        _arrayParams.push(`
                            ${_column} ${operator.toUpperCase()}
                                ${value}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                        `);
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
                        _arrayParams.push(`
                        ${_join}.${_column} ${operator.toUpperCase()}
                                ${inValues}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                        `);
                    }
                    else
                    {
                        _arrayParams.push(`
                            ${_column} ${operator.toUpperCase()}
                                ${inValues}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                        `);
                    }
                }
                else
                {
                    if (isNaN(value))
                    {
                        if (_join)
                        {
                            _arrayParams.push(`
                            ${_join}.${_column} ${operator.toUpperCase()} ${value}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                            `);
                        }
                        else
                        {
                            _arrayParams.push(`
                            ${_column} ${operator.toUpperCase()} ${value}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                            `);
                        }
                    }
                    else
                    {
                        if (_join)
                        {
                            _arrayParams.push(`
                            ${_join}.${_column} ${operator.toUpperCase()} $${_paramNumber}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                            `);
                            _paramNumber++;
                            _arrayValues.push(value);
                        }
                        else
                        {
                            _arrayParams.push(`
                            ${_column} ${operator.toUpperCase()} $${_paramNumber}
                                ${   _logicalOperators[_index]
                                ? _logicalOperators[_index].toUpperCase()
                                : "" }
                            `);
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

    #ValidateLIKEpercent = (_parameter, _paramNumber) =>
    {
        const parameter = { ..._parameter };
        const percent = parameter.percent.toLowerCase();

        if (percent === "start")
        {
            return `'%'||$${_paramNumber}`;
        }
        else if (percent === "end")
        {
            return `$${_paramNumber}||'%'`;
        }
        else if (percent === "both")
        {
            return `'%'||$${_paramNumber}||'%'`;
        }
        else
        {
           return undefined;
        }
    }
}

module.exports = QueryTool;
export default QueryTool;