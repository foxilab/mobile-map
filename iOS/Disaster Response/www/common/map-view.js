/* ============================ *
 *    		 API Keys
 * ============================ */
var GoogleApi = new function() {
	this.key = function () { return 'AIzaSyClELEF3P8NDUeGkiZg0qSD1I_mIejPDI0'; }
}
// Fusion Table Stuff
var FusionServer = new function () {
	/* #TODO: point this to the hosted web server */
	this.url = function () { return 'http://findplango.com:8080/DSI/rest/fusion'; }
};
var FusionTableId = new function () {
	this.statusref		= function() { return '1IhAYlY58q5VxSSzGQdd7PyGpKSf0fhjm7nSetWQ'; };
	this.locations		= function() { return '1G4GCjQ21U-feTOoGcfWV9ITk4khKZECbVCVWS2E'; };
	this.locationsID	= function() { return '2749284'; };
}

/* ============================ *
 *  	   Common divs
 * ============================ */
var div_MapPage;		/* The Map page div.  										*/
var div_MapContainer;	/* The div that houses the map, popups, and other controls.	*/
var div_MapContent;		/* The div that stores the content for the MapPage.  		*/
var div_Map;			/* The div that stores the Openlayers map.  				*/

var div_PageFooter;		/* The div that stores the footer for every page.  			*/

var cameraORvideoPopup;	/* The div that stores the cameraOrVideo popup.  			*/
var div_LocationPopup;	/* The div that stores the Location popup.  				*/
var div_FilterPopup;	/* The div that stores the Filter popup.  					*/
 
/* ============================ *
 *   Projections and Extents
 * ============================ */
var WGS84 					= new OpenLayers.Projection("EPSG:4326");
var WGS84_google_mercator	= new OpenLayers.Projection("EPSG:900913");
var maxExtent 				= new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508);
var restrictedExtent 		= maxExtent.clone();
var maxResolution 			= 78271.51695;
var iconMaxResolution 		= 4.777314266967774;

	/* ============================ *
	 *    Resolution per level
	 * ============================ *
	 *  01 .... 78271.51695 
	 *  02 .... 39135.758475 
	 *  03 .... 19567.8792375 
	 *  04 .... 9783.93961875 
	 *  05 .... 4891.969809375 
	 *  06 .... 2445.9849046875 
	 *  07 .... 1222.99245234375 
	 *  08 .... 611.496226171875 
	 *  09 .... 305.7481103859375 
	 *  10 .... 152.87405654296876 
	 *  11 .... 76.43702827148438 
	 *  12 .... 38.21851413574219 
	 *  13 .... 19.109257067871095 
	 *  14 .... 9.554628533935547 
	 *  15 .... 4.777314266967774 
	 *  16 .... 2.388657133483887 
 	 *  17 .... 1.1943285667419434 
	 *  18 .... 0.5971642833709717
 	* ============================ */

/* ============================ *
 * 			Controls
 * ============================ */
var selectControl;
var touchNavOptions = {
	dragPanOptions: {
		interval: 		0, /* non-zero kills performance on some mobile phones  */
		enableKinetic:	true
	}
};
var rotatingTouchNav = new OpenLayers.Control.TouchNavigation(touchNavOptions);

/* ============================ *
 * 			   Map
 * ============================ */
var map;
var mapOptions = {
	div: 				"OpenLayersMap",
	projection: 		WGS84_google_mercator,
	displayProjection:	WGS84,
	numZoomLevels:	 	20,
	maxResolution: 		maxResolution,
	maxExtent: 			maxExtent,
	allOverlays: 		true,
	restrictedExtent: 	restrictedExtent,
	controls: [
		rotatingTouchNav
	]
};

/* ============================ *
 * 		   Symbolizers
 * ============================ */
var positionUnlockedImage	= "css/images/PositionUnlocked.png";
var positionLockedImage		= "css/images/PositionLocked.png";
var navSymbolizer = new OpenLayers.Symbolizer.Point({
		pointRadius: 		25,
    	externalGraphic:	positionUnlockedImage,
		fillOpacity: 		1,
		rotation: 			0
});

var statusSymbolizer = new OpenLayers.Symbolizer.Point({
    	pointRadius: 	10,
    	fillColor: 		"${status}",
    	strokeColor:	"${status}",
    	fillOpacity: 	0.4,
    	rotation: 		0
});

var fusionSymbolizer = new OpenLayers.Symbolizer.Point({
		pointRadius: 		25,
		externalGraphic: 	"${image}",
		fillOpacity: 		1,
		rotation: 			0,
		graphicZIndex:		"${zIndex}"
});

/* ============================ *
 * 		   	  Styles
 * ============================ */
var navStyle = new OpenLayers.StyleMap({
	"default" : new OpenLayers.Style(null, {
		rules : [ new OpenLayers.Rule({
			symbolizer : navSymbolizer
		})]
	}),
	"select" : new OpenLayers.Style(null, {
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

var fusionStyle = new OpenLayers.StyleMap({
	"default" : new OpenLayers.Style(null, {
		rules : [ new OpenLayers.Rule({
			symbolizer : fusionSymbolizer
		})]
	})
});

/* ============================ *
 *  	 	 Layers
 * ============================ */
var mapLayerOSM		= null;
var heatmapLayer	= null;

var navigationLayer = new OpenLayers.Layer.Vector("Navigation Layer", {
    	styleMap: 			navStyle
});

var statusLayer = new OpenLayers.Layer.Vector("Status Layer", {
    	styleMap: 			statusStyle,
		displayProjection:	WGS84,
		projection: 		WGS84_google_mercator,
		maxResolution: 		iconMaxResolution,
		minResolution: 		"auto"
});

var fusionLayer = new OpenLayers.Layer.Vector("Fusion Layer", {
		rendererOptions: { zIndexing: true },
		styleMap: 			fusionStyle,
		displayProjection:	WGS84,
		projection: 		WGS84_google_mercator,
		maxResolution: 		iconMaxResolution,
		minResolution: 		"auto"
});

/* ============================ *
 *  	    Strategies
 * ============================ */
var statusSaveStrategy = new OpenLayers.Strategy.Save();
var statusWFSLayer = new OpenLayers.Layer.Vector("Status Layer", {
    strategies: [new OpenLayers.Strategy.BBOX(), statusSaveStrategy],
    protocol: new OpenLayers.Protocol.WFS({
       version: 		"1.1.0",
       srsName: 		"EPSG:4326",
       url: 			"findplango.com:8080/geoserver/wfs",
       featureNS: 		"http://lmnsolutions.com/DisasterResponse",
       featureType: 	"location_statuses",
       geometryName:	"the_geom",
       schema:			"http://findplango.com:8080/geoserver/wfs/DescribeFeatureType?version=1.1.0" + 
	   					"&typename=DisasterResponse:location_statuses"
    }),
    visibility: false
});

/* ============================ *
 *  	 	 Popups
 * ============================ */
var clickedLonLat 		= null;	 /* When the cameraOrVideo popup is toggled, store the LonLat of the click.	 */
var popupFeature 		= null;	 /* The current location displayed in the Location popup.					 */
var popupFeatureMain	= null;	 /* The main feature that holds all the locations in the Location popup.	 */
var selectedFeature 	= null;	 /* The feature that is currently selected.									 */
var prevSelectedFeature = null;
var queueVisable 		= true;	 /* Used in the filter popup to display the local queued locations.			 */

var wasPopupOpen		= false; /* True if a popup was just opened.	 */
var wasPopupClosed		= false; /* True if a popup was just closed.	 */

/* Used for sorting in the filter popup, also holds if an item is checked or not  */
var SEARCHSTATUS = {
	ALL 			: {value: 0, name: "All", 						color: "Black",  checked: false},
	OPERATIONAL		: {value: 1, name: "Operational", 				color: "Green",  checked: true },
	LIMITED 		: {value: 2, name: "Limited Capabilities", 		color: "Yellow", checked: true },
	INTACT 			: {value: 3, name: "Intact, but Uninhabited", 	color: "Orange", checked: true },
	NONOPERATIONAL	: {value: 4, name: "Non-Operational", 			color: "Red",    checked: true }
};

var SEARCHMEDIA = {
	ALL 	: {value: 0, name: "All",   checked: false},
	IMAGE 	: {value: 1, name: "image", checked: true },
	VIDEO 	: {value: 2, name: "video", checked: true },
	AUDIO 	: {value: 3, name: "audio", checked: true }
};

var SEARCHTIME = {
	ALL 	: {value: 0, name: "All",  checked: false},
	DAY 	: {value: 1, name: "Day",  checked: true },
	WEEK 	: {value: 2, name: "Week", checked: true }
};

/* ============================ *
 *  	 Other Variables
 * ============================ */
/* PHONE VARIABLES */
var isAppPaused 				= false;	/* True if the app is currently in the background.  */
var isInternetConnection 		= false;	/* True if the device is connected to the internet.	*/
var isLandscape 				= false;	/* True if the device is in landscape mode.			*/
var screenLocked 				= true;
var orientationHeadingOffset	= 0;
var oldRotation 				= 0;
var screenWidth;
var screenHeight;
var DEVICE_ID;
var DEVICE_PLATFORM;
var DEVICE_VERSION;

/* App */
var isAutoPush 			= false;	/* If set to true, the app will try and push your local queue when you get internet.	 */
var centered 			= false; 	/* If set to true, the map is centered on the users location. For initalization only.	 */
var locatedSuccess 		= true;	 	/* If set to true, the app successfully found your location. For initalization only.	 */
var user_CurrentPosition;			/* Stores the users current position.													 */
									/*	- user_CurrentPosition.lat and user_CurrentPosition.lon								 */

/* Badges */
var itemsInQueue		= 0;		/* Holds a current queue count.										 */
var appNotifications	= 0;		/* The number to display on the apps notifacation badge (iOS only).	 */

/* Heatmap */
var heatmapGradient = {
	0.05: "rgb(128,128,128)", 
	0.25: "rgb(0,255,0)", 
	0.50: "rgb(255,255,0)",
	0.90: "rgb(255,165,0)", 
	1.00: "rgb(255,0,0)"
};

var heatmap_IsVisible 		= true;
var heatmapLayer_IsVisible	= true;
var heatmapToggle_IsVisible	= true;
var fusionLayer_IsVisible	= true;

/*
 		==============================================
 						onBodyLoad
 		==============================================
		
	This is the main entry point into the application. When the app loads we check to see if
	PhoneGap is ready. The moment it is we call onDeviceReady and can safely do what we want.
 */
function onBodyLoad() {
	document.addEventListener("deviceready", onDeviceReady, false);
}

/*
	Centers the map on the users current positon.
 */
function centerMap() {
	map.setCenter(new OpenLayers.LonLat(user_CurrentPosition.lon, user_CurrentPosition.lat).transform(WGS84, WGS84_google_mercator));
}

function geolocationSuccess(position) {
	var lon = position.coords.longitude;
	var lat = position.coords.latitude;
	
	user_CurrentPosition = { 
		lon: lon,
		lat: lat
	};
	
	console.log("Current Positon. lat: " + user_CurrentPosition.lat);
	console.log("Current Positon. lon: " + user_CurrentPosition.lon);
	
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
    /* iPhone Quirks
    /    position.timestamp returns seconds instead of milliseconds. */
};

function geolocationError(error) {
    
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
			
			user_CurrentPosition = { 
				lon: lon,
				lat: lat
			};
            
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

function compassSuccess(heading) {
	//Rotate arrow
	/*navSymbolizer.rotation = heading.magneticHeading;
	navigationLayer.redraw();*/
	var heading = (heading.magneticHeading + orientationHeadingOffset) % 360;
	var mapRotation = 360 - heading;
	
	//Rotate map
	if(!screenLocked) {
		$(div_Map).animate({rotate: mapRotation + 'deg'}, 1000);
		$("#northIndicator").animate({rotate: mapRotation + 'deg'}, 1000);
		
		map.events.rotationAngle = -1 * mapRotation;
	}else {
		//navSymbolizer.rotation = mapRotation;
		navSymbolizer.rotation = heading;
		navigationLayer.redraw();
	}
};

function compassError(error) {
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

function mediaUploadSuccess(response) {
	console.log('media upload success');
}

function mediaUploadFailure(response) {
	console.log(response);
}

/*
	Returns the mime type of a file based on the path provided. (ex: image/png, audio/mp3, video/mov)
 */
function getFileMimeType(_filepath) {
	var extension = getFileExtension(_filepath);
	var mime = "null/null";
	
	/* Video MIME's */
		if(extension == "mov")
			mime = "video/quicktime";
		else if(extension == "mp4" || extension == "m4v")
			mime = "video/mp4";
		else if(_filepath.substr(0, 7) == "youtube")
			mime = "youtube";
	
	/* Audio MIME's */
		else if (extension == "wav")
			mime = "audio/wav";
		else if (extension == "mpg" || extension == "mpeg" || extension == "mp1" || 
				 extension == "mp2")
			mime = "audio/mpeg"
		else if (extension == "mp3")
			mime = "audio/mpeg";
		else if (extension == "ogg")
			mime = "audio/ogg";
		else if (extension == "m4a")
			mime = "audio/mp4";
		else if (extension == "3gpp")
			mime = "audio/3gpp";
	
	/* Image MIME's */
		else if (extension == "jpg" || extension == "jpeg" || extension == "jpe" ||
			 	 extension == "jif" || extension == "jfif" || extension == "jfi")
			mime = "image/jpeg";
		else if (extension == "png")
			mime = "image/png";
		else if (extension == "gif")
			mime = "image/gif";
	
	/* Media type not supported, this shouldn't happen so alert the user.  */
		else
			navigator.notification.alert('Media type .' + extension + ' not supported.', function(){}, 'Error', 'Okay');
	
	return mime;
}

/*
 	Returns the extension of a file based on the path provided. (ex: png, mp3, mov)
 */
function getFileExtension(_filepath) {
	var extIndex = _filepath.lastIndexOf('.');
	return _filepath.substr(extIndex+1).toLowerCase();
}

/*
	Returns the file type based on the path provided. (ex: image, audio, video)
 */
function getFileType(_filepath) {
	var mime = getFileMimeType(_filepath);
	if(mime == "youtube") {
		return mime;
	} else {
		return mime.substr(0, mime.indexOf('/'));
	}
}

function callGoogleSQL(sql, id){
	console.log("sql: " + sql);
	googleSQL(sql, 'POST', function(data) {
		var rows = $.trim(data).split('\n');
		var rowid = rows.shift();
		
		console.log("callGoogleSql: " + rowid);
		
		// Just some sanity checking...response should be rowids from Google and
		// the number of inserted rows should equal the number of inserts that we POSTed.
		if (rowid === 'rowid' && rows.length === 1) {
			deleteLocation(sqlDb, id);
			
			// The sqlDb has changed, update the queue size.
			updateQueueSize();
			
			// Fake a moveend to update the fusion layer with the new data.
			onMapMoveEnd();
		}
	});
}

function uploadFileToServer(row, photoguid, sql){
	var filepath = row.media;
	var name = row.name;
	
	var url 			= "http://findplango.com:8080/DSI/rest/youtube/upload";
	var ft 				= new FileTransfer();
	var mimeType 		= getFileMimeType(filepath);
	var extensionIndex	= filepath.lastIndexOf(".");
	var extension 		= filepath.substr(extensionIndex).toLowerCase();
	
	var params = {
		mimeType:	mimeType,
		name:		name
	};
	
	var options 		= new FileUploadOptions();
		options.fileName	= photoguid + extension; 
		options.params 		= params;
	
	ft.upload(filepath, url, function(response){
		var videoId	= response.response;
		//var url 	= "http://www.youtube.com/v/" + videoId + "?version=3&enablejsapi=1";
		var _sql 	= sql + squote("youtube" + videoId) + ');';
		console.log("videoId: " + videoId);
		
		callGoogleSQL(_sql, row.id);
	}, function(response){console.log(response);}, options);
}

function uploadFileToS3(row, photoguid, sql) {
	console.log("upload to s3");
	var filepath	= row.media;
	var fileId 		= row.id;
	var mimeType 	= getFileMimeType(filepath);
	console.log("fileId: " + fileId);

	var policy = {
		"expiration": "2012-12-01T12:00:00.000Z",
		"conditions": [
			{"bucket":			"mobileresponse"},
			["starts-with",		"$key", "user/kzusy/"],
			{"acl":				"public-read" },
			{"Content-Type":	mimeType}
		]
	};

	var encodedPolicy 	= $.base64.encode(JSON.stringify(policy));
	var secret 			= "snPtA2XuMhDBoJM9y0Sx8ILGnYAnPh5FfCwFpbIu";
	var hmac 			= Crypto.HMAC(Crypto.SHA1, encodedPolicy, secret, { asString: true });
	var signature		= $.base64.encode(hmac);
	var extensionIndex	= filepath.lastIndexOf(".");
	var extension 		= filepath.substr(extensionIndex).toLowerCase();
	
	var params = {
		key:				"user/kzusy/" + photoguid + extension,
		bucket:				"mobileresponse",
		AWSAccessKeyId:		"AKIAJPZTPJETTBZ5A5IA",
		policy:				encodedPolicy,
		acl:				"private",
		signature:			signature,
		acl:				"public-read",
		"Content-Type":		mimeType
	};

	var options 		= new FileUploadOptions();
		//options.chunkedMode = true;
		options.mimeType 	= mimeType;
		options.fileKey 	= "file";
		options.fileName	= filepath.substr(filepath.lastIndexOf('/')+1);
		options.params 		= params;

	var ft 	= new FileTransfer();
	var url = 'http://mobileresponse.s3.amazonaws.com';
	ft.upload(filepath, url, function(){
		callGoogleSQL(sql, fileId);
	}, mediaUploadFailure, options);
}

/*
 		==============================================
		 			Map Movement Callbacks
 		==============================================
		
	This function gets called whenever the map stops moving (either from a pan or a zoom).
 */
 var stopMoveEnd = false;
function onMapMoveEnd(_event) {

	if(!stopMoveEnd) {
	/* Close any open popups. */
	/*    #TODO - Close all popups or just some? */
			if(selectedFeature)
				selectControl.unselect(selectedFeature);

			/* Now that the map is done moving, get the new bounds and convert it. */
			var bounds = map.getExtent();
			var leftBottom = new OpenLayers.LonLat(bounds.left,bounds.bottom).transform(map.projection, map.displayProjection);
			var rightTop= new OpenLayers.LonLat(bounds.right,bounds.top).transform(map.projection, map.displayProjection);
	
			/* Generate the SQL to get all location statuses within the current map bounds. */
			var sql = "SELECT Location,Name,Status,Date,MediaURL FROM " + FusionTableId.locations() + 
				" WHERE ST_INTERSECTS(Location, RECTANGLE(LATLNG("+leftBottom.lat+","+leftBottom.lon+"), "+
				"LATLNG("+rightTop.lat+","+rightTop.lon+"))) ORDER BY Date DESC";
	
			/* Display the correct layer based on the maps current resolution. */
			if(map.getResolution() <= iconMaxResolution) {
				/* Display the icons, but hide the heatmap */
				turnFusionLayerOn();
				turnHeatMapToggleButtonOff();
			} else {
				/* STOP! Heatmap time! */
				turnFusionLayerOff();
				turnHeatMapToggleButtonOn();
			}
			
			/* Query the Fusion Table for features with the new parameters. */
			googleSQL(sql, 'GET', fusionSQLSuccess);
		}
		
	stopMoveEnd = false;
}

/*
	This function gets called right before the map begins to move.
 */
function onMapMoveStart(_event) {
	//Before we move check to see if a popup was just opened.
	if(wasPopupOpen) {
		//Was it the location popup?
		if(selectedFeature) {
			stopMoveEnd = true;
		}
	}
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
		
	Creates the popup you get for clicking on a feature on the map.
 */
 var featurePopup = null;
function createLocationPopup(_feature) {
	//Move B, get out da way: Hide the cameraOrvideoPopup to avoid position errors.
	closeAllPopups();
	
	selectedFeature = _feature;

	if (!div_LocationPopup.is(':visible')) {
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
			
		var $locationImage 	= $('#locationImage');
		var $locationName 	= $('#locationName');
		var $locationDate 	= $('#locationDate');
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
		var mime = getFileMimeType(locMedia);
		console.log("mime: " + mime);
		if (mime) {
			var fileType = getFileType(locMedia);
			console.log("after file type");
			//If there is internet, use data from online
			if(isInternetConnection == true) {
				console.log("connected");
				if(fileType == "youtube") {
					if(!stacked) {
						
						//$locationImage.hide();
						$('#embedded-audio').hide();
						$('#embedded-video').hide();
						var videoId = locMedia.substr(7);
						$locationImage.attr('class', 'locImage').attr('videoId', videoId);
						$locationImage.attr('src', "http://img.youtube.com/vi/" + videoId + "/0.jpg");
						//window.location = "http://m.youtube.com/watch?v=" + videoId;
						/*var $div = $('#embedded-video');
						var $video = $div.find('embed');
						$video.attr('src', locMedia);
						$div.show();*/
						
						/*
						div += '<img src=' + "'http://img.youtube.com/vi/" + item.media.substr(7) + "/0.jpg'";
						div += ' class="youtubeVideo" videoId="' + item.media.substr(7) + '" style="vertical-align:middle;max-width:' + itemwidth + 'px;max-height:' + itemwidth + 'px"></img>';
						*/
					} else {
						console.log("stacked");
						$('#embedded-audio').hide();
						$('#embedded-video').hide();
						
						//$locationImage.attr('src', "Popup/Video.png");
						$locationImage.attr('src', "http://img.youtube.com/vi/" + locMedia.substr(7) + "/0.jpg");
						$locationImage.attr('alt', "Video of " + locName + ".").show();
					}
				}
				else if(fileType == "audio") {
				
					if(!stacked) {
						$locationImage.hide();
						$('#embedded-video').hide();
					
						var $div = $('#embedded-audio');
						//var $audio = $div.find('audio');
						//$audio.attr('src', locMedia);
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

		div_LocationPopup.css('border', '2px solid ' + getStatusColor(locStatus));
		$('#locationDate').attr('datetime', locDate).text($.timeago($.format.date(locDate, "yyyy-MM-dd hh:mm:ss a")));
		//$('#locationLonlat').text(locLat.toFixed(precision) + ", " + locLon.toFixed(precision));
	}
	
	featurePopup = new OpenLayers.Popup.FramedCloud("eventPopup", 
		new OpenLayers.LonLat(locLon,locLat).transform(map.displayProjection, map.projection),
		new OpenLayers.Size(300, 300),
		div_LocationPopup.html(),
		null, false, destroyLocationPopup);

	map.addPopup(featurePopup);
	
	if(fileType == "audio" && !stacked){
		var eventPopup = $('#eventPopup');
		var oldAudio = eventPopup.find('.audiojs');
		var popupAudioDiv = eventPopup.find('#embedded-audio');
		var newAudioJSElement = popupAudioDiv.find('audio');
		popupAudioDiv.find('audio').attr('src', locMedia);
		audiojs.create(newAudioJSElement);
		oldAudio.replaceWith(oldAudio.children('.audiojs'));
		popupAudioDiv.show();
	}
}

function onClick_FramedCloudLocationPopup() {
console.log("onClick_FramedCloudLocationPopup called");
	//Now that the image is clicked figure out if there is 1 or more statuses
	if(!$('#locationImageStack').is(':visible')) {
		//If 1 open the normal popup
		console.log("single");
		onImageClick_Single();
		
	} else {
		//If many open the gallary
		console.log("multiple");
		onImageClick_Multiple();
	}
}

function onImageClick_Multiple() {
	var $gallery = $('#gallery');
	$gallery.empty();
	populateGallery($gallery, popupFeature);
	$.mobile.changePage('#gallery-page');
}

function destroyLocationPopup(_feature) {
	// Stop playing any audio or video
	var $audio = div_LocationPopup.find('audio');
	var $video = div_LocationPopup.find('video');
	if ($video.is(':visible')) {
		$video.get(0).pause();
	}
	else if ($audio.is(':visible')) {
		$audio.get(0).pause();
	}
	
	if(featurePopup) {
		featurePopup.destroy();
		featurePopup = null;
	}

	div_LocationPopup.hide();
//	popupFeature = null;
	popupFeatureMain = null;
	prevSelectedFeature = selectedFeature;
	selectedFeature = null;
	
	//Clear out the div's
	document.getElementById("locationImage").src = "Popup/FileNotSupported.png";
	document.getElementById("locationImage").alt = "Nothing set for this location.";
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
	if(div_FilterPopup.is(':visible')) {
		div_FilterPopup.hide();
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
	if(div_FilterPopup.is(':visible')) {
		div_FilterPopup.hide();
	}
}

function arePopupsOpen() {
	var open = false;
	
	if(selectedFeature)
		open = true;
	if(cameraORvideoPopup.is(':visible'))
		open = true;
	if(div_FilterPopup.is(':visible'))
		open = true;
	
	return open;
}

function onImageClick_Single() {
	console.log("onImageClick_Single()");

	//We have popupFeature, this variable holds the current feature
	// now we can pull data and display 
	//Variables for local use/quick access/shorter code
	var locName 	= popupFeatureMain.name;
	var locMedia 	= popupFeatureMain.media;
	var locStatus	= popupFeatureMain.status;
	var locDate 	= popupFeatureMain.date;
	var locLan 		= popupFeatureMain.lan;
	var locLon 		= popupFeatureMain.lon;
	
	//Check to see the media type
	fileType = getFileType(locMedia);

	//Now that we know what type we have, open a new window for the user to view
	if(fileType == "image") {
		// TODO: This is nearly identical to gallery-item click handler
		$('#fs-audio').hide();

		var $viewer = $('#image-viewer');
		var src = $('#locationImage').attr('src');
		var $container = $('#fs-image');
		var $img = $('#chosenImage');
		$img.load(function() {
			$(this).position({
				my:	'center',
				at:	'center',
				of:	$viewer
			});
			$viewer.find('a').position({
				my:	'center',
				at:	'right top',
				of:	$img,
				collision:	'none'
			});			
		});
		$img.attr('src', src);
		$container.show();

		var $overlay = $('#item-metadata-base').clone();
		$overlay.removeAttr('id');

		var itemdate = $.format.date(locDate, "MM-dd-yyyy hh:mm a");
		$overlay.find('span').text(locName + ' - ' + StatusRef.fromId(locStatus).toString());

		var $time = $overlay.find('time');
		$time.text(itemdate);
		$time.attr('datetime', itemdate);

		$('#image-metadata').replaceWith($overlay);
		$overlay.attr('id', 'image-metadata');

		$.mobile.changePage($('#image-viewer'));
	}
	else if(fileType == "youtube")
	{
		var videoId = $('#locationImage').attr('videoId');
		window.location = "http://www.youtube.com/watch?v=" + videoId; 
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
		if(shouldAddToLayer(location)) {
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
					var locationFeature = new OpenLayers.Feature.Vector(point, {zIndex:-lonlat.lat, image: icon, locations: _locationArray[locA]});
					
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
		}//end locA	//Update the layer to show the new data.
		transformedTestData.data = heatMapData;
		heatmapLayer.setDataSet(transformedTestData);
}

/*
	Returns a color based on the status provided.
 */
function getStatusColor(_status) {
	switch(_status) {
		case 1:
			return SEARCHSTATUS.OPERATIONAL.color;
			break;
		case 2:
			return SEARCHSTATUS.LIMITED.color;
			break;
		case 3:
			return SEARCHSTATUS.INTACT.color;
			break;
		case 4:
			return SEARCHSTATUS.NONOPERATIONAL.color;
			break;
		default:
			return SEARCHSTATUS.ALL.color;
			break;
	}
}

/*
	Returns the URL to an image for a location based on the status provided.
 */
function getStatusIcon(_status) {
	return "Buildings/3D_" + getStatusColor(_status) + ".png";
}

/*
	Initalize the Filter popup.
 */
function initFilter() {
	//#TODO - If we offer to save data, load it here {
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
	
	$("input[name=checkbox-QueueA]").attr("checked", queueVisable);
	
	//Refreash the checkboxes
	$("input[type='checkbox']").checkboxradio("refresh");
}

/*
	Whenever a filter checkbox is changed update the filter status and reload the data.
 */
function filterUpdated() {
	SEARCHSTATUS.OPERATIONAL.checked 	= $("input[name=checkbox-StatusA]").is(':checked');
	SEARCHSTATUS.LIMITED.checked 		= $("input[name=checkbox-StatusB]").is(':checked');
	SEARCHSTATUS.INTACT.checked 		= $("input[name=checkbox-StatusC]").is(':checked');
	SEARCHSTATUS.NONOPERATIONAL.checked	= $("input[name=checkbox-StatusD]").is(':checked');
	
	SEARCHMEDIA.IMAGE.checked 			= $("input[name=checkbox-FileTypeA]").is(':checked');
	SEARCHMEDIA.VIDEO.checked			= $("input[name=checkbox-FileTypeB]").is(':checked');
	SEARCHMEDIA.AUDIO.checked 			= $("input[name=checkbox-FileTypeC]").is(':checked');

	queueVisable 						= $("input[name=checkbox-QueueA]").is(':checked');
	setStatusLayerVisibility(queueVisable);
	
	//Now that there is a new filter, face a moveend to reload the fustion layer.
	onMapMoveEnd();
}

function toggleFilterPopup() {
	if(div_FilterPopup.is(':visible')) {
		div_FilterPopup.hide();
	} else {
		closeAllPopups();
		div_FilterPopup.show();
		wasPopupOpen = true;
	}
}

/*
	Checks a location against the current filter options and returns true if
		the building passes and should be shown.
 */
function shouldAddToLayer(_location) {
	
	var shouldI_Status	= false;	/* True if the buildings status passes the filter. */
	var shouldI_Media 	= false;	/* True if the buildings media type passes the filter. */
	var shouldI_Time 	= false;	/* #TODO filter by time. */
		
	/* 
		Check to see if the buildings status meets the filter requirements.
		 - Set up this way because multiple options can be true at once.
	*/
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
	
	/*
		Now check to see if the locations media type meets the filter requirements.
	*/
	fileType = getFileType(_location.media);
		
	if(SEARCHMEDIA.IMAGE.name == fileType && SEARCHMEDIA.IMAGE.checked)
		shouldI_Media = true;
	else if(((SEARCHMEDIA.VIDEO.name == fileType) || (fileType == "youtube")) && SEARCHMEDIA.VIDEO.checked)
		shouldI_Media = true;
	else if(SEARCHMEDIA.AUDIO.name == fileType && SEARCHMEDIA.AUDIO.checked)
		shouldI_Media = true;
	else
		shouldI_Media = false;
	
	/*
		Return true if the location meets all filters requirements.
	*/
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
	while (datalen--) {
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
			//THIS STUFF IS CALLED FROM insertToLocationQueueTable now
			//updateQueueSize();
			//showQueueTab();
		});
	}
}

function getPicture(lonlat) {
	var isSimulator = (device.name.indexOf('Simulator') != -1);
	
	navigator.camera.getPicture(function (imageURI) {
		insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, imageURI, null);
		
		// TODO: This sometimes flashes the map
		//THIS STUFF IS CALLED FROM insertToLocationQueueTable now
		//updateQueueSize();
		//showQueueTab();
	},
	function () { }, {
		quality : 100,
		destinationType : Camera.DestinationType.FILE_URI,
		sourceType : (isSimulator) ? Camera.PictureSourceType.SAVEDPHOTOALBUM : Camera.PictureSourceType.CAMERA,
		allowEdit : false
	});
	
	/*navigator.device.capture.captureImage(function (mediaFiles) {
		insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, mediaFiles[0].fullPath, null);
		
		// TODO: This sometimes flashes the map
		updateQueueSize();
		showQueueTab();
	});*/
}

function getVideo(lonlat) {
	var isSimulator = (device.name.indexOf('Simulator') != -1);

	if (isSimulator) {
		navigator.camera.getPicture(function (imageURI) {
			insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, imageURI, null);
			
			// TODO: This sometimes flashes the map
			//THIS STUFF IS CALLED FROM insertToLocationQueueTable now
			//updateQueueSize();
			//showQueueTab();
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
			//THIS STUFF IS CALLED FROM insertToLocationQueueTable now
			//updateQueueSize();
			//showQueueTab();
		});
	}
}

function togglePhotoVideoDialog(){

	//Move B, get out the way: JIC the other popup is open
	if(selectedFeature)
		selectControl.unselect(selectedFeature); //Removes the LocationPopup
	if(div_FilterPopup.is(':visible'))
		div_FilterPopup.hide();

	cameraORvideoPopup.toggle();
	
	if (cameraORvideoPopup.is(':visible')) {
		cameraORvideoPopup.position({
			my:	'center',
			at:	'center',
			of:	$(window)
		});
		
		wasPopupOpen = true;
	}
	else
		wasPopupClosed = true;
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

/*
		 ==============================================
 						 onDeviceReady
 		 ==============================================
		 
	Now that PhoneGap is initalized we can begin the application. This function
	sets up all the variables and listeners.
*/
function onDeviceReady()
{
	/*
		The device is ready! First lets set up our listeners so we can tell
		when certian things, like rotation, happen.
	*/
	document.addEventListener("pause"            , onAppPause         , false);
	document.addEventListener("resume"           , onAppResume        , false);
	document.addEventListener("online"           , onAppOnline        , false);
	document.addEventListener("offline"          , onAppOffline       , false);
	document.addEventListener("batterycritical"  , onBatteryCritical  , false);
	document.addEventListener("batterylow"       , onBatteryLow       , false);
	document.addEventListener("batterystatus"    , onBatteryStatus    , false);
	//window.addEventListener("orientationchange", onOrientationChange, false);
	  
	/*
		Overwrite the error handler so we can get more information about the error.
		We could also log this to a file.
	*/
/*	window.onerror = function myErrorHandler(msg,url,line) {
		console.log("window.onerror: message: " + msg + ", line: " + line + ", url: " + url);
		return true;
    };
*/	
	/*
		Store variables to some commonly used divs.
	*/
	div_MapPage					= $("#map-page");
	div_MapContainer 			= $("#mapContainer");
	div_MapContent				= $("#map-content");
	div_Map 					= $("#OpenLayersMap");
	div_PageFooter				= $("#Page_Footer");
	
	cameraORvideoPopup 			= $("#cameraORvideoPopup");
	div_LocationPopup			= $("#locationPopup");
	div_FilterPopup				= $("#filterPopup");
	DEVICE_ID = device.uuid;
	DEVICE_PLATFORM = device.platform;
	DEVICE_VERSION = device.version;
	
	/*
		Update the screens size and the orientation heading.
	*/
	updateScreenSize();
	updateOrientationHeading();

	/*
		Initialize the local databases or create them if they don't exist.
	*/
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

	initFilter();
	
	audiojs.events.ready(function() {
		var as = audiojs.createAll();
	});

	var footerHeight = div_PageFooter.height();
	console.log("footerHeight: " + footerHeight);
	var mapHeight = screenHeight - footerHeight;

	//$.mobile.fixedToolbars.show();

	//With the mapDiv setup. Create the map!
	map = new OpenLayers.Map(mapOptions);
	mapLayerOSM = new OpenLayers.Layer.OSM();	
	
	//Set up the HeatMap
	heatmapLayer = new OpenLayers.Layer.Heatmap("Heatmap Layer", map, mapLayerOSM, {visible: heatmapLayer_IsVisible, radius:10, gradient: heatmapGradient}, {isBaseLayer: false, opacity: 0.3, projection: WGS84});
	initHeatmap();

	map.addLayers([mapLayerOSM, fusionLayer, heatmapLayer, navigationLayer, statusLayer]);
		
		map.events.register("movestart", map, onMapMoveStart);	/* Hide popups on drag */
		map.events.register("moveend", map, onMapMoveEnd);		/* Refresh map layers. */

	// fix height of content to allow for header & footer
	function fixContentHeight() {
		if ($.mobile.activePage.attr('id') == "map-page") {

			var viewHeight = $(window).height();

			var contentHeight = viewHeight - div_PageFooter.outerHeight();
			if ((div_MapContent.outerHeight() + div_PageFooter.outerHeight()) !== viewHeight) {
				contentHeight -= (div_MapContent.outerHeight() - div_MapContent.height());
//				contentHeight += map.tileSize.h;
				div_MapContent.height(contentHeight);
				div_Map.height(contentHeight+"px");
				div_Map.width($(window).width()+"px");

				console.log(contentHeight);
				console.log($(window).width());
			}

			if (map) {
				closeAllPopups_NoToggle();
				map.updateSize();
				heatmapLayer.onMapResize();
				
				map.zoomIn(); map.zoomOut();
				map.zoomOut(); map.zoomIn();	
			}
		}
	}
	$(window).bind("orientationchange resize pageshow", fixContentHeight);
	fixContentHeight();

	console.log('initial size');
	console.log(map.getSize().w);
	console.log(map.getSize().h);

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
				if(div_FilterPopup.is(':visible'))
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
		[navigationLayer, fusionLayer], {
			clickout: true, toggle: false, multiple: false, hover: false,
				toggleKey: "ctrlKey", multipleKey: "shiftKey" }
	);
														 
	map.addControl(selectControl);
		selectControl.activate();
	isInternetConnection = window.navigator.onLine;
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

	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	div_MapPage.live('pagebeforeshow', function(){
		$('.map-tab-button').children().addClass('ui-btn-active');
	});
	
	//Hack to keep the Queue tab selected while in the status dialog.
	div_MapPage.live('pageshow', function() {
		var height = $('.queue-dialog').height();
		var width = $('.queue-dialog').width();
		$(this).height(height);
		$(this).width(width);
		var mapLeftPosition = -1 * (div_Map.width()-div_MapContainer.width()) / 2;
		var mapTopPosition = -1 * (div_Map.height()-div_MapContainer.height()) / 2;
		div_Map.css('top', mapTopPosition);
		div_Map.css('left', mapLeftPosition);
		$.mobile.fixedToolbars.show();
					 console.log("map page show");
	});
	
	div_MapPage.live('pagebeforehide', function() {
		closeAllPopups_NoToggle();		
		clickedLonLat = null;  
	});
	
	div_MapPage.live('pagebeforehide', function(){
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
	
	$('#addressSearchDiv .ui-listview-filter').submit(function(){
	  var address = $('#addressSearchDiv .ui-input-text').val();
	  searchForAddress(address);
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

	$('#addressSearchDiv .ui-input-search').find('a').attr('data-theme', 'a');

	$('.youtubeVideo').live('click', function(){
		var videoId = $(this).attr('videoId');
		window.location = "http://www.youtube.com/watch?v=" + videoId; 
	});

	$.mobile.fixedToolbars.show();
}

function clearQueueDialog() {
	$('#queue-list li').not('#queue-list-item-archetype').remove();
}

function addToQueueDialog(locRow) {
	var $clone = $('#queue-list-item-archetype').clone();	
	$clone.removeAttr('id');

	console.log(locRow.media);
	type = getFileType(locRow.media);

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
	console.log("add to queue Dialog");
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

	var itemwidth = $(window).width() / 2 - 8 * 5 - 4;
	
	var makeGalleryItem = function (item, index) {
		var type = getFileType(item.media);

		// 2 items across the screen minus the 8px margin (not sure where the extra 4 pixels come from, maybe default div margin/padding? - discovered through trial and error)
		

		var div = '<div class="gallery-item" media-type=' + quote(type) + ' media-src=' + quote(item.media) + ' style="position:relative;float:left;padding:4px;margin:8px;width:' + itemwidth + 'px;height:' + itemwidth + 'px;border:1px solid silver;text-align:center;line-height:' + itemwidth + 'px;display:table-cell;vertical-align:middle"><span style="vertical-align:middle"></span>';
		
		var playLeftCenter = itemwidth / 2 - 32;
		
		switch (type) {
			case 'audio':
				div += "<audio preload='auto' src=" + squote(item.media) + ">";
				div += "</audio>";
				break;

			case 'image':
				div += '<img src=' + quote(item.media);
				div += ' style="vertical-align:middle;max-width:' + itemwidth + 'px;max-height:' + itemwidth + 'px"></img>';
				break;

			case 'video':
				// TODO: Once video playback starts working again, can we just do width/height like audio above as 100% using CSS?
				div += "<video id='video-thumb-" + index + "'" + /*" class='video-js vjs-default-skin'" +*/ " controls preload='auto' data-setup='{}' width='" + itemwidth + "' height='" + itemwidth + "' onclick='this.play();'>";
				// Note: commented out mime type since Internet searches say this causes it not to work on Android.  It doesn't appear to be necessary on iOS either.
				div += "<source src=" + squote(item.media) + "/>";// + " type=" + squote(getFileMimeType(item.media)) + "/>";
				div += "</video>";
				break;
			case 'youtube':
				var videoId = item.media.substr(7);
				div += '<img videoId="' + videoId + '" style="position:absolute;top:' + playLeftCenter + 'px;left:' + playLeftCenter + 'px" class="galleryPlayYoutube" src="css/images/play_icon.png"></img>';
				div += '<img src=' + "'http://img.youtube.com/vi/" + videoId + "/0.jpg'";
				div += ' class="youtubeVideo" videoId="' + videoId + '" style="vertical-align:middle;max-width:' + itemwidth + 'px;max-height:' + itemwidth + 'px"></img>';
				break;
		}

		// TODO: This is nearly identical to item-metadata-base
		var itemdate = $.format.date(item.date, "MM-dd-yyyy hh:mm a");
		div += '<div class="item-metadata" style="text-align:left;display:block;line-height:100%;width:100%;background-color:black;opacity:0.6;position:absolute !important;left:0px;top:0px;"><div style="margin:8px"><span style="color:white">' + item.name + ' - ' + StatusRef.fromId(item.status).toString() + '</span><p style="margin:8px;margin-left:0px;color:white"><time style="" datetime="' + itemdate + '">' + itemdate + '</time></p>' + '</div></div>';
		
		div += '</div>';
		
		return $(div);
	};

	for (var i = 0; i < items.length; ++i) {
		parent.append(makeGalleryItem(items[i], i));
		
		var type = getFileType(items[i].media);

		if (type == 'video') {
			// Initialize video-js on the video element
			// TODO: bug here - fullscreen mode only works the first time with VideoJS.
			// Commented out for now, but that means no Flash fallback if no HTML5 video support.
			//_V_('video-thumb-' + i);
		}
	}
	parent.trigger('create');
	
	var audioGalleryItems = $('.gallery-item audio');
	
	if(audioGalleryItems.length)
	{
		audiojs.create(audioGalleryItems);
	
		//36 is the height of .audiojs
		var middleOfElement = itemwidth - 36;
		$('.gallery-item .audiojs').css('position', 'relative').css('top', middleOfElement + 'px');
	}
	
}

function indexOfSrc(src) {
	for (var i = 0; i < popupFeature.length; ++i) {
		if (src == popupFeature[i].media) {
			return i;
		}
	}
	return -1;
}
function prevImage(index) {
	for (var i = index - 1; i >= 0; --i) {
		var type = getFileType(popupFeature[i].media);
		if (type == 'image') {
			return i;
		}
	}

	// wrap around if we didn't already find one
	for (var i = popupFeature.length - 1; i > index; --i) {
		var type = getFileType(popupFeature[i].media);
		if (type == 'image') {
			return i;
		}
	}

	// return the same index if we didn't find any other images
	return index;
}
function nextImage(index) {
	for (var i = index + 1; i < popupFeature.length; ++i) {
		var type = getFileType(popupFeature[i].media);
		if (type == 'image') {
			return i;
		}
	}

	// wrap around if we didn't already find one
	for (var i = 0; i < index; ++i) {
		var type = getFileType(popupFeature[i].media);
		if (type == 'image') {
			return i;
		}
	}

	// return the same index if we didn't find any other images
	return index;
}

$(document).ready(function () {
	console.log('document ready');

	$(document).click(function () {
		hideQueueItemDelete();
	});

	$('#fs-audio').position({
		my:	'center',
		at:	'center',
		of:	$('#image-viewer')
	});

	var $queue_item;

	/*
	$('.locImage').live('click', onImageClick_Single);
	$('.locImageMultiple').live('click', function() {
		var $gallery = $('#gallery');
		$gallery.empty();
		populateGallery($gallery, popupFeature);
		$.mobile.changePage('#gallery-page');
	});
	*/

	var $viewer = $('#image-viewer');
	$('.gallery-item').live('click', function(e) {
		var type = $(this).attr('media-type');
		var src = $(this).attr('media-src');

		if (type == 'image') {
			$('#fs-audio').hide();

			var $container = $('#fs-image');
			var $img = $('#chosenImage');
			$img.load(function() {
				$(this).position({
					my:	'center',
					at:	'center',
					of:	$viewer
				});
				$viewer.find('a').position({
					my:	'center',
					at:	'right top',
					of:	$img,
					collision:	'none'
				});
			});
			$img.attr('src', src);
			$container.show();

			var $overlay = $(this).find('.item-metadata').clone();
			$('#image-metadata').replaceWith($overlay);
			$overlay.attr('id', 'image-metadata');
			$.mobile.changePage($viewer);
		}
	});

	$('#image-viewer').live('swipeleft', function() {
		// Get the current index of the displayed image
		var $img = $('#chosenImage');
		var src = $img.attr('src');
		var index = indexOfSrc(src);

		if (index != -1) {
			var next = nextImage(index);
			if (next != index) {
				$img.attr('src', popupFeature[next].media);

				// TODO: This is nearly identical to the code in populateGallery()
				var $overlay = $('#image-metadata');
				$overlay.find('span').text(popupFeature[next].name + ' - ' + StatusRef.fromId(popupFeature[next].status).toString());

				var itemdate = $.format.date(popupFeature[next].date, "MM-dd-yyyy hh:mm a");				
				$overlay.find('time').attr('datetime', itemdate);
				$overlay.find('time').text(itemdate);

				$.mobile.changePage('#image-viewer', { allowSamePageTransition: true, transition: 'slide', changeHash: false, reverse: false });
			}
		}
	});
	$('#image-viewer').live('swiperight', function() {
		// Get the current index of the displayed image
		var $img = $('#chosenImage');
		var src = $img.attr('src');
		var index = indexOfSrc(src);

		if (index != -1) {
			var prev = prevImage(index);
			if (prev != index) {
				$img.attr('src', popupFeature[prev].media);

				// TODO: This is nearly identical to the code in populateGallery(), as well as above in swipeleft
				var $overlay = $('#image-metadata');
				$overlay.find('span').text(popupFeature[prev].name + ' - ' + StatusRef.fromId(popupFeature[prev].status).toString());

				var itemdate = $.format.date(popupFeature[prev].date, "MM-dd-yyyy hh:mm a");				
				$overlay.find('time').attr('datetime', itemdate);
				$overlay.find('time').text(itemdate);

				$.mobile.changePage('#image-viewer', { allowSamePageTransition: true, transition: 'slide', changeHash: false, reverse: true });
			}
		}
	});

	$('#image-viewer img').live('click', function() {
		history.back();
	});

	$('.queue-list-item').live('click', function(e) {
		$queue_item = $(this);
	});

	$('.galleryPlayYoutube').live('click', function(e){
		var videoId = $(this).attr('videoId');
		window.location = "http://www.youtube.com/watch?v=" + videoId;
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
		
		$(div_Map).animate({rotate: '0deg'}, 1000);
		$("#northIndicator").animate({rotate: '0deg'}, 1000);
	
		map.events.rotationAngle = 0;
	});

	$('.address-list-item').live('click', function(){
		var coordinates = $(this).attr('location');
		var commaIndex = coordinates.indexOf(",");
		var lat = coordinates.substring(0, commaIndex);
		var lon = coordinates.substr(commaIndex+1);
		
		map.setCenter(new OpenLayers.LonLat(lon, lat), 17);							
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
	
	$('#centerButton').live('click', centerMap);
				  
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
	
	$('input[name="checkbox-QueueA"]').live('change',filterUpdated);
});

function submitToServer() {
	getValidLocationRowIds(sqlDb, function (rowids) {
		forLocationQueueRows(sqlDb, rowids, function(rows) {
			for (var i = 0; i < rows.length; ++i) {
				var sql = '';
				var row = rows.item(i);
				sql += 'INSERT INTO ' + FusionTableId.locations() + ' (Location,Name,Status,Date,DeviceID,DevicePlatform,DeviceVersion,MediaURL) VALUES (';
				sql += squote(row.location) + ',';
				//--------------------------------------------------
				//  DO NOT TOUCH! It may look wrong       +-Here
				//    but this will run fine.             v
					var name = row.name.replace(/\'/g, "\\'"); 
				//--------------------------------------------------
				sql += squote(name) + ',';
				sql += row.status + ',';
				sql += squote(row.date) + ',';
				sql += squote(DEVICE_ID) + ',';
				sql += squote(DEVICE_PLATFORM) + ',';
				sql += squote(DEVICE_VERSION) + ',';
				var photoguid = Math.uuid();
				var type = getFileType(row.media);
				
				if(type == "video")
				{
					//gonna have to make the url with the videoId returned from the upload callback
					uploadFileToServer(row, photoguid, sql);
				}else
				{
					var extensionIndex = row.media.lastIndexOf(".");
					var extension = row.media.substr(extensionIndex).toLowerCase();
					var amazonURL = "http://s3.amazonaws.com/mobileresponse/user/kzusy/" + photoguid + extension;
					
					sql += squote(amazonURL) + ');';
					uploadFileToS3(row, photoguid, sql);
				}
			}
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
	appNotifications = itemsInQueue;
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

function showStatusLayer() {
	if(!statusLayer.getVisibility()) {
		statusLayer.setVisibility(true);
	}
}

function hideStatusLayer() {
	if(statusLayer.getVisibility()) {
		statusLayer.setVisibility(false);;
	}
}

function setStatusLayerVisibility(_visible) {
	if(_visible) {
		showStatusLayer();
	} else {
		hideStatusLayer();
	}
}


function updateAppBadge(_amount) {
    if(_amount >= 1) {
        window.plugins.badge.set(_amount);
    }
    else {
        hideAppBadge();
	}
}

function hideAppBadge() {
    window.plugins.badge.clear();
}

function showQueueTab() {
	$.mobile.changePage('#queue-dialog', 'pop');
}

/*
        ==============================================
                  Event Listener Callbacks
        ==============================================

    When the application is put into the background via the home button, phone call, app switch, etc. it is paused. Any Objective-C code or PhoneGap code (like alert()) will not run. This callback will allow us to pause anything we need to to avoid time based errors.
 
*/
function onAppPause() {
    console.log('Listener: App has been paused.');
    isAppPaused = true;
    //Because native code won't run while an app is paused, all code below this line
    // will not run until the app is reopened again.
}

// Push any queued items to the server automatically, or with the user's consent,
// depending on the app's current settings.
var timeLastShown = 0;
var unsentPopupClosed = true;
function submitQueuedItems() {
	var currentTimeInSeconds = new Date().getTime() / 1000;
	
	// Only allow the popup every 5 minutes, only if the popup isn't already up, and only if on the map page
	if (unsentPopupClosed && currentTimeInSeconds - timeLastShown > 300 && $.mobile.activePage.attr('id') == 'map-page') {
		// If itemsInQueue is 1 or more we have data to push.
		if(itemsInQueue >= 1) {
			// Check to see if any are actually ready to be pushed (i.e. have a proper name and status set)
			var total = 0;
			var valid = 0;
			forAllLocations(sqlDb, function(row) {
				++total;

				if (row.status && row.name) {
					++valid;
				}

				if (total == itemsInQueue && valid > 0) {
					//If auto push is on, try and push the data to the server.
					if(isAutoPush) {
						submitToServer();
					}
					else {
						timeLastShown = new Date().getTime() / 1000;
						unsentPopupClosed = false;

						navigator.notification.confirm('You have unsent items.  Send now?', function (response) {
							unsentPopupClosed = true;
							switch (response) {
								case 1:
									submitToServer();
									break;
							}
						});
					}
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
function onOrientationChange(_event) {

}

function updateScreenSize() {
	screenWidth  = window.innerWidth;
	screenHeight = window.innerHeight;
}

function getOrientation() {
	return window.orientation;
}

function getOrientationHeadingOffset() {
	return orientationHeadingOffset;
}

function updateOrientationHeading() {
	switch (getOrientation()) {
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
}

/*
	Returns true if the application is in Landscape mode.
*/
function isOrientationLandscape() {
	if(orientationHeadingOffset == 90 || orientationHeadingOffset == -90)
		return true;
	else
		return false;
}

/*
	Returns true if the application is in Portrait mode.
*/
function isOrientationPortrait() {
	if(orientationHeadingOffset == 0 || orientationHeadingOffset == 180)
		return true;
	else
		return false;
}

/*
    This function is called whenever the device is switched over to landscape mode. Here we can do things like resize our viewport.
 */
function onOrientationLandscape() {
    console.log('Listener: App has changed orientation to Landscape ' + getOrientation() + '.');
}

/*
 This function is called whenever the device is switched over to portrait mode. Here we can do things like resize our viewport.
 */
function onOrientationPortrait() {
    console.log('Listener: App has changed orientation to Portrait ' + getOrientation() + '.');
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
