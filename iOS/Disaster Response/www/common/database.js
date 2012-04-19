function errorSql(e) {
	alert("errorsql")
	navigator.notification.alert('Error processing SQL: ' + e.code + ' in function ' + arguments.callee.caller.toString());
}

function quote(str) {
	if (str)
		return '"' + str + '"';
		
	return '""';
}
function squote(str) {
	if (str)
		return "'" + str + "'";
		
	return "''";
}

var StatusRef = new function () {
	function ref (i, str) {
		this.id = function () { return i; }
		this.toString = function () { return str; }
	}

	// TODO: Figure out a way to keep this table in-sync with the fusion table
	this.operational = function () { return new ref(1, 'Operational'); }
	this.limited = function () { return new ref(2, 'Limited Capabilities'); }
	this.uninhabited = function () { return new ref(3, 'Intact, but Uninhabited'); }
	this.nonoperational = function () { return new ref(4, 'Non-operational'); }

	this.fromId = function (id) {
		switch (id) {
			case 1:
				return this.operational();
			case 2:
				return this.limited();
			case 3:
				return this.uninhabited();
			case 4:
				return this.nonoperational();
		}
		return null;
	}
};

function createStatusRefTable(db) {
	/* STATUSREF
	ID		STATUS
	1		Operational
	2		Limited Capabilities
	3		Intact, but Uninhabited
	4		Non-operational
	*/

	var populate = function (tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS statusref (id INTEGER PRIMARY KEY, status TEXT NOT NULL)');

		tx.executeSql('SELECT * FROM statusref', [], function(t, results) {
			if (results.rows.length === 0) {
				t.executeSql('INSERT INTO statusref (status) VALUES (' + quote(StatusRef.operational().toString()) + ')');
				t.executeSql('INSERT INTO statusref (status) VALUES (' + quote(StatusRef.limited().toString()) + ')');
				t.executeSql('INSERT INTO statusref (status) VALUES (' + quote(StatusRef.uninhabited().toString()) + ')');
				t.executeSql('INSERT INTO statusref (status) VALUES (' + quote(StatusRef.nonoperational().toString()) + ')');
			}
		});
	};

	db.transaction(populate, errorSql);
}

function createQueueTable(db) {
	/* LOCATIONQUEUE
	ID		LOCATION			NAME			MEDIA			DATE					STATUS
	0		100.1, 38.4		Wal-Mart		/file/URI	ISO8601 string		1
	*/
	var create = function (tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS locationqueue (id INTEGER PRIMARY KEY, location TEXT NOT NULL, name TEXT, media TEXT NOT NULL, date DATETIME NOT NULL, status INTEGER, FOREIGN KEY(status) REFERENCES statusref(id))');
	};

	db.transaction(create, errorSql);
}

function createAddressSearchTable(db){
	var create = function (tx){
		tx.executeSql('CREATE TABLE IF NOT EXISTS searchAddresses (id INTEGER PRIMARY KEY, coordinates TEXT NOT NULL, address TEXT NOT NULL)');
	};
	
	db.transaction(create, errorSql);
}

function forEachLocationQueueRow(db, rowids, func) {
	if ($.isArray(rowids)) {
		var val = -1;
		var query = function (tx) {
			tx.executeSql('SELECT * FROM locationqueue WHERE id IN (' + rowids.toString() + ')', [], function(t, results) {
				if (func) {
					for (var i = 0; i < results.rows.length; ++i) {
						func.call(results.rows.item(i), results.rows.item(i));
					}
				}
			});
		};

		db.transaction(query, errorSql);
	}
}

function forLocationQueueRows(db, rowids, func) {
	if ($.isArray(rowids)) {
		var val = -1;
		var query = function (tx) {
			tx.executeSql('SELECT * FROM locationqueue WHERE id IN (' + rowids.toString() + ')', [], function(t, results) {
				func.call(func, results.rows);
			});
		};

		db.transaction(query, errorSql);
	}
}
function forAllAddresses(db, func) {
	var query = function (tx){
		tx.executeSql('SELECT * FROM searchAddresses ORDER BY id DESC', [], function(t, results){
			  if(func){
				  for(var i=0; i < results.rows.length; ++i){
					  func.call(null, results.rows.item(i));
				  }
			  }
		});
	};
	
	db.transaction(query, errorSql);
}

function forAllLocations(db, func) {
	var query = function (tx) {
		tx.executeSql('SELECT * FROM locationqueue ORDER BY id DESC', [], function(t, results) {
			if (func) {
				for (var i = 0; i < results.rows.length; ++i) {
					func.call(null, results.rows.item(i));
				}
			}
		});
	};

	db.transaction(query, errorSql);
}

function quotedOrNull(str) {
	if (str) {
		return quote(str);
	}

	return 'NULL';
}

function locationValuesString(location, name, media, date, status) {
	var values = 'VALUES(';
	
	values += quotedOrNull(location) + ',';
	values += quotedOrNull(name) + ',';
	values += quotedOrNull(media) + ',';
	values += quotedOrNull(date) + ',';
	
	if (status) {
		values += status;
	}
	else {
		values += 'NULL'
	}

	values += ')';
	
	return values;
}

function updateLocationCoordinates(db, id, coords) {
	var update = function (tx) {
		tx.executeSql('UPDATE locationqueue SET location=' + quote(coords) + ' WHERE id=' + id);
	};
	
	db.transaction(update, errorSql);
}

function updateLocationName(db, id, name) {
	var update = function (tx) {
		tx.executeSql('UPDATE locationqueue SET name=' + quote(name) + ' WHERE id=' + id);
	};
	
	db.transaction(update, errorSql);
}

function updateLocationStatus(db, id, status) {
	var update = function (tx) {
		tx.executeSql('UPDATE locationqueue SET status=' + status + ' WHERE id=' + id);
	};
	
	db.transaction(update, errorSql);
}

function dropAddressSeachTable(db) {
	var drop = function (tx) {
		tx.executeSql('DROP TABLE searchAddresses');
	};
	
	db.transaction(drop, errorSql);
}

function insertToAddressSearchTable(db, lon, lat, address){
	var insert = function(tx){
		var values = 'VALUES(';
		values += quote(lat + ',' + lon) + ',';
		values += quote(address) + ')';
		
		tx.executeSql('INSERT INTO searchAddresses (coordinates, address) ' + values, [], function(t, results){
		});
	};
	
	db.transaction(insert, errorSql);
}

function performQueueInsert(db, lon, lat, name, media, status){
	var insert = function (tx) {
		var values = 'VALUES(';
		values += quote(lat + ',' + lon) + ',';
		if (name) {
			values += quote(name) + ',';
		}
		else {
			values += 'NULL,';
		}
		
		values += quote(media) + ',';
		values += "datetime('now'),";
		
		if (status) {
			values += status;
		}
		else {
			values += 'NULL'
		}
		
		values += ')';
		
		tx.executeSql('INSERT INTO locationqueue (location, name, media, date, status) ' + values, [], function(t, results) {
			updateQueueSize();
			showQueueTab();
		});
	};
	
	db.transaction(insert, errorSql);
}

function insertToLocationQueueTable(db, lon, lat, name, media, status) {
	if (!name && popupFeatureMainName) {
		console.log("using popup feature's building name");
		name = popupFeatureMainName;
	}

	//alert("media: " + media);
	console.log("platform: " + device.platform);
	if(device.platform == 'Android')
	{
		console.log("i am android! hear me roar!");
		console.log("media.substr: " + media.substr(0, 7));
		if(media.substr(0, 7) == "content")
		{
			//alert("ya");
			window.resolveLocalFileSystemURI(media, function(fileObj) {
				performQueueInsert(db, lon, lat, name, fileObj.fullPath, status);
			});
		}else{
			//alert('no');
			performQueueInsert(db, lon, lat, name, media, status);
		}
	}else
		performQueueInsert(db, lon, lat, name, media, status);
}

function deleteLocation(db, rowid) {
	var remove = function(tx) {
		tx.executeSql('DELETE FROM locationqueue WHERE id=' + rowid);
	};
	
	db.transaction(remove, errorSql);
}

function getValidLocationRowIds(db, func) {
	var query = function(tx) {
		tx.executeSql('SELECT id FROM locationqueue WHERE status IS NOT NULL', [], function(t, results) {
			if (func) {
				var rowids = new Array();
				for (var i = 0; i < results.rows.length; ++i) {
					rowids.push(results.rows.item(i).id);
				}
				console.log(rowids);
				func.call(null, rowids);
			}
		});
	};
	
	db.transaction(query, errorSql);
}

// TODO: remove this since it's debug only?
function clearLocationQueueTable(db) {
	var remove = function (tx) {
		tx.executeSql('DELETE FROM locationqueue');
	};
	
	db.transaction(remove, errorSql);
}
