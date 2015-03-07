var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var random = require("random-js")();

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}


var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {}
	},
	noPathExists:
	{
		'':{}
	},
	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content',
		}
	},
	fileNoContent:
	{
		pathContent: 
		{	
  			file1: '',
		}
	}
};


function generateTestCases()
{

	var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
	
	for ( var funcName in functionConstraints )
	{
		var params = {};

		// initialize params
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			if(paramName == 'phoneNumber')
			{
				params[paramName] = '\'' + faker.phone.phoneNumberFormat()+'\'';
			}
			else if(paramName == 'formatString')
			{
				params[paramName] = '\'' + faker.phone.phoneFormats()+'\'';
			}
			else
			{
				params[paramName] = '\'\'';
			}
		}

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {mocking: 'fileWithContent' });
		var pathExists      = _.some(constraints, {mocking: 'fileExists' });
		var fileExists      = _.some(constraints, {mocking: 'fileExists' });
                var unLeft 	    = _.some(constraints, {ident: 'options' });
		var unRight 	    = _.some(constraints, {ident: 'normalize', value: true });
		var isUndefined	    = _.some(constraints, {value: 'undefined' });
		var isBlackList	    = _.some(constraints, {value: '"212"' });
		var isLessThan 	    = _.some(constraints, {value: 0});

		for( var c = 0; c < constraints.length; c++ )
		{
			var constraint = constraints[c];
			if( params.hasOwnProperty( constraint.ident ) )
			{
				params[constraint.ident] = constraint.value;
				console.log("++++"+constraint.value);
			}
		}

		// Prepare function arguments.
		var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
		
		//console.log(args);
		
		if( pathExists || fileWithContent )
		{
			content += generateMockFsTestCases(pathExists,fileExists, fileWithContent,funcName, args);
			// Bonus...generate constraint variations test cases....
			content += generateMockFsTestCases(!pathExists,fileExists, !fileWithContent,funcName, args);
			content += generateMockFsTestCases(pathExists, fileExists, !fileWithContent,funcName, args);
			content += generateMockFsTestCases(!pathExists,fileExists, fileWithContent,funcName, args);
			content += generateMockFsTestCases(pathExists,!fileExists, fileWithContent,funcName, args);
		}
		else if( isUndefined || isLessThan )
		{
			content += "subject.{0}({1});\n".format(funcName, args );
			var num1 = random.integer(-100,-1);
			var num2 = random.integer(1,100);
			var custargs = '\'' + num1 + '\',\'' + num2 + '\'';
			content += "subject.{0}({1});\n".format(funcName, custargs );
		}
		else if(unLeft || unRight)
		{
			content += "subject.{0}({1});\n".format(funcName,args);
			var options = { normalize: true };
			var tempArgs = "'" + faker.phone.phoneNumberFormat() + "','" + faker.phone.phoneFormats() + "'";
			tempArgs = tempArgs + ",'" + options + "'";
			content += "subject.{0}({1});\n".format(funcName,tempArgs);
			
			options = { normalize: false };
			var tempArgs2 = "'" + faker.phone.phoneNumberFormat() + "','" + faker.phone.phoneFormats() + "'";
			tempArgs2 = tempArgs2 + ",'" + options + "'";
			content += "subject.{0}({1});\n".format(funcName,tempArgs2);
			
		}
		else if( isBlackList )
		{
			var tempArgs = faker.phone.phoneNumberFormat();
			tempArgs = tempArgs.substring(3);
			tempArgs = "'212" + tempArgs + "'";
			content += "subject.{0}({1});\n".format(funcName,tempArgs);
			tempArgs = "\'" + faker.phone.phoneNumberFormat() + "'";
			content += "subject.{0}({1});\n".format(funcName,tempArgs);
		}
		else
		{
			content += "subject.{0}({1});\n".format(funcName,args);
		}
	}
	
	console.log(content);
	
	fs.writeFileSync('test.js', content, "utf8");

}



function generateMockFsTestCases (pathExists,fileExists, fileWithContent,funcName,args) 
{
	var testCase = "";
	// Insert mock data based on constraints.
	var mergedFS = {};
	if( pathExists && !fileExists )
	{
		if( pathExists )
		{
			for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
		}
	}
	else
	{
		if( pathExists )
		{
			for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
		}
		if( fileWithContent )
		{
			for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
		}
		if( !fileWithContent )
		{
			for (var attrname in mockFileLibrary.fileNoContent) { mergedFS[attrname] = mockFileLibrary.fileNoContent[attrname]; }
		}
		if( !pathExists )
		{
			for (var attrname in mockFileLibrary.noPathExists) { mergedFS[attrname] = mockFileLibrary.noPathExists[attrname]; }
		}
	}

	testCase +=
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	return testCase;
}

function constraints(filePath)
{
        var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});
			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && child.operator == "==")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						//console.log(expression);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1]);
						functionConstraints[funcName].constraints.push( 
							{
								ident: child.left.name,
								value: rightHand
							}
							);
					}
					else if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) == -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						//console.log(expression);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1]);
						//console.log(rightHand);
						functionConstraints[funcName].constraints.push( 
							{
								ident: child.left.name,
								value: rightHand
							}
							);
					}
				}
				if( child.type == 'BinaryExpression' && child.operator == "<" )
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
					 	var expression = buf.substring(child.range[0], child.range[1]);
					  	//console.log(expression);
					   	var rightHand = buf.substring(child.right.range[0], child.right.range[1]);
					    	//console.log(rightHand);
					     	functionConstraints[funcName].constraints.push(
					        	{
						                ident: child.left.name,
								value: rightHand
							}
							);
					}
				}
				
				if( child.type === 'LogicalExpression' && child.operator == "||" )
				{
					if(child.left.type == "UnaryExpression")
					{
						console.log(child.left.argument.name);
					     	functionConstraints[funcName].constraints.push(
					        	{
						        	ident: child.left.argument.name,
								value: false
							}
							);
						
					}
					if(child.right.type == "UnaryExpression")
					{
						console.log(child.right.argument.property.name);
					     	functionConstraints[funcName].constraints.push(
					        	{
						        	ident: child.right.argument.property.name,
								value: true
							}
							);
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							{
								// A fake path to a file
								ident: params[p],
								value: "'pathContent/file1'",
								mocking: 'fileWithContent'
							});
						}
					}
				}


				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							{
								// A fake path to a file
								ident: params[p],
								value: "'path/fileExists'",
								mocking: 'fileExists'
							});
						}
					}
				}
				

			});
			console.log( functionConstraints[funcName]);

		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();
