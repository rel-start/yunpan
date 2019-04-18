// 补0
function add0(n) {
	return n < 10 ? '0' + n : '' + n;
}

// 删除数组指定索引对应的数据
function spliceOne(arr, index) {
	var len = arr.length,
		ret = arr[index];
	if (!len) return;
	for (var i = index, j = i + 1; j < len; i++ , j++) {
		arr[i] = arr[j];
	}
	arr.length--;
	return ret;
}

// 混入
function extend(target, source) {      // Object.assign()
	var args = [].slice.call(arguments);

	var i = 1;
	if (args.length == 1) {
		return target;
	};

	while (source = args[i++]) {
		for (var key in source) {
			target[key] = source[key];
		};
	};
	return target;
};

// 区间随机数
function rp(arr, int) {
	var min = Math.min(...arr);
	var max = Math.max.apply(null, arr);
	var ret = Math.random() * (max - min) + min;
	return int ? Math.round(ret) : ret;
}


; (function (win) {
	// 获取与设置css样式
	// =============================================================================
	// 默认css()能设置的带px 的样式。只写了部分
	var normalAttr = [
		'width',
		'height',
		'left',
		'top',
		'bottom',
		'right',
		'marginLeft',
		'marginTop',
		'marginBottom',
		'marginRight'
	];

	var css3Attr = [
		'rotate',
		'rotateX',
		'rotateY',
		'skew',
		'skewX',
		'skewY',
		'translate',
		'translateX',
		'translateY',
		'translateZ',
		'scale',
		'scaleX',
		'scaleY',
		'scaleZ'
	];

	function css(ele, attr, val) {

		// 获取样式值。只有 attr 数据类型为'string' 并且 val 不填写的时候
		if (typeof attr === 'string' && typeof val === 'undefined') {
			// 获取计算后的样式
			var ret = getComputedStyle(ele)[attr];

			if (css3Attr.indexOf(attr) !== -1) {
				return transform(ele, attr);
			}

			// 下面那个 if判断的三元表达式形式
			// return normalAttr.indexOf(attr) !== -1 ? parseFloat(ret) : ret * 1 === ret * 1 ? ret*1 : ret;

			// 如果是 normalAttr 数组内部的样式，获取去掉单位后的值
			if (normalAttr.indexOf(attr) !== -1) {
				return parseFloat(ret);
			}
			// 非 normalAttr 数组内部样式。
			else {
				// 如果获取类似 opacity 得到的值转为数字。animation的时候可能要 + 一个值，所以要number
				// 而类似 background-color 不转换
				return ret * 1 === ret * 1 ? ret * 1 : ret;
			}
		}

		// 批量设置
		if (typeof attr === 'object') {
			for (var key in attr) {
				setAttr(key, attr[key]);
			}
			return;
		}

		// 单一样式设置
		function setAttr(attr, val) {
			if (css3Attr.indexOf(attr) !== -1) {
				return transform(ele, attr, val);
			}

			// 是 normalAttr 数组内部的样式，就 + px
			if (normalAttr.indexOf(attr) !== -1) {
				ele.style[attr] = val + 'px';
			}
			// 非 normalAttr 数组内部样式。直接设置为 val
			else {
				ele.style[attr] = val;
			}
			return;
		}

		// 单一样式设置 调用一次
		setAttr(attr, val);
	}

	// 初始化所有3d样式
	css.init3d = function (el) {
		el._transform = {};
		for (var key in css3Attr) {
			el._transform[css3Attr[key]] = css3Attr[key].indexOf('scale') === -1 ? 0 : 1;
		}
	};


	function transform(el, attr, val) {
		// el元素身上挂一个_transform对象。用于保存添加或修改的2D、3D变化
		el._transform = el._transform || {};

		// 只传入2个参数。那么就是读取该attr属性值
		if (typeof val === 'undefined') return el._transform[attr];


		// _transform对象写入 attr 属性并且值为 val
		/* :KLUDGE; 未做transform 复合样式的功能 */
		el._transform[attr] = val;

		// 储存操作过的2D、3D变化
		var str = '';

		// 相对于_transform对象的每次变化。
		// 都要重新求次str。并重新给元素行内设置transfrom 
		for (var key in el._transform) {
			var value = el._transform[key];

			switch (key) {
				case 'translateX':
				case 'translateY':
				case 'translateZ':
					str += `${key}(${value}px) `;
					break;
				case 'rotate':
				case 'rotateX':
				case 'rotateY':
				case 'rotateZ':
				case 'skewX':
				case 'skewY':
					str += `${key}(${value}deg) `;
					break;
				default:
					str += `${key}(${value})`;
			}
		}

		// 写到行内样式
		el.style.transform = str.trim();
	};

	// css3设置哪个属性 就需要重置哪个属性
	transform.init = function (el, attr) {
		el._transform = {};
		el._transform[attr] = attr.indexOf('scale') === -1 ? 0 : 1;
	};



	// css动画方法
	// =============================================================================
	function animation(props) {
		// 运动的元素
		var el = props.el;

		// window.cancelAnimationFrame(el.animation);
		// 如果在运动中，就跳出方法。只有在运动完成才能在此调用
		if (el.animation) return;


		var
			// 运动样式对象。默认是{} 防止报错
			attrs = props.attrs || {},
			// 总时间。默认400ms
			d = props.duration || 400,
			// 回调函数
			cb = props.cb,
			// 运动曲线
			fx = props.fx || 'easeOut',
			// 起始位置, 总路程
			b = {}, c = {};

		for (var key in attrs) {
			// 获取开始位置的键值对
			b[key] = css(el, key);
			// 获取总路程的键值对
			c[key] = attrs[key] - b[key];
		}

		// 运动开始时间
		var startTime = Date.now();

		(function fn() {
			el.animation = window.requestAnimationFrame(fn);

			// 已用时间
			var t = Date.now() - startTime;

			// 元素限制在终点
			if (t > d) {
				t = d;
				// 清除动画帧
				window.cancelAnimationFrame(el.animation);
				// 清除元素上的动画帧编号
				el.animation = null;
			}


			for (var key in attrs) {
				// 设置当前位置
				var pos = Tween[fx](t, b[key], c[key], d);
				css(el, key, pos);
			}

			// 回调函数调用。this指向元素对象
			if (t === d && typeof cb === 'function') {
				cb.call(el);
			}
		})();
	}

	// 清除动画
	animation.stop = function (el) {
		window.cancelAnimationFrame(el.animation);
		el.animation = null;
	};


	// 运动曲线
	// =============================================================================
	var Tween = {
		linear: function (t, b, c, d) {  //匀速
			return c * t / d + b;
		},
		easeIn: function (t, b, c, d) {  //加速曲线
			return c * (t /= d) * t + b;
		},
		easeOut: function (t, b, c, d) {  //减速曲线
			return -c * (t /= d) * (t - 2) + b;
		},
		easeBoth: function (t, b, c, d) {  //加速减速曲线
			if ((t /= d / 2) < 1) {
				return c / 2 * t * t + b;
			}
			return -c / 2 * ((--t) * (t - 2) - 1) + b;
		},
		easeInStrong: function (t, b, c, d) {  //加加速曲线
			return c * (t /= d) * t * t * t + b;
		},
		easeOutStrong: function (t, b, c, d) {  //减减速曲线
			return -c * ((t = t / d - 1) * t * t * t - 1) + b;
		},
		easeBothStrong: function (t, b, c, d) {  //加加速减减速曲线
			if ((t /= d / 2) < 1) {
				return c / 2 * t * t * t * t + b;
			}
			return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
		},
		elasticIn: function (t, b, c, d, a, p) {  //正弦衰减曲线（弹动渐入）
			if (t === 0) {
				return b;
			}
			if ((t /= d) == 1) {
				return b + c;
			}
			if (!p) {
				p = d * 0.3;
			}
			if (!a || a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			} else {
				var s = p / (2 * Math.PI) * Math.asin(c / a);
			}
			return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		},
		elasticOut: function (t, b, c, d, a, p) {    //*正弦增强曲线（弹动渐出）
			if (t === 0) {
				return b;
			}
			if ((t /= d) == 1) {
				return b + c;
			}
			if (!p) {
				p = d * 0.3;
			}
			if (!a || a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			} else {
				var s = p / (2 * Math.PI) * Math.asin(c / a);
			}
			return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
		},
		elasticBoth: function (t, b, c, d, a, p) {
			if (t === 0) {
				return b;
			}
			if ((t /= d / 2) == 2) {
				return b + c;
			}
			if (!p) {
				p = d * (0.3 * 1.5);
			}
			if (!a || a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			}
			else {
				var s = p / (2 * Math.PI) * Math.asin(c / a);
			}
			if (t < 1) {
				return - 0.5 * (a * Math.pow(2, 10 * (t -= 1)) *
					Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
			}
			return a * Math.pow(2, -10 * (t -= 1)) *
				Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
		},
		backIn: function (t, b, c, d, s) {     //回退加速（回退渐入）
			if (typeof s == 'undefined') {
				s = 1.70158;
			}
			return c * (t /= d) * t * ((s + 1) * t - s) + b;
		},
		backOut: function (t, b, c, d, s) {
			if (typeof s == 'undefined') {
				s = 3.70158;  //回缩的距离
			}
			return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
		},
		backBoth: function (t, b, c, d, s) {
			if (typeof s == 'undefined') {
				s = 1.70158;
			}
			if ((t /= d / 2) < 1) {
				return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
			}
			return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
		},
		bounceIn: function (t, b, c, d) {    //弹球减振（弹球渐出）
			return c - Tween['bounceOut'](d - t, 0, c, d) + b;
		},
		bounceOut: function (t, b, c, d) {//*
			if ((t /= d) < (1 / 2.75)) {
				return c * (7.5625 * t * t) + b;
			} else if (t < (2 / 2.75)) {
				return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
			} else if (t < (2.5 / 2.75)) {
				return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
			}
			return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
		},
		bounceBoth: function (t, b, c, d) {
			if (t < d / 2) {
				return Tween['bounceIn'](t * 2, 0, c, d) * 0.5 + b;
			}
			return Tween['bounceOut'](t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
		}
	}

	win.css = css;
	win.animation = animation;
	win.transform = transform;
})(window);


// 拖拽函数
function mDrag(props) {
	var
		moveEle = props.moveEle,	// 要拖拽的元素
		downEle = props.downEle || moveEle,	// 鼠标按下元素
		beforeFn = props.beforeFn,	// 按下拖拽之前执行的函数
		moveFn = props.moveFn,	// 在拖拽时执行的函数
		afterFn = props.afterFn,	// 拖拽结束之后执行的函数
		called = props.called || downEle,	// 设定执行函数体内的this指向
		outDisable = true,	// 鼠标超出 moveScrop 范围是否取消拖拽操作，默认否
		disableX = props.disableX || false,
		disableY = props.disableY || false,
		scrope = true;	// 是否限制在 moveScrop 范围，默认是限制范围
	// 是否限制范围
	if (typeof props.scrope !== 'undefined') scrope = props.scrope;
	// 鼠标超出范围是否取消拖拽操作
	if (typeof props.outDisable !== 'undefined') outDisable = props.outDisable;
	var dx, dy,
		// 移动元素的定位父级
		offsetParent = moveEle.offsetParent,
		// 父级的 DOMRect对象
		parentRect = offsetParent.getBoundingClientRect(),
		// 父级的样式
		parentStyle = getComputedStyle(offsetParent),
		// 鼠标移动事件触发对象，默认就是拖拽对象的定位父级
		// 如果不限制，鼠标移动事件触发对象为document
		moveScrop = scrope ? (props.moveScrop || offsetParent) : document,
		// 鼠标抬起的事件触发对象，默认是拖拽对象的定位父级
		// 如果不限制，鼠标抬起的事件触发对象为document
		upScrop = scrope ? (props.upScrop || moveScrop) : document;

	// ---------------------------------------------------------
	// 用户交互
	downEle.addEventListener('mousedown', function (e) {
		(downEle);
		e.preventDefault();

		// 拖拽之前的 Fn
		if (typeof beforeFn === 'function') beforeFn.call(called, e);

		// 移动元素的 DOMRect对象
		var moveEleRect = moveEle.getBoundingClientRect();

		// 鼠标按下点距离 移动元素左上角的x、y
		dx = e.pageX - moveEleRect.left;
		dy = e.pageY - moveEleRect.top;

		if (outDisable) moveScrop.addEventListener('mouseleave', clearEventFromParent);
		moveScrop.addEventListener('mousemove', startMove);
		upScrop.addEventListener('mouseup', cancelMove);
	});




	// ---------------------------------------------------------
	// 方法区域
	// ==========
	// 元素移动
	function startMove(e) {
		// 移动元素相对于定位父级的位置 x、y
		var x = e.pageX - dx - parentRect.left - parseFloat(parentStyle['borderLeftWidth']);
		var y = e.pageY - dy - parentRect.top - parseFloat(parentStyle['borderTopWidth']);

		// 限制拖拽范围
		if (scrope) {
			if (x < 0) x = 0;
			// 如果定位父级对象为document 那么用window.innerWidth
			if (x > offsetParent.clientWidth - moveEle.offsetWidth) x = offsetParent.clientWidth - moveEle.offsetWidth;

			if (y < 0) y = 0;
			if (y > offsetParent.clientHeight - moveEle.offsetHeight) y = offsetParent.clientHeight - moveEle.offsetHeight;
		}

		if (!disableX) moveEle.style.left = x + 'px';
		if (!disableY) moveEle.style.top = y + 'px';

		// 拖拽中的 Fn
		if (typeof moveFn === 'function') moveFn.call(called, e);
	}


	// ==========
	// 取消元素移动方法
	function cancelMove(e) {
		if (outDisable) moveScrop.removeEventListener('mouseleave', clearEventFromParent);
		moveScrop.removeEventListener('mousemove', startMove);
		upScrop.removeEventListener('mouseup', cancelMove);

		// 拖拽结束后的 Fn
		if (typeof afterFn === 'function') afterFn.call(called, e);
	}


	// ==========
	// 离开父级清除事件
	function clearEventFromParent(e) { cancelMove(); }
}

// 元素碰撞检测
function impact(ele1, ele2) {
	var rect1 = ele1.getBoundingClientRect();
	var rect2 = ele2.getBoundingClientRect();
	return rect1.right > rect2.left && rect1.bottom > rect2.top && rect1.left < rect2.right && rect1.top < rect2.bottom;
}



; (function (window) {	// 还没封装好
	function scrollBarFx(options) {
		if (this instanceof scrollBarFx) {
			this.barPos = 0;
			this.options = extend({}, this.options);
			extend(this.options, options);

			this._calcBar();
			this.rollerEvent();
			if (this.options.canDrag) this.drag();
			if (this.options.xAxis) this.xdrag();
			if (this.options.autoScale) this.selfAdaption();
		}
		else {
			return new scrollBarFx(options);
		}
	}



	// 默认参数
	scrollBarFx.prototype.options = {
		displayArea: null,
		contentArea: null,
		barWrap: null,
		bar: null,
		xbarWrap: null,
		xbar: null,
		speed: 5,
		minHeight: 30,
		maxHeight: null,
		minWidth: 30,
		maxWidth: null,
		beforeFn: null,
		afterFn: null,
		canDrag: true,
		xAxis: false,
		autoScale: false
	};

	scrollBarFx.prototype._calcBar = function (topNotZero) {

		this.yAxisRoll(topNotZero);
		if (this.options.xAxis) this.xAxisRoll(topNotZero);
	};

	// 自适应
	scrollBarFx.prototype.selfAdaption = function (arguments){
		var _this = this;
		window.addEventListener('resize', function (e) {
			_this._calcBar(true);
		});
	};

	scrollBarFx.prototype.yAxisRoll = function (topNotZero) {
		var _this = this, _opts = _this.options;
		_this.displayAreaH = _opts.displayArea.clientHeight;
		_this.contentAreaH = _opts.contentArea.offsetHeight;
		_opts.barWrap.style.opacity = _this.contentAreaH > _this.displayAreaH ? 1 : '';

		// if (!topNotZero) {
		_this.barPos = 0;
		_opts.bar.style.top = 0;
		_opts.contentArea.style.top = 0;
		// } else {
		// 	let curContTop = parseFloat(_opts.contentArea.style.top);
		// 	let curBarTop = parseFloat(_opts.bar.style.top);
		// 	let scale = _this.displayAreaH / _this.oldDisplayAreaH;
		// 	/**
		// 	 * 放大是除以 >1
		// 	 * 缩小是乘以 <1
		// 	 */

		// 	 if (scale > 1) {
		// 		_this.barPos = _this.barPos / scale;
		// 		_opts.bar.style.top = curBarTop / scale + 'px';
		// 		_opts.contentArea.style.top = curContTop / scale + 'px';
		// 	 } else {
		// 		_this.barPos = _this.barPos * scale;
		// 		_opts.bar.style.top = curBarTop * scale + 'px';
		// 		_opts.contentArea.style.top = curContTop * scale + 'px';
		// 	 }
		// }

		_this.oldDisplayAreaH = _this.displayAreaH;

		if (_this.contentAreaH <= _this.displayAreaH) return;

		_this.barWrapH = _opts.barWrap.clientHeight;
		// 正常滚动条的高度
		_this.norbarH = _this.displayAreaH / _this.contentAreaH * _this.barWrapH;
		// 当前滚动条的高度。最大高度 barParent 的高度
		_this.curbarH = Math.min(_this.norbarH, _opts.maxHeight);
		// 滚动条最小高度 30px
		_this.curbarH = Math.max(_this.curbarH, _opts.minHeight);

		// 手动设置滚动条后的一个差值
		_this.cbarRatio = (_this.barWrapH - _this.norbarH) / (_this.barWrapH - _this.curbarH);
		// 默认的滚动条的滚动路程 与 内容滚动距离的比值 / 手动设置的差值
		_this.barRatio = _this.norbarH / _this.displayAreaH / _this.cbarRatio;
		_opts.bar.style.height = _this.curbarH + 'px';
	};

	scrollBarFx.prototype.xAxisRoll = function (leftNotZero) {
		var _this = this, _opts = _this.options;
		_this.displayAreaW = _opts.displayArea.clientWidth;
		_this.contentAreaW = _opts.contentArea.offsetWidth;
		_opts.xbarWrap.style.opacity = _this.contentAreaW > _this.displayAreaW ? 1 : '';

		if (!leftNotZero) {
			_this.xbarPos = 0;
			_opts.xbar.style.top = 0;
			_opts.contentArea.style.left = 0;
		} else {
			let curContTop = parseFloat(_opts.contentArea.style.left);
			let curBarTop = parseFloat(_opts.xbar.style.left);
			let scale = _this.displayAreaW / _this.oldDisplayAreaW;
			_this.xbarPos = _this.xbarPos * scale;
			_opts.xbar.style.left = curBarTop * scale + 'px';
			_opts.contentArea.style.left = curContTop * scale + 'px';
		}

		_this.oldDisplayAreaW = _this.displayAreaW;

		if (_this.contentAreaW <= _this.displayAreaW) return;

		_this.barWrapW = _opts.xbarWrap.clientWidth;
		// 正常滚动条的高度
		_this.norbarW = _this.displayAreaW / _this.contentAreaW * _this.barWrapW;
		// 当前滚动条的高度。最大高度 barParent 的高度
		_this.curbarW = Math.min(_this.norbarW, _opts.maxWidth);
		// 滚动条最小高度 30px
		_this.curbarW = Math.max(_this.curbarW, _opts.minWidth);

		// 手动设置滚动条后的一个差值
		_this.xcbarRatio = (_this.barWrapW - _this.norbarW) / (_this.barWrapW - _this.curbarW);
		// 默认的滚动条的滚动路程 与 内容滚动距离的比值 / 手动设置的差值
		_this.xbarRatio = _this.norbarW / _this.displayAreaW / _this.xcbarRatio;
		_opts.xbar.style.width = _this.curbarW + 'px';
	};

	scrollBarFx.prototype.rollerEvent = function () {
		var _this = this, _opts = _this.options;
		_this.mouseWheel(_opts.displayArea, function upFn(e, rate) {
			if (_this.contentAreaH <= _this.displayAreaH) return;

			e.preventDefault();
			// 滚动距离
			_this.barPos -= _opts.speed * rate;
			// 边界判断
			if (_this.barPos < 0) _this.barPos = 0;
			// 滚动条的运动
			_opts.bar.style.top = _this.barPos + 'px';
			// 内容的滚动
			_opts.contentArea.style.top = -_this.barPos / _this.barRatio + 'px';

		}, function downFn(e, rate) {
			e.preventDefault();
			if (_this.contentAreaH <= _this.displayAreaH) return;

			// 滚动距离
			_this.barPos += _opts.speed * rate;
			// 边界判断
			if (_this.barPos > _this.barWrapH - _this.curbarH) _this.barPos = _this.barWrapH - _this.curbarH;
			// 滚动条的运动
			_opts.bar.style.top = _this.barPos + 'px';
			// 内容的滚动
			_opts.contentArea.style.top = -_this.barPos / _this.barRatio + 'px';

		});
	};

	scrollBarFx.prototype.drag = function () {
		var _this = this, _opts = _this.options;
		mDrag({
			moveEle: _opts.bar,
			disableX: true,
			moveFn() {
				_this.barPos = _opts.bar.offsetTop;
				_opts.contentArea.style.top = -_this.barPos / _this.barRatio + 'px';
			},
			moveScrop: document
		});
	};

	scrollBarFx.prototype.xdrag = function () {
		var _this = this, _opts = _this.options;
		mDrag({
			moveEle: _opts.xbar,
			disableY: true,
			moveFn() {
				_this.xbarPos = _opts.xbar.offsetLeft;
				_opts.contentArea.style.left = -_this.xbarPos / _this.xbarRatio + 'px';
			},
			moveScrop: document
		});
	};


	// 滚轮事件
	scrollBarFx.prototype.mouseWheel = function (ele, upFn, downFn) {
		if (window.onmousewheel === null) {
			ele.addEventListener('mousewheel', fn);        // 谷歌浏览器
		} else {
			ele.addEventListener('DOMMouseScroll', fn);    // 火狐浏览器
		}

		function fn(e) {
			var dir, rate;

			// 谷歌浏览器。向上滚动 >= 120
			if (e.wheelDelta) {
				dir = e.wheelDelta > 0 ? true : false;
				rate = Math.abs(e.wheelDelta) / 120;
			}

			// 火狐浏览器。向上滚动 <= -3
			if (e.detail) {

				dir = e.detail < 0 ? true : false;
				rate = Math.abs(e.detail) / 3;
			}

			if (dir) upFn && upFn.call(ele, e, rate);
			else downFn && downFn.call(ele, e, rate);
		}
	}

	


	window.scrollBarFx = scrollBarFx;
	window.mouseWheel = scrollBarFx.prototype.mouseWheel;
})(window);





