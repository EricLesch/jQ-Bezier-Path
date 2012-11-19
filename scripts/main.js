/**
 * Created by JetBrains PhpStorm.
 * User: Eric
 * Date: 11/19/12
 * Time: 6:58 PM
 * To change this template use File | Settings | File Templates.
 */
var KANVAS1_START_POINT = {
	left:50,
	top:50
};
var KANVAS1_END_POINT = {
	left:420,
	top:420
};
var CONTROL_POINT_1 = {
	left:420,
	top:50
};
var CONTROL_POINT_2 = {
	left:50,
	top:420
};

var KANVAS2_START_POINT = {
	left:50,
	top:420
};

var KANVAS2_END_POINT = {
	left:420,
	top:50
};

var KANVAS2_CONTROL_POINT1 = {
	left:50,
	top:50
};

var KANVAS2_CONTROL_POINT2 = {
	left:420,
	top:420
};


var CONTROL_RADIUS = 20;
var CONTROL_POINT_OPACITY = 0.8;

var TRANSITION_POINT_COLOR = "#f55";
var CONTROL_POINT_COLOR = "#55f";


$(function ()
{
	function initializeCanvas()
	{


		var Bezier = (function (_, fabric, events)
		{

			function Bezier(options)
			{
				_.bindAll(this);

				// install events support
				events.install(this);

				this._points = {};

				this._points.startPoint = options.startPoint;
				this._points.endPoint = options.endPoint;

				this._points.controlPoint1 = options.controlPoint1;

				this._points.controlPoint2 = options.controlPoint2;

				this._fabricCanvas = options.fabricCanvas;

				// string of directives to feed to fabric canvas
				this._newPath = '';

				// reference to fabric object
				this._fabricLine = null;

				// render that shit
				this._createPath();
				this._createLine();
				this._add();
				this._draw();
			}

			Bezier.fn = Bezier.prototype;

			Bezier.fn._createPath = function ()
			{
				this.moveTo = 'M ' +
						this._points.startPoint.left + ' ' +
						this._points.startPoint.top + ' ';

				this.bezierCurveTo = 'C ' +
						this._points.controlPoint1.left + ' ' +
						this._points.controlPoint1.top + ' ' +
						this._points.controlPoint2.left + ' ' +
						this._points.controlPoint2.top + ' ' +
						this._points.endPoint.left + ' ' +
						this._points.endPoint.top + ' ';

				this._newPath = this.moveTo + this.bezierCurveTo;
			};

			Bezier.fn.setStartPoint = function (topic, startPoint)
			{
				this._fabricLine.path[0][1] = startPoint.left;
				this._fabricLine.path[0][2] = startPoint.top;

				// update the start point info
				this._points.startPoint = startPoint;

				this._publishPointsMoved();

				this._draw();
			};

			Bezier.fn.setEndPoint = function (topic, endPoint)
			{
				this._fabricLine.path[1][5] = endPoint.left;
				this._fabricLine.path[1][6] = endPoint.top;

				// update the end point info
				this._points.endPoint = endPoint;

				this._publishPointsMoved();

				this._draw();
			};

			Bezier.fn.setControlPoint1 = function (topic, controlPoint1)
			{
				this._fabricLine.path[1][1] = controlPoint1.left;
				this._fabricLine.path[1][2] = controlPoint1.top;

				// update the control point info
				this._points.controlPoint1 = controlPoint1;

				this._publishPointsMoved();

				this._draw();
			};

			Bezier.fn.setControlPoint2 = function (topic, controlPoint2)
			{
				this._fabricLine.path[1][3] = controlPoint2.left;
				this._fabricLine.path[1][4] = controlPoint2.top;

				// update the control point info
				this._points.controlPoint2 = controlPoint2;

				this._publishPointsMoved();

				this._draw();
			};

			Bezier.fn._createLine = function ()
			{
				this._fabricLine = new fabric.Path(this._newPath, {fill:'', stroke:'black', width:0, height:0});
			};

			Bezier.fn._publishPointsMoved = function ()
			{
				// tell everyone that one of the points changed
				this.evt.publish('pointMoved', this._points);
			};

			Bezier.fn._add = function ()
			{
				this._fabricCanvas.add(this._fabricLine);
			};

			Bezier.fn._draw = function ()
			{
				this._fabricCanvas.renderAll();
			};

			// return all of the points
			Bezier.fn.getPoints = function ()
			{
				return this._points;
			};

			return Bezier;

		})(_, fabric, utils.events);

		var Circle = (function (_, fabric, events)
		{
			function Circle(options)
			{
				_.bindAll(this);

				// install events support
				events.install(this);

				// store the circle's properties here
				this._props = {};

				this._props.radius = options.radius;

				this._props.fill = options.fill || null;

				this._props.top = options.top;

				this._props.left = options.left;

				this._props.opacity = options.opacity || null;

				this._fabricCanvas = options.fabricCanvas;

				// we will stash the fabric circle here
				this._fabricCircle = null;

				this._create();
				this._add();
				this.draw();

				this._setupEvents();
			}

			Circle.fn = Circle.prototype;

			Circle.fn._create = function ()
			{
				// build the props that we will use to instantiate the circle
				var instantiationProps = {};

				// basically a copy sans anything that is set to null
				_.each(
						this._props,
						function (prop, key)
						{
							if (prop !== null)
							{
								instantiationProps[key] = prop;
							}

						}
				);

				this._fabricCircle = new fabric.Circle(instantiationProps);

				this._fabricCircle.lockRotation = true;
				this._fabricCircle.lockScalingX = true;
				this._fabricCircle.lockScalingY = true;
				this._fabricCircle.hasControls = false;
			};

			Circle.fn._add = function ()
			{
				this._fabricCanvas.add(this._fabricCircle);
			};

			Circle.fn.draw = function ()
			{
				this._fabricCanvas.renderAll();
			};

			Circle.fn.updatePoint = function (newPoint)
			{
				// set the left and the top
				this.set('left', newPoint.left);
				this.set('top', newPoint.top);

				// publish that the point has been updated
				this.evt.publish('moving', newPoint);
			};

			// takes a hash of properties and updates them
			Circle.fn.set = function (prop, value)
			{
				var self = this;

				// and update the prop on this object and the referenced fabric object
				// throw an error if you are trying to modify an undefined property

				if (typeof self._props[prop] !== 'undefined')
				{
					// update it on this object
					self._props[prop] = value;

					// update it on the fabric circle
					self._fabricCircle.set(prop, value);
				}
				else
				{
					throw new Error('property ' + prop + ' is undefined on this object!')
				}

			};

			Circle.fn._setupEvents = function ()
			{
				var self = this;

				this._fabricCircle.on(
						'moving',
						function ()
						{
							self.evt.publish(
									'moving',
									{
										left:self._fabricCircle.left,
										top:self._fabricCircle.top
									}
							);

						}
				);
			};

			Circle.fn.setSelectable = function (bool)
			{
				this._fabricCircle.selectable = bool;
			};

			return Circle;

		})(_, fabric, utils.events);

		// abstract class
		var BezierWithControls = (function (_, fabric, Circle, Bezier, events)
		{
			function BezierWithControls(options)
			{
				// fix javascript event callbacks
				_.bindAll(this);

				// events support
				events.install(this);

				this._points = {};

				this._points.startPoint = options.startPoint;
				this._points.endPoint = options.endPoint;
				this._points.controlPoint1 = options.controlPoint1;
				this._points.controlPoint2 = options.controlPoint2;

				this._fabricCanvas = options.fabricCanvas;

				this._bezier = null;

				this._startPointControl = null;

				this._endPointControl = null;

				this._controlPoint1Control = null;

				this._controlPoint2Control = null;

				this._createBezier();
				this._createControls();
				this._initEvents();

			}

			BezierWithControls.fn = BezierWithControls.prototype;

			BezierWithControls.fn._createBezier = function ()
			{
				this._bezier = new Bezier(
						{
							fabricCanvas:this._fabricCanvas,
							startPoint:this._points.startPoint,
							endPoint:this._points.endPoint,
							controlPoint1:this._points.controlPoint1,
							controlPoint2:this._points.controlPoint2
						}
				);
			};

			BezierWithControls.fn._createControls = function ()
			{
				this._startPointControl = new Circle(
						{
							fabricCanvas:this._fabricCanvas,
							radius:CONTROL_RADIUS,
							fill:TRANSITION_POINT_COLOR,
							top:this._points.startPoint.top,
							left:this._points.startPoint.left,
							opacity:CONTROL_POINT_OPACITY
						}
				);

				this._endPointControl = new Circle(
						{
							fabricCanvas:this._fabricCanvas,
							radius:CONTROL_RADIUS,
							fill:TRANSITION_POINT_COLOR,
							top:this._points.endPoint.top,
							left:this._points.endPoint.left,
							opacity:CONTROL_POINT_OPACITY
						}
				);

				this._controlPoint1Control = new Circle(
						{
							fabricCanvas:this._fabricCanvas,
							radius:CONTROL_RADIUS,
							fill:CONTROL_POINT_COLOR,
							top:this._points.controlPoint1.top,
							left:this._points.controlPoint1.left,
							opacity:CONTROL_POINT_OPACITY
						}
				);

				this._controlPoint2Control = new Circle(
						{
							fabricCanvas:this._fabricCanvas,
							radius:CONTROL_RADIUS,
							fill:CONTROL_POINT_COLOR,
							top:this._points.controlPoint2.top,
							left:this._points.controlPoint2.left,
							opacity:CONTROL_POINT_OPACITY
						}
				);

			};

			// no op - implemented in a subclass
			BezierWithControls.fn._initEvents = function ()
			{

			};

			BezierWithControls.fn._updatePoints = function (topic, points)
			{
				this._points = points;

				// publish the new points to whoever is listening
				this.evt.publish('pointsUpdated', this._points);

				// publish the slope intercept
				this.evt.publish('slopeIntercept', bezierMath.calculateSlopeIntercept(this._points.startPoint, this._points.endPoint));

			};

			// return the current points
			BezierWithControls.fn.getPoints = function ()
			{
				return this._points;
			};

			BezierWithControls.fn.callUpdatePoints = function ()
			{
				this._updatePoints(null, this._points);
			};

			return BezierWithControls;

		})(_, fabric, Circle, Bezier, utils.events);


		// subclass of abstract class BezierWithControls
		var BezierWithControlsMaster = (function (_, BezierWithControls, extend)
		{

			function BezierWithControlsMaster(options)
			{
				_.bindAll(this);

				// call the super class's constructor
				this.superclass.constructor.apply(this, arguments);

				// call update points for the first time so everything gets initialized

				//
			}

			extend(BezierWithControlsMaster, BezierWithControls);

			BezierWithControlsMaster.fn = BezierWithControlsMaster.prototype;

			BezierWithControlsMaster.fn._initEvents = function ()
			{
				// when the fabric canvas control object moves, move the bezier startPoint
				this._startPointControl.evt.subscribe('moving', this._bezier.setStartPoint);
				this._endPointControl.evt.subscribe('moving', this._bezier.setEndPoint);
				this._controlPoint1Control.evt.subscribe('moving', this._bezier.setControlPoint1);
				this._controlPoint2Control.evt.subscribe('moving', this._bezier.setControlPoint2);

				// when any bezier point has moved update the the points on this object

				this._bezier.evt.subscribe('pointMoved', this._updatePoints);
			};

			BezierWithControlsMaster.fn._updatePoints = function (topic, points)
			{
				// call the superclass's update point function first
				this.superclass._updatePoints.apply(this, arguments);

				// publish the angle info
				this.evt.publish('angleUpdated', this.getPercentAndAngle());
			};

			BezierWithControlsMaster.fn.getPercentAndAngle = function ()
			{
				return bezierMath.translateBezierPointsToPercentAndAngle(this._points);
			};

			BezierWithControlsMaster.fn.callUpdatePoints = function ()
			{
				this._updatePoints(null, this._points);
			};

			return BezierWithControlsMaster;

		})(_, BezierWithControls, utils.extend);

		// subclass of abstract class BezierWithControls
		var BezierWithControlsSlave = (function (_, BezierWithControls, extend)
		{

			function BezierWithControlsSlave(options)
			{
				_.bindAll(this);

				// call the super class's constructor
				this.superclass.constructor.apply(this, arguments);

				// hold the angle and distance of the control points
				// we need to hold on to this just in case we need to update our own control
				// points based on the movement of the start or end point
				this._currentPointAngleAndDistance = null;

				// make the two control points unselectable
				this._controlPoint1Control.setSelectable(false);
				this._controlPoint2Control.setSelectable(false);

				//				this.superclass._updatePoints.call(this, null, this._points);
			}

			extend(BezierWithControlsSlave, BezierWithControls);

			BezierWithControlsSlave.fn = BezierWithControlsSlave.prototype;

			BezierWithControlsSlave.fn._initEvents = function ()
			{
				var self = this;

				// when the fabric canvas control object moves, move the bezier startPoint
				this._startPointControl.evt.subscribe('moving', this._bezier.setStartPoint);
				this._endPointControl.evt.subscribe('moving', this._bezier.setEndPoint);

				// when the startpoint control moves, update this object's startpoint, then update all the
				// points
				this._startPointControl.evt.subscribe(
						'moving',
						function (topic, point)
						{
							self._points.startPoint = point;
							self._updatePoints(null, self._points);
						}
				);

				// when the endpoint control moves, update this object's startpoint, then update all the
				// points

				this._endPointControl.evt.subscribe(
						'moving',
						function (topic, point)
						{
							self._points.endPoint = point;
							self._updatePoints(null, self._points);
						}
				);

				this._controlPoint1Control.evt.subscribe('moving', this._bezier.setControlPoint1);
				this._controlPoint2Control.evt.subscribe('moving', this._bezier.setControlPoint2);

				// when any bezier point has moved update the the points on this object

				//				this._bezier.evt.subscribe('pointMoved', this._updatePoints);


			};

			BezierWithControlsSlave.fn._updatePoints = function (topic, points)
			{
				// at the moment this is unnecessary but just including this call for clarity
				// and consistency

				// call the superclass's update point function
				this.superclass._updatePoints.apply(this, arguments);
				//				debugger;
				// publish the angle info

				// call to ensure that the points get updated using the correct controlPointAngleAndDistance
				this.updateControlPoints(null, this._currentPointAngleAndDistance);

				//				this.evt.publish('angleUpdated', this._currentPointAngleAndDistance);
			};

			BezierWithControlsSlave.fn.updateControlPoints = function (topic, controlPointAngleAndDistance)
			{
				var newPoints = bezierMath.translatePercentAndAngleToPoints(controlPointAngleAndDistance, this._points.startPoint, this._points.endPoint);

				// reference the new
				this._points = newPoints;

				this._currentPointAngleAndDistance = controlPointAngleAndDistance;

				// update the points on the control points
				this._controlPoint1Control.updatePoint(newPoints.controlPoint1);
				this._controlPoint2Control.updatePoint(newPoints.controlPoint2);

				//				this._controlPoint2Control.set('left', newPoints.controlPoint2.left);
				//				this._controlPoint2Control.set('top', newPoints.controlPoint2.top);

				// redraw the control points
				this._controlPoint1Control.draw();
				this._controlPoint2Control.draw();

			};

			BezierWithControlsSlave.fn.initializePercentAndAngle = function (controlPointAngleAndDistance)
			{
				this._currentPointAngleAndDistance = controlPointAngleAndDistance;
			};



			return BezierWithControlsSlave;

		})(_, BezierWithControls, utils.extend);


		var PointObserver = (function (_)
		{
			function PointObserver(options)
			{
				_.bindAll(this);

				this._$startPointLeft = options.$startPointLeft;

				this._$endPointLeft = options.$endPointLeft;

				this._$controlPoint1Left = options.$controlPoint1Left;

				this._$controlPoint2Left = options.$controlPoint2Left;

				this._$startPointTop = options.$startPointTop;

				this._$endPointTop = options.$endPointTop;

				this._$controlPoint1Top = options.$controlPoint1Top;

				this._$controlPoint2Top = options.$controlPoint2Top;
			}

			PointObserver.fn = PointObserver.prototype;

			PointObserver.fn.updatePointInfo = function (topic, points)
			{
				this._$startPointLeft.text(points.startPoint.left);
				this._$startPointTop.text(points.startPoint.top);
				this._$endPointLeft.text(points.endPoint.left);
				this._$endPointTop.text(points.endPoint.top);
				this._$controlPoint1Left.text(points.controlPoint1.left.toFixed(2));
				this._$controlPoint1Top.text(points.controlPoint1.top.toFixed(2));
				this._$controlPoint2Left.text(points.controlPoint2.left.toFixed(2));
				this._$controlPoint2Top.text(points.controlPoint2.top.toFixed(2));
			};

			return PointObserver;

		})(_);

		var AngleObserver = (function (_)
		{
			function AngleObserver(options)
			{
				_.bindAll(this);

				this._$angleRadians = options.$angleRadians;
				this._$angleDegrees = options.$angleDegrees;
				this._$percentDistance = options.$percentDistance;
				this._$aboveTheLine = options.$aboveTheLine;

				this._listenerHash = options.listenerHash;
			}

			AngleObserver.fn = AngleObserver.prototype;

			AngleObserver.fn.updateAngleInfo = function (topic, angleInfo)
			{
				this._$angleRadians.text(angleInfo[this._listenerHash].angleRadians.toFixed(2));
				this._$angleDegrees.text((angleInfo[this._listenerHash].angleRadians / Math.PI * 180).toFixed(2));
				this._$percentDistance.text((angleInfo[this._listenerHash].percentDistance * 100).toFixed(2));

				this._$aboveTheLine.text(angleInfo[this._listenerHash].leftOfTheLine);
			};

			return AngleObserver;

		})(_);

		var SlopeInterceptObserver = (function (_)
		{
			function SlopeInterceptObserver(options)
			{
				_.bindAll(this);

				this._$slope = options.$slope;
				this._$intercept = options.$intercept;
			}

			SlopeInterceptObserver.fn = SlopeInterceptObserver.prototype;

			SlopeInterceptObserver.fn.updateSlopeIntercept = function (topic, slopeIntercept)
			{
				this._$slope.text(slopeIntercept.slope.toFixed(2));
				this._$intercept.text(slopeIntercept.intercept.toFixed(2));

			};

			return SlopeInterceptObserver;

		})(_);

		// horrible name - basically it spits out json data
		var JsObjectObserver = (function (_, HandleBars, $)
		{
			function JsObjectObserver(options)
			{
				_.bindAll(this);

				this._$outputElement = options.$outputElement;

				this._source = options.$templateElement.html();
				this._template = HandleBars.compile(this._source);

				// we stash the compiled html here
				this._html = null;
			}

			JsObjectObserver.fn = JsObjectObserver.prototype;

			JsObjectObserver.fn.update = function (topic, angleInfo)
			{
				// process the angle info object and make sure that it
				// doesn't have insanely long numbers,
				// create a new has and clone and copy everything into it
				// so we are not modifying the original object

				// new hash to store a copy of this object
				var newAngleInfo = {};

				// go one level down
				_.each(
						angleInfo,
						function (element, key)
						{
							// clone this object so we aren't messing with the original
							var obj = _.clone(element);

							// go another level down to get to the actual data
							_.each(
									obj,
									function (element, key)
									{
										// just process numbers
										if (typeof obj[key] === 'number')
										{
											obj[key] = element.toFixed(5);
										}
									}
							);

							// add it to the new hash
							newAngleInfo[key] = obj;
						}
				);

				// process the html
				this._html = this._template(newAngleInfo);

				// push the html into the output element
				this._$outputElement.html(this._html);
			};

			return JsObjectObserver;

		})(_, Handlebars, jQuery);

        var AnimatingDiv = (function(_)
        {
            function AnimatingDiv($divElement)
            {
                _.bindAll(this);

                this._$divElement = $divElement;

                this._initialLeft = parseInt(this._$divElement.css('left'), 10);
                this._initialTop = parseInt(this._$divElement.css('top'), 10);

                this._endLeft = 270;
                this._endTop = 270;

                this._pathingInfo = null;

//                this._animate();



            }

            AnimatingDiv.fn = AnimatingDiv.prototype;

            AnimatingDiv.fn.animate = function()
            {
                var self = this;

                this._$divElement.animate(
                    {
                        top: this._endTop,
                        left: this._endLeft,
                        path: new $.path.bezier(this._pathingInfo)
                    },
                    2000,
                    function()
                    {
                        self._reset();
                        self.animate();
                    }
                )
            };

            AnimatingDiv.fn._reset = function()
            {
                this._$divElement.css(
                    {
                        top: this._initialTop,
                        left: this._initialLeft
                    }
                );
            };

            AnimatingDiv.fn.updateAnimationPath = function(topic, points)
            {
                var self = this;

                console.log(points);

                this._pathingInfo =
                {
                    start: {
                        x: self._initialLeft,
                        y: self._initialTop,
                        angle: bezierMath.translateRadiansToDegrees(points.controlPoint1.angleRadians),
                        length: points.controlPoint1.percentDistance

                    },
                    end: {
                        x: self._endLeft,
                        y: self._endTop,
                        angle: bezierMath.translateRadiansToDegrees(points.controlPoint2.angleRadians),
                        length: points.controlPoint2.percentDistance
                    }
                };

                debugger;
            };

            return AnimatingDiv;


        })(_);


		// initialize the canvas's
        var kanvas1 = new fabric.Canvas('fabricCanvas', {renderOnAddition: false});
        var kanvas2 = new fabric.Canvas('fabricCanvas2', {renderOnAddition: false});

		// change the hover cursor
		kanvas1.hoverCursor = 'pointer';
		kanvas2.hoverCursor = 'pointer';


		/************** left canvas bezier initialization *****************/

		var leftBezierControls = new BezierWithControlsMaster(
				{
					fabricCanvas:kanvas1,
					startPoint:KANVAS1_START_POINT,
					endPoint:KANVAS1_END_POINT,
					controlPoint1:CONTROL_POINT_1,
					controlPoint2:CONTROL_POINT_2
				}
		);


		var $leftPointObserver = $('.leftCanvasPointsJS');

		var leftPointObserver = new PointObserver(
				{
					$startPointLeft:$leftPointObserver.find('.startPointJS .xValueJS'),
					$startPointTop:$leftPointObserver.find('.startPointJS .yValueJS'),
					$endPointLeft:$leftPointObserver.find('.endPointJS .xValueJS'),
					$endPointTop:$leftPointObserver.find('.endPointJS .yValueJS'),
					$controlPoint1Left:$leftPointObserver.find('.controlPoint1JS .xValueJS'),
					$controlPoint1Top:$leftPointObserver.find('.controlPoint1JS .yValueJS'),
					$controlPoint2Left:$leftPointObserver.find('.controlPoint2JS .xValueJS'),
					$controlPoint2Top:$leftPointObserver.find('.controlPoint2JS .yValueJS')
				}
		);

		leftBezierControls.evt.subscribe('pointsUpdated', leftPointObserver.updatePointInfo);

		/************** end left canvas bezier initialization *****************/


		/************** right canvas bezier initialization *******************/

		var rightBezierControls = new BezierWithControlsSlave(
				{
					fabricCanvas:kanvas2,
					startPoint:KANVAS2_START_POINT,
					endPoint:KANVAS2_END_POINT,
					controlPoint1:KANVAS2_CONTROL_POINT1,
					controlPoint2:KANVAS2_CONTROL_POINT2
				}
		);

		var $rightPointObserver = $('.rightCanvasPointsJS');

		var rightPointObserver = new PointObserver(
				{
					$startPointLeft:$rightPointObserver.find('.startPointJS .xValueJS'),
					$startPointTop:$rightPointObserver.find('.startPointJS .yValueJS'),
					$endPointLeft:$rightPointObserver.find('.endPointJS .xValueJS'),
					$endPointTop:$rightPointObserver.find('.endPointJS .yValueJS'),
					$controlPoint1Left:$rightPointObserver.find('.controlPoint1JS .xValueJS'),
					$controlPoint1Top:$rightPointObserver.find('.controlPoint1JS .yValueJS'),
					$controlPoint2Left:$rightPointObserver.find('.controlPoint2JS .xValueJS'),
					$controlPoint2Top:$rightPointObserver.find('.controlPoint2JS .yValueJS')
				}
		);

		rightBezierControls.evt.subscribe('pointsUpdated', rightPointObserver.updatePointInfo);

		/************ end right canvas bezier initialization *****************/

		/*********** control point 1 observer for the left canvas ************/

		var $controlPoint1Observer = $('.controlPoint1JS');

		var controlPoint1Observer = new AngleObserver(
				{
					$angleRadians:$controlPoint1Observer.find('.radiansJS'),
					$angleDegrees:$controlPoint1Observer.find('.degreesJS'),
					$percentDistance:$controlPoint1Observer.find('.distanceJS'),
					$aboveTheLine:$controlPoint1Observer.find('.leftOfTheLineJS'),
					listenerHash:'controlPoint1'
				}
		);

		leftBezierControls.evt.subscribe('angleUpdated', controlPoint1Observer.updateAngleInfo);

		/*********** end control point 1 observer for the left canvas ************/

		/*********** control point 2 observer for the left canvas ************/

		var $controlPoint2Observer = $('.controlPoint2JS');

		var controlPoint2Observer = new AngleObserver(
				{
					$angleRadians:$controlPoint2Observer.find('.radiansJS'),
					$angleDegrees:$controlPoint2Observer.find('.degreesJS'),
					$percentDistance:$controlPoint2Observer.find('.distanceJS'),
					$aboveTheLine:$controlPoint2Observer.find('.leftOfTheLineJS'),
					listenerHash:'controlPoint2'
				}
		);

		leftBezierControls.evt.subscribe('angleUpdated', controlPoint2Observer.updateAngleInfo);

		/*********** end control point 2 observer for the left canvas ************/

		/********** slope intercept observer for the left canvas ****************/

		var slopeInterceptObserver1 = new SlopeInterceptObserver(
				{
					$slope:$leftPointObserver.find('.slopeJS'),
					$intercept:$leftPointObserver.find('.interceptJS')
				}
		);

		leftBezierControls.evt.subscribe('slopeIntercept', slopeInterceptObserver1.updateSlopeIntercept);

		/********** end slope intercept observer for the left canvas ************/

		/********** slope intercept observer for the right canvas ****************/

		var slopeInterceptObserver2 = new SlopeInterceptObserver(
				{
					$slope:$rightPointObserver.find('.slopeJS'),
					$intercept:$rightPointObserver.find('.interceptJS')
				}
		);

		rightBezierControls.evt.subscribe('slopeIntercept', slopeInterceptObserver2.updateSlopeIntercept);

		/********** end slope intercept observer for the right canvas ****************/

		/********** change in left canvas updates the right canvas *************/

		leftBezierControls.evt.subscribe('angleUpdated', rightBezierControls.updateControlPoints);

		var jsObjectOutput = new JsObjectObserver(
				{
					$outputElement:$('#javascriptObjectOutput'),
					$templateElement:$('#jsObjectTemplate')
				}
		);

		// initialize the connection between the left and the right control points

		leftBezierControls.evt.subscribe('angleUpdated', jsObjectOutput.update);

        // the animating div object

        var animatingDiv = new AnimatingDiv($('.animatingDiv'));

        leftBezierControls.evt.subscribe('angleUpdated', animatingDiv.updateAnimationPath);

		// initialize everything that is listening to the left Bezier Controls
        leftBezierControls.callUpdatePoints();

        animatingDiv.animate();

		leftBezierControls.evt.subscribe('angleUpdated', rightBezierControls.callUpdatePoints);

		rightBezierControls.callUpdatePoints();

        // initialize the animating Div


//



	}

	// go!
	initializeCanvas();
});
