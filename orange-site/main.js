'use strict';

//const + showDiv do this:
//keep track of which section within <main> is actively showing
//slide the active section off to the right
//slide the new section in from the left (not visited) or right (previously visited)
//animation is embedded in classes; this just changed classes
//because we are not changing pages, we need to hide the menu
//animation for fading out menu is included via script.

const globalConstant = {
	activeSection: 'mainLanding',
};

//menu hides on click, this reactivates menu when the user tries to re-enter
function showMenu() {
	$('.navUl2Hide').addClass('navUl2'); 
	$('.navUl2').removeClass('navUl2Hide');
}

function moveDivBackLeft() {
	$('.mainHideRight').css("display","none");
	$('.mainHideRight').addClass('mainHideLeft');
	$('.mainHideLeft').removeClass('mainHideRight');
	$('.mainHideLeft').css("display","block");
	$('.mainHideLeft').css("height","100vh");
	$('.mainHideRight').css("height","100vh");
}

function showDiv(classToShow) {
	$('.slicknav_btn').addClass('slicknav_collapsed');
	$('.slicknav_open').addClass('slicknav_collapsed');
	$('.slicknav_collapsed').removeClass('slicknav_open');
	$('.slicknav_nav').addClass('slicknav_hidden');
	$('.slicknav_hidden').css("display", "none").attr("aria-hidden", "true");
	
	$('.navUl2').addClass('navUl2Hide'); //adds a non-hovered class so we can reverse this in the showMenu() function
	$('.navUl2Hide').removeClass('navUl2'); //removes class that includes hover state
	$('.'+globalConstant.activeSection).addClass('mainHideRight'); 
	$('.'+globalConstant.activeSection).removeClass('mainShow'); 
	//so mainShow slides in from the left. We do that on this selection.
	let fullClassToShow = 'mainShow ' + classToShow;
	$('.'+classToShow).attr('class' , fullClassToShow);
	globalConstant.activeSection = classToShow;

	window.setTimeout(moveDivBackLeft,3000);
}