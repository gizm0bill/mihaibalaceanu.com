define
({
    load: function (name, require, load, config) 
    {
        if( !config.stylePath ) throw 'No stylesheet path defined';
        function inject(filename)
        {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.href = filename;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
        }
        var np = name.split('.');
        inject(requirejs.toUrl(config.stylePath.replace(/\/$/, '')+'/'+name+(np[1]?'':'.css')));
        load(true);
    }
});