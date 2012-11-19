window.utils = window.utils || {};

utils.events = (function ()
{
	var exports =
	{
		install:install
	};

	function install(object)
	{
		if (object && !object.evt)
		{
			object.evt = new LocalEvent(object);
		}
	}

	function LocalEvent(object)
	{
		this.topics = {};
		this.subId = -1;
		this.parent = object;
	}

	LocalEvent.fn = LocalEvent.prototype;

	LocalEvent.fn.subscribe = function (topic, func)
	{
		if (!this.topics[topic])
		{
			this.topics[topic] = [];
		}

		var token = ++this.subId;
		this.topics[topic].push({
			token:token,
			func:func
		});
		return token;
	};

	LocalEvent.fn.publish = function (topic)
	{
		// everything into an array
		var args = Array.prototype.slice.call(arguments);

		if (!this.topics[topic])
		{
			return false;
		}

		var subscribers = this.topics[topic],
				len = subscribers.length;

		while (len--)
		{
			subscribers[len].func.apply(null, args);
		}

		return true;
	};

	LocalEvent.fn.unsubscribe = function (token)
	{
		for (var m in this.topics)
		{
			if (this.topics[m])
			{
				for (var i = 0, j = this.topics[m].length; i < j; i++)
				{
					if (this.topics[m][i].token === token)
					{
						this.topics[m].splice(i, 1);
						return token;
					}
				}
			}
		}
		return false;
	};

	return (exports);

})();
/**
 * Created by JetBrains PhpStorm.
 * User: Eric
 * Date: 9/3/12
 * Time: 7:52 PM
 * To change this template use File | Settings | File Templates.
 */
utils.extend = function (subclass, superclass)
{
	var F = function ()
	{
	};
	F.prototype = superclass.prototype;
	subclass.prototype = new F();
	subclass.prototype.constructor = subclass;

	subclass.prototype.superclass = superclass.prototype;
	if (superclass.prototype.constructor == Object.prototype.constructor)
	{
		superclass.prototype.constructor = superclass;
	}

};


