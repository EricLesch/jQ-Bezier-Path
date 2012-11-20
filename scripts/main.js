
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
            this._fabricLine = new fabric.Path(this._newPath, {fill: '', stroke: 'black', width: 0, height: 0});
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
                            left: self._fabricCircle.left,
                            top: self._fabricCircle.top
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
        var CONTROL_RADIUS = 20;
        var CONTROL_POINT_OPACITY = 0.8;
        var TRANSITION_POINT_COLOR = "#f55";
        var CONTROL_POINT_COLOR = "#55f";

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
            if (options.hasControls !== false)
            {
                this._createControls();
            }

            this._initEvents();

        }

        BezierWithControls.fn = BezierWithControls.prototype;

        BezierWithControls.fn._createBezier = function ()
        {
            this._bezier = new Bezier(
                {
                    fabricCanvas: this._fabricCanvas,
                    startPoint: this._points.startPoint,
                    endPoint: this._points.endPoint,
                    controlPoint1: this._points.controlPoint1,
                    controlPoint2: this._points.controlPoint2
                }
            );
        };

        BezierWithControls.fn._createControls = function ()
        {
            this._startPointControl = new Circle(
                {
                    fabricCanvas: this._fabricCanvas,
                    radius: CONTROL_RADIUS,
                    fill: TRANSITION_POINT_COLOR,
                    top: this._points.startPoint.top,
                    left: this._points.startPoint.left,
                    opacity: CONTROL_POINT_OPACITY
                }
            );

            this._endPointControl = new Circle(
                {
                    fabricCanvas: this._fabricCanvas,
                    radius: CONTROL_RADIUS,
                    fill: TRANSITION_POINT_COLOR,
                    top: this._points.endPoint.top,
                    left: this._points.endPoint.left,
                    opacity: CONTROL_POINT_OPACITY
                }
            );

            this._controlPoint1Control = new Circle(
                {
                    fabricCanvas: this._fabricCanvas,
                    radius: CONTROL_RADIUS,
                    fill: CONTROL_POINT_COLOR,
                    top: this._points.controlPoint1.top,
                    left: this._points.controlPoint1.left,
                    opacity: CONTROL_POINT_OPACITY
                }
            );

            this._controlPoint2Control = new Circle(
                {
                    fabricCanvas: this._fabricCanvas,
                    radius: CONTROL_RADIUS,
                    fill: CONTROL_POINT_COLOR,
                    top: this._points.controlPoint2.top,
                    left: this._points.controlPoint2.left,
                    opacity: CONTROL_POINT_OPACITY
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

            var percentAndAngle = this.getPercentAndAngle();

            percentAndAngle.startPoint = points.startPoint;
            percentAndAngle.endPoint = points.endPoint;

            // publish the angle info
            this.evt.publish('angleUpdated', percentAndAngle);
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


    // horrible name - basically it spits out json data
    var JsObjectObserver = (function (_, HandleBars, $, prettyPrint)
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
                                switch (key)
                                {
                                    case 'left':
                                    case 'top':
                                        obj[key] = element.toFixed(0);
                                        break;
                                    default:
                                        obj[key] = element.toFixed(3);
                                }
                            }

                        }
                    );

                    // add it to the new hash
                    newAngleInfo[key] = obj;
                }
            );

            newAngleInfo.controlPoint1.degrees = bezierMath.translateRadiansToDegrees(newAngleInfo.controlPoint1.angleRadians).toFixed(3);
            newAngleInfo.controlPoint2.degrees = bezierMath.translateRadiansToDegrees(newAngleInfo.controlPoint2.angleRadians).toFixed(3);

            // process the html
            this._html = this._template(newAngleInfo);

            // push the html into the output element
            this._$outputElement.html(this._html);

            prettyPrint();
        };

        return JsObjectObserver;

    })(_, Handlebars, jQuery, prettyPrint);

    var AnimatingDiv = (function (_)
    {
        var DIV_END_LEFT = 540;
        var DIV_END_TOP = 540;

        function AnimatingDiv($divElement)
        {
            _.bindAll(this);

            this._$divElement = $divElement;

            this._initialLeft = parseInt(this._$divElement.css('left'), 10);
            this._initialTop = parseInt(this._$divElement.css('top'), 10);

            this._endLeft = DIV_END_LEFT;
            this._endTop = DIV_END_TOP;

            this._pathingInfo = null;

        }

        AnimatingDiv.fn = AnimatingDiv.prototype;

        AnimatingDiv.fn.animate = function ()
        {
            var self = this;

            this._$divElement.animate(
                {
                    top: this._endTop,
                    left: this._endLeft,
                    path: new $.path.bezier(this._pathingInfo)
                },
                2000,
                function ()
                {
                    self._reset();
                    self.animate();
                }
            )
        };

        AnimatingDiv.fn._reset = function ()
        {
            this._$divElement.css(
                {
                    top: this._initialTop,
                    left: this._initialLeft
                }
            );
        };

        AnimatingDiv.fn.updateAnimationPath = function (topic, points)
        {
            this._pathingInfo =
            {
                start: {
                    x: points.startPoint.left,
                    y: points.startPoint.top,
                    angle: bezierMath.translateRadiansToDegrees(points.controlPoint1.angleRadians),
                    length: points.controlPoint1.percentDistance

                },
                end: {
                    x: points.endPoint.left,
                    y: points.endPoint.top,
                    angle: bezierMath.translateRadiansToDegrees(points.controlPoint2.angleRadians),
                    length: points.controlPoint2.percentDistance
                }
            };

        };

        return AnimatingDiv;


    })(_);


    // initialize
    var kanvas1 = new fabric.Canvas('fabricCanvas', {renderOnAddition: false});
    kanvas1.selection = false;

    // change the hover cursor
    kanvas1.hoverCursor = 'pointer';

    var KANVAS1_START_POINT = {
        left: 50,
        top: 50
    };
    var KANVAS1_END_POINT = {
        left: 540,
        top: 540
    };
    var CONTROL_POINT_1 = {
        left: 540,
        top: 50
    };
    var CONTROL_POINT_2 = {
        left: 50,
        top: 540
    };

    /************** left canvas bezier initialization *****************/

    var leftBezierControls = new BezierWithControlsMaster(
        {
            fabricCanvas: kanvas1,
            startPoint: KANVAS1_START_POINT,
            endPoint: KANVAS1_END_POINT,
            controlPoint1: CONTROL_POINT_1,
            controlPoint2: CONTROL_POINT_2
        }
    );

    var jsObjectOutput = new JsObjectObserver(
        {
            $outputElement: $('#javascriptObjectOutput'),
            $templateElement: $('#jsObjectTemplate')
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
}
