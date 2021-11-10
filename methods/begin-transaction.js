function BeginTransaction (_method, _connection)
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

    if (_method === "client")
    {
        const beginTransaction = _connection
            .query("BEGIN;")
            .then( () =>
            {
                connectionStatus.beginTransaction.success = true;
                
                return connectionStatus.beginTransaction;
            })
            .catch( (err) => 
            {
                connectionStatus.beginTransaction.error = err.message;
                
                return connectionStatus.beginTransaction;
            });
        
        return beginTransaction;
    }
    else
    {
        const beginTransaction = _connection
            .query("BEGIN;")
            .then( () =>
            {
                connectionStatus.beginTransaction.success = true;
                
                return connectionStatus.beginTransaction;
            })
            .catch( (err) => 
            {
                connectionStatus.beginTransaction.error = err.message;
                
                return connectionStatus.beginTransaction;
            });

        return beginTransaction;
    }
}

module.exports = BeginTransaction;
