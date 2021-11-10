const Config = require("../functions/config.js");
const StartConnection = require("../functions/start-connection.js");

const Select = require("../methods/select.js");
const Insert = require("../methods/insert.js");
const Update = require("../methods/update.js");
const Delete = require("../methods/delete.js");

const BeginTransaction = require("../methods/begin-transaction.js");
const Commit = require("../methods/commit.js");
const Rollback = require("../methods/rollback.js");

const EndConnection = require("../functions/end-connection.js");

function QueryTool ()
{
    let method = undefined;
    let configInfo = undefined;
    let connection = undefined;
    let connectionStarted = undefined;
    let connectionStatus = undefined;
    
    function config (_config)
    {
        const settings = Config(_config);

        method = settings.method;
        configInfo = settings.config;
    }

    async function startConnection ()
    {
        const starting = await StartConnection(method, configInfo);

        connectionStatus = {
            ...starting.connectionStatus
        };

        connectionStarted = starting.connectionStarted;
        connection = starting.connection;

        return connectionStatus;
    }

    async function select (_selectParam)
    {
        if (method === "client")
        {
            const result = await Select(_selectParam, method, connectionStarted);
            
            return result;
        }
        else
        {
            const result = await Select(_selectParam, method, connection);
            
            return result;
        }
    }

    async function insert (_insertParam)
    {
        if (method === "client")
        {
            const result = await Insert(_insertParam, method, connectionStarted);
            
            return result;
        }
        else
        {
            const result = await Insert(_insertParam, method, connection);
            
            return result;
        }
    }

    async function update (_updateParam)
    {
        if (method === "client")
        {
            const result = await Update(_updateParam, method, connectionStarted);
            
            return result;
        }
        else
        {
            const result = await Update(_updateParam, method, connection);
            
            return result;
        }
    }

    async function deleteFrom (_deleteParam)
    {
        if (method === "client")
        {
            const result = await Delete(_deleteParam, method, connectionStarted);
            
            return result;
        }
        else
        {
            const result = await Delete(_deleteParam, method, connection);
            
            return result;
        }
    }

    async function beginTransaction ()
    {
        if (method === "client")
        {
            const result = await BeginTransaction(method, connectionStarted);
            
            return result;
        }
        else
        {
            const result = await BeginTransaction(method, connection);
            
            return result;
        }
    }

    async function commit ()
    {
        if (method === "client")
        {
            const result = await Commit(method, connectionStarted);
            
            return result;
        }
        else
        {
            const result = await Commit(method, connection);
            
            return result;
        }
    }

    async function rollback ()
    {
        if (method === "client")
        {
            const result = await Rollback(method, connectionStarted);
            
            return result;
        }
        else
        {
            const result = await Rollback(method, connection);
            
            return result;
        }
    }

    async function endConnection ()
    {
        const result = await EndConnection(connectionStarted);
        
        return result;
    }

    return {
        config,
        startConnection,
        select,
        insert,
        update,
        deleteFrom,
        beginTransaction,
        commit,
        rollback,
        endConnection,
    };
}

module.exports = QueryTool;
