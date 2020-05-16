const Notification = {
	id : null,
	set : function(message, id, timeout){
		$(".notification > span").text(message);
		Notification.id = id;
		$(".notification").slideDown(20);


		if (timeout){
			setTimeout(function(){
				Notification.stop(id)
			}, timeout * 1000);
		}
	},
	stop : function(id){
		if ((typeof id == "undefined") || (typeof id !== undefined && Notification.id == id)){
			$(".notification").slideUp(40);
		}
	}
}
