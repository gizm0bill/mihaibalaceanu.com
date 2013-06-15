define(['jquery'], function()
{ 
    var isMobile = $('#mobile-detect').css('display') == 'none' ? true : false;
    return isMobile;
});