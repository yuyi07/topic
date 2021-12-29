import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OBJLoader } from 'https://raw.githack.com/mrdoob/three.js/master/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://raw.githack.com/mrdoob/three.js/master/examples/jsm/loaders/MTLLoader.js';
import {Line2} from 'https://raw.githack.com/mrdoob/three.js/dev/examples/jsm/lines/Line2.js';
import {LineMaterial} from 'https://raw.githack.com/mrdoob/three.js/dev/examples/jsm/lines/LineMaterial.js';
import {LineGeometry} from 'https://raw.githack.com/mrdoob/three.js/dev/examples/jsm/lines/LineGeometry.js';
import {carParameter, scene} from "./init.js";
import {buildDashboard} from "./buildDashboard.js";
var traceMeshes = [], traceMeshesBlue = [];

export class Car {
	constructor(pos, size, materialArray, materialArray2, dashboard, mapArrow, sign, colorName = 'white') {
		this.center = pos;
		this.size = size; // array of halfwidth's
		this.mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0] * 2, size[1] * 2, size[2] * 2), materialArray);
		this.mesh.position.copy(pos);
		this.speed = 0;
		this.theta = 0.001;
		this.minDis = 0;
		this.gear = 'p';
		
		this.materialArray = materialArray;
		this.materialArray2 = materialArray2;
		this.dashboard = dashboard;
		this.dashboard.mesh.visible = false;
		this.mapArrow = mapArrow;
		
		this.brakeLightR = sign[0];
		this.brakeLightR.material.color.set('darkred');
		this.brakeLightR.position.set(-19.02, -6, 8);
		this.brakeLightL = sign[0].clone();
		this.brakeLightL.material.color.set('darkred');
		this.brakeLightL.position.set(-19.02, -6, -8);
		
		this.turnSignalR = sign[1];
		this.turnSignalR.material.color.set(0x998000);
		this.turnSignalR.position.set(-19.01, -6, 8);
		this.turnSignalL = sign[2];
		this.turnSignalL.material.color.set(0x998000);
		this.turnSignalL.position.set(-19.01, -6, -8);
		
		this.backUpLightR = sign[3];
		this.backUpLightR.material.color.set('darkgray');
		this.backUpLightR.position.set(-19.01, -6, 8);
		this.backUpLightL = sign[3].clone();
		this.backUpLightL.material.color.set('darkgray');
		this.backUpLightL.position.set(-19.01, -6, -8);
				
		this.leftfrontWheel = new THREE.Group();
		this.rightfrontWheel = new THREE.Group();
		this.leftRearWheel = new THREE.Group();
		this.rightRearWheel = new THREE.Group();
		this.seats = buildSeats();
		
		this.mesh.add(this.leftfrontWheel, this.rightfrontWheel, this.leftRearWheel, this.rightRearWheel
					, this.brakeLightR, this.brakeLightL, this.seats, this.turnSignalR, this.turnSignalL
					, this.backUpLightR, this.backUpLightL);
		scene.add(this.mesh, this.mapArrow);
		
		this.rotate(0); // set initial axes
	}

	rotate(angle) {
		this.angle = angle;

		let yAxis = new THREE.Vector3(0, 1, 0);
		this.axes = [];
		this.axes[0] = (new THREE.Vector3(1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.axes[1] = (new THREE.Vector3(0, 0, 1)).applyAxisAngle(yAxis, angle);
				
		this.dir = [];
		this.dir[0] = (new THREE.Vector3(1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.dir[1] = (new THREE.Vector3(-1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.dir[2] = (new THREE.Vector3(0, 0, 1)).applyAxisAngle(yAxis, angle);
		this.dir[3] = (new THREE.Vector3(0, 0, -1)).applyAxisAngle(yAxis, angle);
		
		this.c = [];
		this.mesh.updateWorldMatrix(true, false);
		this.c[0] = this.mesh.localToWorld(new THREE.Vector3(this.size[0], 0, 0));
		this.c[1] = this.mesh.localToWorld(new THREE.Vector3(-this.size[0], 0, 0));
		this.c[2] = this.mesh.localToWorld(new THREE.Vector3(0, 0, this.size[2]));
		this.c[3] = this.mesh.localToWorld(new THREE.Vector3(0, 0, -this.size[2]));
				
		this.mesh.rotation.y = angle;
		this.mapArrow.rotation.y = angle;
	}

	intersect(obbB) {
		// four axes to check
		let obbA = this;
		let sepAxes = [];
		sepAxes[0] = obbA.axes[0];
		sepAxes[1] = obbA.axes[1];
		sepAxes[2] = obbB.axes[0];
		sepAxes[3] = obbB.axes[1];
		
		let t = obbB.center.clone().sub(obbA.center.clone());
		for (let i = 0; i < 4; i++) {
			let sHat = sepAxes[i];
			let centerDis = Math.abs(t.dot(sHat));

			let dA = obbA.size[0] * Math.abs(obbA.axes[0].dot(sHat)) 
					+ obbA.size[1] * Math.abs(obbA.axes[1].dot(sHat));
			let dB = obbB.size[0] * Math.abs(obbB.axes[0].dot(sHat)) 
					+ obbB.size[1] * Math.abs(obbB.axes[1].dot(sHat));
			
			if (centerDis > dA + dB){
				return false;  // NOT intersect
			}
		}
		return true;  // intersect
	}
	
	move(pos){
		this.center.copy(pos);
		this.mesh.position.copy(this.center);
		this.mapArrow.position.copy(this.center);
	}
	
	changeColor(signal){
		if(signal)
			this.mesh.material = this.materialArray2;
		else
			this.mesh.material = this.materialArray;
	}
	
	calculateCloseDistance(obbB){
		let obbA = this;
		
		var min = [
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, obbA.size[2]))), dir:'xz'},
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, -obbA.size[2]))), dir:'x-z'},
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, -obbA.size[2]))), dir:'-x-z'},
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, obbA.size[2]))), dir:'-xz'},
			{dis:obbB.calculateDistance(obbA.c[1]), dir:'back'},
			{dis:obbB.calculateDistance(obbA.c[0]), dir:'front'}
		];
		
		return min;
	}

	calculateDistance(pointB) {
		// four axes to check
		let obbA = this;
		
		let x1 = (pointB.clone().sub(obbA.c[0])).dot(obbA.dir[0]);
		let x2 = (pointB.clone().sub(obbA.c[1])).dot(obbA.dir[1]);
		let z1 = (pointB.clone().sub(obbA.c[2])).dot(obbA.dir[2]);
		let z2 = (pointB.clone().sub(obbA.c[3])).dot(obbA.dir[3]);

		let dis = new THREE.Vector3(0, 0, 0);
		if(x1 > 0){
			if(z1 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, obbA.size[2])));
			}else if(z2 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, -obbA.size[2])));
			}else {
				dis.x = pointB.clone().sub(obbA.c[0]).dot(obbA.dir[0]);
				dis.z = 0;
			}
		}else if(x2 > 0){
			if(z1 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, obbA.size[2])));
			}else if(z2 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, -obbA.size[2])));
			}else {
				dis.x = pointB.clone().sub(obbA.c[1]).dot(obbA.dir[1]);
				dis.z = 0;
			}
		}else if(z1 > 0){
			dis.z = pointB.clone().sub(obbA.c[2]).dot(obbA.dir[2]);
			dis.x = 0;
		}else if(z2 > 0){
			dis.z = pointB.clone().sub(obbA.c[3]).dot(obbA.dir[3]);
			dis.x = 0;
		}else{
			dis.x = dis.z = 0;
		}
		
		return Math.sqrt(dis.x*dis.x + dis.z*dis.z);

	}
}
/*
export class Obstacle {
	constructor(pos, size, texture) {
		this.center = pos;
		this.size = size; // array of halfwidth's
		this.mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0]*2, size[1]*2, size[2]*2), new THREE.MeshBasicMaterial({map: texture, transparent:true}));
		this.mesh.position.copy(pos);
				
		scene.add(this.mesh);
		this.rotate(0); // set initial axes
	}

	rotate(angle) {
		this.angle = angle;

		let yAxis = new THREE.Vector3(0, 1, 0);
		this.axes = [];
		this.axes[0] = (new THREE.Vector3(1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.axes[1] = (new THREE.Vector3(0, 0, 1)).applyAxisAngle(yAxis, angle);
				
		this.dir = [];
		this.dir[0] = (new THREE.Vector3(1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.dir[1] = (new THREE.Vector3(-1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.dir[2] = (new THREE.Vector3(0, 0, 1)).applyAxisAngle(yAxis, angle);
		this.dir[3] = (new THREE.Vector3(0, 0, -1)).applyAxisAngle(yAxis, angle);
		
		this.c = [];
		this.mesh.updateWorldMatrix(true, false);
		this.c[0] = this.mesh.localToWorld(new THREE.Vector3(this.size[0], 0, 0));
		this.c[1] = this.mesh.localToWorld(new THREE.Vector3(-this.size[0], 0, 0));
		this.c[2] = this.mesh.localToWorld(new THREE.Vector3(0, 0, this.size[2]));
		this.c[3] = this.mesh.localToWorld(new THREE.Vector3(0, 0, -this.size[2]));
		
		this.mesh.rotation.y = angle;
	}
	
	calculateCloseDistance(obbB){
		let obbA = this;
		
		var min = [
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, obbA.size[2]))), dir:'xz'},
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, -obbA.size[2]))), dir:'x-z'},
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, -obbA.size[2]))), dir:'-x-z'},
			{dis:obbB.calculateDistance(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, obbA.size[2]))), dir:'-xz'},
			{dis:obbB.calculateDistance(obbA.c[1]), dir:'back'},
			{dis:obbB.calculateDistance(obbA.c[0]), dir:'front'}
		];
		
		return min;
	}

	calculateDistance(pointB) {
		// four axes to check
		let obbA = this;

		let x1 = (pointB.clone().sub(obbA.c[0])).dot(obbA.dir[0]);
		let x2 = (pointB.clone().sub(obbA.c[1])).dot(obbA.dir[1]);
		let z1 = (pointB.clone().sub(obbA.c[2])).dot(obbA.dir[2]);
		let z2 = (pointB.clone().sub(obbA.c[3])).dot(obbA.dir[3]);

		let dis = new THREE.Vector3(0, 0, 0);
		if(x1 > 0){
			if(z1 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, obbA.size[2])));
			}else if(z2 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, -obbA.size[2])));
			}else {
				dis.x = pointB.clone().sub(obbA.c[0]).dot(obbA.dir[0]);
				dis.z = 0;
			}
		}else if(x2 > 0){
			if(z1 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, obbA.size[2])));
			}else if(z2 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, -obbA.size[2])));
			}else {
				dis.x = pointB.clone().sub(obbA.c[1]).dot(obbA.dir[1]);
				dis.z = 0;
			}
		}else if(z1 > 0){
			dis.z = pointB.clone().sub(obbA.c[2]).dot(obbA.dir[2]);
			dis.x = 0;
		}else if(z2 > 0){
			dis.z = pointB.clone().sub(obbA.c[3]).dot(obbA.dir[3]);
			dis.x = 0;
		}else{
			dis.x = dis.z = 0;
		}
		return Math.sqrt(dis.x*dis.x + dis.z*dis.z);

	}
}

export class ObstacleCar {
	constructor(pos, size, modelName = 'truck') {
		this.center = pos;
		this.size = size; // array of halfwidth's
		//this.mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0]*2, size[1]*2, size[2]*2), new THREE.MeshBasicMaterial({map: texture, transparent:true}));
		this.mesh = readModel(modelName, size[0]);
		
		if(this.mesh){
			this.mesh.position.copy(pos);
			scene.add(this.mesh);
			this.rotate(0); // set initial axes
		}
	}

	rotate(angle) {
		this.angle = angle;

		let yAxis = new THREE.Vector3(0, 1, 0);
		this.axes = [];
		this.axes[0] = (new THREE.Vector3(1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.axes[1] = (new THREE.Vector3(0, 0, 1)).applyAxisAngle(yAxis, angle);
				
		this.dir = [];
		this.dir[0] = (new THREE.Vector3(1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.dir[1] = (new THREE.Vector3(-1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.dir[2] = (new THREE.Vector3(0, 0, 1)).applyAxisAngle(yAxis, angle);
		this.dir[3] = (new THREE.Vector3(0, 0, -1)).applyAxisAngle(yAxis, angle);
		
		this.c = [];
		this.mesh.updateWorldMatrix(true, false);
		this.c[0] = this.mesh.localToWorld(new THREE.Vector3(this.size[0], 0, 0));
		this.c[1] = this.mesh.localToWorld(new THREE.Vector3(-this.size[0], 0, 0));
		this.c[2] = this.mesh.localToWorld(new THREE.Vector3(0, 0, this.size[2]));
		this.c[3] = this.mesh.localToWorld(new THREE.Vector3(0, 0, -this.size[2]));
		
		this.mesh.rotation.y = angle;
	}
	
	calculateDistance(pointB) {
		// four axes to check
		let obbA = this;

		let x1 = (pointB.clone().sub(obbA.c[0])).dot(obbA.dir[0]);
		let x2 = (pointB.clone().sub(obbA.c[1])).dot(obbA.dir[1]);
		let z1 = (pointB.clone().sub(obbA.c[2])).dot(obbA.dir[2]);
		let z2 = (pointB.clone().sub(obbA.c[3])).dot(obbA.dir[3]);

		let dis = new THREE.Vector3(0, 0, 0);
		if(x1 > 0){
			if(z1 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, obbA.size[2])));
			}else if(z2 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(obbA.size[0], 0, -obbA.size[2])));
			}else {
				dis.x = pointB.clone().sub(obbA.c[0]).dot(obbA.dir[0]);
				dis.z = 0;
			}
		}else if(x2 > 0){
			if(z1 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, obbA.size[2])));
			}else if(z2 > 0){
				dis = pointB.clone().sub(obbA.mesh.localToWorld(new THREE.Vector3(-obbA.size[0], 0, -obbA.size[2])));
			}else {
				dis.x = pointB.clone().sub(obbA.c[1]).dot(obbA.dir[1]);
				dis.z = 0;
			}
		}else if(z1 > 0){
			dis.z = pointB.clone().sub(obbA.c[2]).dot(obbA.dir[2]);
			dis.x = 0;
		}else if(z2 > 0){
			dis.z = pointB.clone().sub(obbA.c[3]).dot(obbA.dir[3]);
			dis.x = 0;
		}else{
			dis.x = dis.z = 0;
		}
		return Math.sqrt(dis.x*dis.x + dis.z*dis.z);

	}
}
*/

export function buildCar(pos) {
    let loader = new THREE.TextureLoader();
    loader.setCrossOrigin('');
  
    var materialArray = [];
    materialArray.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/iRrkNU7.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/m8OcKV5.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/vjq6Rm5.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/vjq6Rm5.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/BbC4LNk.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/BbC4LNk.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
	
	var materialArray2 = [];
    materialArray2.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/JMN31Pd.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray2.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/E6Aa12z.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray2.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/bBnU4nu.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray2.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/bBnU4nu.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray2.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/E3Z6EF9.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
    materialArray2.push(new THREE.MeshLambertMaterial({
		map: loader.load ('./pictures/E3Z6EF9.png'),
		transparent: true, opacity: 0.7, side: THREE.DoubleSide, alphaTest: 0.5
	}));
  
    let wheelGeometry = new THREE.CylinderGeometry(5, 5, 2, 32, 1, true);
    let wheelMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.DoubleSide});
    let circle = new THREE.Mesh(new THREE.CircleGeometry(5, 32), 
								new THREE.MeshBasicMaterial({
									map: loader.load ('./pictures/ZeYqhuv.png'), 
									transparent: true, 
									side:THREE.DoubleSide
								}));
    circle.rotation.x = Math.PI/2;
    circle.position.y = 1;
    let circle2 = circle.clone();
    circle2.position.y = -1;
	
	//dashboard
	let dashboard = buildDashboard();
	
	let bodyLength = carParameter[carParameter.map(x =>x.name).indexOf('bodyLength')].value
	, bodyWidth = carParameter[carParameter.map(x =>x.name).indexOf('bodyWidth')].value
	, axelLength = carParameter[carParameter.map(x =>x.name).indexOf('axelLength')].value
	, frontWheelToBackWheel = carParameter[carParameter.map(x =>x.name).indexOf('frontWheelToBackWheel')].value;
	
	//mapArrow
	var arrowMesh = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({
																		map: loader.load('./pictures/1wmEVdS.png'),
																		alphaTest: 0.5,
																		side: THREE.DoubleSide
																	}));
	arrowMesh.rotation.z = -Math.PI/2;
	arrowMesh.rotation.x = Math.PI/2;
	let mapArrow = new THREE.Group();
	mapArrow.add(arrowMesh);
	mapArrow.visible = false;
	
	//brakeLight
	var brakeLight = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial({
																		map: loader.load('./pictures/CrbaIo1.png'),
																		alphaTest: 0.5,
																		side: THREE.DoubleSide
																	}));
	brakeLight.rotation.y = Math.PI/2;
	
	//turnSignal
	var turnSignalR = new THREE.Mesh(new THREE.RingGeometry(1.3, 2, 32, 8, Math.PI, Math.PI), new THREE.MeshBasicMaterial({
																		map: loader.load('./pictures/CrbaIo1.png'),
																		alphaTest: 0.5,
																		side: THREE.DoubleSide
																	}));
	turnSignalR.rotation.y = Math.PI/2;
	var turnSignalL = new THREE.Mesh(new THREE.RingGeometry(1.3, 2, 32, 8, Math.PI, Math.PI), new THREE.MeshBasicMaterial({
																		map: loader.load('./pictures/CrbaIo1.png'),
																		alphaTest: 0.5,
																		side: THREE.DoubleSide
																	}));
	turnSignalL.rotation.y = Math.PI/2;
	
	//backUpLight
	var backUpLight = new THREE.Mesh(new THREE.RingGeometry(1.3, 2, 32, 8, 0, Math.PI), new THREE.MeshBasicMaterial({
																		map: loader.load('./pictures/CrbaIo1.png'),
																		alphaTest: 0.5,
																		side: THREE.DoubleSide
																	}));
	backUpLight.rotation.y = Math.PI/2;
  
    // assembly
    let car = new Car(pos, [bodyLength/2, bodyWidth/2, 10], materialArray, materialArray2, dashboard, mapArrow, [brakeLight, turnSignalR, turnSignalL, backUpLight], 'white');
	
    // wheels
    let mesh1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    car.leftfrontWheel.position.set(frontWheelToBackWheel/2, -axelLength/2, -axelLength/2);
    mesh1.add(circle);
    mesh1.add(circle2);
    car.leftfrontWheel.add(mesh1);
    //important!!
    mesh1.rotation.x = Math.PI/2;
  
    let mesh2 = mesh1.clone();
    car.rightfrontWheel.position.set(frontWheelToBackWheel/2, -axelLength/2, axelLength/2);
    car.rightfrontWheel.add(mesh2);
    
    let mesh3 = mesh1.clone();
    car.leftRearWheel.position.set(-frontWheelToBackWheel/2, -axelLength/2, -axelLength/2);
    car.leftRearWheel.add(mesh3);
  
    let mesh4 = mesh1.clone();
    car.rightRearWheel.position.set(-frontWheelToBackWheel/2, -axelLength/2, axelLength/2);
    car.rightRearWheel.add(mesh4);
		
    return car;
}

function buildSeats(){
	var seats = new THREE.Group();
	
	//backSeats
	let shape = new THREE.Shape();
	shape.moveTo( 0,0 );
	shape.lineTo( 0, 10 );
	shape.lineTo( 3, 10 );
	shape.lineTo( 3, 6 );
	shape.lineTo( 9, 6 );
	shape.lineTo( 9, 10 );
	shape.lineTo( 12, 10 );
	shape.lineTo( 12, 0 );
	shape.lineTo( 0, 0 );

	let extrudeSettings = {
		steps: 2,
		depth: 2,
		bevelThickness: 1,
		bevelSize: 1,
		bevelSegments: 1
	};
	
	let geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
	let backSeats = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x323740, transparent: true, opacity: 0.7 } ) ) ;
	backSeats.position.set(-12, -5, -6);
	backSeats.rotation.y = -Math.PI/2;
	
	let longSeat = new THREE.Mesh( new THREE.BoxGeometry( 5, 2, 14 ), new THREE.MeshLambertMaterial( {color: 0x323740, transparent: true, opacity: 0.7} ) );
	longSeat.position.set(6, 0, -1.5);
	longSeat.rotation.y = Math.PI/2;
	backSeats.add(longSeat);
	
	//frontSeat
	shape = new THREE.Shape();
	shape.moveTo( 0,0 );
	shape.lineTo( 0, 10 );
	shape.lineTo( 2, 10 );
	shape.lineTo( 2, 2 );
	shape.lineTo( 5, 2 );
	shape.lineTo( 5, 0 );
	shape.lineTo( 0, 0 );

	extrudeSettings = {
		steps: 2,
		depth: 4,
		bevelThickness: 1,
		bevelSize: 1,
		bevelSegments: 1
	};
	geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
	let frontSeatL = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x323740, transparent: true, opacity: 0.7 } ) ) ;
	frontSeatL.position.set(5, -5, -6);
	
	let frontSeatR = frontSeatL.clone();
	frontSeatR.position.set(5, -5, 2);
	
	
	seats.add( backSeats, frontSeatL, frontSeatR );
	return seats;
}

function readModel (modelName, targetSize=40) {
	var onProgress = function(xhr) {
	if (xhr.lengthComputable) {
		var percentComplete = xhr.loaded / xhr.total * 100;
			console.log(Math.round(percentComplete, 2) + '% downloaded');
		}
	};

	var onError = function(xhr) {};

	var mtlLoader =  new MTLLoader();
	mtlLoader.setPath('https://raw.githubusercontent.com/Huitney/topic/master/models/');
	mtlLoader.load(modelName+'.mtl', function(materials) {
		materials.preload();

		var objLoader =  new OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.setPath('https://github.com/Huitney/topic/tree/master/models/');
		objLoader.load(modelName+'.obj', function(object) {

		let theObject =  unitize (object, targetSize);
		theObject.add(new THREE.BoxHelper(theObject));
		theObject.name = 'OBJ'

		carModel = new THREE.Object3D();
		carModel.add(theObject);
		carModel.rotation.y = Math.PI/2;

		return carModel;

		}, onProgress, onError);

	});

}

function unitize (object, targetSize) {  

	// find bounding box of 'object'
	var box3 = new THREE.Box3();
	box3.setFromObject (object);
	var size = new THREE.Vector3();
	size.subVectors (box3.max, box3.min);
	var center = new THREE.Vector3();
	center.addVectors(box3.max, box3.min).multiplyScalar (0.5);

	console.log ('center: ' + center.x + ', '+center.y + ', '+center.z );
	console.log ('size: ' + size.x + ', ' +  size.y + ', '+size.z );

	// uniform scaling according to objSize
	var objSize = Math.max (size.x, size.y, size.z);
	var scaleSet = targetSize/objSize;

	var theObject =  new THREE.Object3D();
	theObject.add (object);
	object.scale.set (scaleSet, scaleSet, scaleSet);
	object.position.set (-center.x*scaleSet, center.y*scaleSet/6, -center.z*scaleSet);
	return theObject;
}

export function revLine(){
	var positions = [];


	let len = 2;
	for (let i = 0; i < len; i++) {
		positions.push(-10, -10, -10);
		positions.push(-10, -10, 10);
	
	}
	var geometry = new LineGeometry();
	geometry.setPositions(positions);


	var matLine = new LineMaterial({
		color: 0xffff00,
		linewidth: 0.05, // in pixels
		//vertexColors: THREE.VertexColors,
		//resolution:  // to be set by renderer, eventually
		dashed: false
	});
	const traceMesh = new Line2(geometry, matLine);
	traceMesh.computeLineDistances();
	for (var i = 0; i < 2; i++) {
		traceMeshes.push (traceMesh.clone());
		scene.add (traceMeshes[i]);
	}
	/////
	var positions1 = [];

	for (let i = 0; i < 9; i++) {  
		positions1.push(0, -10, 10);
		positions1.push(0, -10, -10);
		positions1.push(30, -10, -10);
		positions1.push(30, -10, 10);
		positions1.push(10, -10, 10);
		positions1.push(10, -10, -10); 
		positions1.push(0, -10, -10); 
		positions1.push(0, -10, 10); 
		positions1.push(20, -10, 10); 


	}

	var geometry1 = new LineGeometry();
	geometry1.setPositions(positions1);
	var matLine1 = new LineMaterial({
		color: 0x0080ff,
		linewidth: 0.03, // in pixels
		//vertexColors: THREE.VertexColors,
		//resolution:  // to be set by renderer, eventually
		dashed: false
	});

	var  traceMesh1 = new Line2(geometry1, matLine1);
	traceMesh1.computeLineDistances();
	
	traceMeshesBlue.push (traceMesh1.clone());

	scene.add (traceMeshesBlue[0]);
}

export class buildSidewalks{
	constructor(pos, size) {

		this.center = pos;
		this.size = size;// array of halfwidth's
		/*
		var extrudeSettings = {
			steps: 1,
			depth: 50,
			bevelEnabled: false,
		};*/
		this.mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0] * 2, size[1] * 2, size[2] * 2), new THREE.MeshLambertMaterial({
			color:0x000000,
			transparent:true,
			opacity:0
		}));
		this.mesh.rotation.x = Math.PI/2;
		this.mesh.position.y = 2;
		this.mesh.position.copy(pos);
				
		scene.add(this.mesh);
		
		this.rotate(0); // set initial axes
	}

	rotate(angle) {
		this.angle = angle;

		let yAxis = new THREE.Vector3(0, 1, 0);
		this.axes = [];
		this.axes[0] = (new THREE.Vector3(1, 0, 0)).applyAxisAngle(yAxis, angle);
		this.axes[1] = (new THREE.Vector3(0, 0, 1)).applyAxisAngle(yAxis, angle);
		this.mesh.rotation.y = angle;
	}

	intersect(obbB) {
		// four axes to check
		let obbA = this;
		let sepAxes = [];
		sepAxes[0] = obbA.axes[0];
		sepAxes[1] = obbA.axes[1];
		sepAxes[2] = obbB.axes[0];
		sepAxes[3] = obbB.axes[1];

		let t = obbB.center.clone().sub(obbA.center);
		for (let i = 0; i < 4; i++) {
			let sHat = sepAxes[i];
			let centerDis = Math.abs(t.dot(sHat));

			let dA = obbA.size[0] * Math.abs(obbA.axes[0].dot(sHat)) 
					+ obbA.size[1] * Math.abs(obbA.axes[1].dot(sHat));
			let dB = obbB.size[0] * Math.abs(obbB.axes[0].dot(sHat)) 
					+ obbB.size[1] * Math.abs(obbB.axes[1].dot(sHat));
			if (centerDis > dA + dB)
				return false;  // NOT intersect
		}
		return true;  // intersect
	}	
}

export { traceMeshes, traceMeshesBlue };