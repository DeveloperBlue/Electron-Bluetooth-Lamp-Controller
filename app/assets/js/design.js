let color_picker = new iro.ColorPicker(".color-wheel", {
	width : 256,
	height : 256,
	handleRadius : 8,
	wheelLightness : false,
	layout : [
		{
			component : iro.ui.Wheel
		}
	]
});

let brightness_slider = new iro.ColorPicker(".brightness-slider", {
	width : 256,
	layout : [
		{
			component : iro.ui.Slider
		}
	]
})


color_picker.on("color:change", function(color){
	brightness_slider.color.set(color);
})

brightness_slider.on("color:change", function(color){
	color_picker.color.set(color);
})

$(".color-presets > a").click(function(e){
	e.preventDefault();
	
	let color = $(this).children("span").css("background-color");
	console.log(color);
	color_picker.color.set(color);
	
	return false;
})

