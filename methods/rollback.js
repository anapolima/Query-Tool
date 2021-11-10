async function Rollback (_method, _connection)
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
        const rollback = _connection
            .query("ROLLBACK;")
            .then( () =>
            {
                connectionStatus.rollback.success = true;
                
                return connectionStatus.rollback;
            })
            .catch( (err) => 
            {
                connectionStatus.rollback.error = err.message;
                
                return connectionStatus.rollback;
            });
        
        return rollback;
    }
    else
    {
        const rollback = _connection
            .query("ROLLBACK;")
            .then( () =>
            {
                connectionStatus.rollback.success = true;
                
                return connectionStatus.rollback;
            })
            .catch( (err) => 
            {
                connectionStatus.rollback.error = err.message;
                
                return connectionStatus.rollback;
            })
            .finally( () =>
            {
                try
                {
                    _connection.release();
                    
                    return connectionStatus.rollback;
                }
                catch
                {
                    return connectionStatus.rollback;
                }
            });
        
        return rollback;
    }
}

module.exports = Rollback;
