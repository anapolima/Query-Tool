function Config (_config)
{
    if (_config instanceof Object && !(_config instanceof Array))
    {
        const config = { ..._config };
        if (config.method)
        {
            const method = config.method.toLowerCase();
            delete config.method;
            const configInfo = {
                ...config,
            };

            return {
                method,
                config: configInfo
            };
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

module.exports = Config;
