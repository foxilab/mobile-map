// If you want to prevent dragging, uncomment this section
/*
 function preventBehavior(e) 
 { 
 e.preventDefault(); 
 };
 document.addEventListener("touchmove", preventBehavior, false);
 */

/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */
/*
 function handleOpenURL(url)
 {
 // TODO: do something with the url passed in.
 }
 */

/*
 * OpenLayers.Map
 */
var map;

var navSymbolizer = new OpenLayers.Symbolizer.Point({
	pointRadius : 10,
	externalGraphic : "images/15x15_Blue_Arrow.png",
	fillOpacity: 1,
	rotation: 0
});

var navStyle = new OpenLayers.StyleMap({
	"default" : new OpenLayers.Style(null, {
		rules : [ new OpenLayers.Rule({
					symbolizer : navSymbolizer
				})]
	})
});

var navigationLayer = new OpenLayers.Layer.Vector("Navigation Layer",
{
  styleMap: navStyle
});


var WGS84 = new OpenLayers.Projection("EPSG:4326");
var WGS84_google_mercator = new OpenLayers.Projection("EPSG:900913");
var maxResolution = 15543.0339;
var maxExtent = new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508);
var restrictedExtent = maxExtent.clone();

var touchNavOptions = {
dragPanOptions: {
interval: 0, //non-zero kills performance on some mobile phones
enableKinetic: true
}
};


var rotatingTouchNav = new OpenLayers.Control.TouchNavigation(touchNavOptions);

var options = {
div: "map",
projection: WGS84,
	numZoomLevels : 20,
maxResolution: maxResolution,
maxExtent: maxExtent,
restrictedExtent: restrictedExtent,
controls: [
		   rotatingTouchNav
		   ]
};

/*var gimmyHeading = 315;
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
	defaultHandlerOptions: {
		'single': true,
		'double': false,
		'pixelTolerance': 0,
		'stopSingle': false,
		'stopDouble': false
	},
					
	initialize: function(options) {
		this.handlerOptions = OpenLayers.Util.extend(
		 {}, this.defaultHandlerOptions
		);
		OpenLayers.Control.prototype.initialize.apply(
		  this, arguments
		); 
		this.handler = new OpenLayers.Handler.Click(
			this, {
				'click': this.trigger
			}, this.handlerOptions
		);
	}, 
											
	trigger: function(e) {
		//navSymbolizer.rotation += 10;
		//navigationLayer.redraw();
									
		//Rotate map
											var heading = gimmyHeading;
											var mapRotation = 360 - heading;
											var diff = (-1 * mapRotation) - map.events.rotationAngle;
											if(diff > -180)
											$("#map").animate({rotate: mapRotation + 'deg'}, 1000);
											else
											$("#map").animate({rotate: (-1 * heading) + 'deg'}, 1000);
											
											map.events.rotationAngle = -1 * mapRotation;
											gimmyHeading = 90;
	}
										
});*/


function onBodyLoad()
{		
	document.addEventListener("deviceready", onDeviceReady, false);
}

var geolocationSuccess = function(position){
	var lon = position.coords.longitude;
	var lat = position.coords.latitude;
	
	var currentPoint = new OpenLayers.Geometry.Point(lon, lat).transform(WGS84, WGS84_google_mercator);
	var currentPosition = new OpenLayers.Feature.Vector(currentPoint);
	
	navigationLayer.removeAllFeatures();
	navigationLayer.addFeatures([currentPosition]);
	
	map.setCenter(new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude)
				  .transform(WGS84, WGS84_google_mercator), 17);
}

var geolocationError = function(error){
	//error handling
}

var compassSuccess = function(heading){
	//Rotate arrow
	/*navSymbolizer.rotation = heading.magneticHeading;
	navigationLayer.redraw();*/
	
	//Rotate map
	var heading = heading.magneticHeading;
	var mapRotation = 360 - heading;
	var diff = (-1 * mapRotation) - map.events.rotationAngle;
	if(diff > -180)
		$("#map").animate({rotate: mapRotation + 'deg'}, 1000);
	else
		$("#map").animate({rotate: (-1 * heading) + 'deg'}, 1000);
	
	map.events.rotationAngle = -1 * mapRotation;
}

var compassError = function(error){
	//error handling
	if(error.code == CompassError.COMPASS_INTERNAL_ERR)
		alert("compass internal error");
	else if(error.code == CompassError.COMPASS_NOT_SUPPORTED)
		alert("compass not supported");
	
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */
function onDeviceReady()
{
	// do your thing!
	var docHeight = $(window).height();
	var headerHeight = $("#header").height();
	var footerHeight = $("#footer").height();
	var mapHeight = docHeight - headerHeight - footerHeight - 50;
	
	var mapContainer = $("#mapContainer");
	mapContainer.height(mapHeight +"px");
	var mapDiv = $("#map");
	mapHeight = mapHeight*1.7;
	mapDiv.height(mapHeight+"px");
	mapDiv.width(mapHeight+"px");

	var mapLeftPosition = -1 * (mapDiv.width()-mapContainer.width()) / 2;
	var mapTopPosition = -1 * (mapDiv.height()-mapContainer.height()) / 2;
	mapDiv.css('top', mapTopPosition);
	mapDiv.css('left', mapLeftPosition);
	
	map = new OpenLayers.Map(options);
	map.events.mapSideLength = mapHeight;
	
	var mapLayerOSM = new OpenLayers.Layer.OSM();
	map.addLayers([mapLayerOSM, navigationLayer]);
	
	navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, 
	{
		enableHighAccuracy: true,
		maximumAge: 3000
	});
	
	var compassOptions = {
		frequency: 3000
	};
	
	//navigator.compass.watchHeading(compassSuccess, compassError, compassOptions);
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
	
	var zoomPanel = new OpenLayers.Control.ZoomPanel({div: document.getElementById("zoomPanel")});
	map.addControl(zoomPanel);
	var zoomRight = .05 * mapHeight;
	$("#zoomPanel").css("right", "5%");
	$("#zoomPanel").css("bottom", zoomRight + "px");
	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();
}