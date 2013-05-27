var GSVPANO = GSVPANO || {};

GSVPANO.PanoLoader = function( parameters ) 
{
    'use strict';

    var _parameters = parameters || {},
        _location,
        _zoom,
        _panoId,
        _panoClient = new google.maps.StreetViewService(),
        _count = 0,
        _total = 0,
        _canvas = document.createElement('canvas'),
        _ctx = _canvas.getContext('2d'),
        rotation = 0,
        copyright = '',
        onSizeChange = null,
        onPanoramaLoad = null;
        
    this.setProgress = function( p ) 
    {
        this.onProgress && this.onProgress(p);
    };

    this.throwError = function( message )
    {
        this.onError && this.onError(message);
        console && console.error(message);
    };

    this.adaptTextureToZoom = function() 
    {
        var w = 416 * Math.pow( 2, _zoom),
            h = 416 * Math.pow( 2, _zoom - 1);
        _canvas.width = w;
        _canvas.height = h;
        _ctx.translate( _canvas.width, 0 );
        _ctx.scale( -1, 1 );
    };

    this.composeFromTile = function (x, y, w, h, texture) 
    {
        _ctx.drawImage( texture, x*512, y*512);
        this.filterTile && this.filterTile(x, y, w, h);
        _count++;
        var p = Math.round( _count * 100 / _total );
        this.setProgress(p);
        if( _count === _total ) 
            this.onPanoramaLoad && this.onPanoramaLoad();
        
    };

    this.composePanorama = function() 
    {
        this.setProgress(0);
        
        var w = Math.pow(2, _zoom),
            h = Math.pow(2, _zoom - 1),
            self = this,
            url,
            x,
            y;
            
        _count = 0;
        _total = w * h;
        
        for( y = 0; y < h; y++) 
        {
            for( x = 0; x < w; x++) 
            {
                url = 'http://maps.google.com/cbk?output=tile&panoid=' + _panoId + '&zoom=' + _zoom + '&x=' + x + '&y=' + y + '&' + Date.now();
                (function( x, y, w, h ) 
                { 
                    var img = new Image();
                    img.addEventListener('load', function(){ self.composeFromTile(x, y, w, h, this); });
                    img.crossOrigin = '';
                    img.src = url;
                    
                })( x, y, w, h );
            }
        }
        
    };
    
    this.load = function( location ) 
    {
        var self = this;
        this.canvas = _canvas;
        this.context = _ctx;
        
        _panoClient.getPanoramaByLocation
        (  
            location, 
            50, 
            function( result, status ) 
            {
                if( status === google.maps.StreetViewStatus.OK ) 
                {
                    if( self.onPanoramaData ) self.onPanoramaData( result );
                    var h = google.maps.geometry.spherical.computeHeading(location, result.location.latLng);
                    rotation = (result.tiles.centerHeading - h) * Math.PI / 180.0;
                    copyright = result.copyright;
                    self.copyright = result.copyright;
                    _panoId = result.location.pano;
                    self.location = location;
                    //$('#pano').css('overflow', 'scroll').html(_canvas);
                    self.composePanorama();
            } 
            else 
            {
                if( self.onNoPanoramaData ) self.onNoPanoramaData( status );
                self.throwError('Could not retrieve panorama for the following reason: ' + status);
            }
        });
        
    };
    
    this.setZoom = function( z ) 
    {
        _zoom = z;
        this.adaptTextureToZoom();
    };

    this.setZoom( _parameters.zoom || 2 );

};