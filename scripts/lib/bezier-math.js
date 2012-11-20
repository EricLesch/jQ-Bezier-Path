var bezierMath = {};

bezierMath.linearInterpolation = function (pointA, pointB, easingAdjustedPercentDone)
{
    return {
        left: pointA.left + (pointB.left - pointA.left) * easingAdjustedPercentDone,
        top: pointA.top + (pointB.top - pointA.top) * easingAdjustedPercentDone
    }
};

bezierMath.translateRadiansToDegrees = function (radians)
{
    return radians / (Math.PI * 2) * 360;
};

bezierMath.translateDegreesToRadians = function(degrees)
{
    return degrees / 360 * Math.PI * 2;
};

// calculates the distance between two points
bezierMath.calculateDistance = function (startPoint, endPoint)
{
    return Math.sqrt(Math.pow(startPoint.left - endPoint.left, 2) + Math.pow(startPoint.top - endPoint.top, 2));
};

// returns angle in radians given three sides of a triangle

bezierMath.calculateAngleSSS = function (opposite, adjacent1, adjacent2)
{
    return Math.acos((Math.pow(opposite, 2) - Math.pow(adjacent1, 2) - Math.pow(adjacent2, 2)) / (-2 * adjacent1 * adjacent2));
};

// returns y = mx + b where m is slope and b is intercept
bezierMath.calculateSlopeIntercept = function (startPoint, endPoint)
{
    // calculate the slope of the line between the start and end points
    var slope = (endPoint.top - startPoint.top) / (endPoint.left - startPoint.left);

    var intercept = endPoint.top - slope * endPoint.left;

    return {
        slope: slope,
        intercept: intercept
    }
};

// takes a total distance and angle and returns a relative x and y
bezierMath.getChangeOfLeftAndTop = function (totalDistance, angle)
{

    var left = totalDistance * Math.cos(angle);
    var top = totalDistance * Math.sin(angle);

    return {
        left: left,
        top: top
    }
};

// return the 360 compliment of an angle
bezierMath.compliment360 = function (angle)
{
    return 2 * Math.PI - angle;
};

// takes startPoint, endPoint, controlPoint1, controlPoint2
// turns it into angle1, percent1, angle2, percent2
bezierMath.translateBezierPointsToPercentAndAngle = function (points)
{
    var startPoint = points.startPoint;
    var endPoint = points.endPoint;

    var controlPoint1 = points.controlPoint1;
    var controlPoint2 = points.controlPoint2;

    // distance from startpoint to endpoint
    var lineLength = bezierMath.calculateDistance(startPoint, endPoint);

    var startPointToControlPoint1Distance = bezierMath.calculateDistance(startPoint, controlPoint1);

    var startPointToControlPoint2Distance = bezierMath.calculateDistance(startPoint, controlPoint2);

    var endPointToControlPoint1Distance = bezierMath.calculateDistance(endPoint, controlPoint1);

    var endPointToControlPoint2Distance = bezierMath.calculateDistance(endPoint, controlPoint2);

    // gets the preliminary angle .... need to take into account which hemisphere the point is
    // in to get the final angle
    var controlPoint1Angle = bezierMath.calculateAngleSSS(endPointToControlPoint1Distance, startPointToControlPoint1Distance, lineLength);
    var controlPoint2Angle = bezierMath.calculateAngleSSS(startPointToControlPoint2Distance, endPointToControlPoint2Distance, lineLength);

    var slopeIntercept = bezierMath.calculateSlopeIntercept(startPoint, endPoint);

    var controlPoint1PercentDistance = startPointToControlPoint1Distance / lineLength;
    var controlPoint2PercentDistance = endPointToControlPoint2Distance / lineLength;

    var controlPoint1AboveTheLine;
    var controlPoint2AboveTheLine;

    // figure out if the control points are above or below the line - these funcs only work if the slope is not
    // infinity or -infinity (i.e. vertical line)
    if (slopeIntercept.slope !== Infinity && slopeIntercept.slope !== -Infinity)
    {
        controlPoint1AboveTheLine = bezierMath.determineHemisphere(controlPoint1, slopeIntercept);
        controlPoint2AboveTheLine = bezierMath.determineHemisphere(controlPoint2, slopeIntercept);
    }
    else if (slopeIntercept.slope === Infinity)// if we are dealing with a vertical line that means we can just compare x values
    {
        controlPoint1AboveTheLine = controlPoint1.left >= startPoint.left;
        controlPoint2AboveTheLine = controlPoint2.left >= startPoint.left;
    }
    else if (slopeIntercept.slope === -Infinity) // if we are dealing with a vertical line going the other way then...
    {
        controlPoint1AboveTheLine = controlPoint1.left < startPoint.left;
        controlPoint2AboveTheLine = controlPoint2.left < startPoint.left;
    }

    // if the start point has a great x value than the end point, then we need to flip
    // the value to get the correct left

    var controlPoint1ToTheLeftOfTheLine;
    var controlPoint2ToTheLeftOfTheLine;

    // don't know what to say about this logic other than it takes care of the cases
    // where endtop === starttop or endleft === startleft
    if (endPoint.top < startPoint.top)
    {
        controlPoint1ToTheLeftOfTheLine = startPoint.left <= endPoint.left
            ? controlPoint1AboveTheLine
            : !controlPoint1AboveTheLine;

        controlPoint2ToTheLeftOfTheLine = startPoint.left > endPoint.left
            ? !controlPoint2AboveTheLine
            : controlPoint2AboveTheLine;
    }
    else
    {
        controlPoint1ToTheLeftOfTheLine = startPoint.left > endPoint.left
            ? !controlPoint1AboveTheLine
            : controlPoint1AboveTheLine;


        controlPoint2ToTheLeftOfTheLine = startPoint.left <= endPoint.left
            ? controlPoint2AboveTheLine
            : !controlPoint2AboveTheLine;
    }

    if (controlPoint1ToTheLeftOfTheLine)
    {
        controlPoint1Angle = 2 * Math.PI - controlPoint1Angle;
    }
    if (!controlPoint2ToTheLeftOfTheLine)
    {
        controlPoint2Angle = 2 * Math.PI - controlPoint2Angle;
    }

    return {
        controlPoint1: {
            angleRadians: controlPoint1Angle,
            percentDistance: controlPoint1PercentDistance,
            leftOfTheLine: controlPoint1ToTheLeftOfTheLine
        },
        controlPoint2: {
            angleRadians: controlPoint2Angle,
            percentDistance: controlPoint2PercentDistance,
            leftOfTheLine: controlPoint2ToTheLeftOfTheLine
        }
    }
};


// takes data in the form
// controlPointInfo : {
// 		controlPoint1: {
// 			angleRadians: num,
//			percentDistance: num
// 		},
// 		controlPoint2: {
// 			angleRadians: num,
//			percentDistance: num
// 		},
//	}
// startPoint : {
//		left: num,
//		top: num,
//	},
//	endPoint: {
//		left: num,
//		top: num,
//	}
// and returns
// points: {
// 		startPoint : {
//			left: num,
//			top: num,
//		},
//		endPoint: {
//			left: num,
//			top: num,
//		},
//		controlPoint1: {
//			left: num,
//			top: num,
// 		},
//		controlPoint2: {
// 			left: num,
//			top: num,
// 		}
//	}

bezierMath.translatePercentAndAngleToPoints = function (controlPointInfo, startPoint, endPoint)
{
    debugger;

    var controlPoint1Angle = controlPointInfo.controlPoint1.angleRadians;
    var controlPoint2Angle = controlPointInfo.controlPoint2.angleRadians;

    // percent of total distance (distance from startPoint to endPoint is)
    var controlPoint1PercentDistance = controlPointInfo.controlPoint1.percentDistance;
    var controlPoint2PercentDistance = controlPointInfo.controlPoint2.percentDistance;

    var lineLength = bezierMath.calculateDistance(startPoint, endPoint);

    var controlPoint1DistanceFromStartPoint = controlPoint1PercentDistance * lineLength;
    var controlPoint2DistanceFromEndPoint = controlPoint2PercentDistance * lineLength;

    var lineAngle = bezierMath.getAngle(startPoint, endPoint);

    var controlPoint1TotalAngle;
    var controlPoint2TotalAngle;

    // take into account case where x values are equal
    if (startPoint.left === endPoint.left)
    {
        controlPoint1TotalAngle = (lineAngle + controlPoint1Angle + Math.PI) % (2 * Math.PI);
        controlPoint2TotalAngle = (lineAngle + controlPoint2Angle) % (2 * Math.PI);
    }
    else
    {
        controlPoint1TotalAngle = (lineAngle + controlPoint1Angle) % (2 * Math.PI);
        controlPoint2TotalAngle = (lineAngle + controlPoint2Angle + Math.PI) % (2 * Math.PI);
    }

    var controlPoint1TotalChangeTopAndLeft = bezierMath.getChangeOfLeftAndTop(controlPoint1DistanceFromStartPoint, controlPoint1TotalAngle);

    var controlPoint2TotalChangeTopAndLeft = bezierMath.getChangeOfLeftAndTop(controlPoint2DistanceFromEndPoint, controlPoint2TotalAngle);

    return {
        startPoint: startPoint,
        endPoint: endPoint,
        controlPoint1: {
            left: controlPoint1TotalChangeTopAndLeft.left + startPoint.left,
            top: controlPoint1TotalChangeTopAndLeft.top + startPoint.top
        },
        controlPoint2: {
            left: controlPoint2TotalChangeTopAndLeft.left + endPoint.left,
            top: controlPoint2TotalChangeTopAndLeft.top + endPoint.top
        }
    }

};



// determines if the point is above or below the line created by the start point and end point
// returns true if the point is above the line -- doesn't work if infinity is the slope (i.e. vertical line)
bezierMath.determineHemisphere = function (controlPoint, slopeIntercept)
{
    // check for the case where slope is infinity (i.e. vertical line)
    if (slopeIntercept.slope === Infinity || slopeIntercept.slope === -Infinity)
    {
        throw new Error('line is vertical. Can\'t determine hemisphere');
    }

    var controlPoint1ComparisonY = controlPoint.left * slopeIntercept.slope + slopeIntercept.intercept;

    return controlPoint1ComparisonY >= controlPoint.top;
};

// returns an angle given the change in the left and the change in the top values
bezierMath.getAngle = function (startPoint, endPoint)
{
    var angle;

    var changeLeft = endPoint.left - startPoint.left;
    var changeTop = endPoint.top - startPoint.top;

    // figure out the initial angle based on what quadrant it is in
    if (changeTop > 0)
    {
        if (changeLeft > 0)
        {
            angle = Math.atan(changeTop / changeLeft);
        }
        else if (changeLeft < 0)
        {
            angle = Math.atan(Math.abs(changeLeft) / changeTop) + Math.PI / 2;
        }
        else if (changeLeft === 0)
        {
            angle = Math.PI * 3 / 2;
        }
    }
    else if (changeTop < 0)
    {
        if (changeLeft > 0)
        {
            angle = 2 * Math.PI - Math.atan(Math.abs(changeTop) / changeLeft);
        }
        else if (changeLeft < 0)
        {
            angle = Math.atan(changeTop / changeLeft) + Math.PI;
        }
        else if (changeLeft === 0)
        {
            angle = Math.PI / 2;
        }
    }
    else if (changeTop === 0)
    {
        if (changeLeft > 0)
        {
            angle = 0;
        }
        else
        {
            angle = Math.PI;
        }
    }

    return angle;
};

