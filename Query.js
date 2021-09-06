const pg = require("pg");
const dotenv = require("dotenv");
dotenv.config();

class QueryTool 
{
    #method
    #config
    #client
    #validateParams
    #insertResult
    #selectResult
    #updateResult

    #insertBeginTransaction
    #insertTable
    #insertColumns
    #insertReturning

    #selectTable
    #selectColumns
    #selectJoin
    #selectWhere
    #selectLogicalOperators
    #selectGroupBy
    #selectOrderBy
    #selectHaving

    #updateBeginTransaction
    #updateTable
    #updateColumns
    #updateWhere
    #updateLogicalOperators
    #updateReturning

    Config (_config)
    {
        this.#SetConfig(_config);
        this.#SetClient();
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
                throw new Error("You must provide a method to connect to the database");
            }
        }
        else
        {
            throw new Error ("The config must be a JSON specifying how do you want to connect to the database");
        }
    }

    #SetClient = () => {
        if (this.#method.toLowerCase() === "client")
        {
            this.#client = new pg.Client({
                ...this.#config
            });

            this.#client.connect()
            .then(() => console.log("Connected to database"))
            .catch((err) => console.log(err));
        }
        else if (this.#method.toLowerCase() === "pool")
        {
            this.#client = new pg.Pool({
                ...this.#config
            });

            this.#client.connect()
            .then(() => console.log("Connected to database"))
            .catch((err) => console.log(err));
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
        const validParameters = this.#validateParams(_insertParam);

        if (validParameters)
        {
            this.#SetClient();
            this.#insertResult = {
                error: {
                    transaction: false,
                    commit: false,
                    rollback: false,
                    params: false,
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

            this.#table = table;
        }
    }

    Insert(_insertParam)
    {
        this.#SetClient();
        this.#Insert(_insertParam);
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
