$(document).ready(function(){
    
    /*
        PAGINATION BEGIN
    */
	
	function goToPage(page_trigger){
		
		let current_page = $(".page.active");
        let destination_page = $(`.page[page="${page_trigger}"]`);
		
		if (current_page.is(destination_page)){
			console.log("Already at destination page");
			return;
		}
		
		$("a[page_trigger].active").removeClass("active");
		$(this).addClass("active");
        
        let current_page_col = current_page.attr("page_column_x");
        let destination_page_col = destination_page.attr("page_column_x");
        
        console.log(`Page ${page_trigger} | Going from ${current_page_col} to ${destination_page_col}`);
        
		current_page.stop();
		destination_page.stop();
		
		let destination_page_preset_left = (destination_page_col >= current_page_col) ? "100%" : "-100%"
		let current_page_goal_left = (destination_page_col > current_page_col) ? "-100%" : "100%";

		destination_page.css("left", destination_page_preset_left);
		destination_page.animate({
			left : "0"
		}, {
			duration : 200,
			queue : false
		})
		current_page.animate({
			left : current_page_goal_left
		}, {
			duration : 200,
			queue : false,
			complete : function(){
				$(".page.active").removeClass("active");
				destination_page.addClass("active");
			}
		})
		
	}
	
	window.goToPage = goToPage;
    
    $("a[page_trigger]").mousedown(function(e){
        e.preventDefault();
        
        let page_trigger = $(this).attr("page_trigger");
		goToPage(page_trigger);
		
		if (e.which !== 3){
			$(".sidebar").removeClass("open");
		}
        
			
    })
    
    /*
        PAGINATION END
    */
    
    /*
        SIDEBAR BEGIN
    */
    
    $(".sidebar-toggle").click(function(e){
        e.preventDefault();
        
        $(".sidebar").toggleClass("open");
    })
    
    /*
        SIDEBAR END
    */
    
})