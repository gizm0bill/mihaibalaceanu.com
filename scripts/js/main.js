requirejs.config
({
    waitSeconds: 60,
    baseUrl: 'scripts/js/lib',
    tmplPath: '../../../templates/',
    stylePath: '../../../styles/css',
    paths: 
    {
        'app': '../app',
        'tmpl': 'require/tmpl',
        'css': 'require/css',
        'async': 'require/async'
    },
    shim: 
    {
        'backbone': { deps: ['underscore', 'jquery'], exports: 'Backbone' },
        'underscore': { exports: '_' },
        'GSVPano': { deps: ['async!https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false'] }
    }
});

require(['mobile-detect'], function(isMobile){ require([ isMobile ? 'app/indexm' : 'app/index']); });
