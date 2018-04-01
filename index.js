function RemoveIdle(config) {
	this.reapIntervalMillis = config.reapIntervalMillis || 1000;
	this.idleTimeoutMillis = config.idleTimeoutMillis || 10000;
	this.refreshIdle = config.refreshIdle || true;
	this.returnToHead = config.returnToHead || false;
	this.scheduleRemoveIdle();
	this.min = config.min || 0;
	this.max = config.max || 1000;
	this.availableObjects = [];
	this._destroy = config.destroy || function() {};
	this._create = config.create ;
	this.logger = config.logger || null;
};
(function() {
	this.removeConditions = function() {
		return true;
	}
	this.ensureMinimum = function() {

	}
	this.dispense = function() {

	}
	this.getIdle = function(obj) {
		this.availableObjects = this.availableObjects.filter(function(objWithTimeout) {
			return (objWithTimeout.obj !== obj);
		});
	}
	this.size = function() {
		return this.availableObjects.length;
	}
	this.update = function(obj) {
		for( var i = 0, len = this.availableObjects.length; i < len; i ++ ) {
			if(obj == this.availableObjects[i].obj) {
				this.availableObjects[i].timeout = new Date().getTime() + this.idleTimeoutMillis;
			}
		}
	}
	this.release = function(obj) {
		if(this.availableObjects.some(function(objWithTimeout) {
			if(objWithTimeout.obj === obj) {
				objWithTimeout.timeout = new Date().getTime() + this.idleTimeoutMillis;
				return true;
			}
		})) {
			this.logger && this.logger.error("called twice for the smae resource");
			return;
		}
		var objWithTimeout = { obj: obj, timeout: Date.now() + this.idleTimeoutMillis };
		if(this.returnToHead) {
			this.availableObjects.splice(0,0,objWithTimeout);
		}else{
			this.availableObjects.push(objWithTimeout);
		}
		this.dispense();
		this.scheduleRemoveIdle();
	}
	this.removeIdle = function() {
		var toRemove = [],
		 now = Date.now(),
		 self = this,
		 timeout;
		 this.removeIdleScheduled = false;
		 for(var i = 0, len = toRemove.length; i < len; i++) {
		 	self.destroy(toRemove[i]);
		 }
		 if(this.availableObjects.length > 0) {
		 	this.scheduleRemoveIdle();
		 }
	}
	this.scheduleRemoveIdle = function() {
		if(!this.removeIdleScheduled) {
			this.removeIdleScheduled = true;
			this.removeIdleTimer = setTimeout(this.removeIdle.bind(this), this.reapIntervalMillis);
		}
	}
	this.destroy = function(obj) {
		this.getIdle(obj);
		this._destroy(obj);
		this.ensureMinimum();
	}
	this.destroyAllNow = function(callback) {
		var willDie = this.availableObjects;
		this.availableObjects = [];
		var obj = willDie.shift();
		var self = this;
		while(obj !== null && obj !== undefined) {
			self.destroy(obj.obj);
			obj = willDie.shift();
		}
		this.removeIdleScheduled = false;
		clearTimeout(this.removeIdleTimer);
		if(callback) {
			callback();
		}
	}
}).call(RemoveIdle.prototype);
module.exports = RemoveIdle;