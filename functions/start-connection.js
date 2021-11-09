const pg = require("pg");

async function StartConnection (_method, _config)
{
    const connectionStatus = {
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

    let connection = undefined;
    let pool = undefined;
    let client = undefined;

    if (_method === "client")
    {
        const clientConnection = new pg.Client({
            ..._config
        });

        const connecting = clientConnection
            .connect()
            .then( () =>
            {   
                connectionStatus.start.success = true;
                client =  clientConnection;
                
                return connectionStatus.start;
            })
            .catch( (err) =>
            {
                connectionStatus.start.error = err.message;
                
                return connectionStatus.start;
            });

        return {
            connectionStatus: await connecting,
            connectionStarted: client
        };
    }
    else if (_method === "pool")
    {
        const clientConnection = new pg.Pool({
            ..._config
        });

        const connecting = clientConnection
            .connect()
            .then( (connectionPool) => 
            {
                connection = connectionPool;
                pool = clientConnection;
                connectionStatus.start.success = true;
                
                return connectionStatus.start;
            })
            .catch( (err) =>
            {
                connectionStatus.start.error = err.message;
                
                return connectionStatus.start;
            });

        return {
            connectionStatus: await connecting,
            connectionStarted: pool,
            connection
        };
    }
    else
    {
        throw new Error("Invalid connection method. Choose between Client or Pool");
    }
}

module.exports = StartConnection;
