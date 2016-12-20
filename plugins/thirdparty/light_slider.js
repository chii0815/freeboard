(function()
{
	freeboard.loadWidgetPlugin({
		// Same stuff here as with datasource plugin.
		"type_name"   : "lightslider",
		"display_name": "Light Slider",
        "description" : "Slider for Light",
		// **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
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
			newInstanceCallback(new SliderPlugin(settings));
		}
	});
	var SliderPlugin = function(settings){
		var self = this;
		var currentSettings = settings;
		var light = 0;
		var isOn = false;
		var colorset = "";
		// Here we create an element to hold the text we're going to display. We're going to set the value displayed in it below.
		var led = $('<div class="ios"></div>');
		var slider = $('<div class="slider"></div>');
		this.onoff = function(e){
				e.preventDefault()
				isOn = !isOn;
				var o = isOn ? 1: 0;
				var msg ="set,"+colorset+","+o+",0,0,0,"+light;
				this.sendValue(currentSettings.data, msg);
				led.toggleClass(currentSettings.onLED).toggleClass(currentSettings.offLED);				
		}
		 function updateState(){
			if(isOn){
				led.addClass(currentSettings.onLED);
			} else {
				led.addClass(currentSettings.offLED);
			}
			$(slider).slider("value", light);
			//console.log(light);
		 }
		
		
		// **render(containerElement)** (required) : A public function we must implement that will be called when freeboard wants us to render the contents of our widget. The container element is the DIV that will surround the widget.
		this.render = function(containerElement)
		{
			// Here we append our text element to the widget container element.
			$(containerElement).append(led);
			$(containerElement).append(slider);
			$(slider).slider({
				range: "min",
				min: 1,
				max: 255,
				slide: function(event, ui){
					light = ui.value;
					var o = isOn ? 1: 0;
					var msg ="set,"+colorset+","+o+",0,0,0,"+light;
					self.sendValue(currentSettings.data, msg);
				}
			});
			$(led).click(this.onoff.bind(this));
		
		}

		// **getHeight()** (required) : A public function we must implement that will be called when freeboard wants to know how big we expect to be when we render, and returns a height. This function will be called any time a user updates their settings (including the first time they create the widget).
		//
		// Note here that the height is not in pixels, but in blocks. A block in freeboard is currently defined as a rectangle that is fixed at 300 pixels wide and around 45 pixels multiplied by the value you return here.
		//
		// Blocks of different sizes may be supported in the future.
		this.getHeight = function()
		{
			return 1;
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
				//console.log("sl: ",newValue);
				light = parseInt(newValue.white);
				isOn = Boolean(parseInt(newValue.on));
				colorset = newValue.colorset;
			}
			updateState();
		}

		// **onDispose()** (required) : Same as with datasource plugins.
		this.onDispose = function()
		{
		}
	};
}());