define([ 'jquery', 'filters', 'dust/core',
         'GSVPano', 'three', 'tween',
         'css!app',
         'tmpl!index'], 
function($, Filters, dust)
{
    function loaderOuttaHeader()
    {
        var cts = arguments[0], s = '';
        cts.each(function()
        {
            if( this.nodeType == 1 ) 
            {
                var d = $('<span />');
                d.html($(this).html(loaderOuttaHeader($(this).contents())));
                s += d.html();
            }
            if( this.nodeType == 3 ) 
            {
                var txt = $(this).text();
                for( var i=0; i<txt.length; i++ )
                    s += txt[i].search(/\s/) === -1 ? '<span class="hide">'+txt[i]+'</span>' : txt[i];
            }
        });
        return s;
    };
    
    var loaderPartsLen, loaderElem;
    // render page template
    dust.render('index', {}, function(e, o)
    { 
        e && console.error(e); 
        var page = $(o);
        loaderElem = $('h1', page);  
        o && loaderElem.html(loaderOuttaHeader(loaderElem.contents())) && $('body').html(page);
        loaderPartsLen = loaderElem.find('.hide').length;
        $('h1 span.small').prepend('<span class="pre">_</span>');
        
//        require({ waitSeconds: 45}, ['//connect.facebook.net/en_GB/all.js#xfbml=1&appId=131162073593633'], function()
//        {
//            console.log(FB);
//        });
    });
    
    // xcross browser requestAnimationFrame
    if( !window.requestAnimationFrame ) 
        window.requestAnimationFrame = ( function() 
        {
            return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function( callback,  element ){ window.setTimeout( callback, 1000 / 60 ); };
        })();
    
    TWEEN.start();

    var map, canvas, ctx;
    var marker = null;
    var container, mesh, renderer, camera;
    var fov = 70;
    var lat = 0, lon = 0;
    var zoom;
    var cd = new Date();
    var time = cd.getTime();
    var position = { x: 0, y: 0 };
    var loader = new GSVPANO.PanoLoader();
    var finit;
    var randomLocations = 
    [
        { lat: 46.768877, lng: 23.590238 },
        { lat: 44.318581, lng: 23.798667 },
        { lat: 50.089303, lng: 14.421197 },
        { lat: 52.502978, lng: 13.412365 },
        { lat: 45.609377, lng: 24.614353 },
        { lat: 52.566334, lng: 5.464668 },
        { lat: 44.873577, lng: 13.848168 }
    ];

    loader.filterTile = function( x, y, w, h )
    {
        var imgData = this.context.getImageData( (w-2)*512 - (x*512+256), y*512, 512, 512);
        imgData = Filters.grayscale( imgData, 128 ); // [0, -1, 0, -1, 10, -1, 0, -1, 0 ]);
        this.context.putImageData( imgData, (w-2)*512 - (x*512+256), y*512);
    };
    
    var prevLoad = 0;
    function setProgress( progress ) 
    {
        var x = Math.floor(progress/100 * loaderPartsLen);
        if( x > prevLoad )
            loaderElem.find('.hide').eq( Math.floor( Math.random() * (loaderPartsLen-x) ) ).removeClass('hide');
    }

    function showProgress( show ) 
    {
        loaderElem.find('.pre').remove();
    }

    function initialize( positionOrError ) 
    {
        clearTimeout(finit);
        
        var pos = positionOrError.coords ? {lat: positionOrError.coords.latitude, lng: positionOrError.coords.longitude} : randomLocations[ Math.floor( Math.random() * randomLocations.length ) ]; 
        canvas = document.createElement( 'canvas' );
        ctx = canvas.getContext( '2d' );

        container = document.getElementById('pano');

        camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 1100 );
        camera.target = new THREE.Vector3( 0, 0, 0 );

        scene = new THREE.Scene();
        scene.add( camera );

        try 
        {
            var isWebGL = !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
        }
        catch(e){ console.error(e); }

        renderer = new THREE.WebGLRenderer();
        renderer.autoClearColor = false;
        renderer.setSize( window.innerWidth, window.innerHeight );

        var faces = 50,
            initTex = THREE.ImageUtils.loadTexture( 'placeholder.png' );
        initTex.wrapS = initTex.wrapT = THREE.RepeatWrapping;
        initTex.repeat.set( 30, 30 );
        mesh = new THREE.Mesh( new THREE.SphereGeometry( 500, 60, 40 ), new THREE.MeshBasicMaterial( { map: initTex } ) );
        mesh.doubleSided = true;
        scene.add( mesh );

        container.appendChild( renderer.domElement );

        $(container).on( 'mousedown', onContainerMouseDown );
        $(container).on( 'mousemove', onContainerMouseMove );
        $(container).on( 'mouseup', onContainerMouseUp  );
        
        window.addEventListener( 'resize', onWindowResized, false );

        onWindowResized( null );

        navigator.pointer = navigator.pointer || navigator.webkitPointer || navigator.mozPointer;  

        loader.onProgress = function( p ) 
        {
            setProgress( p );
        };

        loader.onPanoramaData = function( result ) 
        {
            showProgress();
        };

        loader.onNoPanoramaData = function( status ) 
        {
            console.error("Could not retrieve panorama for the following reason: " + status);
            var pos = randomLocations[ Math.floor( Math.random() * randomLocations.length ) ];
            loader.load( new google.maps.LatLng(pos.lat, pos.lng) );
        };

        loader.onPanoramaLoad = function() 
        {
            mesh.material.map = new THREE.Texture( this.canvas ); 
            mesh.material.map.needsUpdate = true;
            $('footer span').text('The images are ' + this.copyright);
        };

        loader.setZoom( 3 );
        loader.load( new google.maps.LatLng( pos.lat, pos.lng ) ); 
        animate();
    }

    function onWindowResized( event ) 
    {
        renderer.setSize( container.clientWidth, container.clientHeight );
        camera.projectionMatrix = THREE.Matrix4.makePerspective( fov, container.clientWidth / container.clientHeight, 1, 1100 );
    }

    var isUserInteracting = false;
    var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

    function onContainerMouseDown( event ) 
    {
        event.preventDefault();

        isUserInteracting = true;

        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;

        onPointerDownLon = lon;
        onPointerDownLat = lat;
    }

    function onContainerMouseMove( event ) 
    {
        event.preventDefault();

        lookSpeed = .15;
        var f = fov / 500;
        if( navigator.pointer && navigator.pointer.isLocked ) 
        {
            position.x -= event.webkitMovementX * f;
            position.y += event.webkitMovementY * f;
        } 
        else if ( document.mozPointerLockElement == container )
        {
            if( Math.abs( event.mozMovementX ) < 100 || Math.abs( event.mozMovementY ) < 100 ) 
            { 
                position.x += event.mozMovementX * f;
                position.y -= event.mozMovementY * f;
            }
        } 
        else 
        {
            if ( isUserInteracting ) 
            {
                var dx = ( onPointerDownPointerX - event.clientX ) * f;
                var dy = ( event.clientY - onPointerDownPointerY ) * f;
                position.x = dx + onPointerDownLon; 
                position.y = dy + onPointerDownLat;
            }
        }
    }

    function onContainerMouseUp( event ) 
    {
        event.preventDefault();
        isUserInteracting = false;
    }
    
    var panoramas = [];
    var circle = null;
    var copyright;

    function animate() 
    {
        requestAnimationFrame( animate );
        render();
    }

    var ellapsedTime;

    function render() 
    {
        var cd = new Date();
        ctime = cd.getTime();

        ellapsedTime = ( ctime - time );
        ellapsedFactor = ellapsedTime / 16;

        var olon = lon, olat = lat;
        var s = .15 * ellapsedFactor;
        lon = lon + ( position.x - olon ) * s;
        lat = lat + ( position.y - olat ) * s;

        lat = Math.max( - 85, Math.min( 85, lat ) );
        phi = ( 90 - lat ) * Math.PI / 180;
        theta = lon * Math.PI / 180;

        camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
        camera.target.y = 500 * Math.cos( phi );
        camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );
        camera.lookAt( camera.target );
        if( !isUserInteracting ) mesh.rotation.y += 0.0001;
        renderer.render( scene, camera );

        time = ctime;
    }

    var wid;
    if( navigator.geolocation )
        wid = navigator.geolocation.watchPosition(initialize, initialize, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    finit = setTimeout(function()
    { 
        navigator.geolocation.clearWatch(wid); 
        initialize(false); 
    }, 6000);
    
});
