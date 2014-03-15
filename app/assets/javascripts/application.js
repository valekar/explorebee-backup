// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//


//=require jquery_ujs
//=require jquery-ui

//= require angular-route
//=require angular-cookies
//= require angular-resource
//=require angular-sanitize

//= require ng-rails-csrf
//=require minifiedVendor/ngProgress
//=require minifiedVendor/angular-file-upload
//=require minifiedVendor/angular-file-upload-shim.min
//=require minifiedVendor/ng-infinite-scroll

//=require minifiedVendor/jquery.jscrollpane.min
//=require minifiedVendor/jquery.mousewheel

//= require minifiedVendor/jquery.tokeninput
//= require minifiedVendor/foundation.min
//=require minifiedVendor/placeholder



//=require minifiedVendor/angular.ratings

//= require masonry/jquery.masonry





//=require_directory ./production







$(function(){ $(document).foundation({
    orbit: {
        animation: 'fade',
        timer_speed: 5000,
        pause_on_hover: false,
        animation_speed: 1000,
        navigation_arrows: false,
        bullets: false,
        resume_on_mouseout:false
    }
});


       // $('.scrollable').jScrollPane();




});


