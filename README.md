# Query-Tool
The QueryTool is a library that allows easier and faster connections with Postgres databases. Whit it, you can make insertions, selections, updates and deletions in the database in a simple and effective way.

[Click here](https://github.com/anapolima/Query-Tool/wiki) to check our documentation.

## Installing
You can install this package by running
```
$ npm i query-tool
```

## What is new on version 2.0.0
The 2.0.0 version was released to prevent possible compatibility issues.

In version 2.0.0, all methods that used to be in PascalCase are now in camelCase. Since _delete_ is a JavaScript reserved word, the old _Delete_ method is now `deleteFrom`. Also, when using the `update` method, the `type` you must supply, which used to be _string_ or _integer_, is now _string_ or _number_. The _EndClient_ and _EndPool_ methods are now one, called `endConnection`.

The documentation is up to date, you can check it.
## Support
QueryTool is free software. If you encounter a bug with the library please open an issue on the GitHub repo. If you have questions unanswered by the documentation please open an issue pointing out how the documentation was unclear and I will do my best to make it better!

When you open an issue please provide:

* version of Node
* smallest possible snippet of code to reproduce the problem

## License
MIT License

Copyright (c) 2021 Ana Paula Oliveira de Lima

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
