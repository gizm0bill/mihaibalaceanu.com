define([], function()
{
    var 
    Filters = 
    {
        grayscale: function()
        {
            return function(d, i)
            {
                var r = d[i],
                g = d[i+1],
                b = d[i+2],
                v = 0.2126*r + 0.7152*g + 0.0722*b; // luminance
                d[i] = d[i+1] = d[i+2] = v;
            };
        },
        customContrast: function(t)
        {
            return function(d, i)
            {
                for( var j=i; j<i+3; j++ )
                    d[j] += -Math.ceil(Math.cos((d[j]*Math.PI)/255)*t);
            };
        },
        
        /*!
         * for the sake of optimization
         */
        customFx: function(t)
        {
            return function(d, i)
            {
                var r = d[i],
                g = d[i+1],
                b = d[i+2],
                v = 0.2126*r + 0.7152*g + 0.0722*b; 
                v += -Math.ceil( Math.cos( (v*Math.PI)/255 ) *t );
                d[i] = d[i+1] = d[i+2] = v;
            };
        },
        
        /*!
         * mix a bunch of compatible filters
         */
        mixin:
        {
            /*!
             * apply filters one after the other
             * call: Filters.mixin.chain( filterFnc [, filterFnc, ...] )( imageData )
             */
            chain: function()
            {
                var filters = arguments;
                return function(imgData)
                {
                    for( var i=0; i < imgData.data.length; i+=4 )
                        for( var j=0; j < filters.length; j++) filters[j](imgData.data, i);
                    return imgData;
                };
            }
        },
        applyOne: function(filter, imgData)
        {
            var d = imgData.data;
            for( var i=0; i<d.length; i+=4 ) filter(d, i);
            return imgData;
        }
    };
    
    return Filters;
});