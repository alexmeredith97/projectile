//Allows use of Math.log in internet explorer by creating it as a new function
Math.log10 = function(x){return Math.log(x)*Math.LOG10E} 
// sets angle of projectile 1 to 45 degrees. divides by Math.PI to get convert to degrees (default it radians)

setup = {angle1: 45 / 180 * Math.PI,
velocity1: 20,
gravity1: 9.8,
height1: 0,
bounces1: 0,
efficiency1: 0.5,
angle2: 45 / 180 * Math.PI,
velocity2: 15,
gravity2: 9.8,
height2: 0,
bounces2: 0,
efficiency2: 0.5
}
function save(){
  name = document.getElementById('saveName').value;
  saveToSimulations(name)
}
function saveToSimulations(name) {
  setup.time = new Date().getTime();
  simulations = loadSimulations()
  if(simulations === null || simulations === undefined){
    simulations = {}
  }
  simulations[name] = setup
  localStorage.setItem('simulations', JSON.stringify(simulations));
}

function loadSimulation(name) {
  simulations = JSON.parse(localStorage.getItem('simulations'));
  setup = simulations[name];
  display.reDraw();
}

function loadSimulations() {
  return JSON.parse(localStorage.getItem('simulations'));
}

// creates new Graph object called display to be recalled later when re-drawing graphs
var display = new Graph(); 

// creates a function that updates values between sliders and textboxes to synchronise them when the other gets edited
function updateValues(ThingToChange, val) {
	document.getElementById(ThingToChange).value = val;
	syncVariables();
}

// creates function to synchronise variables by getting their values from the HTML code 
// called after UpdateValues to make sure that the variables update to the new values, not just the visual display on the textbexes and sliders
function syncVariables() {
	setup.angle1 = (document.getElementById("angleNumber1").value / 180) * Math.PI;
	setup.velocity1 = document.getElementById("speedNumber1").value;
	setup.height1 = document.getElementById("heightNumber1").value;
	setup.bounces1 = document.getElementById("bounceMax1").value;
	setup.efficiency1 = document.getElementById("efficiency1").value;
	setup.gravity1 = (document.getElementById("gravityValue1").value * -1);
	// if user selects to only use 1 projectile, the angle of projectile 2 is set to 0 to hide it from screen
	if (document.getElementById("compare").checked) {
		setup.angle2 = (document.getElementById("angleNumber2").value / 180) * Math.PI;
		
	}
		else{ setup.angle2 = 0
		}

	setup.velocity2 = document.getElementById("speedNumber2").value;
	setup.height2 = document.getElementById("heightNumber2").value;
	setup.bounces2 = document.getElementById("bounceMax2").value;
	setup.efficiency2 = document.getElementById("efficiency2").value;
	setup.gravity2 = (document.getElementById("gravityValue2").value * -1);
	graph.animating = false;
	display.reDraw()
}

function Graph() {
	this.canvas = document.getElementById("graph")
	this.ctx = this.canvas.getContext('2d');
	// defines values relating distance, pixels and time to make sure that the simulation is output to the screen accurately
	this.pixelsPerMeter = 20;
	this.metersPerTick = 5;
	this.tick = 1;
	this.timeStep = 1/60;
	this.time = 0;
	this.dotSeperation = 1;
	this.animating = false;
	// arrays storing X and Y co-ordinates differing with timestep (1/60)
	this.xSeries1 = [];
	this.xSeries2 = [];
	this.ySeries1 = [];
	this.ySeries2 = [];

	this.colour1 = "green";
	this.colour2 = "purple";
	
	this.animindex = 0;
	this.prevFrameStartTime = 0;
}

Graph.prototype.reScale = function() {
	var xMax = Math.max(this.xSeries1[this.xSeries1.length - 1], this.xSeries2[this.xSeries2.length - 1])
	var yMax = Math.max((-setup.velocity1 * Math.sin(setup.angle1) * setup.velocity1 * Math.sin(setup.angle1)) / (2 * setup.gravity1) + parseInt(setup.height1), (-setup.velocity2 * Math.sin(setup.angle2) * setup.velocity2 * Math.sin(setup.angle2)) / (2 * setup.gravity2) + parseInt(setup.height2));
	this.pixelsPerMeter = Math.min(this.canvas.width / xMax, this.canvas.height / yMax)
	this.tick = 1;
}

Graph.prototype.reDraw = function() {
	this.clearDisplay();
	this.updateSeries();
	this.reScale();
	this.drawSeries(this.xSeries1, this.ySeries1, this.colour1);
	this.drawSeries(this.xSeries2, this.ySeries2, this.colour2);
	this.drawAxis();
}

Graph.prototype.drawAxis = function() {
	this.ctx.lineWidth = 1;
	this.ctx.strokeStyle = 'black';

	this.ctx.beginPath();
	this.ctx.moveTo(0, this.canvas.height);
	this.ctx.lineTo(this.canvas.width, this.canvas.height);
	this.ctx.stroke();

	this.ctx.beginPath();
	this.ctx.moveTo(0, 0);
	this.ctx.lineTo(0, this.canvas.height);
	this.ctx.stroke();

	this.ctx.lineWidth = 0.2;
	this.ctx.font = "13px courier";
	this.ctx.textAlign = "left";

	var mx = this.canvas.width / this.pixelsPerMeter;
	var xdtarget = 10;
	var xtspacing = Math.pow(10, Math.round(Math.log10(mx / xdtarget)));

	for (var x = 0; x < this.canvas.width; x += xtspacing * this.pixelsPerMeter) {
		this.ctx.beginPath();
		this.ctx.moveTo(x, 0);
		this.ctx.lineTo(x, this.canvas.height);
		this.ctx.stroke();
		this.ctx.fillText(Math.round(10 * x / this.pixelsPerMeter) / 10, x + 3, this.canvas.height - 4);
	}
	
	var my = this.canvas.height / this.pixelsPerMeter;
	var ydtarget = 10;
	var ytspacing = Math.pow(10, Math.round(Math.log10(my / ydtarget)));

	for (var y = this.canvas.height; y >= 0; y -= ytspacing * this.pixelsPerMeter) {
		this.ctx.beginPath();
		this.ctx.moveTo(0, y);
		this.ctx.lineTo(this.canvas.width, y);
		this.ctx.stroke();
		this.ctx.fillText(Math.round((this.canvas.height-y)/this.pixelsPerMeter), 3, y - 4);
	}
};

Graph.prototype.clearDisplay = function() {
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
}
// creates the X and Y series
// splits the y=xtana−gx²/(2u²×cos²a) equation into X and Y components, setting up parametric equations
Graph.prototype.updateSeries = function() {
	this.xSeries1 = []
	this.ySeries1 = []
	this.xSeries2 = []
	this.ySeries2 = []
        // t = time
        // x = X coordinate
        // y = Y coordinate
        // b = bounce
	offset = 0;
	x = 0;
	for (b = 0; b <= setup.bounces1; b++) {
		y = 0
		for (t = 0; y >= 0; t = t + this.timeStep) {
			x = t * setup.velocity1 * Math.cos(setup.angle1) + offset;
			y = t * setup.velocity1 * Math.sin(setup.angle1) * Math.pow(setup.efficiency1, b) + 0.5 * setup.gravity1 * t * t + parseInt(setup.height1);
			this.xSeries1.push(x);
			this.ySeries1.push(y);
		}
		offset = x;
		height1 = 0;
	}

	offset = 0;
	x = 0;
	for (b = 0; b <= setup.bounces2; b++) {
		y = 0
		for (t = 0; y >= 0; t = t + this.timeStep) {
			x = t * setup.velocity2 * Math.cos(setup.angle2) + offset;
			y = t * setup.velocity2 * Math.sin(setup.angle2) * Math.pow(setup.efficiency2, b) + 0.5 * setup.gravity2 * t * t + parseInt(setup.height2);
			this.xSeries2.push(x);
			this.ySeries2.push(y);
		}
		offset = x;
		setup.height2 = 0;
	}

	setup.height1 = document.getElementById("heightNumber1").value;
	setup.height2 = document.getElementById("heightNumber2").value;
}
// draws the graphs from the X and Y series' and colour
Graph.prototype.drawSeries = function(seriesX, seriesY, colour) {
	this.ctx.lineWidth = 1;
	this.ctx.strokeStyle = colour;

	this.ctx.beginPath();
	this.ctx.moveTo(0, this.canvas.height);
	for (i = 0; i <= seriesX.length; i++) {
		this.ctx.lineTo(seriesX[i] * this.pixelsPerMeter, this.canvas.height - seriesY[i] * this.pixelsPerMeter);
	}
	this.ctx.stroke();
}

Graph.prototype.drawAnimatingSeries = function(seriesX, seriesY, sliceN, colour) {
	this.ctx.lineWidth = 1;
	this.ctx.strokeStyle = colour;
	
	var st = false;
	
	
	this.ctx.moveTo(0, this.canvas.height);
	for (i = 0; i <= Math.min(sliceN, seriesX.length); i++) {
		this.ctx.lineTo(seriesX[i] * this.pixelsPerMeter, this.canvas.height - seriesY[i] * this.pixelsPerMeter);
		
		if (i % 2 == 0) {
			st = !st;
		}
		
		if (st) {
			this.ctx.beginPath();
		} else {
			this.ctx.stroke();
		}
	}
	
	this.ctx.stroke();
	
	this.ctx.beginPath();
	this.ctx.arc(seriesX[sliceN]*this.pixelsPerMeter, this.canvas.height-seriesY[sliceN]*this.pixelsPerMeter, 5, 0, Math.PI*2, true); 
	this.ctx.closePath();
	this.ctx.fillStyle = colour
	this.ctx.fill();
	this.ctx.fillStyle = 'black'
}

Graph.prototype.startAnimating = function() {
	this.firstAnimCall = true;
	window.requestAnimationFrame(this.animateProjectile.bind(this))
}

Graph.prototype.animateProjectile = function(time) {
	if (this.firstAnimCall === true) {
		this.startTime = time;
		this.firstAnimCall = false
	}
	
	var t = (time - this.startTime)/1000;
	var slice = (t/this.timeStep) >> 0;

	this.clearDisplay();
	this.updateSeries();
	this.reScale();
	this.drawAxis();
	//this.drawSeries(this.xSeries1, this.ySeries1, this.colour1);
	//this.drawSeries(this.xSeries2, this.ySeries2, this.colour2);
	this.drawAnimatingSeries(this.xSeries1, this.ySeries1, slice, this.colour1)
	this.drawAnimatingSeries(this.xSeries2, this.ySeries2, slice, this.colour2)
	
	if (slice < Math.max(this.xSeries1.length, this.xSeries2.length)) {
		window.requestAnimationFrame(this.animateProjectile.bind(this))
	} else {
		this.reDraw()
	}
	
};

function show(it, box) {
	var vis = (box.checked) ? "block" : "none";
	var col = (box.checked) ? "purple" : "rgba(0,0,0,0)";
	display.colour2 = col;
	display.reDraw();
	document.getElementById(it).style.display = vis;
	syncVariables();
	
}

syncVariables();
document.getElementById('div1').style.display = "block";
