
var assert = require('assert')
  , inc = require('./../subject').inc;

	suite('inc', function() 
    	{
    		test('inc should return 2', function(done) 
		{
          		assert.equal(2, inc(1,undefined));
			done();
		});
    		test('inc should return 2', function(done) 
		{
          		assert.equal(3, inc(-1,1));
			done();
		});
    	});
     

