function ValidateParameters (_param)
{
    if (Array.isArray(_param.columns))
    {
        const arrayColumns = _param.columns;
        const specialRegex = /[;|\s]?truncate$|[;|\s]?drop$|[;|\s]?update$|[;|\s]?insert$/i;
        const specialRegexCompound = /[;|\s]?truncate table$|[;|\s]?drop table$|[;|\s]?drop column$|[;|\s]?drop database$|[;|\s]?alter table$|[;|\s]?add column$|[;|\s]?create table$|[;|\s]?create database$|[;|\s]?create view$|[;|\s]?create index$|[;|\s]?update table$/i;

        if (specialRegex.test(JSON.stringify(arrayColumns)) || specialRegexCompound.test(JSON.stringify(arrayColumns)))
        {
            throw new Error ("It looks like you trying to modify the database.");
        }
        delete _param.columns;
    }

    const regex = /[;|\s]?truncate$|[;|\s]?drop$|[;|\s]?update$|[;|\s]?insert$|[;|\s]?select$/i;
    const regexCompound = /[;|\s]?truncate table$|[;|\s]?drop table$|[;|\s]?drop column$|[;|\s]?drop database$|[;|\s]?alter table$|[;|\s]?add column$|[;|\s]?create table$|[;|\s]?create database$|[;|\s]?create view$|[;|\s]?create index$|[;|\s]?update table$|[;|\s]?select [a-zA-ZÀ-ü\W]+ from$/i;

    if (regex.test(JSON.stringify(_param)) || regexCompound.test(JSON.stringify(_param)))
    {
        throw new Error ("It looks like you trying to modify the database.");
    }

    return true;
}

module.exports = ValidateParameters;
