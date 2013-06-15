define(['dust/core', 'tmpl!indexm'], function(dust)
{
    dust.render('indexm', {}, function(e, o){ $('body').html(o); });
});