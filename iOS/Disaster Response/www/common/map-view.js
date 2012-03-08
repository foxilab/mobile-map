var GoogleApi = new function() {
	this.key = function () { return 'AIzaSyClELEF3P8NDUeGkiZg0qSD1I_mIejPDI0'; }
}
// Fusion Table Stuff
var FusionServer = new function () {
	// TODO: point this to the hosted web server
	this.url = function () { return 'http://findplango.com:8080/DSI/rest/fusion'; }
};
var FusionTableId = new function () {
	this.statusref = function () { return '1IhAYlY58q5VxSSzGQdd7PyGpKSf0fhjm7nSetWQ'; };
	this.locations  = function() { return '1G4GCjQ21U-feTOoGcfWV9ITk4khKZECbVCVWS2E'; };
	this.locationsID = function() { return '2749284'; };
}

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
var heatmapLayer;
var screenLocked = true;
var orientationHeadingOffset = 0;

//var fusionLayer_Locations_Icons;
//var fusionLayer_Locations_HeatMap;

//PLUGIN VARIABLES
//  NativeControl Variables
var nativeControls;

//PHONE VARIABLES
var isAppPaused = false;
var isInternetConnection = false;
var isLandscape = false;
//Badges
var itemsInQueue = 0;
var appNotifications = 0;
//App
var isAutoPush = false; 

var centered = false;
var locatedSuccess = true;

var wasPopupOpen = false;
var wasPopupClosed = false;

// ============================
//    Resolution per level
// ============================
//  01 .... 78271.51695 
//  02 .... 39135.758475 
//  03 .... 19567.8792375 
//  04 .... 9783.93961875 
//  05 .... 4891.969809375 
//  06 .... 2445.9849046875 
//  07 .... 1222.99245234375 
//  08 .... 611.496226171875 
//  09 .... 305.7481103859375 
//  10 .... 152.87405654296876 
//  11 .... 76.43702827148438 
//  12 .... 38.21851413574219 
//  13 .... 19.109257067871095 
//  14 .... 9.554628533935547 
//  15 .... 4.777314266967774 
//  16 .... 2.388657133483887 
//  17 .... 1.1943285667419434 
//  18 .... 0.5971642833709717
// ============================

var WGS84 = new OpenLayers.Projection("EPSG:4326");
var WGS84_google_mercator = new OpenLayers.Projection("EPSG:900913");
var maxExtent = new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508);
var restrictedExtent = maxExtent.clone();
var maxResolution = 78271.51695;
var iconMaxResolution = 4.777314266967774;
//var photoguid;
var cameraORvideoPopup;
var LocationPopup;
var clickedLonLat;

var positionUnlockedImage = "css/images/PositionUnlocked.png";
var positionLockedImage = "css/images/PositionLocked.png";

var navSymbolizer = new OpenLayers.Symbolizer.Point({
	pointRadius : 25,
    externalGraphic : positionUnlockedImage,
	fillOpacity: 1,
	rotation: 0
});

var statusSymbolizer = new OpenLayers.Symbolizer.Point({
    pointRadius : 10,
    fillColor: "${status}",
    strokeColor: "${status}",
    fillOpacity: 0.4,
    rotation: 0
});

var navStyle = new OpenLayers.StyleMap({
	"default" : new OpenLayers.Style(null, {
		rules : [ new OpenLayers.Rule({
					symbolizer : navSymbolizer
				})]
	})
});

var statusStyle = new OpenLayers.StyleMap({
    "default" : new OpenLayers.Style(null, {
       rules : [ new OpenLayers.Rule({
                    symbolizer : statusSymbolizer
               })]
    })
});

var navigationLayer = new OpenLayers.Layer.Vector("Navigation Layer", {
    styleMap: navStyle
});

var statusLayer = new OpenLayers.Layer.Vector("Status Layer", {
    styleMap: statusStyle,
	displayProjection: WGS84,
	projection: WGS84_google_mercator,
	maxResolution: iconMaxResolution,
	minResolution: "auto"
});

var statusSaveStrategy = new OpenLayers.Strategy.Save();
var statusWFSLayer = new OpenLayers.Layer.Vector("Status Layer", {
    strategies: [new OpenLayers.Strategy.BBOX(), statusSaveStrategy],
    protocol: new OpenLayers.Protocol.WFS({
       version: "1.1.0",
       srsName: "EPSG:4326",
       url: "findplango.com:8080/geoserver/wfs",
       featureNS: "http://lmnsolutions.com/DisasterResponse",
       featureType: "location_statuses",
       geometryName: "the_geom",
       schema: "http://findplango.com:8080/geoserver/wfs/DescribeFeatureType?version=1.1.0&typename=DisasterResponse:location_statuses"
    }),
    visibility: false
});

var touchNavOptions = {
	dragPanOptions: {
		interval: 0, //non-zero kills performance on some mobile phones
		enableKinetic: true
	}
};

var oldRotation = 0;
var rotatingTouchNav = new OpenLayers.Control.TouchNavigation(touchNavOptions);

var options = {
	div: "map",
	projection: WGS84_google_mercator,
	displayProjection: WGS84,
	numZoomLevels : 20,
	maxResolution: maxResolution,
	maxExtent: maxExtent,
	allOverlays: true,
	restrictedExtent: restrictedExtent,
	controls: [
		   rotatingTouchNav
	]
};

//Fusion Layer Variables (Building Icons) 
var fusionSymbolizer = new OpenLayers.Symbolizer.Point({
		pointRadius : 15,
		externalGraphic : "${image}",
		fillOpacity: 1,
		rotation: 0
});
													   
var fusionStyle = new OpenLayers.StyleMap({
		"default" : new OpenLayers.Style(null, {
			rules : [ new OpenLayers.Rule({
				symbolizer : fusionSymbolizer})]
			})
});

var fusionLayer = new OpenLayers.Layer.Vector("Fusion Layer", {
		styleMap: fusionStyle,
		displayProjection: WGS84,
		projection: WGS84_google_mercator,
		maxResolution: iconMaxResolution,
		minResolution: "auto"
});

var fusionLayer_IsVisible = true;

//Heatmap Variables
var heatmapGradient = {
	0.05: "rgb(128,128,128)", 
	0.25: "rgb(0,255,0)", 
	0.50: "rgb(255,255,0)",
	0.90: "rgb(255,165,0)", 
	1.00: "rgb(255,0,0)"
};

var heatmap_IsVisible = true;
var heatmapLayer_IsVisible = false;
var heatmapToggle_IsVisible = false;

function onBodyLoad() {
	document.addEventListener("deviceready", onDeviceReady, false);
}

var geolocationSuccess = function(position) {
	var lon = position.coords.longitude;
	var lat = position.coords.latitude;
	
    if(map) {
        var currentPoint = new OpenLayers.Geometry.Point(lon, lat).transform(WGS84, WGS84_google_mercator);
        var currentPosition = new OpenLayers.Feature.Vector(currentPoint);
        
        if(navigationLayer.features.length > 0)
			navigationLayer.features[0].move(new OpenLayers.LonLat(lon, lat).transform(WGS84, WGS84_google_mercator));
		else
			navigationLayer.addFeatures([currentPosition]);
        
        if(!centered) {
            map.setCenter(new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude)
                          .transform(WGS84, WGS84_google_mercator), 17);
            
            centered = true;
        }
    }
    
    locatedSuccess = true;
    //iPhone Quirks
    //  position.timestamp returns seconds instead of milliseconds.
};

var geolocationError = function(error) {
    
    if(locatedSuccess) {
        //error handling
        if(error == PositionError.PERMISSION_DENIED)
            navigator.notification.alert("Location permission denied", function(){}, 'Error', 'Okay');
        else if(error == PositionError.POSITION_UNAVAILABLE)
            navigator.notification.alert("Location unavailable", function(){}, 'Error', 'Okay');
        /*else
            navigator.notification.alert("Location timeout", function(){}, 'Error', 'Okay');*/
        
        if(navigationLayer.features.length == 0) {
            var lon = -77.020000;
            var lat = 38.890000;
            
            var currentPoint = new OpenLayers.Geometry.Point(lon, lat).transform(WGS84, WGS84_google_mercator);
            var currentPosition = new OpenLayers.Feature.Vector(currentPoint);
            
			if(navigationLayer.features.length == 0) {
				navigationLayer.addFeatures([currentPosition]);
				map.setCenter(new OpenLayers.LonLat(lon, lat)
                          .transform(WGS84, WGS84_google_mercator), 2);
			}
        }
        
        locatedSuccess = false;
    }
    
};

var compassSuccess = function(heading) {
	//Rotate arrow
	/*navSymbolizer.rotation = heading.magneticHeading;
	navigationLayer.redraw();*/
	var heading = (heading.magneticHeading + orientationHeadingOffset) % 360;
	var mapRotation = 360 - heading;
	
	//Rotate map
	if(!screenLocked) {
		$("#map").animate({rotate: mapRotation + 'deg'}, 1000);
		$("#northIndicator").animate({rotate: mapRotation + 'deg'}, 1000);
		
		map.events.rotationAngle = -1 * mapRotation;
	}else {
		//navSymbolizer.rotation = mapRotation;
		navSymbolizer.rotation = heading;
		navigationLayer.redraw();
	}
};

var compassError = function(error) {
	//error handling
/*	if(error.code == CompassError.COMPASS_INTERNAL_ERR)
        navigator.notification.alert("compass internal error", function(){}, 'Error', 'Okay');
	else if(error.code == CompassError.COMPASS_NOT_SUPPORTED)
        navigator.notification.alert("compass not supported", function(){}, 'Error', 'Okay');
*/
};

function googleSQL(sql, type, success, error) {
	// TODO: we could actually figure this out without a type argument by inspecting the SQL string
	var http_type = 'GET';
	if (type) {
		http_type = type;
	}

	$.ajax({
		type:		http_type,
		url:		FusionServer.url(),
		data:		{
			sql:	sql
		},
		success:	function(data, status, xhr) {
			if (success) {
				success.call(null, data, status, xhr);
			}
		},
		error:	function(xhr, status, err) {
			if (error) {
				error.call(null, xhr, status, err);
			}
		}
	});
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */

function mediaUploadSuccess(response) {
	console.log('media upload success');
	//console.log(response.response);
}

function mediaUploadFailure(response) {
	console.log('media upload error');
	//console.log(response.response);
}

function mimeTypeFromExt(filepath) {
	var extensionIndex = filepath.lastIndexOf(".");
	var extension = filepath.substr(extensionIndex+1).toLowerCase();
	var mime = null;

	if (extension == "mov")
		mime = "video/quicktime";
	else if (extension == "wav")
		mime = "audio/wav";
	else if (extension == "mp3")
		mime = "audio/mpeg";
	else if (extension == "jpg" || extension == "jpeg")
		mime = "image/jpeg";
	else if (extension == "png")
		mime = "image/png";
	else
		mime = "none/none"; //prevent errors
		
	return mime;
}

function uploadFileToS3(filepath, photoguid) {
	var mimeType = mimeTypeFromExt(filepath);

	var policy = {
		"expiration": "2012-12-01T12:00:00.000Z",
		"conditions": [
			{"bucket":			"mobileresponse"},
			["starts-with",	"$key", "user/kzusy/"],
			{"acl":				"public-read" },
			{"Content-Type":	mimeType}
		]
	};

	var encodedPolicy = $.base64.encode(JSON.stringify(policy));
	var secret = "snPtA2XuMhDBoJM9y0Sx8ILGnYAnPh5FfCwFpbIu";
	var hmac = Crypto.HMAC(Crypto.SHA1, encodedPolicy, secret, { asString: true });
	var signature = $.base64.encode(hmac);
	var extensionIndex = filepath.lastIndexOf(".");
	var extension = filepath.substr(extensionIndex).toLowerCase();
	
	var params = {
		key:					"user/kzusy/" + photoguid + extension,
		bucket:				"mobileresponse",
		AWSAccessKeyId:	"AKIAJPZTPJETTBZ5A5IA",
		policy:				encodedPolicy,
		acl:					"private",
		signature:			signature,
		acl:					"public-read",
		"Content-Type":	mimeType
	};

	var options = new FileUploadOptions();
	options.mimeType = mimeType;
	options.fileKey = "file";
	options.fileName = filepath.substr(filepath.lastIndexOf('/')+1);
	options.params = params;

	var ft = new FileTransfer();
	var url = 'http://mobileresponse.s3.amazonaws.com';
	ft.upload(filepath, url, mediaUploadSuccess, mediaUploadFailure, options);
}

/*
 		==============================================
		 			HeatMap and Icons
 		==============================================
 */
function onMapMoveEnd(_event) {
	//Close all popups or just some?
	if(selectedFeature)
		selectControl.unselect(selectedFeature);

	//The map bounds has changed...get the bounds and convert it
	var bounds = map.getExtent();
	var leftBottom = new OpenLayers.LonLat(bounds.left,bounds.bottom).transform(map.projection, map.displayProjection);
	var rightTop= new OpenLayers.LonLat(bounds.right,bounds.top).transform(map.projection, map.displayProjection);
	
	//Generate the SQL
	var sql = "SELECT Location,Name,Status,Date,MediaURL FROM " + FusionTableId.locations() + 
		" WHERE ST_INTERSECTS(Location, RECTANGLE(LATLNG("+leftBottom.lat+","+leftBottom.lon+"), "+
		"LATLNG("+rightTop.lat+","+rightTop.lon+"))) ORDER BY Date DESC";
	
	//Display the correct layer depending on the resolution
	if(map.getResolution() <= iconMaxResolution) {
		//Display the icons, but hide the heatmap
		turnFusionLayerOn();
		turnHeatMapToggleButtonOff();
	} else {
		//STOP! Heatmap time!
		turnFusionLayerOff();
		turnHeatMapToggleButtonOn();
	}
			
	//With the bounds and SQL, query the Fusion Table for the features.
	googleSQL(sql, 'GET', fusionSQLSuccess);
}

//----------------------------------------------------

function turnHeatMapToggleButtonOn() {
		$('#heatmapLock').show();
		heatmapToggle_IsVisible = true;
		
		//if the heatmap should be visible, show it
		if(heatmap_IsVisible == true)
			turnHeatMapLayerOn();
			
		setHeatMapToggleIcon();
}

function turnHeatMapToggleButtonOff() {

		$('#heatmapLock').hide();
		heatmapToggle_IsVisible = false;
		
		//If this button goes away, that means the heatmap layer cannot be seen.
		// turn off ALL the things
		turnHeatMapLayerOff();
}

function setHeatMapToggleButtonVisibility(_visible) {
	if(_visible == true)
		turnHeatMapToggleButtonOn();
	else
		turnHeatMapToggleButtonOff();
}

function heatMapToggleButton_Click() {

	heatmap_IsVisible = !heatmapLayer_IsVisible;
	setHeatMapToggleIcon();
	toggleHeatMapLayer();
}

function setHeatMapToggleIcon() {
	if(heatmap_IsVisible == true) {
		$('#heatmapLock').attr('data-icon','glyphish-chat-2');			//RADIO GooGoo
		$("#heatmapLock span.ui-icon").addClass("ui-icon-radio-on").removeClass("ui-icon-radio-off")
	} else {
		$('#heatmapLock').attr('data-icon','glyphish-chat');			//RADIO GaGa
		$("#heatmapLock span.ui-icon").addClass("ui-icon-radio-off").removeClass("ui-icon-radio-on")
	}
}

//----------------------------------------------------

function toggleHeatMapLayer() {
	heatmapLayer_IsVisible = !heatmapLayer_IsVisible;
	heatmapLayer.toggle();
}

function turnHeatMapLayerOn() {
		heatmapLayer_IsVisible = true;
		heatmapLayer.show();
}

function turnHeatMapLayerOff() {
		heatmapLayer_IsVisible = false;
		heatmapLayer.hide();
}

function setHeatMapLayerVisibility(_visible) {
	if(_visible == true)
		turnHeatMapLayerOn();
	else
		turnHeatMapLayerOff();
}

//----------------------------------------------------

function toggleFusionLayer() {
	setFusionLayerVisibility(!fusionLayer_IsVisible);
}

function turnFusionLayerOn() {
	setFusionLayerVisibility(true);
}

function turnFusionLayerOff() {
	setFusionLayerVisibility(false);
}

function setFusionLayerVisibility(_visible) {
	fusionLayer_IsVisible = _visible;
	fusionLayer.setVisibility(fusionLayer_IsVisible);
}

/*
 		==============================================
							PopUps
 		==============================================
 */

var popupFeature = null;
var popupFeatureMain = null;
var selectedFeature = null;
function createLocationPopup(_feature) {
	//Move B, get out da way: Hide the cameraOrvideoPopup to avoid position errors.
	closeAllPopups();
	
	selectedFeature = _feature;

	if (!LocationPopup.is(':visible')) {
		//Variables for local use/quick access/shorter code
		var featureSize = _feature.attributes.locations.length;
		popupFeature = _feature.attributes.locations;
		popupFeatureMain = popupFeature[0];
			var locName 	= popupFeatureMain.name;
			var locMedia 	= popupFeatureMain.media;
			var locStatus	= popupFeatureMain.status;
			var locDate 	= popupFeatureMain.date;
			var locLat 		= popupFeatureMain.lat;
			var locLon 		= popupFeatureMain.lon;
			var precision	= 5;
			
		var $locationImage = $('#locationImage');
		var $locationName = $('#locationName');
		var $locationDate = $('#locationDate');
		var $locationLonlat = $('#locationLonlat');
		
		var stacked = false;
		//If there are not multiple status for this location
		if(featureSize <= 1) {
			$('#locationImageStack').hide();	//hide ALL the things
			$locationImage.attr('class', 'locImage');
		}
		else {
			$('#locationImageStack').show();	//Otherwise show ALL the things
			$locationImage.attr('class', 'locImageMultiple');
			stacked = true;
		}
		
		//Check to see the media type
		var mime = mimeTypeFromExt(locMedia);

		if (mime) {
			var fileType = mime.substr(0, mime.indexOf('/'));
		
			//If there is internet, use data from online
			if(isInternetConnection == true) {
				if(fileType == "video") {
				
					if(!stacked) {
						$locationImage.hide();
						$('#embedded-audio').hide();

						var $div = $('#embedded-video');
						var $video = $div.find('video');
						$video.attr('src', locMedia);
						$div.show();
					} else {
						$('#embedded-audio').hide();
						$('#embedded-video').hide();
						
						$locationImage.attr('src', "Popup/Video.png");
						$locationImage.attr('alt', "Video of " + locName + ".").show();
					}
				}
				else if(fileType == "audio") {
				
					if(!stacked) {
						$locationImage.hide();
						$('#embedded-video').hide();
					
						var $div = $('#embedded-audio');
						var $audio = $div.find('audio');
						$audio.attr('src', locMedia);
						$div.show();
					} else {
						$('#embedded-audio').hide();
						$('#embedded-video').hide();
						
						$locationImage.attr('src', "css/images/speaker.png");
						$locationImage.attr('alt', "Audio recorded at " + locName + ".").show();
					}
				}
				else if(fileType ==  "image") {
					$('#embedded-audio').hide();
					$('#embedded-video').hide();
					
					$locationImage.attr('src', locMedia);
					$locationImage.attr('alt', "Image taken of " + locName + ".").show();
				}
			}
			//Otherwise use defaults
			else {
				$('#embedded-audio').hide();
				$('#embedded-video').hide();
			
				if(fileType == "video") {
					$locationImage.attr('src', "Popup/Video_Offline.png");
					$locationImage.attr('alt', "Video of "+locName+", currently unavailable.").show();
				}
				else if(fileType == "audio") {
					$locationImage.attr('src', "Popup/Audio_Offline.png");
					$locationImage.attr('alt', "Audio recorded at "+locName+", currently unavailable.").show();
				}
				else if(fileType ==  "image") {
					$locationImage.attr('src', "Popup/Image_Offline.png");
					$locationImage.attr('alt', "Image taken of "+locName+", currently unavailable.").show();
				}
				$locationImage.show();
			}
		}
		else {
			$('#embedded-audio').hide();
			$('#embedded-video').hide();
					
			document.getElementById("locationImage").src = "Popup/FileNotSupported.png";
			document.getElementById("locationImage").alt = "This file type is not supported.";
			$locationImage.show();
		}
		//Set the rest of the data here:
		// If the feature has more then 1 status, add the number to the end of the name.
		if(featureSize <= 1)
			document.getElementById("locationName").innerHTML = locName;
		else
			document.getElementById("locationName").innerHTML = locName + " (" + featureSize + ")";

		LocationPopup.css('border', '2px solid ' + getStatusColor(locStatus));
		$('#locationDate').attr('datetime', locDate).text($.timeago($.format.date(locDate, "yyyy-MM-dd hh:mm:ss a")));
		//$('#locationLonlat').text(locLat.toFixed(precision) + ", " + locLon.toFixed(precision));
	}
	LocationPopup.toggle();
	LocationPopup.trigger('updatelayout');
	LocationPopup.position({
		my:	'center',
		at:	'center',
		of:	$('#map')
	});
}

function destroyLocationPopup(_feature) {
	// Stop playing any audio or video
	var $audio = LocationPopup.find('audio');
	var $video = LocationPopup.find('video');
	if ($video.is(':visible')) {
		$video.get(0).pause();
	}
	else if ($audio.is(':visible')) {
		$audio.get(0).pause();
	}

	LocationPopup.hide();
	popupFeature = null;
	popupFeatureMain = null;
	selectedFeature = null;
	
	//Clear out the div's
	document.getElementById("locationImage").src = "Popup/FileNotSupported.png";
	document.getElementById("locationImage").alt = "Nothing set for this location.";
}

function showStatusesDialog() {

	for(var i = 0; i < popupFeature.length; i++) {
		//clone the archetype
		var $clone = $('#multiStatus-list-item-archetype').clone();	
		$clone.removeAttr('id');
	
		var type = mimeTypeFromExt(popupFeature[i].media);
		type = type.substr(0, type.indexOf('/'));
	
		if (type == "image") {
			$clone.find('img').attr('src', popupFeature[i].media);
		}
			else if (type == "audio") {
				$clone.find('img').attr('src', 'css/images/glyphish/66-microphone.png');
				$clone.find('img').addClass('ui-li-icon');
			}
			else if (type == "video") {
				// TODO: maybe we should get a thumbnail and put the play button in the middle?
				$clone.find('img').attr('src', 'css/images/glyphish/45-movie-1.png');
				$clone.find('img').addClass('ui-li-icon');
			}
		else {
			// Should be impossible to get here
			console.log('unsupported media type in addToQueueDialog');
			return;
		}
	
		if (popupFeature[i].name) {
			$clone.find('h3').text(popupFeature[i].name);
		}
	
		if (popupFeature[i].status >= 1) {
			$clone.find('p').text(popupFeature[i].date + " - " + StatusRef.fromId(popupFeature[i].status).toString());
		}
	
		$('#multiStatus-dialog ul').append($clone);
		$clone.trigger('create').show();
	}
	
	
	$.mobile.changePage('#multiStatus-dialog', 'pop');
}

function closeAllPopups() {
	if(selectedFeature) {
		selectControl.unselect(selectedFeature); //Removes the LocationPopup
		wasPopupClosed = true;
	}
	if(cameraORvideoPopup.is(':visible')) {
		cameraORvideoPopup.hide();	 //Removes the CameraOrVideoPopup
		wasPopupClosed = true;
	}
	if($('#filterPopup').is(':visible')) {
		$('#filterPopup').hide();
		wasPopupClosed = true;
	}
}

function closeAllPopups_NoToggle() {
	if(selectedFeature) {
		selectControl.unselect(selectedFeature); //Removes the LocationPopup
	}
	if(cameraORvideoPopup.is(':visible')) {
		cameraORvideoPopup.hide();	 //Removes the CameraOrVideoPopup
	}
	if($('#filterPopup').is(':visible')) {
		$('#filterPopup').hide();
	}
}

function arePopupsOpen() {
	var open = false;
	
	if(selectedFeature)
		open = true;
	if(cameraORvideoPopup.is(':visible'))
		open = true;
	if($('#filterPopup').is(':visible'))
		open = true;
	
	return open;
}

function hideStatusesDialog() {
	$('#multiStatus-dialog li').not('#multiStatus-list-item-archetype').remove();
}

function locationPopup_onImageClick() {
	//We have popupFeature, this variable holds the current feature
	// now we can pull data and display 
	//Variables for local use/quick access/shorter code
		var locName 	= popupFeatureMain.name;
		var locMedia 	= popupFeatureMain.media;
		var locStatus	= popupFeatureMain.status;
		var locDate 	= popupFeatureMain.date;
		var locLan 		= popupFeatureMain.lan;
		var locLon 		= popupFeatureMain.lon;
	
	//If this image is clicked, we need to do one of 2 things: If the image is a...
	//  1) Image 2) Video file, open it for the user.
	
	//Check to see the media type
	var fileType = mimeTypeFromExt(locMedia);
	fileType = fileType.substr(0, fileType.indexOf('/'));

	//Now that we know what type we have, open a new window for the user to view
	if(fileType == "video") {
		//launch the video
		navigator.notification.alert('Date: ' + locDate + '.', function(){}, locName, 'Video');
	}
	else if(fileType ==  "image") {
		$.mobile.changePage('#image-viewer');
	}
	else {
		//Sould be impossible to get here...so congratulations?!
		navigator.notification.alert('Media type not supported.', function(){}, 'Error', 'Okay');
	}
}

//Given a row from the fusionSQL call, create a location object
function getDataFromFusionRow(_row) {
	//Take the information and split it 
		var locationDataSplit = _row.split(",");
		var nameBugFixSplit = _row.split('"');
	
	//Gathering intel..., stay frosty
	//{
		var lat = parseFloat(locationDataSplit[0].substr(1, locationDataSplit[0].length));
		var lon = parseFloat(locationDataSplit[1].substr(0, locationDataSplit[1].length-1));	
		
		//If the name contains a ',' this method breaks. But there is an easy fix.
		var name; var positon = 2;
		if(locationDataSplit[2][0] == '"')			//Check to see if there is an issue:
			name = nameBugFixSplit[(positon+=1)];	//If so, increase the positon.
		else
			name = locationDataSplit[positon];		//Otherwise continue like normal.
			
		var status = parseInt(locationDataSplit[(positon+=1)]);
		var date = locationDataSplit[(positon+=1)];
		var media = locationDataSplit[(positon+=1)];
	//}
	
	//#BUGFIX 44
	// The date is left in UTC/GMT for the main server, but it's converted to the users local time
	// when pulled. This code formats it and converts it to the correct timezone.
	var dateFormated = $.format.date(date, "ddd, dd MMM yyyy HH:mm:ss UTC");
	var dateConverted = new Date(dateFormated);
	
	//Build a location
	var location = {
			name: name,
			position: nameBugFixSplit[1],
			lat: lat,
			lon: lon,
			status: status,
			date: dateConverted,
			media: media
	};
	
	return location;
}

function fusionSQLSuccess(data) {

	var rows = $.trim(data).split('\n');
	var length = rows.length;
	
	var locationArray = [];
	locationArray.length = 0;
	var exists = false;
		
	//With the data, we want to split it up and get it into a format we can use
	//	start at 1, rows[0] is our column titles.
	for(var i = 1; i < length; i++) {
		var location = getDataFromFusionRow(rows[i]);
			exists = false;
		
		//Before we add anything to the list, lets check to see if we it fits our
		// search filters
		if(shouldAddToLayer(location) == true) {
			//Now that we have our location, loop through and find out if it already exists.
			for(var locA = 0; locA < locationArray.length; locA++) {
				for(var loc = 0; loc < locationArray[locA].length; loc++) {
			
					//If the positions are the same, these are the same place
					if(locationArray[locA][loc].position == location.position) {
						//So add the location to this spot in the locationArray
						locationArray[locA].push(location);
						exists = true;
						break;	//Okay we are done here.
					}
				}
			}
		
			//Does it exist?
			if(exists == false) {
				locationArray.push([location]);
			}
		}
	}
	
	//Parse ALL the data!!
	parseSQLSuccess_Icons(locationArray);
	parseSQLSuccess_Heatmap(locationArray);
}

function parseSQLSuccess_Icons(_locationArray) {
	//Only do this if the icons are visible
	if(fusionLayer_IsVisible == true) {
		//We got our new data set, remove all the old features.
		fusionLayer.removeAllFeatures();
		
		//Lets loop through the whole array
		for(var locA = 0; locA < _locationArray.length; locA++) {
				//The newest location (used for GUI)
					var newestLocation = _locationArray[locA][0];
					
				//convert the lat and lon for display
					var lonlat = new OpenLayers.LonLat(newestLocation.lon,newestLocation.lat).transform(map.displayProjection, map.projection);
				//create a point for the layer
					var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
				//and pick out a nice icon to go with the locations eyes.
					var icon = getStatusIcon(newestLocation.status);
				
				//Create a point and add it to the fusionLayer
				// pass in all the location statuses
					var locationFeature = new OpenLayers.Feature.Vector(point, {image: icon, locations: _locationArray[locA]});
				fusionLayer.addFeatures([locationFeature]);
		}//end locA
	}//end if
}

function parseSQLSuccess_Heatmap(_locationArray) {
	//Always do this, we never know when the user will toggle the heatmaps on and off.
	
		var transformedTestData = { max: _locationArray.length , data: [] }
		var heatMapData = [];
		
		//Lets loop through the whole array
		for(var locA = 0; locA < _locationArray.length; locA++) {
			//The newest location (used for GUI)
			var newestLocation = _locationArray[locA][0];
					heatMapData.push({
						lonlat: new OpenLayers.LonLat(newestLocation.lon, 
											  newestLocation.lat),
						count: (parseInt(newestLocation.status)*50)
					});
		}//end locA
		
		//Update the layer to show the new data.
		transformedTestData.data = heatMapData;
		heatmapLayer.setDataSet(transformedTestData);
}

var SEARCHSTATUS = {
	ALL 			: {value: 0, name: "All", color: "Black", checked: false},
	OPERATIONAL		: {value: 1, name: "Operational", color: "Green", checked: true},
	LIMITED 		: {value: 2, name: "Limited Capabilities", color: "Yellow", checked: true},
	INTACT 			: {value: 3, name: "Intact, but Uninhabited", color: "Orange", checked: true},
	NONOPERATIONAL	: {value: 4, name: "Non-Operational", color: "Red", checked: true}
};

var SEARCHMEDIA = {
	ALL 	: {value: 0, name: "All", checked: false},
	IMAGE 	: {value: 1, name: "image", checked: true},
	VIDEO 	: {value: 2, name: "video", checked: true},
	AUDIO 	: {value: 3, name: "audio", checked: true}
};

var SEARCHTIME = {
	ALL 	: {value: 0, name: "All", checked: false},
	DAY 	: {value: 1, name: "Day", checked: true},
	WEEK 	: {value: 2, name: "Week", checked: true}
};

function initFilter() {
	//#LOAD - If we offer to save data, load it here {
	//	Reloading!
	//}
	
	//Take the data and set the filter checkboxes
	$("input[name=checkbox-StatusA]").attr("checked", SEARCHSTATUS.OPERATIONAL.checked);
	$("input[name=checkbox-StatusB]").attr("checked", SEARCHSTATUS.LIMITED.checked);
	$("input[name=checkbox-StatusC]").attr("checked", SEARCHSTATUS.INTACT.checked);
	$("input[name=checkbox-StatusD]").attr("checked", SEARCHSTATUS.NONOPERATIONAL.checked);
	
	$("input[name=checkbox-FileTypeA]").attr("checked", SEARCHMEDIA.IMAGE.checked);
	$("input[name=checkbox-FileTypeB]").attr("checked", SEARCHMEDIA.VIDEO.checked);
	$("input[name=checkbox-FileTypeC]").attr("checked", SEARCHMEDIA.AUDIO.checked);
	
	//refreash the checkboxes (jic)
	$("input[type='checkbox']").checkboxradio("refresh");
}

function filterUpdated() {
	SEARCHSTATUS.OPERATIONAL.checked = $("input[name=checkbox-StatusA]").is(':checked');
	SEARCHSTATUS.LIMITED.checked = $("input[name=checkbox-StatusB]").is(':checked');
	SEARCHSTATUS.INTACT.checked = $("input[name=checkbox-StatusC]").is(':checked');
	SEARCHSTATUS.NONOPERATIONAL.checked = $("input[name=checkbox-StatusD]").is(':checked');
	
	SEARCHMEDIA.IMAGE.checked = $("input[name=checkbox-FileTypeA]").is(':checked');
	SEARCHMEDIA.VIDEO.checked = $("input[name=checkbox-FileTypeB]").is(':checked');
	SEARCHMEDIA.AUDIO.checked = $("input[name=checkbox-FileTypeC]").is(':checked');
	
	//New data, fake a move end
	onMapMoveEnd();
}

function toggleFilterPopup() {
	filterPopup = $('#filterPopup');
	
	if(filterPopup.is(':visible')) {
		filterPopup.hide();
	} else {
		closeAllPopups();
		filterPopup.show();
		wasPopupOpen = true;
	}
}

//Allows the customization of the heatmap: e.g.,
// - show only Operational buildings
// - only locations in the last 3 days
// - only pictures
// - or a combination of the three
function shouldAddToLayer(_location) {
	
	var shouldI_Status	= false;	//can you?
	var shouldI_Media 	= false;
	var shouldI_Time 	= false;
		
	if(SEARCHSTATUS.OPERATIONAL.value == _location.status && SEARCHSTATUS.OPERATIONAL.checked)
		shouldI_Status = true;
	else if(SEARCHSTATUS.LIMITED.value == _location.status && SEARCHSTATUS.LIMITED.checked)
		shouldI_Status = true;
	else if(SEARCHSTATUS.INTACT.value == _location.status && SEARCHSTATUS.INTACT.checked)
		shouldI_Status = true;
	else if(SEARCHSTATUS.NONOPERATIONAL.value == _location.status && SEARCHSTATUS.NONOPERATIONAL.checked)
		shouldI_Status = true;
	else
		shouldI_Status = false;
	
	//Now check to see if the media type is correct
	var fileType = mimeTypeFromExt(_location.media);
	fileType = fileType.substr(0, fileType.indexOf('/'));
		
	if(SEARCHMEDIA.IMAGE.name == fileType && SEARCHMEDIA.IMAGE.checked)
		shouldI_Media = true;
	else if(SEARCHMEDIA.VIDEO.name == fileType && SEARCHMEDIA.VIDEO.checked)
		shouldI_Media = true;
	else if(SEARCHMEDIA.AUDIO.name == fileType && SEARCHMEDIA.AUDIO.checked)
		shouldI_Media = true;
	else
		shouldI_Media = false;
		
	/*
	console.log(" - current    : " + _location.status);
	console.log(" - current    : " + fileType);
	console.log("--------------");
	console.log(" - Should You? Status : " + shouldI_Status);
	console.log(" - Should You? Media  : " + shouldI_Media);
	console.log(" - Should You? Time   : " + shouldI_Time);
	console.log("     - return " + (shouldI_Status && shouldI_Media));
	console.log("0===========================================0");
	*/
	
	//Return true if the item meets all filters
	return (shouldI_Status && shouldI_Media);
}

//This function just readys the heatmap layer
function initHeatmap() {
	var testData = {
		max: 1, data: [
			{lat: 0.0, lon: 0.0, count: 0}
	]}
	
	var transformedTestData = { max: testData.max , data: [] },
		data = testData.data, datalen = data.length, nudata = [];
	
    // in order to use the OpenLayers Heatmap Layer we have to transform our data into 
    // { max: <max>, data: [{lonlat: <OpenLayers.LonLat>, count: <count>},...]}
    while(datalen--) {
        nudata.push({
			lonlat: new OpenLayers.LonLat(data[datalen].lon, data[datalen].lat),
			count: data[datalen].count
		});
    }
	
    transformedTestData.data = nudata;
	heatmapLayer.setDataSet(transformedTestData);
	
	setHeatMapLayerVisibility(heatmapLayer_IsVisible);
	setHeatMapToggleButtonVisibility(heatmapToggle_IsVisible);
}

function getAudio(lonlat) {
	var isSimulator = (device.name.indexOf('Simulator') != -1);
	
	if (isSimulator) {
		// TODO: Allow user to choose file?
	}
	else {
		navigator.device.capture.captureAudio(function (mediaFiles) {
			insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, mediaFiles[0].fullPath, null);
			
			// TODO: This sometimes flashes the map
			updateQueueSize();
			showQueueTab();
		});
	}
}

function getPicture(lonlat) {
	var isSimulator = (device.name.indexOf('Simulator') != -1);

	navigator.camera.getPicture(function (imageURI) {
		insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, imageURI, null);
		
		// TODO: This sometimes flashes the map
		updateQueueSize();
		showQueueTab();
	},
	function () { }, {
		quality : 100,
		destinationType : Camera.DestinationType.FILE_URI,
		sourceType : (isSimulator) ? Camera.PictureSourceType.SAVEDPHOTOALBUM : Camera.PictureSourceType.CAMERA,
		allowEdit : false
	});
}

function getVideo(lonlat) {
	var isSimulator = (device.name.indexOf('Simulator') != -1);

	if (isSimulator) {
		navigator.camera.getPicture(function (imageURI) {
			insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, imageURI, null);
			
			// TODO: This sometimes flashes the map
			updateQueueSize();
			showQueueTab();
		},
		function () { }, {
			quality : 100,
			destinationType : Camera.DestinationType.FILE_URI,
			sourceType : Camera.PictureSourceType.SAVEDPHOTOALBUM,
			MediaType: Camera.MediaType.ALLMEDIA,
			allowEdit : false
		});
	}
	else {
		navigator.device.capture.captureVideo(function (mediaFiles) {
			insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, mediaFiles[0].fullPath, null);
			
			// TODO: This sometimes flashes the map
			updateQueueSize();
			showQueueTab();
		});
	}
}

function togglePhotoVideoDialog(){

	//Move B, get out the way: JIC the other popup is open
	if(selectedFeature)
		selectControl.unselect(selectedFeature); //Removes the LocationPopup
	if($('#filterPopup').is(':visible'))
		$('#filterPopup').hide();

	cameraORvideoPopup.toggle();
	
	if (cameraORvideoPopup.is(':visible')) {
		cameraORvideoPopup.position({
			my:	'center',
			at:	'center',
			of:	$('#mapContainer')
		});
		
		wasPopupOpen = true;
	}
	else
		wasPopupClosed = true;
}

function getStatusColor(_status) {
	switch(_status) {
		case 1:
			return "Green";
			break;
		case 2:
			return "Yellow";
			break;
		case 3:
			return "Orange";
			break;
		case 4:
			return "Red";
			break;
		default:
			return "Black";
			break;
	}
}

function getStatusIcon(_status) {
	return "Buildings/" + getStatusColor(_status) + ".png";
}

function hideAddressSearchList(){
	if($('#addressSearchDiv .ui-listview-filter').is(':focus'))
		$('#old-places-list .address-list-item').not('.ui-screen-hidden').addClass('ui-screen-hidden hid-myself');
}

function searchForAddress(address){
	$.get("https://maps.googleapis.com/maps/api/geocode/json", {'address': address, 'sensor': false, }, function(results){
	  if(results.status == "OK")
	  {
		  var lat = results.results[0].geometry.location.lat;
		  var lon = results.results[0].geometry.location.lng;
	  
		  var lonlat = new OpenLayers.LonLat(lon, lat).transform(WGS84, WGS84_google_mercator);
		  
		  map.setCenter(lonlat, 17);
		  
		  var formattedAddress = results.results[0].formatted_address;
		  
		  if(!formattedAddress)
			formattedAddress = address;
		  
		  insertToAddressSearchTable(sqlDb, lonlat.lon, lonlat.lat, formattedAddress);
		  addToAddressList(lonlat.lon, lonlat.lat, formattedAddress);
	  }
	});
}

/*function hideMapToolDivs(){
	$('#northIndicator').hide();
	$('#navigation').hide();
	$('#addressSearchDiv').hide();
	$('#screenLock').hide();
}

function showMapToolDivs(){
	$('#northIndicator').show();
	$('#navigation').show();
	$('#addressSearchDiv').show();
	$('#screenLock').show();
}*/

var selectControl;
var docHeight = 0;
var deviceMaxSize = 0;
var deviceMinSize = 0;
var mapContainer;
var mapDiv;

function setMaxAndMinSizes(sizes){
	deviceMaxSize = sizes[0];
	deviceMinSize = sizes[0];

	for(var i = 1; i < sizes.length; i++)
	{
		if(sizes[i] > deviceMaxSize)
			deviceMaxSize = sizes[i];
		else if(sizes[i] < deviceMinSize)
			deviceMinSize = sizes[i];
	}
}

/*
		 ==============================================
 						 onDeviceReady
 		 ==============================================
*/
function onDeviceReady()
{
	console.log("ready");

	audiojs.events.ready(function() {
		var as = audiojs.createAll();
	});

	//photoguid = device.uuid;
	cameraORvideoPopup = $("#cameraORvideoPopup");
	LocationPopup = $("#locationPopup");
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();
	var windowMinHeight = $('#map-page').css('min-height');
	windowMinHeight = windowMinHeight.substr(0, windowMinHeight.length-2);

	mapContainer = $("#mapContainer");
	mapDiv = $("#map");

	/*if(windowHeight > windowWidth)
	{
		deviceMaxSize = windowHeight;
		deviceMinSize = windowWidth;
	}else{
		deviceMaxSize = windowWidth;
		deviceMinSize = windowHeight;
	}*/
	setMaxAndMinSizes([windowHeight, windowWidth, windowMinHeight]);
	console.log("maxSize: " + deviceMaxSize);
	console.log("minSize: "  + deviceMinSize);
	//Now that the device is ready, lets set up our event listeners.
	document.addEventListener("pause"            , onAppPause         , false);
	document.addEventListener("resume"           , onAppResume        , false);
	document.addEventListener("online"           , onAppOnline        , false);
	document.addEventListener("offline"          , onAppOffline       , false);
	document.addEventListener("batterycritical"  , onBatteryCritical  , false);
	document.addEventListener("batterylow"       , onBatteryLow       , false);
	document.addEventListener("batterystatus"    , onBatteryStatus    , false);
	  window.addEventListener("orientationchange", onOrientationChange,  true);
	  
	initFilter();


	// The Local Database (global for a reason)
	try {
		if (!window.openDatabase) {
			// Do we need to support this?
			navigator.notification.alert('Local databases not supported');
		}
		else {
			// Open or create a 3MB database and store in global variable
			sqlDb = window.openDatabase('mobdisapp', '0.1', 'MobDisAppDB', 3145728);
			createStatusRefTable(sqlDb);
			createQueueTable(sqlDb);
			createAddressSearchTable(sqlDb);
			forAllAddresses(sqlDb, addToAddressList);
		}
	}
	catch (e) {
		// Do we need to handle this?
		navigator.notification.alert('Error opening database: ' + e);
	}

	switch (window.orientation) {
		case -90:   //Landscape with the screen turned to the left.
			orientationHeadingOffset = -90;
			break;
			
		case 0:     //Default view
			orientationHeadingOffset = 0;
			break;
			
		case 90:    //Landscape with the screen turned to the right.
			orientationHeadingOffset = 90;
			break;
			
		case 180:   //Upside down.
			orientationHeadingOffset = 180;
			break;
			
		default: 
			console.log('Orientation issue: ' + window.orientation);
			break;
	}
	
	// Set up NativeControls
	//nativeControls = window.plugins.nativeControls;
	//setupTabBar();
	//selectTabBarItem('Map');
        //setupNavBar();
    
	// do your thing!
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();

	if(windowHeight > windowWidth)
		docHeight = windowHeight;
	else
		docHeight = windowWidth;
	
	var footerHeight = $("#map-footer").height();
	var mapHeight = docHeight - footerHeight - 20;
	
	mapContainer.height(mapHeight +"px");
	
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
	
	//Set up the HeatMap
	heatmapLayer = new OpenLayers.Layer.Heatmap("Heatmap Layer", map, mapLayerOSM, {visible: true, radius:10, gradient: heatmapGradient}, {isBaseLayer: false, opacity: 0.3, projection: new OpenLayers.Projection("EPSG:4326")});
	initHeatmap();
	
	map.events.register("moveend", map, onMapMoveEnd);
	map.addLayers([mapLayerOSM, navigationLayer, statusLayer, fusionLayer, heatmapLayer]);
		
	navigator.geolocation.watchPosition(geolocationSuccess, geolocationError, {
		enableHighAccuracy: true,
		maximumAge: 3000
	});

	var compassOptions = {
		frequency: 3000
	};

	navigator.compass.watchHeading(compassSuccess, compassError, compassOptions);
	OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
		//console.log("device uuid: " + device.uuid);
		defaultHandlerOptions : {
			'single' : true, 'double' : false, 'pixelTolerance' : 0, 'stopSingle' : false, 'stopDouble' : false 
		},
		initialize : function (options) {
			this.handlerOptions = OpenLayers.Util.extend( {}, this.defaultHandlerOptions );
			OpenLayers.Control.prototype.initialize.apply( this, arguments );
			this.handler = new OpenLayers.Handler.Click( this, {
				'click' : this.trigger 
			},
			this.handlerOptions );
		},
		trigger : function (e) 
		{
			//First thing we need to do is check if the search bar was focused before you
			// clicked the map. If so, unfocus it and close that popup
			if($('#addressSearchDiv .ui-input-text').is(":focus")) {
				$('#addressSearchDiv .ui-input-text').blur();
				wasPopupClosed = true;
			}
												
			//Now check to make sure that no popups are open and one wasn't just closed
			if(!arePopupsOpen() && !wasPopupClosed)
			{
				//If not, open the PhotoVideo dialog
				var lonlat = map.getLonLatFromViewPortPx(e.xy);
				clickedLonLat = new OpenLayers.LonLat(lonlat.lon,lonlat.lat).transform(map.projection, map.displayProjection);
				togglePhotoVideoDialog();
			}
			else {
				//A popup was open, close em all!
				//	cant call closeAllPopups, feature pop up cant be closed here =(
				if($('#filterPopup').is(':visible'))
					toggleFilterPopup();
				if(cameraORvideoPopup.is(':visible'))
					togglePhotoVideoDialog();
			}
			
			//Reset these
			wasPopupOpen = false;
			wasPopupClosed = false;
		}
	});
	
	selectControl = new OpenLayers.Control.SelectFeature(
		[fusionLayer], {
			clickout: true, toggle: false, multiple: false, hover: false,
				toggleKey: "ctrlKey", multipleKey: "shiftKey" }
	);
														 
	map.addControl(selectControl);
	selectControl.activate();

	fusionLayer.events.on({
		"featureselected": function(_event) {
			wasPopupOpen = true;
			createLocationPopup(_event.feature);
		},
		"featureunselected": function(_event) {
			destroyLocationPopup(_event.feature);
			wasPopupClosed = true;
		}
	});

	/*var zoomPanel = new OpenLayers.Control.ZoomPanel({div: document.getElementById("zoomPanel")});
	map.addControl(zoomPanel);
	var zoomRight = .05 * mapHeight;
	$("#zoomPanel").css("right", "5%");
	$("#zoomPanel").css("bottom", zoomRight + "px");*/

	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	/*$('#map-page').live('pagebeforeshow', function(){
		showMapToolDivs();
	});*/

	$('#map-page').live('pagebeforeshow', function(){
		$('.map-tab-button').children().addClass('ui-btn-active');
	});
	
	//Hack to keep the Queue tab selected while in the status dialog.
	$('#map-page').live('pageshow', function() {
	//	selectTabBarItem('Map');
						
						var height = $('.queue-dialog').height();
					  var width = $('.queue-dialog').width();
					  $(this).height(height);
					  $(this).width(width);
					  var mapLeftPosition = -1 * (mapDiv.width()-mapContainer.width()) / 2;
					  var mapTopPosition = -1 * (mapDiv.height()-mapContainer.height()) / 2;
					  mapDiv.css('top', mapTopPosition);
					  mapDiv.css('left', mapLeftPosition);
					//  $.mobile.fixedToolbars.show();
	});
	
	$('#map-page').live('pagehide', function() {
		closeAllPopups();
		clickedLonLat = null;		  
	});

	/*$('#map-page').live('pagebeforehide', function(){
		hideMapToolDivs();
	});*/
	
	$('#map-page').live('pagebeforehide', function(){
		$('.map-tab-button').children().removeClass('ui-btn-active');
	});
	
	$('#queue-dialog').live('pagebeforehide', function(){
		$('.queue-tab-button').children().removeClass('ui-btn-active');
	});
	
	$('#user-dialog').live('pagebeforehide', function(){
		$('.user-tab-button').children().removeClass('ui-btn-active');
	});
	
	$('#more-dialog').live('pagebeforehide', function(){
		$('.more-tab-button').children().removeClass('ui-btn-active');
	});
	
	$('#queue-dialog').live('pagebeforeshow', function(){
		$('.queue-tab-button').children().addClass('ui-btn-active');
	});
	
	$('#user-dialog').live('pagebeforeshow', function(){
		$('.user-tab-button').children().addClass('ui-btn-active');
	});
	
	$('#more-dialog').live('pagebeforeshow', function(){
		$('.more-tab-button').children().addClass('ui-btn-active');
	});
	
	$('#queue-dialog').live('pageshow', function() {
		// TODO: more efficient to keep a 'dirty' flag telling us when we need to clear/update
		// rather than doing it every time.
		//selectTabBarItem('Queue');
		forAllLocations(sqlDb, addToQueueDialog);
	});
	
	$('#multiStatus-dialog').live('pageshow', function() {

	});
						  
	$('#multiStatus-dialog').live('pagehide', function() {
		hideStatusesDialog();
	});
	
	//Clear the queue when the user is done with the page,
	// fixes double queue on when you get over 20 items
	// blinks when you leave the page =/
	$('#queue-dialog').live('pagehide', function() {
		clearQueueDialog();
	});
	
	$('#status-dialog').live('pagehide', function() {
		updateQueueSize();
	});

	//Now that we are done loading everything, read the queue and find the size
	// then update all the badges accordingly.
	updateQueueSize();
}

function clearQueueDialog() {
	$('#queue-list li').not('#queue-list-item-archetype').remove();
}

function addToQueueDialog(locRow) {
	var $clone = $('#queue-list-item-archetype').clone();	
	$clone.removeAttr('id');
	
	var type = mimeTypeFromExt(locRow.media);
	type = type.substr(0, type.indexOf('/'));

	if (type == "image") {
		$clone.find('img').attr('src', locRow.media);
	}
	else if (type == "audio") {
		$clone.find('img').attr('src', 'css/images/glyphish/66-microphone.png');
		$clone.find('img').addClass('ui-li-icon');
	}
	else if (type == "video") {
		// TODO: maybe we should get a thumbnail and put the play button in the middle?
		$clone.find('img').attr('src', 'css/images/glyphish/45-movie-1.png');
		$clone.find('img').addClass('ui-li-icon');
	}
	else {
		// Should be impossible to get here
		console.log('unsupported media type in addToQueueDialog');
		return;
	}

	if (locRow.name) {
		$clone.find('h3').text(locRow.name);
	}

	if (locRow.status >= 1) {
		$clone.find('p').text(StatusRef.fromId(locRow.status).toString());
	}

	$clone.attr('rowid', locRow.id);
	$('#queue-list').append($clone);
	$clone.trigger('create').show();
}

function addToAddressList(){
	var location;
	var address;
	var _class;
	
	if(arguments.length == 1)
	{
		location = arguments[0].coordinates;
		address = arguments[0].address;
		_class = "address-list-item ui-screen-hidden hid-myself";
	}else{
		location = arguments[1] + "," + arguments[0];
		address = arguments[2];
		_class = "address-list-item";
	}
	
	var newListElement = "<li class='" + _class + "' location='" + location + "'><a href='#'>" + address + "</a></li>";
	$('#old-places-list').append(newListElement);
	$('#old-places-list').listview('refresh');
}

function hideQueueItemDelete(e) {
	$('#queue-item-delete').hide();
}

function showQueueItemDelete(e) {
	var $del = $('#queue-item-delete');
	$del.attr('rowid', $(this).attr('rowid'));
	$del.show();
	$del.position({
		my:	'right center',
		at:	'right center',
		of:	$(this)
	});
}

function populateGallery(parent, items, options) {
	if (!parent || !$.isArray(items))
		return;

	var makeGalleryItem = function (item, index) {
		var type = mimeTypeFromExt(item.media);
		type = type.substr(0, type.indexOf('/'));

		// 2 items across the screen minus the 8px margin (not sure where the extra 4 pixels come from, maybe default div margin/padding? - discovered through trial and error)
		var itemwidth = $(window).width() / 2 - 8 * 5 - 4;

		var div = '<div class="gallery-item" media-type=' + quote(type) + ' media-src=' + quote(item.media) + ' style="position:relative;float:left;padding:4px;margin:8px;width:' + itemwidth + 'px;height:' + itemwidth + 'px;border:1px solid silver;text-align:center;line-height:' + itemwidth + 'px;display:table-cell;vertical-align:middle"><span style="vertical-align:middle"></span>';

		switch (type) {
			case 'audio':
				div += '<img src=' + quote('css/images/speaker.png');
				div += ' style="vertical-align:middle;max-width:64px;max-height:64px;"></img>';
				break;

			case 'image':
				div += '<img src=' + quote(item.media);
				div += ' style="vertical-align:middle;max-width:' + itemwidth + 'px;max-height:' + itemwidth + 'px"></img>';
				break;

			case 'video':
				div += "<video id='video-thumb-" + index + "'" + /*" class='video-js vjs-default-skin'" +*/ " controls preload='auto' data-setup='{}' width='" + itemwidth + "' height='" + itemwidth + "' onclick='this.play();'>";
				div += "<source src=" + squote(item.media) + "/>";// + " type=" + squote(mimeTypeFromExt(item.media)) + "/>";
				div += "</video>";
				break;
		}

		// Metadata overlay (this probably has a bug when name is so long that it takes up more than one line)
		div += '<div style="text-align:left;display:block;line-height:100%;width:100%;background-color:black;opacity:0.6;position:absolute !important;left:0px;bottom:0px;"><div style="margin:8px"><span style="color:white">' + item.name + ' - ' + StatusRef.fromId(item.status).toString() + '</span><p style="margin:8px;margin-left:0px;color:white"><time class="timeago" style="" datetime="' + $.format.date(item.date, "yyyy-MM-dd hh:mm:ss a") + '"></time></p>' + '</div></div>';

		div += '</div>';
		var $nrv = $(div);
		$nrv.find('.timeago').timeago();
		return $nrv;
	};

	for (var i = 0; i < items.length; ++i) {
		parent.append(makeGalleryItem(items[i], i));

		var type = mimeTypeFromExt(items[i].media);
		type = type.substr(0, type.indexOf('/'));
		
		if (type == 'video') {
			// Initialize video-js on the video element
			// TODO: bug here - fullscreen mode only works the first time with VideoJS.
			// Commented out for now, but that means no Flash fallback if no HTML5 video support.
			//_V_('video-thumb-' + i);
		}
	}
	parent.trigger('create');
}

$(document).ready(function () {
	$(document).click(function () {
		hideQueueItemDelete();
	});

	$('#fs-audio').position({
		my:	'center',
		at:	'center',
		of:	$('#image-viewer')
	});

	var $queue_item;

	$('.locImage').live('click', locationPopup_onImageClick);
	$('.locImageMultiple').live('click', function() {
		var $gallery = $('#gallery');
		$gallery.empty();
		populateGallery($gallery, popupFeature);
		$.mobile.changePage('#gallery-page');
	});

	$('.gallery-item').live('click', function(e) {
		var type = $(this).attr('media-type');
		var src = $(this).attr('media-src');
		var $viewer = $('#image-viewer');

		switch (type) {
			case 'audio':
				$('#fs-image').hide();
				
				var $container = $('#fs-audio');
				var $audio = $container.find('audio');
				$audio.attr('src', src);
				$container.show();
				$.mobile.changePage($viewer);
				break;

			case 'image':
				$('#fs-audio').hide();
				
				var $container = $('#fs-image');
				var $img = $container.find('img');
				$img.attr('max-height', $(window).height());
				$img.attr('max-width', $(window).width());
				$img.attr('src', src);
				$container.show();
				$img.load(function() {
					$(this).position({
						my:	'center',
						at:	'center',
						of:	$viewer
					});
				});
				$.mobile.changePage($viewer);
				break;
		}
	});

	$('#image-viewer').live('pagebeforeshow', function(ignored, popup) {
		$('#map-footer li').removeClass('ui-btn-active');

		if ($(popup.prevPage).attr('id') == 'map-page') {
			$('#fs-audio').hide();
		
			var src = popup.prevPage.find('#locationImage').attr('src');
			var $img = $(this).find('img');
			$img.attr('max-width', $(window).width());
			$img.attr('src', src);
			$img.show();
			$img.load(function() {
				$(this).position({
					my:	'center',
					at:	'center',
					of:	$(this).parent()
				});
			});
		}
	});
	$('#image-viewer').live('pagebeforehide', function() {
		var $audio = $(this).find('audio');
		if ($audio.is(':visible')) {
			$audio.get(0).pause();
		}
	});

	$('#image-viewer img').live('click', function() {
		history.back();
	});

	$('.queue-list-item').live('click', function(e) {
		$queue_item = $(this);
	});

	$('.queue-list-item').live('swipeleft', showQueueItemDelete)
	$('.queue-list-item').live('swiperight', hideQueueItemDelete);
	$('.queue-list-item').live('blur', hideQueueItemDelete);

	$('.queue-tab-button').click(function(e) {
		if(itemsInQueue === 0) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			$(this).find('a').removeClass('ui-btn-active');
		}
	});

	$('#queue-item-delete').live('click', function(e) {
		// If we were the last item in the queue, close the dialog
		if (itemsInQueue === 1) {
			//$('#queue-dialog').dialog('close');
			$.mobile.changePage('#map-page');
		}

		var id = $(this).attr('rowid');
		deleteLocation(sqlDb, id);
		$(this).hide();
		$('.queue-list-item').filter('[rowid="' + id + '"]').remove();

		// An item was removed, update the queue size.
		updateQueueSize();
		$.mobile.fixedToolbars.show();
	});

	$('#location-dialog').live('pagebeforeshow', function() {
		var $ul = $('#places-list');
		$ul.remove('li');
		
		forEachLocationQueueRow(sqlDb, [$queue_item.attr('rowid')], function(row) {
			$.ajax({
				url:	'https://maps.googleapis.com/maps/api/place/search/json?location=' + row.location + '&sensor=false&radius=500&key=' + GoogleApi.key(),
				success:	function(data) {
					var placesList = new Array();
					for (var i = 0; i < data.results.length; ++i) {
						var alreadyAdded = false;
						for (var j = 0; j < placesList.length; ++j) {
							if (data.results[i].reference == placesList[j]) {
								alreadyAdded = true;
								break;
							}
						}
						
						if (!alreadyAdded) {
							placesList.push(data.results[i].reference);
							$ul.append("<li class='location-list-item' reference='" + data.results[i].reference + "'><a data-rel='back'>" + data.results[i].name + "</a></li>");
						}
					}
					$ul.listview('refresh');
				},
				error:	function(xhr, status, error) {
					console.log('places error');
					console.log(xhr);
					console.log(status);
					console.log(error);
				}
			});
		});
	});

	$('#location-dialog').live('pageinit', function() {
		var $locform = $(this).find('form');
		$locform.submit(function() {
			// Store back to local DB
			var desc = $(this).find('input').val();
			var id = $queue_item.attr('rowid');
			updateLocationName(sqlDb, id, desc);
			$('#location-dialog').dialog('close');
		});
	});
	
	$('#location-dialog').live('pagebeforeshow', function() {
		$(this).find('input').val('');
	});

	$('.location-list-item').live('click', function() {
		var id = $queue_item.attr('rowid');
		// Grab the real geographic coordinates and store them
		$.ajax({
			url:	'https://maps.googleapis.com/maps/api/place/details/json?reference=' + $(this).attr('reference') + '&sensor=false&key=' + GoogleApi.key(),
			success:	function(data) {
				updateLocationCoordinates(sqlDb, id, data.result.geometry.location.lat + ',' + data.result.geometry.location.lng);
			},
			error:	function(xhr, status, error) {
				console.log('places detail error');
				console.log(xhr);
				console.log(status);
				console.log(error);
			}
		});		
		// Doing this outside the ajax success callback so that it happens immediately since
		// we already have the required information.
		updateLocationName(sqlDb, id, $(this).text());
	});

	$('.status-list-item').live('click', function() {
		// Store back to local DB
		var id = $queue_item.attr('rowid');
		updateLocationStatus(sqlDb, id, $(this).attr('status-ref'));
	});

	$('.status-submit-button').live('click', function() {
		submitToServer();
	});
	
	$('#filterToggle').live('click', function() {
			toggleFilterPopup();
	});
				  
	$("#northIndicator").live("taphold", function(){
		if(!screenLocked){
			screenLocked = true;
			$("#screenLock .ui-icon").css("background", "url('css/images/lock.png') 50% 50% no-repeat");
			navSymbolizer.externalGraphic = positionUnlockedImage;
			navigationLayer.redraw();
		}
		
		$("#map").animate({rotate: '0deg'}, 1000);
		$("#northIndicator").animate({rotate: '0deg'}, 1000);
	
		map.events.rotationAngle = 0;
	});
	
	$('#addressSearchDiv .ui-listview-filter').submit(function(){
													  console.log("hi friend");
		var address = $('#addressSearchDiv .ui-input-text').val();
		searchForAddress(address);
	});
				  
	$('.address-list-item').live('click', function(){
		var coordinates = $(this).attr('location');
		var commaIndex = coordinates.indexOf(",");
		var lat = coordinates.substring(0, commaIndex);
		var lon = coordinates.substr(commaIndex+1);
		
		map.setCenter(new OpenLayers.LonLat(lon, lat), 17);							
	});
	
	$('#addressSearchDiv .ui-listview-filter').live('focus', function(){
			closeAllPopups();
			$('#old-places-list .address-list-item').removeClass('ui-screen-hidden');
			if($('#cameraORvideoPopup').is(':visible'))
					togglePhotoVideoDialog();
	});
		
	$('#addressSearchDiv .ui-listview-filter').live('blur', function(){
		var visibleListItems = $('#old-places-list .address-list-item').not('.ui-screen-hidden');
		
		setTimeout(function(){
			if(visibleListItems.length > 0)
				visibleListItems.addClass('ui-screen-hidden hid-myself');
		}, 200);
	});
				  
	$('#plus').click(function(){
		closeAllPopups_NoToggle();
		map.zoomIn();
	});
						
	$('#minus').click(function(){
		closeAllPopups_NoToggle();
		map.zoomOut();
	});
	
	$('#heatmapLockButton').live('click', heatMapToggleButton_Click);
				  
	$('#audioButton').click(function(){
		getAudio(clickedLonLat);
		clickedLonLat = null;
	});

	$('#cameraButton').click(function(){
		getPicture(clickedLonLat);
		clickedLonLat = null;
	});

	$('#videoButton').click(function(){
		getVideo(clickedLonLat);
		clickedLonLat = null;
	});

	$('#cancelButton').click(function(){
		togglePhotoVideoDialog();
		clickedLonLat = null;
	});
	
	$('#screenlockbutton').click(function(){
		if(screenLocked){
			screenLocked = false;
			$("#screenlockbutton .ui-icon").css("background-image", "url(css/images/unlock.png) !important");
			navSymbolizer.externalGraphic = positionLockedImage;
			navSymbolizer.pointRadius = 30;
		 }else{
			screenLocked = true;
			$("#screenlockbutton .ui-icon").css("background-image", "url(css/images/glyphish/54-lock.png) !important");
			navSymbolizer.externalGraphic = positionUnlockedImage;
			navSymbolizer.pointRadius = 20;
		 }
								 
		navigationLayer.redraw();
	});
	
	$('input[name="checkbox-StatusA"]').live('change',filterUpdated);
	$('input[name="checkbox-StatusB"]').live('change',filterUpdated);
	$('input[name="checkbox-StatusC"]').live('change',filterUpdated);
	$('input[name="checkbox-StatusD"]').live('change',filterUpdated);
	
	$('input[name="checkbox-FileTypeA"]').live('change',filterUpdated);
	$('input[name="checkbox-FileTypeB"]').live('change',filterUpdated);
	$('input[name="checkbox-FileTypeC"]').live('change',filterUpdated);
});

function submitToServer() {
	getValidLocationRowIds(sqlDb, function (rowids) {
		forLocationQueueRows(sqlDb, rowids, function(rows) {
			var sql = '';
			for (var i = 0; i < rows.length; ++i) {
				var row = rows.item(i);
				sql += 'INSERT INTO ' + FusionTableId.locations() + ' (Location,Name,Status,Date,MediaURL) VALUES (';
				sql += squote(row.location) + ',';
				//--------------------------------------------------
				//  DO NOT TOUCH! It may look wrong       +-Here
				//    but this will run fine.             v
					var name = row.name.replace(/\'/g, "\\'"); 
					sql += squote(name) + ',';
				//--------------------------------------------------				
				sql += row.status + ',';
				sql += squote(row.date) + ',';
				var photoguid = Math.uuid();
				var extensionIndex = row.media.lastIndexOf(".");
				var extension = row.media.substr(extensionIndex).toLowerCase();
				var amazonURL = "http://s3.amazonaws.com/mobileresponse/user/kzusy/" + photoguid + extension;
				
				
				sql += squote(amazonURL) + ')';

				if (rows.length > 1) {
					sql += ';';
				}

				uploadFileToS3(row.media, photoguid);
			}

			googleSQL(sql, 'POST', function(data) {
				var rows = $.trim(data).split('\n');
				var rowid = rows.shift();
				
				// Just some sanity checking...response should be rowids from Google and
				// the number of inserted rows should equal the number of inserts that we POSTed.
				if (rowid === 'rowid' && rows.length === rowids.length) {
					for (var i = 0; i < rowids.length; ++i) {
						deleteLocation(sqlDb, rowids[i]);
					}
					//The sqlDb has changed, update the queue size.
					updateQueueSize();
					
					//Hack to refesh the map icons, problem OpenLayers?
					map.zoomOut(); map.zoomIn();
				}
			});
		});
	});
}

/*
        ==============================================
                     QueueSize Functions
        ==============================================
 
    Calling this function will do everything for you, it reads the SQL database and then updates the size as well as the badges.
 */
function updateQueueSize() {
	//We are updating the queue count, so first
	// lets remove the current queue times from the counters.
	appNotifications -= itemsInQueue;
	itemsInQueue = 0;
	clearStatusPoints();

	//Now we are ready to start, lets get the QueueSize
	sqlDb.transaction(getQueueSize, getQueueSizeErrorBC, getQueueSizeSuccessCB);
}

function getQueueSize(_tx) {
    //Gets all the rows from the locationqueue
    _tx.executeSql('SELECT * FROM locationqueue',[], 
		function(_tx, _result) { 
			itemsInQueue = _result.rows.length;
		   
			for(var i = 0; i < itemsInQueue; i++) {
				var row = _result.rows.item(i);
				addStatusPoints(row.location, row.status);
			}
		}, 
		function(_tx, _error) {
			console.log('SQL Execute error'); return true; }
	);
}

function getQueueSizeSuccessCB() {
	//Now itemsInQueue is at the current count, update everything
	appNotifications += itemsInQueue;
	//updateTabItemBadge('Queue', itemsInQueue);
	updateAppBadge(appNotifications);
}

function getQueueSizeErrorBC(_error) {
    console.log('getQueueSizeError: ' + _error.message);
}

function addStatusPoints(_location, _status) {
	var commaIndex = _location.indexOf(",");
	var lat = _location.substr(0, commaIndex);
	var lon = _location.substr(commaIndex+1);
						   
	var lonlat = new OpenLayers.LonLat(lon,lat).transform(map.displayProjection, map.projection);
	var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
						   
	var statusColor = getStatusColor(_status);
						   
	var location = new OpenLayers.Feature.Vector(point, {
		status: statusColor
	});
						   
	statusLayer.addFeatures([location]);
	statusLayer.redraw();
}
						   
function clearStatusPoints() {
	statusLayer.removeAllFeatures();
	statusLayer.redraw();
}

/*
        ==============================================
                  NativeControls Functions
        ==============================================
 
    This array contains all the information about the buttons that we are going to have in the tab bar. It contains the name of the tab, the image used for the tab and what function to call when that tab is selected. 
 */
/*var tabBarItems = { tabs: [
      {'name': 'Map'  , 'image': '/www/common/TabImages/Map.png'  	, 'onSelect': onClick_MapTab},
      {'name': 'Queue', 'image': '/www/common/TabImages/Queue.png'	, 'onSelect': onClick_QueueTab},
      {'name': 'User' , 'image': '/www/common/TabImages/User.png' 	, 'onSelect': onClick_UserTab},
      {'name': 'Debug', 'image': '/www/common/TabImages/Debug.png'	, 'onSelect': onClick_DebugTab},
      {'name': 'More' , 'image': 'tabButton:More'					, 'onSelect': onClick_MoreTab}]
};*/

/*
    This function loops though the array and sets up the buttons for us. Then we add them to the tab bar and show the bar.
 */
/*function setupTabBar() {
    nativeControls.createTabBar();
        var _length = tabBarItems.tabs.length;
        for (var i = 0; i < _length; i++) {
            setUpButton(tabBarItems.tabs[i]);
        }
    nativeControls.showTabBarItems('Map', 'Queue', 'User', 'More', 'Debug');
    selectTabBarItem('Map');
    showTabBar();
}*/

/*
    Called by setupTabBar, this function creates the TabBarItems with the given params from our array.
 */
/*function setUpButton(_tabItem) {
    var options = new Object();
        options.onSelect = _tabItem.onSelect;
    nativeControls.createTabBarItem(_tabItem.name, _tabItem.name, _tabItem.image, options);
}*/

/*
    This function creates the Nav bar, sets up the buttons and their callbacks and then displays the nav bar.
 */
/*function setupNavBar() {
	nativeControls.createNavBar();
	nativeControls.setupLeftNavButton('Left','', 'onClick_LeftNavBarButton');
	nativeControls.setupRightNavButton('Right','', 'onClick_RightNavBarButton');
	nativeControls.setNavBarTitle('Disaster Response');
	nativeControls.setNavBarLogo('');
	hideLeftNavButton();
	hideRightNavButton();
	showNavBar();
}

function selectTabBarItem(_tabItem) {
	nativeControls.selectTabBarItem(_tabItem);
}

function updateTabItemBadge(_tabName, _amount) {
    if(_amount >= 1) {
        //console.log('TabBar: Badge with the value ' + _amount + ' added to ' + _tabName + '.');
        var object = new Object();
            object.badge = _amount.toString();
        nativeControls.updateTabBarItem(_tabName, object);
    }
    else
        hideTabItemBadge(_tabName);
}

function hideTabItemBadge(_tabName) {
    //console.log('TabBar: Badge removed from ' + _tabName + '.');
    nativeControls.updateTabBarItem(_tabName, null);
}

*/function updateAppBadge(_amount) {
    if(_amount >= 1) {
        //console.log('App: Badge added with the value ' + _amount + '.');
        window.plugins.badge.set(_amount);
    }
    else
        hideAppBadge();
}

function hideAppBadge() {
    //console.log('App: Badge removed from App.');
    window.plugins.badge.clear();
}/*

function showTabBar() {
    var options = new Object();
    options.position = 'bottom';
    nativeControls.showTabBar(options);
}

function hideTabBar() {
    nativeControls.hideTabBar();
}

function showNavBar() {
    nativeControls.showNavBar();
}

function hideNavBar() {
    nativeControls.hideNavBar();
}

function showLeftNavButton() {
    nativeControls.showLeftNavButton();
}

function hideLeftNavButton() {
    nativeControls.hideLeftNavButton();
}

function showRightNavButton() {
    nativeControls.showRightNavButton();
}

function hideRightNavButton() {
    nativeControls.hideRightNavButton();
}*/

/*
        ==============================================
            NativeControls Nav onClick Functions
        ==============================================
 */

/*function onClick_LeftNavBarButton() {
    //console.log('onClick: LeftNavBarButton');
    navigator.notification.alert('Left NavBar button was selected.', function(){}, 'Debug', 'Okay');
}

function onClick_RightNavBarButton() {
    //console.log('onClick: RightNavBarButton');
    navigator.notification.alert('Right NavBar button was selected.', function(){}, 'Debug', 'Okay');
}*/

/*
        ==============================================
             NativeControls Tab onClick Functions
        ==============================================
 */
/*var selectedTabBarItem = 'Map';
function onClick_MapTab() {
	//console.log('onClick: MapTab');
	selectTabBarItem('Map');
	selectedTabBarItem = 'Map';
	$.mobile.changePage('#map-page', 'pop');
}
*/
function showQueueTab() {
	//selectTabBarItem('Queue');
	//selectedTabBarItem = 'Queue';
	$.mobile.changePage('#queue-dialog', 'pop');
}
/*
function onClick_QueueTab() {
	if (itemsInQueue > 0) {
		showQueueTab();
	}
	else {
		nativeControls.selectTabBarItem(selectedTabBarItem);
	}
}

function onClick_UserTab() {
	selectTabBarItem('User');
	selectedTabBarItem = 'User';
	$.mobile.changePage('#user-dialog', 'pop');
}

function onClick_MoreTab() {
	selectTabBarItem('More');
	selectedTabBarItem = 'More';
	$.mobile.changePage('#more-dialog', 'pop');
}

//Temporary option to allow us to open a different tab and access debug information
// like Device, iOS version, current location, etc.
function onClick_DebugTab() {
	//console.log('onClick: DebugTab');
	selectTabBarItem('Debug');
	selectedTabBarItem = 'Debug';
	window.open ('Debug.html','_self',false);
}*/

/*
        ==============================================
                  Event Listener Callbacks
        ==============================================

    When the application is put into the background via the home button, phone call, app switch, etc. it is paused. Any Objective-C code or PhoneGap code (like alert()) will not run. This callback will allow us to pause anything we need to to avoid time based errors.
 
*/
/*
function resizeImageViewer() {
	var $imgviewer = $('#image-viewer');
	if ($imgviewer.is(':visible')) {
		console.log('resized');
		var $img = $imgviewer.find('img');
		$img.attr('max-width', $(window).width());
		$img.position({
			my:	'center',
			at:	'center',
			of:	$imgviewer
		});
	}
}
*/
function onAppPause() {
    console.log('Listener: App has been paused.');
    isAppPaused = true;
    //Because native code won't run while an app is paused, all code below this line
    // will not run until the app is reopened again.
}

// Push any queued items to the server automatically, or with the user's consent,
// depending on the app's current settings.
function submitQueuedItems() {
	//If itemsInQueue is 1 or more we have data to push.
	if(itemsInQueue >= 1) {
		//If auto push is on, try and push the data to the server.
		if(isAutoPush) {
			submitToServer();
		}
		else {
			navigator.notification.confirm('You have unsent items.  Send now?', function (response) {
				switch (response) {
					case 1:
						submitToServer();
						break;
				}
			});
		}
	}
}

/*
    When the user resumes the app from the background this callback is called, allowing us to resume anything that we stopped.
 */
function onAppResume() {
	console.log('Listener: App has been resumed.');
	isAppPaused = false;
	
	//Check to see if we have an internet connection
	if(isInternetConnection) {
		submitQueuedItems();
	}
}

						   var reloadScript = false;
/*
    Whenever the device connects to the internet this function will be called. This allows us to know when to update our fusion tables online as well as when to start updating the map again.
    #QUIRK: Durring the inital startup of the app, this will take at least a second to fire.
 */
function onAppOnline() {
	console.log('Listener: App has internet connection.');
	isInternetConnection = true;

	//Because native code won't run while an app is paused, this should not get called unless the app is running. Time to push data to the server.
	submitQueuedItems();
}

/*
    This function is called whenever the device loses internet connection (be it WiFi or 3G or EDGE). With this we can keep the current map tiles cached to avoid losing them.
    #QUIRK: Durring the inital startup of the app, this will take at least a second to fire.
 */
function onAppOffline() {
	console.log('Listener: App has lost internet connection.');
	isInternetConnection = false;
}

/*
    Called when the orientation of the iDevice is changed.
    #QUIRK: Triggered twice on 1 rotation.
 */
var orDirtyToggle = false;
function onOrientationChange(_error) {  
	//Prevent the function from running multiple times.
	/*orDirtyToggle = !orDirtyToggle;
						  
	if (orDirtyToggle) {*/
		switch (window.orientation) {
			case -90:   //Landscape with the screen turned to the left.
				onOrientationLandscape(window.orientation);
						   orientationHeadingOffset = -90;
				break;

			case 0:     //Default view
				onOrientationPortrait(window.orientation);
						   orientationHeadingOffset = 0;
				break;

			case 90:    //Landscape with the screen turned to the right.
				onOrientationLandscape(window.orientation);
						   orientationHeadingOffset = 90;
				break;

			case 180:   //Upside down.
				onOrientationPortrait(window.orientation);
						   orientationHeadingOffset = 180;
				break;

			default: 
				console.log('Orientation issue: ' + window.orientation);
				break;
		}
	//}
}

function resizeMapContainer(orientation){
	if((orientation == -90) || (orientation == 90)) //landscape
	{
	   $('.mypage').height(deviceMinSize);
	   $('.mypage').width(deviceMaxSize);
						   
	}else{
	   $('.mypage').height(deviceMaxSize);
	   $('.mypage').width(deviceMinSize);
	}
						   
   var mapLeftPosition = -1 * (mapDiv.width()-mapContainer.width()) / 2;
   var mapTopPosition = -1 * (mapDiv.height()-mapContainer.height()) / 2;
   mapDiv.css('top', mapTopPosition);
   mapDiv.css('left', mapLeftPosition);
   
   $.mobile.fixedToolbars.show();
}

/*
    This function is called whenever the device is switched over to landscape mode. Here we can do things like resize our viewport.
 */
function onOrientationLandscape(_orientation) {
    console.log('Listener: App has changed orientation to Landscape ' + _orientation + '.');
    isLandscape = true;
						   
	resizeMapContainer(_orientation);
}

/*
 This function is called whenever the device is switched over to portrait mode. Here we can do things like resize our viewport.
 */
function onOrientationPortrait(_orientation) {
    console.log('Listener: App has changed orientation to Portrait ' + _orientation + '.');
    isLandscape = false;
						   
	resizeMapContainer(_orientation);
}

/*
    Called when the device hits the critical level threshold. This is device specific. (10 on iDevices)
 */
function onBatteryCritical(_info) {
    console.log('Listener: Device battery is now critical.');
    //_info.level = % of battery (0-100).
    //_info.isPlugged = true if the device is plugged in.
}

/*
    Called when the device hits the low level threshold. This is device specific. (20 on iDevices).
 */
function onBatteryLow(_info) {
    console.log('Listener: Device battery is now on low.');
    //_info.level = % of battery (0-100).
    //_info.isPlugged = true if the device is plugged in.
}

/*
    Whenever the battery changes status (either info.level changes by one, or info.isPlugged is toggled) this function is called.
    Example: If they plug in, that means they have power where they are. The building locations that are close by are now operational (if they weren't already labled as such).
 */
function onBatteryStatus(_info) {
    console.log('Listener: Device battery now at ' + _info.level + '.');
    //_info.level = % of battery (0-100).
    //_info.isPlugged = true if the device is plugged in.
}

/*
	 ==============================================
	 					Old Code
	 ==============================================
	 
	 No longer used but held onto just in case
*/
/*
var fusionLayerOptions_Heat = {
		displayProjection: WGS84,
		projection: WGS84_google_mercator,
		maxResolution: maxResolution,
		maxExtent: maxExtent,
		restrictedExtent: restrictedExtent,
};
						   
var fusionLayerOptions_Icon = {
		displayProjection: WGS84,
		projection: WGS84_google_mercator,
		maxResolution: 38.21851413574219,
		minResolution: "auto",
};
						   
var fLayer_heatMap = true;
function initializeFusionLayer_Icons() {
	fusionLayer_Locations_Icons = new OpenLayers.Layer.OSM("Fusion Table - locations",
		"http://mt0.googleapis.com/mapslt?hl=en-US&lyrs=ft:"+FusionTableId.locationsID()+"|h:" + !fLayer_heatMap + "&x=${x}&y=${y}&z=${z}&w=256&h=256&source=maps_api",fusionLayerOptions_Icon);
}
						   
function initializeFusionLayer_HeatMap() {
	fusionLayer_Locations_HeatMap = new OpenLayers.Layer.OSM("Fusion Table - locations",
		"http://mt0.googleapis.com/mapslt?hl=en-US&lyrs=ft:"+FusionTableId.locationsID()+"|h:" + fLayer_heatMap + "&x=${x}&y=${y}&z=${z}&w=256&h=256&source=maps_api",fusionLayerOptions_Heat);
}
*/
