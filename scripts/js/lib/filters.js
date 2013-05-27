define([], function()
{
    var Filters = 
    {
        /*!
         * threshold filter
         */
        threshold: function(imgData, threshold) 
        {
            var d = imgData.data;
            for( var i=0; i<d.length; i+=4 ) 
            {
                var r = d[i],
                    g = d[i+1],
                    b = d[i+2],
                    v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 255 : 0;
                d[i] = d[i+1] = d[i+2] = v;
            }
            return imgData;
        },
        /*!
         * grayscale filter
         */
        grayscale: function(imgData)
        {
            var d = imgData.data;
            for( var i=0; i<d.length; i+=4 )
            {
              var r = d[i],
                  g = d[i+1],
                  b = d[i+2],
                  v = 0.2126*r + 0.7152*g + 0.0722*b; // luminance
              d[i] = d[i+1] = d[i+2] = v;
            }
            return imgData;
        }
    };
    
    return Filters;
});