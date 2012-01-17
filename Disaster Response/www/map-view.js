// If you want to prevent dragging, uncomment this section
/*
 function preventBehavior(e) 
 { 
 e.preventDefault(); 
 };
 document.addEventListener("touchmove", preventBehavior, false);
 */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app
launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */
/*
 function handleOpenURL(url)
 {
 // TODO: do something with the url passed in.
 }
 */
function onBodyLoad()
{
    document.addEventListener("deviceready", onDeviceReady, false);
}
/* When this function is called, PhoneGap has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app
launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */
function onDeviceReady()
{
    var options = {
        numZoomLevels : 15 
    };
    var map = new OpenLayers.Map('map', options);
    var wms = new OpenLayers.Layer.WMS( "OpenLayers WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0", {
        layers : 'basic' 
    } );
    map.addLayer(wms);
    map.zoomToMaxExtent();
    navigator.geolocation.getCurrentPosition(function (position) 
    {
        map.setCenter({
            lon : position.coords.longitude, lat : position.coords.latitude 
        }, 2, false, true);
    },
    function (error) 
    {
        map.zoomToMaxExtent();
    },
    {
        enableHighAccuracy : true 
    });
    OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, 
    {
        defaultHandlerOptions : 
        {
            'single' : true, 'double' : false, 'pixelTolerance' : 0, 'stopSingle' : false, 'stopDouble' : false 
        },
        initialize : function (options) 
        {
            this.handlerOptions = OpenLayers.Util.extend( {}, this.defaultHandlerOptions );
            OpenLayers.Control.prototype.initialize.apply( this, arguments );
            this.handler = new OpenLayers.Handler.Click( this, {
                'click' : this.trigger 
            },
            this.handlerOptions );
        },
        trigger : function (e) 
        {
            var lonlat = map.getLonLatFromViewPortPx(e.xy);
            //alert("You clicked near " + lonlat.lat + " N, " + + lonlat.lon + " E");
            navigator.camera.getPicture(function (imageURI) 
            {
                var $thumb = $('#statusThumb');
                $thumb.children('img').attr('src', imageURI);
                $thumb.show();
					 $thumb.position({
						my:	'center',
						at:	'center',
						of:	$(window)
					 });
            },
            function () { }, 
            {
                quality : 100,
					 destinationType : Camera.DestinationType.FILE_URI,
					 // DEBUG: This should be CAMERA to force a new pic
                sourceType : Camera.PictureSourceType.SAVEDPHOTOALBUM,
					 allowEdit : false
            });
        }
    });
    var click = new OpenLayers.Control.Click();
    map.addControl(click);
    click.activate();
}
