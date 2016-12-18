module.exports = [
    {
        name: "pipe.upper",
        example:[
            {title:"JS写法", code: `pipe.upper("abc")`, result: "ABC"},
            //{title:"模版写法", code: `{"abc"|upper}`, result: "ABC"}
        ]
    },
    {
        name: "pipe.lower",
        example:[
            {title:"JS写法", code: `pipe.lower("ABC")`, result: "abc"},
            //{title:"模版写法", code: `{"ABC"|lower}`, result: "abc"}
        ]
    }
];