function EndConnection (_connection)
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

    const end = _connection.end()
        .then( () => 
        {
            connectionStatus.end.success = true;
            
            return connectionStatus.end;
        })
        .catch( (err) =>
        {
            connectionStatus.end.error = err.message;
            
            return connectionStatus.end;
        });

    return end;
}

module.exports = EndConnection;
