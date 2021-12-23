import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {changeParkingMode, changeParkingModeButton, storeParkingAngle} from "https://raw.githack.com/Huitney/topic/master/carMove.js";
import {car, camera, topCamera, raycaster, radarSound, longBeep, topView} from "https://raw.githack.com/Huitney/topic/master/init.js";
import {changeTopView} from "https://raw.githack.com/Huitney/topic/master/init.js";
import {pickables} from "https://raw.githack.com/Huitney/topic/master/buildDashboard.js";

var mouse = new THREE.Vector2();
var soundBT = false, CCW = 0;

export function onPointerDown (event) {
	
	event.preventDefault();  // may not be necessary
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	// find intersections
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(pickables, true);
	if (intersects.length > 0) {
		if(intersects[0].object.name == 'parkBT'){
			parkBTDown();
		}
		
		if(intersects[0].object.name == 'topViewBT'){
			topViewBTDown();
		}
		
		if(intersects[0].object.name == 'CCWBT'){
			CCWBTDown();
		}
		
		if(intersects[0].object.name == 'zoomInBT'){
			zoomInBTDown();
		}
		
		if(intersects[0].object.name == 'zoomOutBT'){
			zoomOutBTDown();
		}
		
		if(intersects[0].object.name == 'autoBT'){
			if(car.dashboard.autoBT.visible == true)
				autoBTDown();
			else if(car.dashboard.manuBT.visible == true)
				manuBTDown();
		}
		
		if(intersects[0].object.name == 'mode1BT'){
			if(car.dashboard.mode1BT.visible == true)
				mode1BTDown();
			else if(car.dashboard.mode2BT.visible == true)
				mode2BTDown();
		}
		
		if(intersects[0].object.name == 'radarOn'){
			if(car.dashboard.radarOn.visible == true)
				radarOnDown();
			else if(car.dashboard.radarOff.visible == true)
				radarOffDown();
		}
		
		if(intersects[0].object.name == 'mapIcon'){
			//mapIconDown();
		}
				
	}
}	

function parkBTDown(){
	changeParkingMode(1);
	storeParkingAngle();
	car.dashboard.autoBT.visible = true;
	car.dashboard.manuBT.visible = false;
	car.dashboard.gearFrame.position.z = -2.93;//R
	car.gear = 'r';
}

function topViewBTDown(){
	changeTopView();
	if(topView){
		car.dashboard.CCWBT.visible = true;
		car.dashboard.zoomInBT.visible = true;
		car.dashboard.zoomOutBT.visible = true;
		car.dashboard.splitLine.visible = true;
		car.mapArrow.visible = false;
	}else{
		car.dashboard.CCWBT.visible = false;
		car.dashboard.zoomInBT.visible = false;
		car.dashboard.zoomOutBT.visible = false;
		car.dashboard.splitLine.visible = false;
	}
}

function CCWBTDown(){
	CCW++;
	if(CCW % 4 == 1){
		topCamera.up.set(0, 0, -1);
		topCamera.lookAt(car.center);
	}
	else if(CCW % 4 == 2){
		topCamera.up.set(-1, 0, 0);
		topCamera.lookAt(car.center);
	}
	else if(CCW % 4 == 3){
		topCamera.up.set(0, 0, 1);
		topCamera.lookAt(car.center);
	}
	else if(CCW % 4 == 0){
		topCamera.up.set(1, 0, 0);
		topCamera.lookAt(car.center);
	}
}

function zoomInBTDown(){
	topCamera.left += window.innerWidth/130;
	topCamera.right -= window.innerWidth/130;
	topCamera.top -= window.innerHeight/60;
	topCamera.bottom += window.innerHeight/60;
	topCamera.updateProjectionMatrix();
}

function zoomOutBTDown(){
	topCamera.left -= window.innerWidth/130;
	topCamera.right += window.innerWidth/130;
	topCamera.top += window.innerHeight/60;
	topCamera.bottom -= window.innerHeight/60;
	topCamera.updateProjectionMatrix();
}

function autoBTDown(){
	changeParkingMode(0);
	car.dashboard.autoBT.visible = false;
	car.dashboard.manuBT.visible = true;
	car.dashboard.gearFrame.position.z = -3.08;//P
	car.gear = 'p';
}

function manuBTDown(){
	changeParkingMode(2);
	car.dashboard.autoBT.visible = true;
	car.dashboard.manuBT.visible = false;
	car.dashboard.gearFrame.position.z = -3.08;//P
	car.gear = 'p';
}

function mode1BTDown(){
	changeParkingModeButton(true);
	car.move(new THREE.Vector3(-112.5, 13, 13));
	car.rotate(0);
	car.dashboard.mode1BT.visible = false;
	car.dashboard.mode2BT.visible = true;
}

function mode2BTDown(){
	changeParkingModeButton(false);
	car.move(new THREE.Vector3(-118, 13, 23));
	car.rotate(0);
	car.dashboard.mode1BT.visible = true;
	car.dashboard.mode2BT.visible = false;
}

function radarOnDown(){
	soundBT = true;
	radarSound.volume = 0;
	radarSound.muted = true;
	longBeep.volume = 0;
	longBeep.muted = true;
	car.dashboard.radarOn.visible = false;
	car.dashboard.radarOff.visible = true;
}

function radarOffDown(){
	soundBT = false;
	radarSound.volume = 1;
	radarSound.muted = false;
	longBeep.volume = 1;
	longBeep.muted = false;
	car.dashboard.radarOn.visible = true;
	car.dashboard.radarOff.visible = false;
}

function mapIconDown(){
	//GPSView = !GPSView;
	topView = false;
	/*if(GPSView){
		car.dashboard.mapArrow.visible = true;
	}else{
		car.dashboard.mapArrow.visible = false;	
	}*/
	car.dashboard.CCWBT.visible = false;
	car.dashboard.zoomInBT.visible = false;
	car.dashboard.zoomOutBT.visible = false;
	car.dashboard.splitLine.visible = false;
}