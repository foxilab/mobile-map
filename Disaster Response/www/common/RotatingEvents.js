OpenLayers.RotatingEvents = OpenLayers.Class(OpenLayers.Events, {
	 rotationAngle: 0,
	 
	 mapSideLength: 0,
	 
	 getRotatedPoint: function(x , y){
		 var radians = this.rotationAngle * Math.PI/180;
		 var mxx = Math.cos(radians);
		 var mxy = -1 * Math.sin(radians);
		 var myx = Math.sin(radians);
		 var myy = Math.cos(radians);
		 var newX = (x * mxx) + (y * myx);
		 var newY = (x * mxy) + (y * myy);
		 
		 return {x: newX, y: newY};
	 },
	 
	 getMinXCoordinate: function(coordinates){
		 var minCoordinateIndex = 0;
		 for(var i=1;i < coordinates.length; i++)
		 {
			 if(coordinates[i].x < coordinates[minCoordinateIndex].x)
				 minCoordinateIndex = i;
		 }
		 
		 return minCoordinateIndex;
	 },
	 
	 getMaxYCoordinate: function(coordinates){
		 var maxCoordinateIndex = 0;
		 
		 for(var i=1;i < coordinates.length; i++)
		 {
			 if(coordinates[i].y < coordinates[maxCoordinateIndex].y)
			 maxCoordinateIndex = i;
		 }
		 
		 return maxCoordinateIndex;
	 },
	 
	 getNewXY: function(x, y){
		 if((this.rotationAngle % 360)!= 0){
			 var oldX = x;
			 var oldY = y;
			 
			 var degrees = this.rotationAngle * Math.PI/180;
			 
			 var newX = (oldX * Math.cos(degrees)) - (oldY * Math.sin(degrees));
			 var newY = (oldY * Math.cos(degrees)) + (oldX * Math.sin(degrees));
			 
			 return {x: newX, y: newY};
		 }else{
			 return {x: x, y: y};
		 }
	 },
	 
	 /**
	  * Method: getMousePosition
	  * 
	  * Parameters:
	  * evt - {Event} 
	  * 
	  * Returns:
	  * {<OpenLayers.Pixel>} The current xy coordinate of the mouse, adjusted
	  *                      for offsets
	  */
	 getMousePosition: function (evt) {
		 this.clearMouseCache();
		 if (!this.includeXY) {
			 this.clearMouseCache();
		 } else if (!this.element.hasScrollEvent) {
			 OpenLayers.Event.observe(window, "scroll", this.clearMouseListener);
			 this.element.hasScrollEvent = true;
		 }
		 
		 if (!this.element.scrolls) {
			 var viewportElement = OpenLayers.Util.getViewportElement();
			 this.element.scrolls = [
				 viewportElement.scrollLeft,
				 viewportElement.scrollTop
			 ];
		 }
		 
		 if (!this.element.lefttop) {
			 this.element.lefttop = [
				 (document.documentElement.clientLeft || 0),
				 (document.documentElement.clientTop  || 0)
			];
		 }
		 
		 if (!this.element.offsets) {
			 this.element.offsets = OpenLayers.Util.pagePosition(this.element);
		 }
		 
		 var halfMapHeight = this.mapSideLength/2;
		 
		 var rotatedCoordinates = new Array();
		 var topLeft = this.getRotatedPoint(-1*halfMapHeight, -1*halfMapHeight);
		 rotatedCoordinates.push(this.getRotatedPoint(halfMapHeight, -1*halfMapHeight)); //topRight
		 rotatedCoordinates.push(this.getRotatedPoint(-1*halfMapHeight, halfMapHeight)); //bottomLeft
		 rotatedCoordinates.push(this.getRotatedPoint(halfMapHeight, halfMapHeight)); //bottomRight
		 
		 var minXCoordinate = this.getMinXCoordinate(rotatedCoordinates);
		 var maxYCoordinate = this.getMaxYCoordinate(rotatedCoordinates);
		 
		 var xOffset = 0;
		 var yOffset = 0;
		 
		 if(this.rotationAngle % -360 > -270){
			 xOffset = rotatedCoordinates[minXCoordinate].x - topLeft.x;
		 }
		 
		 if(this.rotationAngle % -360 < -90)
			 yOffset = rotatedCoordinates[maxYCoordinate].y - topLeft.y;
		 
		 var oldX = (evt.clientX + this.element.scrolls[0]) - this.element.offsets[0] - this.element.lefttop[0] + xOffset;
		 var oldY = (evt.clientY + this.element.scrolls[1]) - this.element.offsets[1] - this.element.lefttop[1] + yOffset;
		 
		 var clientXY = this.getNewXY(oldX, oldY);
		 
		 return new OpenLayers.Pixel(
			 clientXY.x, 
			 clientXY.y
		 );
	 },
	 
	 CLASS_NAME: "OpenLayers.RotatingEvents"
 });