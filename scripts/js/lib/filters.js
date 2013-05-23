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
        },
        /*!
         * convolute with a kernel
         */
        convolute: function( pixels, weights, opaque ) 
        {
            var side = Math.round(Math.sqrt(weights.length)),
                halfSide = Math.floor(side/2),
                src = pixels.data,
                sw = pixels.width,
                sh = pixels.height,
                // pad output by the convolution matrix
                w = sw,
                h = sh,
                output = Filters.createImageData(w, h),
                dst = output.data,
                // go through the destination image pixels
                alphaFac = opaque ? 1 : 0;
            
            for( var y=0; y<h; y++ ) 
            {
                for( var x=0; x<w; x++ ) 
                {
                    var sy = y, 
                        sx = x,
                        dstOff = (y*w+x)*4,
                        // calculate the weighed sum of the source image pixels that
                        // fall under the convolution matrix
                        r=0, g=0, b=0, a=0;
                    
                    for( var cy=0; cy<side; cy++ ) 
                    {
                        for( var cx=0; cx<side; cx++ ) 
                        {
                            var scy = sy + cy - halfSide,
                                scx = sx + cx - halfSide;
                            
                            if( scy >= 0 && scy < sh && scx >= 0 && scx < sw ) 
                            {
                                var srcOff = (scy*sw+scx)*4,
                                    wt = weights[cy*side+cx];
                                r += src[srcOff] * wt;
                                g += src[srcOff+1] * wt;
                                b += src[srcOff+2] * wt;
                                a += src[srcOff+3] * wt;
                            }
                        }
                    }
                    dst[dstOff] = r;
                    dst[dstOff+1] = g;
                    dst[dstOff+2] = b;
                    dst[dstOff+3] = a + alphaFac*(255-a);
                }
            }
            return output;
        }
    };
    
    return Filters;
});