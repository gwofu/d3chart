var D3Chart = function( container, options ) {

	this._container = container;

	this._s = {
		width : 600,
		height: 300,
		margin: { top: 30, left: 30, right: 30, bottom: 30 },
		xOrient: 'bottom',
		yOrient: 'left',
		xDomain: [0, 10],
		yDomain: [0, 10],
		data: [],
		colors: d3.scale.category10(),
		duration: 1000,
		interpolate: 'linear',
		ticks: [10, 0],
		tickSize: 5,
		tickSubdivide: 0,
		tickPadding: 0,
		tickFormat: 0
	};

	this.extend( this._s, options );

};

D3Chart.prototype.init = function() {
	var m = this._s.margin; // Chart margins
	this._xStart = m.left;
	this._yStart = this._s.height - m.bottom;
	this._yEnd = m.top;
	this._quadrantWidth= this._s.width - m.left - m.right;
	this._quadrantHeight= this._s.height - m.top - m.bottom;

	this._data = this._s.data;
	this._colors = this._s.colors; // Chart ordinal color scale used to differentiate different data series
	this._duration = this._s.duration;

	this._svg = null;
	this._bodyG = null;
	this._line = null;
};

D3Chart.prototype.extend = function( a, b ) {
	for(var key in b)
		if(b.hasOwnProperty(key))
			a[key] = b[key];
	return a;
};

D3Chart.prototype.container = function() {
	return this._s.container;
};

D3Chart.prototype.render = function () {
	if (!this._svg) {
		this._svg = d3.select(this._container).append("svg")
				.attr("height", this._s.height)
				.attr("width", this._s.width);

		this.renderAxes();
		this.renderBody(this._svg);
	}
};

D3Chart.prototype.renderAxes = function() {
	this._axesG = this._svg.append("g").attr("class", "axes");

	this.renderXAxis(this._axesG);
	this.renderYAxis(this._axesG);
};

D3Chart.prototype.renderXAxis = function(axesG) {

	var xAxis = d3.svg.axis()
		.scale(this._x)
		.orient(this._s.xOrient)
		.ticks(this._s.ticks[0], this._s.ticks[1]);

	var t = "translate(" + this._xStart + "," + this._yStart + ")";

	this._s.tickSubdivide && xAxis.tickSubdivide(this._s.tickSubdivide);
	this._s.tickPadding && xAxis.tickPadding(this._s.tickPadding);

	if (this._s.tickFormat) {
		var tickFormat = this._s.tickFormat;
		xAxis.tickFormat(function(v) {
			return v + tickFormat;
		});
	}

	axesG.append("g")
		.attr("class", "x axis")
		.attr("transform", function () {
			 return t;
		})
		.call(xAxis);

	d3.selectAll("g.x g.tick")
		.append("line")
			.classed("grid-line", true)
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", - this._quadrantHeight);
};

D3Chart.prototype.renderYAxis = function(axesG) {
	var yAxis = d3.svg.axis()
		.scale(this._y)
		.orient(this._s.yOrient);

	var t = "translate(" + this._xStart + "," + this._yEnd + ")";

	axesG.append("g")
		.attr("class", "y axis")
		.attr("transform", function () {
			 return t;
		})
		.call(yAxis);

	d3.selectAll("g.y g.tick")
		.append("line")
			.classed("grid-line", true)
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", this._quadrantWidth)
			.attr("y2", 0);
};

D3Chart.prototype.renderBody = function(svg) {
if (!this._bodyG)
	var t = "translate(" + this._xStart + "," + this._yEnd + ")";

	this._bodyG = svg.append("g")
			.attr("class", "body")
			.attr("transform", function () {
				return t;
			})
			.attr("clip-path", "url(#body-clip)");

	this.renderLines();
	this.renderDots();
};

D3Chart.prototype.renderLines = function() {

	var x = this._x;
	var y = this._y;
	var colors = this._colors;

	var line = d3.svg.line()
		.x(function (d) { return x(d.x); })
		.y(function (d) { return y(d.y); });

	this._bodyG.selectAll("path.line")
		.data(this._data)
		.enter()
		.append("path")
		.style("stroke", function (d, i) {
				return colors(i);
		})
		.attr("class", "line");

	this._bodyG.selectAll("path.line")
		.data(this._data)
		.transition()
		.duration(this._duration)
		.attr("d", function (d) { return line(d); });
};

D3Chart.prototype.renderDots = function() {
	var x = this._x;
	var y = this._y;
	var colors = this._colors;
	var bodyG = this._bodyG;
	var duration = this._duration;

	this._data.forEach(function (list, i) {
		bodyG.selectAll("circle._" + i)
			.data(list)
			.enter()
			.append("circle")
			.attr("class", "dot _" + i);

		bodyG.selectAll("circle._" + i)
			.data(list)
			.style("stroke", function (d) {
					return colors(i);
			})
			.transition()
			.duration(duration)
			.attr("cx", function (d) { return x(d.x); })
			.attr("cy", function (d) { return y(d.y); })
			.attr("r", 4.5);
	});
};

D3Chart.prototype.update = function(data) {
	//this.renderXAxis(this._axesG);
	
	this._data = data;
	this.renderLines();
	this.renderDots();
};


var LineChart = function( container, options ) {
	D3Chart.call( this, container, options );

	this.init();

	this.buildScale();

	this.render();

};

LineChart.prototype = Object.create( D3Chart.prototype );

LineChart.prototype.buildScale = function() {
	this._x = d3.scale.linear().domain(this._s.xDomain).range([0, this._quadrantWidth]); // x axis scale
	this._y = d3.scale.linear().domain(this._s.yDomain).range([this._quadrantHeight, 0]); // y axis scale
};


var TimeChart = function( container, options ) {
	D3Chart.call( this, container, options );

	var data = this._s.data;

	this.init();

	this.buildScales();

	this.render();

};

TimeChart.prototype = Object.create( D3Chart.prototype );

TimeChart.prototype.buildScales = function() {
	var data = this._s.data;

	this._x = d3.time.scale().domain([data[0][0].x, data[0][data[0].length - 1].x])
			.rangeRound([0, this._quadrantWidth]);

	this._y = d3.scale.linear()
			.domain([0, d3.max(data[0], function(d) { return d.y; })])
			.range([this._quadrantHeight, 0]);
};

TimeChart.prototype.renderXAxis = function(axesG) {

	var xAxis = d3.svg.axis()
		.scale(this._x)
		.orient(this._s.xOrient)
		.ticks(this._s.ticks[0], this._s.ticks[1])
		.tickFormat(this._s.tickFormat)
		.tickSize(this._s.tickSize)
		.tickPadding(this._s.tickPadding);

	var t = "translate(" + this._xStart + "," + this._yStart + ")";

	axesG.append("g")
		.attr("class", "x axis")
		.attr("transform", function () {
			 return t;
		})
		.call(xAxis);

	d3.selectAll("g.x g.tick")
		.append("line")
			.classed("grid-line", true)
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", - this._quadrantHeight);
};