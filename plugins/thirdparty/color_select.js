(function()
{
	var ColorwheelDatasource = function(settings, updateCallback) {
        var server = window.location.hostname;
        var wsUri, ws;
        var self = this;
        var currentSettings = settings;
        function wsStart(wsUri) {
            ws = new WebSocket(wsUri);
            ws.onopen = function(evt) {
                console.log("cw_ws : connected");
				ws.send("cfg");
            };
            ws.onclose = function(evt) {
                console.log("cw_ws : disconnected");
                setTimeout(function(){wsStart(wsUri)}, 3000); // try to reconnect every 3 secs...
            }
            ws.onmessage = function (evt) {
                try {
                    var da = JSON.parse(evt.data);
                    updateCallback(da);
                } catch (e) {
                    console.log("cw:ws : bad parse",evt.data);
                }
            }
            ws.onerror = function(evt) {
                console.log("cw_ws : error",evt);
            }
        }
		this.sendvalues = function(value){
			//if(ws.readyState == 1){
				ws.send(value);
			//}
			console.log(value);
		}
        this.updateNow = function() {
            console.log("cw_ws: Update now");
        }
        this.onDispose = function() {
            console.log("cw_ws: Disposed");
        }
        this.onSettingsChanged = function(newSettings) {
            if (ws) ws.close();
            currentSettings = newSettings;
            wsUri = currentSettings.ws_uri;
            wsStart(wsUri);
        }
        self.onSettingsChanged(settings);
    };
    freeboard.loadDatasourcePlugin({
        type_name : "cw_web_socket",
        display_name: "Colorwheel Web Socket",
        settings : [
            {
                name : "ws_uri",
                display_name: "WS URI",
                description : "Example: ws://server:port/path",
                type : "text"
            }
        ],
        newInstance : function(settings, newInstanceCallback, updateCallback)
        {
            newInstanceCallback(new ColorwheelDatasource(settings, updateCallback));
        }
    });
	freeboard.loadWidgetPlugin({
		// Same stuff here as with datasource plugin.
		"type_name"   : "colorwheel",
		"display_name": "Colorwheel",
        "description" : "Colorwheel",
		// **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
		"external_scripts": [
			"plugins/thirdparty/raphael.2.1.0.min.js",
			"plugins/thirdparty/colorwheel.js"
		],
		// **fill_size** : If this is set to true, the widget will fill be allowed to fill the entire space given it, otherwise it will contain an automatic padding of around 10 pixels around it.
		"fill_size" : true,
		"settings"    : [
			{
				"name"        : "data",
				"display_name": "Datasource",
				// We'll use a calculated setting because we want what's displayed in this widget to be dynamic based on something changing (like a datasource).
				"type"        : "calculated"
			},
			{
				"name"        : "onLED",
				"display_name": "ON LED",
				"type"        : "option",
				"options"     : [
					{
						"name" : "blue",
						"value": "led-blue"
					},
					{
						"name" : "green",
						"value": "led-green"
					},
					{
						"name" : "yellow",
						"value": "led-yellow"
					},
					{
						"name" : "red",
						"value": "led-red"
					}
				]
			},
			{
				"name"        : "offLED",
				"display_name": "OFF LED",
				"type"        : "option",
				"options"     : [
					{
						"name" : "blue",
						"value": "led-blue"
					},
					{
						"name" : "green",
						"value": "led-green"
					},
					{
						"name" : "yellow",
						"value": "led-yellow"
					},
					{
						"name" : "red",
						"value": "led-red"
					}
				]
			}
			
		],
		// Same as with datasource plugin, but there is no updateCallback parameter in this case.
		newInstance   : function(settings, newInstanceCallback)
		{
			newInstanceCallback(new ColorwheelPlugin(settings));
		}
	});

	// ### Widget Implementation
	//
	// -------------------
	// Here we implement the actual widget plugin. We pass in the settings;
	var ColorwheelPlugin = function(settings)
	{
		var self = this;
		var currentSettings = settings;
		var colors = [0,0,0,0];
		var isOn = false;
		var colorset = "";
		// Here we create an element to hold the text we're going to display. We're going to set the value displayed in it below.
		var led = $('<div class="io"></div>');
		var wheel = $('<div class="cw"></div>');
		var cw = Raphael.colorwheel(wheel, 290, 120);
		cw.onchange(function(color){
			colors = [parseInt(color.r), parseInt(color.g), parseInt(color.b),0];
			var o = isOn ? 1: 0;
			var msg ="set,"+colorset+","+o+","+colors.join(",");
			self.sendValue(currentSettings.data, msg);
		});
		this.onoff = function(e){
				e.preventDefault()
				isOn = !isOn;
				var o = isOn ? 1: 0;
				var msg ="set,"+colorset+","+o+","+colors.join(",");
				this.sendValue(currentSettings.data, msg);
				led.toggleClass(currentSettings.onLED).toggleClass(currentSettings.offLED);				
		}
		
		function updateState(){
			console.log("cw: ",isOn);
			console.log("cw_colors: ", colors);
			if(isOn){
				led.addClass(currentSettings.onLED);
			} else {
				led.addClass(currentSettings.offLED);
			}
			var col = "#" + ((1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2]).toString(16).slice(1);
			cw.color(col);
			console.log("cw_colstr: ",col);
		}
		
		
		// **render(containerElement)** (required) : A public function we must implement that will be called when freeboard wants us to render the contents of our widget. The container element is the DIV that will surround the widget.
		this.render = function(containerElement)
		{
			// Here we append our text element to the widget container element.
			$(containerElement).append(led);
			$(containerElement).append(wheel);
			$(led).click(this.onoff.bind(this));
		
		}

		// **getHeight()** (required) : A public function we must implement that will be called when freeboard wants to know how big we expect to be when we render, and returns a height. This function will be called any time a user updates their settings (including the first time they create the widget).
		//
		// Note here that the height is not in pixels, but in blocks. A block in freeboard is currently defined as a rectangle that is fixed at 300 pixels wide and around 45 pixels multiplied by the value you return here.
		//
		// Blocks of different sizes may be supported in the future.
		this.getHeight = function()
		{
			return 5;
		}

		// **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
		this.onSettingsChanged = function(newSettings)
		{
			// Normally we'd update our text element with the value we defined in the user settings above (the_text), but there is a special case for settings that are of type **"calculated"** -- see below.
			currentSettings = newSettings;
		}

		// **onCalculatedValueChanged(settingName, newValue)** (required) : A public function we must implement that will be called when a calculated value changes. Since calculated values can change at any time (like when a datasource is updated) we handle them in a special callback function here.
		this.onCalculatedValueChanged = function(settingName, newValue)
		{
			// Remember we defined "the_text" up above in our settings.
			if(settingName == "data")
			{
				console.log(newValue);
				colors = [parseInt(newValue.red),parseInt(newValue.green),parseInt(newValue.blue),parseInt(newValue.white)];
				isOn = Boolean(parseInt(newValue.on));
				//var values = newValue.payload.split(',');
				//colors = [parseInt(values[1]),parseInt(values[2]),parseInt(values[3])];
				//isOn = Boolean(parseInt(values[0]));
				colorset = newValue.colorset;
			}
			updateState();
		}

		// **onDispose()** (required) : Same as with datasource plugins.
		this.onDispose = function()
		{
		}
	}
}());