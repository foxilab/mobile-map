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
var fusionLayer_Locations;

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
var isAutoPush = true; 

var centered = false;
var locatedSuccess = true;


var navSymbolizer = new OpenLayers.Symbolizer.Point({
	pointRadius : 10,
    externalGraphic : "css/images/15x15_Blue_Arrow.png",
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

var navigationLayer = new OpenLayers.Layer.Vector("Navigation Layer",
{
    styleMap: navStyle
});

var statusLayer = new OpenLayers.Layer.Vector("Status Layer",
{
    styleMap: statusStyle
});

var statusSaveStrategy = new OpenLayers.Strategy.Save();
var statusWFSLayer = new OpenLayers.Layer.Vector("Status Layer",
{
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
	allOverlays: true,
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
	
    if(map)
    {
        var currentPoint = new OpenLayers.Geometry.Point(lon, lat).transform(WGS84, WGS84_google_mercator);
        var currentPosition = new OpenLayers.Feature.Vector(currentPoint);
        
        navigationLayer.removeAllFeatures();
        navigationLayer.addFeatures([currentPosition]);
        
        if(!centered)
        {
            map.setCenter(new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude)
                          .transform(WGS84, WGS84_google_mercator), 17);
            
            centered = true;
        }
    }
    
    locatedSuccess = true;
    //iPhone Quirks
    //  position.timestamp returns seconds instead of milliseconds.
}

var geolocationError = function(error){
    
    if(locatedSuccess)
    {
        //error handling
        if(error == PositionError.PERMISSION_DENIED)
            navigator.notification.alert("Location permission denied", function(){}, 'Error', 'Okay');
        else if(error == PositionError.POSITION_UNAVAILABLE)
            navigator.notification.alert("Location unavailable", function(){}, 'Error', 'Okay');
        else
            navigator.notification.alert("Location timeout", function(){}, 'Error', 'Okay');
        
        if(navigationLayer.features.length == 0)
        {
            var lon = -77.020000;
            var lat = 38.890000;
            
            var currentPoint = new OpenLayers.Geometry.Point(lon, lat).transform(WGS84, WGS84_google_mercator);
            var currentPosition = new OpenLayers.Feature.Vector(currentPoint);
            
            navigationLayer.addFeatures([currentPosition]);
            
            map.setCenter(new OpenLayers.LonLat(lon, lat)
                          .transform(WGS84, WGS84_google_mercator), 2);
        }
        
        locatedSuccess = false;
    }
    
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
    navSymbolizer.rotation = mapRotation;
    navigationLayer.redraw();
}

var compassError = function(error){
	//error handling
/*	if(error.code == CompassError.COMPASS_INTERNAL_ERR)
        navigator.notification.alert("compass internal error", function(){}, 'Error', 'Okay');
	else if(error.code == CompassError.COMPASS_NOT_SUPPORTED)
        navigator.notification.alert("compass not supported", function(){}, 'Error', 'Okay');
*/
}

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

var fusionLayerOptions = {
	projection: "EPSG:3857",
	numZoomLevels : 20,
	maxResolution: maxResolution,
	maxExtent: maxExtent,
	restrictedExtent: restrictedExtent,
};

function initializeFusionLayer() {
	fusionLayer_Locations = new OpenLayers.Layer.OSM("Fusion Table - locations",
	"http://mt0.googleapis.com/mapslt?hl=en-US&lyrs=ft:"+FusionTableId.locationsID()+"&x=${x}&y=${y}&z=${z}&w=256&h=256&source=maps_api",fusionLayerOptions);
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
 see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
 for more details -jm */

function onDeviceReady()
{
	//Now that the device is ready, lets set up our event listeners.
	document.addEventListener("pause"            , onAppPause         , false);
	document.addEventListener("resume"           , onAppResume        , false);
	document.addEventListener("online"           , onAppOnline        , false);
	document.addEventListener("offline"          , onAppOffline       , false);
	document.addEventListener("batterycritical"  , onBatteryCritical  , false);
	document.addEventListener("batterylow"       , onBatteryLow       , false);
	document.addEventListener("batterystatus"    , onBatteryStatus    , false);
	//  window.addEventListener("orientationchange", onOrientationChange,  true);

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
		}
	}
	catch (e) {
		// Do we need to handle this?
		navigator.notification.alert('Error opening database: ' + e);
	}
    
    //Set up NativeControls
	nativeControls = window.plugins.nativeControls;
        setupTabBar();
        setupNavBar();
    
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
	
	//Initalize the Fusion Table layer.
	initializeFusionLayer();
	
	var mapLayerOSM = new OpenLayers.Layer.OSM();
		map.addLayers([mapLayerOSM, fusionLayer_Locations, navigationLayer, statusLayer]);
		
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
			navigator.camera.getPicture(function (imageURI) 
			{
				insertToLocationQueueTable(sqlDb, lonlat.lon, lonlat.lat, null, imageURI, null);
                
               /* var point = new OpenLayers.Geometry.Point(lon, lat).transform(WGS84, WGS84_google_mercator);
                var location = new OpenLayers.Feature.Vector(point);
                
                navigationLayer.addFeatures([location]);*/
                                        
				// TODO: This sometimes flashes the map
				onClick_QueueTab();
                                        
                //We just added an item, update the queue size.
                updateQueueSize();
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

	/*var zoomPanel = new OpenLayers.Control.ZoomPanel({div: document.getElementById("zoomPanel")});
	map.addControl(zoomPanel);
	var zoomRight = .05 * mapHeight;
	$("#zoomPanel").css("right", "5%");
	$("#zoomPanel").css("bottom", zoomRight + "px");*/

	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	//Hack to keep the Queue tab selected while in the status dialog.
	$('#map-page').on('pageshow', function() {
		selectTabBarItem('Map');
	});
					  
	$('#queue-dialog').on('pageshow', function() {
		// TODO: more efficient to keep a 'dirty' flag telling us when we need to clear/update
		// rather than doing it every time.
		selectTabBarItem('Queue');
		forAllLocations(sqlDb, addToQueueDialog);
	});
	
	//Clear the queue when the user is done with the page,
	// fixes double queue on when you get over 20 items
	// blinks when you leave the page =/
	$('#queue-dialog').on('pagehide', function() {
		clearQueueDialog();
	});
	
	$('#user-dialog').on('pageshow', function() {
		selectTabBarItem('User');
	});
	
	$('#more-dialog').on('pageshow', function() {
		selectTabBarItem('More');
	});
						      
    //Now that we are done loading everything, read the queue and find the size
    // then update all the badges accordingly.
    updateQueueSize();
}

function clearQueueDialog() {
	$('#queue-dialog li').not('#queue-list-item-archetype').remove();
}

function addToQueueDialog(locRow) {
	var $clone = $('#queue-list-item-archetype').clone();	
	$clone.removeAttr('id');
	$clone.find('img').attr('src', locRow.photo);

	if (locRow.status >= 1) {
		$clone.find('h3').text(StatusRef.fromId(locRow.status).toString());
	}

	$clone.attr('rowid', locRow.id);
	$('#queue-dialog ul').append($clone);
	$clone.show();
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
		of:	$(this),
		offet:'0, 0'
	});
}

$(document).ready(function() {
	$(document).click(function() {
		hideQueueItemDelete();
	});

	var $queue_item;

	// TODO: Why do some of these only work with live() and not on() ?
	$('.queue-list-item').live('click', function(e) {
		$queue_item = $(this);
	});

	$('.queue-list-item').live('swipeleft', showQueueItemDelete)
	$('.queue-list-item').live('swiperight', hideQueueItemDelete);
	$('.queue-list-item').live('blur', hideQueueItemDelete);

	$('#queue-item-delete').live('click', function(e) {
		var id = $(this).attr('rowid');
		deleteLocation(sqlDb, id);
		$(this).hide();
		$('.queue-list-item').filter('[rowid="' + id + '"]').remove();
                     
        //An item was removed, update the queue size.
        updateQueueSize();
	});

	$('.status-list-item').on('click', function(e) {
		// See the text for the currently selected queue list item
		var $h3 = $queue_item.find('h3');
		$h3.text($(this).text());
		
		// Store back to local DB
		var id = $queue_item.attr('rowid');
		updateLocationStatus(sqlDb, id, $(this).attr('status-ref'));
	});

	$('.status-submit-button').on('click', function(e) {
		submitToServer();
	});
                  
	$('#plus').click(function(){
		map.zoomIn();
	});
						
	$('#minus').click(function(){
		map.zoomOut();
	});
});

function submitToServer() {
	getValidLocationRowIds(sqlDb, function (rowids) {
		forLocationQueueRows(sqlDb, rowids, function(rows) {
			var sql = '';
			for (var i = 0; i < rows.length; ++i) {
				var row = rows.item(i);
				sql += 'INSERT INTO ' + FusionTableId.locations() + ' (Location,Name,Status,Date,PhotoURL) VALUES (';
				sql += squote(row.location) + ',';
				sql += squote(row.name) + ',';
				sql += row.status + ',';
				sql += squote(row.date) + ',';
				sql += squote('placeholder') + ')'; // TODO: upload the photo and store the URL

				if (rows.length > 1) {
					sql += ';';
				}
// TODO: Whoever wrote this, I think it's in the wrong place, or maybe it was just test code...
/*
				var commaIndex = row.location.indexOf(",");
				var lon = row.location.substr(0, commaIndex);
				var lat = row.location.substr(commaIndex+1);
				var point = new OpenLayers.Geometry.Point(lon, lat);
				
				 var statusColor;
				 
				 if(row.status == 1)
					 statusColor = "green";
				 else if(row.status == 2)
					 statusColor = "yellow";
				 else if(row.status == 3)
					 statusColor = "orange";
				 else
					 statusColor = "red";
								 
				var location = new OpenLayers.Feature.Vector(point, 
				{
					 name: row.name,
					 status: statusColor,
					 date: row.date
				 });
				 
				statusLayer.addFeatures([location]);
				statusWFSLayer.addFeatures([location]);
				statusLayer.redraw();
*/
			}

			// TODO: Whoever wrote this, are we using it, or should it be deleted?
	//		if(isInternetConnection)
	//			statusSaveStrategy.save();

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
    
    //Now we are ready to start, lets get the QueueSize
    sqlDb.transaction(getQueueSize, getQueueSizeErrorBC, getQueueSizeSuccessCB);
}

function getQueueSize(_tx) {
    //Gets all the rows from the locationqueue
    _tx.executeSql('SELECT * FROM locationqueue',[], 
       function(_tx, _result) { 
           itemsInQueue = _result.rows.length; }, 
       function(_tx, _error) {
            console.log('SQL Execute error'); return true; }
    );
}

function getQueueSizeSuccessCB() {
    //Now itemsInQueue is at the current count, update everything
    appNotifications += itemsInQueue;
    updateTabItemBadge('Queue', itemsInQueue);
    updateAppBadge(appNotifications);
}

function getQueueSizeErrorBC(_error) {
    console.log('getQueueSizeError: ' + _error.message);
}

/*
        ==============================================
                  NativeControls Functions
        ==============================================
 
    This array contains all the information about the buttons that we are going to have in the tab bar. It contains the name of the tab, the image used for the tab and what function to call when that tab is selected. 
 */
var tabBarItems = { tabs: [
      {'name': 'Map'  , 'image': '/www/TabImages/Map.png'  , 'onSelect': onClick_MapTab},
      {'name': 'Queue', 'image': '/www/TabImages/Queue.png', 'onSelect': onClick_QueueTab},
      {'name': 'User' , 'image': '/www/TabImages/User.png' , 'onSelect': onClick_UserTab},
      {'name': 'Debug', 'image': '/www/TabImages/Debug.png', 'onSelect': onClick_DebugTab},
      {'name': 'More' , 'image': 'tabButton:More'          , 'onSelect': onClick_MoreTab}]};

/*
    This function loops though the array and sets up the buttons for us. Then we add them to the tab bar and show the bar.
 */
function setupTabBar() {
    nativeControls.createTabBar();
        var _length = tabBarItems.tabs.length;
        for (var i = 0; i < _length; i++) {
            setUpButton(tabBarItems.tabs[i]);
        }
    nativeControls.showTabBarItems('Map', 'Queue', 'User', 'More', 'Debug');
    selectTabBarItem('Map');
    showTabBar();
}

/*
    Called by setupTabBar, this function creates the TabBarItems with the given params from our array.
 */
function setUpButton(_tabItem) {
    var options = new Object();
        options.onSelect = _tabItem.onSelect;
    nativeControls.createTabBarItem(_tabItem.name, _tabItem.name, _tabItem.image, options);
}

/*
    This function creates the Nav bar, sets up the buttons and their callbacks and then displays the nav bar.
 */
function setupNavBar() {
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

function updateAppBadge(_amount) {
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
}

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
}

/*
        ==============================================
            NativeControls Nav onClick Functions
        ==============================================
 */

function onClick_LeftNavBarButton() {
    //console.log('onClick: LeftNavBarButton');
    navigator.notification.alert('Left NavBar button was selected.', function(){}, 'Debug', 'Okay');
}

function onClick_RightNavBarButton() {
    //console.log('onClick: RightNavBarButton');
    navigator.notification.alert('Right NavBar button was selected.', function(){}, 'Debug', 'Okay');
}

/*
        ==============================================
             NativeControls Tab onClick Functions
        ==============================================
 */
function onClick_MapTab() {
    //console.log('onClick: MapTab');
	selectTabBarItem('Map');
    $.mobile.changePage('#map-page', 'pop');
}

function onClick_QueueTab() {
    //console.log('onClick: QueueTab');
	selectTabBarItem('Queue');
    $.mobile.changePage('#queue-dialog', 'pop');
}

function onClick_UserTab() {
    //console.log('onClick: UserTab');
	selectTabBarItem('User');
    $.mobile.changePage('#user-dialog', 'pop');
}

function onClick_MoreTab() {
    //console.log('onClick: MoreTab');
	selectTabBarItem('More');
    $.mobile.changePage('#more-dialog', 'pop');
}

//Temporary option to allow us to open a different tab and access debug information
// like Device, iOS version, current location, etc.
function onClick_DebugTab() {
    //console.log('onClick: DebugTab');
	selectTabBarItem('Debug');
	window.open ('Debug.html','_self',false);
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
    orDirtyToggle = !orDirtyToggle;
    if(orDirtyToggle) {
        switch(window.orientation) {
            case -90:   //Landscape with the screen turned to the left.
                onOrientationLandscape(window.orientation);
                break;
            
            case 0:     //Default view
                onOrientationPortrait(window.orientation);
                break;
  
            case 90:    //Landscape with the screen turned to the right.
                onOrientationLandscape(window.orientation);
                break;
            
            case 180:   //Upside down.
                onOrientationPortrait(window.orientation);
                break;
            
            default: 
                navigator.notification.alert('Orientation issue.', function(){},'Error','Okay');
                break;
        }
    }
}

/*
    This function is called whenever the device is switched over to landscape mode. Here we can do things like resize our viewport.
 */
function onOrientationLandscape(_orientation) {
    console.log('Listener: App has changed orientation to Landscape ' + _orientation + '.');
    isLandscape = true;
}

/*
 This function is called whenever the device is switched over to portrait mode. Here we can do things like resize our viewport.
 */
function onOrientationPortrait(_orientation) {
    console.log('Listener: App has changed orientation to Portrait ' + _orientation + '.');
    isLandscape = false;
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
