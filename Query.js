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
    #selectLogicalOperators
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
        this.#selectLogicalOperators = undefined;
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
            delete _param.column
        }

        const regex = /truncate$|drop$|select$|$update$/i;
        const regexComposed = /truncate table$|drop table$|drop column$|drop database$|select [a-zA-ZÀ-ü\W]+ from$|alter table$|add column$|create table$|create database$|create view$|create index$|update table/i;

        if (regex.test(JSON.stringify(_param)) || regexComposed.test(JSON.stringify(_param)))
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

            if ( !( Array.isArray(returning) ) )
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

    Insert(_insertParam)
    {
        return this.#Insert(_insertParam);
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
