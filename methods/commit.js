async function Commit (_method, _connection)
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
        const commit = await _connection
            .query("COMMIT;")
            .then( () =>
            {
                connectionStatus.commit.success = true;
                
                return connectionStatus.commit;
            })
            .catch( (err) =>
            {
                connectionStatus.commit.error = err.message;
                
                return connectionStatus.commit;
            });

        return commit;
    }
    else
    {
        const commit = _connection
            .query("COMMIT;")
            .then( () =>
            {
                connectionStatus.commit.success = true;
                
                return connectionStatus.commit;
            })
            .catch( (err) =>
            {
                connectionStatus.commit.error = err.message;
                
                return connectionStatus.commit;
            })
            .finally( () =>
            {
                try
                {
                    _connection.release();
                    
                    return connectionStatus.commit;
                }
                catch
                {
                    return connectionStatus.commit;
                }
            });

        return commit;
    }
}

module.exports = Commit;
