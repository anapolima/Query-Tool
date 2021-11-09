function ValidateLIKEPercent (_parameter, _paramNumber)
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

module.exports = ValidateLIKEPercent;
