// --------------------------------------------------------------
// [初始化]
enterFolder(bl.fileListId);





// --------------------------------------------------------------
// [切换列表与缩略图模式功能]
bl.orderList.onselectstart = function () { return false; };
bl.orderList.firstElementChild.onmouseenter = function () {
	this.parentNode.parentNode.querySelector('.mask').style.display = 'none';
};
bl.orderList.firstElementChild.onmouseleave = function () {
	this.parentNode.parentNode.querySelector('.mask').style.display = '';
};
bl.orderList.addEventListener('click', function (e) {
	e.preventDefault();
	const target = e.target;

	if (target.className === 'display_mode') {

		switchDisplayMode.call(target);
		// 文件夹间隙重新计算
		setFileGap(bl.fileWrap, bl.files);
		fsScrollBar._calcBar();
	}

	if (target.className === 'alpha_order') {
		enterFolder(bl.fileListId, 2);
	}

	if (target.className === 'time_order') {
		enterFolder(bl.fileListId, 3);
	}
});

// \________
// 切换显示模式
function switchDisplayMode() {
	if (this.innerHTML === '缩略图') {
		bl.fileWrap.className = 'file_wrap';
		bl.displayMode.innerHTML = '详细信息';
	} else {
		bl.fileWrap.className = 'tabular_form';
		bl.displayMode.innerHTML = '缩略图';
	}
}


// --------------------------------------------------------------
// [进入与选中文件]
// ____________________
// 进入文件夹
bl.fileWrap.addEventListener('dblclick', function (e) {
	const target = e.target,
		parent = judgeParentByClass(target, 'file', 'fileWrap');

	if (parent) whatWayEnter(parent);
});

document.addEventListener('keydown', function (e) {
	const keyCode = e.keyCode;
	const { checkedBuffer } = bl;
	const requirement = (checkedBuffer.length === 1);

	if (requirement) {
		if (keyCode === 13) return whatWayEnter(undefined, getCheckedFileFromBuffer(checkedBuffer)[0].fileId);
		if (keyCode === 113) return setFileNodeName({ checkedBuffer });
	}
});

// \__________
// 什么方式进入
function whatWayEnter(parent, cID) {
	let fileId = cID ? cID : parent.dataset['fileId'];
	enterFolder(fileId);
}

// ____________________
// 面包屑导航跳转
bl.pathWrap.addEventListener('click', function (e) {
	const target = e.target;

	if (target.nodeName === 'A' && !target.classList.contains('active')) {
		const fileId = target.dataset['fileId'];
		enterFolder(fileId);
	}
});


// ____________________
// 选中文件夹
bl.fileWrap.addEventListener('click', function (e) {
	// 文件的选中与取消
	fileItemSelAndCancel(e.type, e.target, e);
});

bl.fileWrap.addEventListener('mousedown', function (e) {
	fileItemSelAndCancel(e.type, e.target, e);
});

// \__________
// 文件的选中与取消函数
function fileItemSelAndCancel(type, target, e) {

	// 找到父级 fileItem
	const parent = judgeParentByClass(target, 'file', 'fileWrap');
	const { checkedBuffer, fileWrap } = bl, fileId = (parent ? parent.dataset['fileId'] : undefined);

	// 单选功能。点击复选框更替 .checked
	if (target.className === 'checkbox' && type === 'click') {
		switchChecked();
		return allCheckStatus();
	}

	function switchChecked(arguments) {	// 切换点击事件
		if (parent.classList.toggle('checked')) {
			checkedBuffer[fileId] = parent;
			checkedBuffer.length++;
		} else {
			delete checkedBuffer[fileId];
			checkedBuffer.length--;
		}
	}

	// 点击 fileItem 选中
	if (target.nodeName !== 'INPUT' && parent && target.className !== 'checkbox') {

		/**	【没实现】
		 * 鼠标按下：选中当前
		 * 鼠标松开：取消选中非当前文件
		 * 空白区域点击：取消全部选中
		 * 按住ctrl键：不清除文件
		 */

		if (type === 'mousedown') {
			if (e) {
				// e.preventDefault();
				dragFileMoveTo(e);
			}
			if (e && e.ctrlKey) {
				dragFileMoveTo(e);
				switchChecked();
			} else {
				if (!parent.classList.contains('checked')) clearCheckBuffer();
				if (!bl.checkedBuffer[fileId]) {
					bl.checkedBuffer[fileId] = parent;
					parent.classList.add('checked');
					bl.checkedBuffer.length++;
				}
			}
		}

		if (type === 'click') {

			if (!e.ctrlKey && parent.classList.contains('checked')) clearCheckBuffer(parent);
			recordClickTimes(parent);

			// 如果文件是选中的 再次点击名字当前文件就执行重命名
			if (target.classList.contains('file_name') && parent.classList.contains('checked') && parent.clicks >= 2) {
				currentFileOperate(parent, 'rename');
			}
			// 当前的文件夹重命名功能
			if (target.className === 'curRename') {
				currentFileOperate(parent, 'rename');
			}
			// 当前的文件夹删除功能
			if (target.className === 'curRemove') {
				currentFileOperate(parent, 'delete');
			}
			// 当前的文件夹移动功能
			if (target.className === 'curMoveto') {
				stopStatusHints();
				currentFileOperate(parent, 'moveto');
			}
			if (target.className === 'curShare') {
				return popuptStatus('功能尚未完成', 'select_file');
			}
			if (target.className === 'curDownload') {
				return popuptStatus('功能尚未完成', 'select_file');
			}
		}


		return allCheckStatus();
	}
	// 点击非 fileItem。
	if (target.nodeName !== 'INPUT' && !parent && type === 'mousedown') {
		if (fileWrap.prevParent) fileWrap.prevParent.clicks = 0;
		clearCheckBuffer();
	}
}

// \\__________
// 记录鼠标按下次数。第二次后点击 .file_name 可以改名字
function recordClickTimes(parent) {
	const { fileWrap } = bl;
	if (!parent.clicks || (fileWrap.prevParent && fileWrap.prevParent !== parent)) {
		parent.clicks = 1;
	} else {
		parent.clicks++;
	}
	fileWrap.prevParent = parent;
}


// \\_________
// 拖拽选中 文件到。。。
function dragFileMoveTo(e) {
	const { checkedBuffer, drag_hint, fileWrap, container } = bl;
	const len = checkedBuffer.length;
	let x1 = e.pageX, y1 = e.pageY, canMove;

	document.addEventListener('mousemove', startDrag);
	function startDrag(e) {

		x = e.pageX; y = e.pageY;
		if (Math.abs(x - x1) >= 10 || Math.abs(y - y1) >= 10) {
			canMove = true;
			drag_hint.innerHTML = '选中' + checkedBuffer.length + '个文件';

			// 边界限制
			let containerRect = container.getBoundingClientRect();
			if (x < containerRect.left - 5) x = containerRect.left - 5;
			if (x > containerRect.right - 5 - drag_hint.offsetWidth) x = (containerRect.right - 5 - drag_hint.offsetWidth);
			if (y < containerRect.top - 5) y = containerRect.top - 5;
			if (y > containerRect.bottom - 5 - drag_hint.offsetHeight) y = (containerRect.bottom - 5 - drag_hint.offsetHeight);

			drag_hint.style.left = x + 5 + 'px';
			drag_hint.style.top = y + 5 + 'px';
		}
	}

	document.addEventListener('mouseup', endDrag);
	function endDrag(e) {
		document.removeEventListener('mousemove', startDrag);
		document.removeEventListener('mouseup', endDrag); // arguments.callee
		drag_hint.style.left = -999 + 'px';

		let curParent = judgeParentByClass(e.target, 'file', 'container');
		// 不是移动到文件夹上, 鼠标按下x、y移动没超过5。就跳出去
		if (!canMove || !curParent) return;
		bl.moveTargetId = curParent.dataset.fileId * 1;

		sureMoveto();
	}
}


// \__________
// 全选按钮的状态
function allCheckStatus() {
	bl.allCheck.classList.toggle('checked', bl.checkedBuffer.length === bl.files.length);
}

// \\__________
// 全部非选中
function clearCheckBuffer(parent) {
	if (bl.checkedBuffer.length > 0) {
		const arr = getCheckedFileFromBuffer(bl.checkedBuffer);
		arr.map(function (item) {
			const itemNode = item['fileNode'];
			if (parent !== itemNode) {
				itemNode.classList.remove('checked');

				if (parent) {
					delete bl.checkedBuffer[item['fileId']];
					bl.checkedBuffer.length--;
				}
			}
		});

		if (!parent) initAllCheck();
	}
}

// \\________
// 清除全选按钮
function initAllCheck() {
	bl.checkedBuffer = { length: 0 };
	allCheck.classList.remove('checked');
}

// ____________________
// 全选功能
bl.allCheck.addEventListener('click', function () {
	const isChecked = this.classList.toggle('checked'),
		{ files } = bl,
		len = files.length;
	bl.checkedBuffer = { length: 0 };

	for (let i = 0; i < len; i++) {
		const item = files[i],
			{ fileId } = item.dataset;

		// 对应所有文件 是否选中
		item.classList.toggle('checked', isChecked);
		// 如果是选中，把所有item传到 checkedBuffer 对象中
		if (isChecked) bl.checkedBuffer[fileId] = item;
	}

	// 如果是选中, checkedBuffer对象的length = files.length
	if (isChecked) bl.checkedBuffer.length = len;

});


// ____________________
// 鼠标画框功能
mouseFrame();

// \__________
// 鼠标画框函数
function mouseFrame() {
	const parentEle = bl.fileArea;
	document.addEventListener('mousedown', function (e) {
		if (e.button !== 0) return;		// 只有鼠标主键(左键)才能画框
		const target = e.target;
		const { mouseFrame } = bl;

		if (target.id !== 'fileWrap') return;
		const dx = e.pageX - parentEle.offsetLeft,
			dy = e.pageY - parentEle.offsetTop;

		document.addEventListener('mousemove', startDraw);
		document.addEventListener('mouseup', endDraw);

		function startDraw(e) {
			const x = e.pageX - parentEle.offsetLeft,
				y = e.pageY - parentEle.offsetTop;

			/**
			 * 碰撞检测
			 * 	- bl.selDataId 如果碰撞到了，并且里面没有就push。没碰撞到，里面有就删除掉
			 * 	- bl.allCheck 全选按钮是否要选中
			 */
			Array.from(bl.files, function (item) {
				const isImpact = impact(mouseFrame, item),
					{ fileId } = item.dataset,
					{ checkedBuffer } = bl;

				if (item.classList.toggle('checked', isImpact)) {
					if (!checkedBuffer[fileId]) {
						checkedBuffer[fileId] = item;
						checkedBuffer.length++;
					};
				} else {
					if (checkedBuffer[fileId]) {
						delete checkedBuffer[fileId];
						checkedBuffer.length--;
					};
				}

				// 全选按钮的状态
				allCheckStatus();
			});


			mouseFrame.style.left = Math.min(x, dx) + 'px';
			mouseFrame.style.top = Math.min(y, dy) + 'px';
			mouseFrame.style.width = Math.abs(x - dx) + 'px';
			mouseFrame.style.height = Math.abs(y - dy) + 'px';
		}

		function endDraw(e) {
			mouseFrame.style.cssText = '';
			document.removeEventListener('mousemove', startDraw);
			document.removeEventListener('mouseup', endDraw);
		}
	});
}


// --------------------------------------------------------------
// [重命名功能]
bl.reName.addEventListener('click', function (e) {
	const { checkedBuffer } = bl;

	// 如果选中1个文件
	if (checkedBuffer.length === 1) {
		setFileNodeName({ checkedBuffer });
	} else {
		popuptStatus('请选中1个文件', 'select_file');
	}

});


// \__________
function stopStatusHints() {
	// animation.stop(bl.statusHints);
	bl.statusHints.style.display = 'none';
}
// \__________
// 弹出提示状态
function popuptStatus(text, type, beforeFn) {
	const statusHints = bl.statusHints;
	stopStatusHints();
	beforeFn && beforeFn();
	statusHints.setAttribute('data-style', type);
	statusHints.querySelector('.status_text').innerHTML = text;

	statusHints._transform = { perspective: '1000px', translate: '-50%', rotateX: -90 };
	statusHints.style.display = 'block';
	animation({
		el: statusHints,
		attrs: {
			rotateX: 0
		},
		cb() {
			// 2秒之后隐藏
			clearTimeout(statusHints.timers);
			statusHints.timers = setTimeout(function () {
				animation({
					el: statusHints,
					attrs: {
						rotateX: -90
					},
					cb() {
						statusHints.style.display = 'none';
					},
					duration: 200
				});
			}, 3000);
		},
		duration: 200
	});
}

// \__________
// 文件夹重命名
/**
 * current: 当前操作文件夹
 * checkedBuffer: 选中缓存
 * failFn: 新建文件重命名失败执行的函数
 * succFn: 新建文件重命名成功执行的函数
 */
function setFileNodeName(opts) {
	let fileId, fileNode;

	if (opts.current) {
		fileId = opts.current.fileId;
		fileNode = opts.current.fileNode;
	} else {
		const checkedEle = getCheckedFileFromBuffer(opts.checkedBuffer)[0];
		fileId = checkedEle.fileId;
		fileNode = checkedEle.fileNode;
	}

	const fileName = fileNode.querySelector('.file_name'),
		nameInput = fileNode.querySelector('.name_input');

	btnsIsAbled(bl.fsControlChildren, true);
	SwitchDisplay(nameInput, fileName, 'show');

	const oldName = nameInput.value = fileName.innerHTML;
	nameInput.select();

	document.addEventListener('keydown', addKeyBoardEvent, true);
	function addKeyBoardEvent(e) {
		e.stopImmediatePropagation();	// 防止与回车进入文件夹冲突
		const keyCode = e.keyCode;
		if (e.keyCode === 13) {
			nameInput.onblur();
		}
		else if (e.keyCode === 27) {
			nameInput.isCancel = true;
			nameInput.onblur(true);
		}
	}


	nameInput.onblur = function () {
		const newName = this.value.trim();
		if (newName === oldName || this.isCancel) {
			btnsIsAbled(bl.fsControlChildren, false);
			SwitchDisplay(fileName, nameInput, 'show');
			document.removeEventListener('keydown', addKeyBoardEvent, true);
			this.onblur = null;
			opts.failFn && opts.failFn();
			return this.isCancel = false;
		}
		if (!newName) {
			this.select();
			opts.failFn && opts.failFn();
			return popuptStatus('请输入一个名字', 'select_file');
		}
		if (!nameCanUse(fileData, bl.fileListId, newName)) {
			this.select();
			return popuptStatus('命名冲突', 'select_file');
		}

		fileName.innerHTML = fileName.title = newName;
		setItemById(fileData, fileId, { name: newName });

		bl.currentBuffer.some((item) => {
			if (item.id === fileId * 1) {
				item.name = newName;
				return true;
			}
			return false;
		});

		btnsIsAbled(bl.fsControlChildren, false);
		SwitchDisplay(fileName, nameInput, 'show');
		this.onblur = null;
		document.removeEventListener('keydown', addKeyBoardEvent, true);
		opts.succFn && opts.succFn(newName);
	}
}
// \\__________
// 按鈕是否可用
function btnsIsAbled(eles, bool) {
	eles.forEach((c) => { c.disabled = bool; });
}
// \\__________
// 操作当前文件夹
function currentFileOperate(parent, type) {
	const { fileId } = parent.dataset;
	if (type === 'rename') {
		setFileNodeName({
			checkedBuffer: bl.checkedBuffer,
			current: { fileId, fileNode: parent }
		});
	} else if (type === 'delete') {
		alertMessage('确定要删除这个文件夹吗？', () => {
			sureDelete({
				current: [{ fileId, fileNode: parent }]
			});
		});
	} else if (type === 'moveto') {
		setMoveToDialog(sureMoveto, cancelMoveto, [{ fileId, fileNode: parent }]);
	}
}
// \\__________
// 两者切换显示
function SwitchDisplay(a, b, clas) {
	a.classList.add(clas);
	b.classList.remove(clas);
}


// --------------------------------------------------------------
// [删除功能]
bl.rmFile.addEventListener('click', function (e) {
	this.blur();
	const { checkedBuffer } = bl;
	const len = checkedBuffer.length;

	if (!len) {
		popuptStatus('请选择文件', 'select_file');
	} else {
		alertMessage('确定要删除选中的文件夹吗？', () => {
			sureDelete({ checkedBuffer });
		}, null);

	}
});



// \__________
// 弹出提示信息
function alertMessage(text, sureFn, cancelFn) {
	const rmAlert = bl.rmAlert;
	stopStatusHints();

	rmAlert.insertAdjacentHTML('beforeend', createCheckBoxHtml(text));
	const animateEle = rmAlert.querySelector('.dialog_content');
	const overlayEle = rmAlert.querySelector('.dialog_overlay');

	rmAlert.style.display = 'block';

	// 3D动画 先初始化
	animateEle._transform = { translateY: -50 };
	animation({
		el: animateEle,
		attrs: {
			translateY: 0,
			opacity: 1
		}
	});

	const sureBtn = rmAlert.querySelector('.sure_btn');
	const cancelBtn = rmAlert.querySelector('.cancel_btn');
	const closeBtn = rmAlert.querySelector('.dialog_close');
	document.addEventListener('keydown', deleteSure, true);

	function deleteSure(e) {
		e.stopImmediatePropagation();
		let keyCode = e.keyCode;
		if (keyCode === 13) hideAlertMessage(sureFn);
		else if (keyCode === 27) hideAlertMessage(cancelFn);
	}
	sureBtn.addEventListener('click', () => {
		hideAlertMessage(sureFn);
	});
	overlayEle.onclick = cancelBtn.onclick = closeBtn.onclick = function () {
		hideAlertMessage(cancelFn);
	};

	function hideAlertMessage(fn) {
		console.log('删除');
		animation.stop(animateEle);
		document.removeEventListener('keydown', deleteSure, true);
		animation({
			el: animateEle,
			attrs: {
				translateY: -50,
				opacity: 0
			},
			cb() {
				animation.stop(animateEle);
				fn && fn();
				rmAlert.innerHTML = '';
				console.log(22);
				rmAlert.style.display = 'none';
			},
			duration: 300
		});
	}
}

// \\__________
// 确认删除
function sureDelete(opts) {
	let checkFiles;
	if (opts.current) {
		checkFiles = opts.current;
	} else {
		checkFiles = getCheckedFileFromBuffer(opts.checkedBuffer);
	}


	const { fileWrap } = bl;

	checkFiles.forEach(function (item, i) {
		const { fileId, fileNode } = item;

		fileWrap.removeChild(fileNode);

		bl.checkedBuffer.length--;
		delete bl.checkedBuffer[fileId];
		bl.currentBuffer = bl.currentBuffer.filter((item) => item.id !== fileId * 1);

		deleteItemById(fileData, fileId);
	});

	noFile();
	bl.allCheck.classList.remove('checked');
	popuptStatus('删除成功', 'success');
	fsScrollBar._calcBar();
}


// --------------------------------------------------------------
// [新建功能]
bl.newFolder.addEventListener('click', function (e) {
	newFileFun();
});

// \_________
// 创建文件夹函数
function newFileFun() {
	const { fileListId, fileWrap, checkedBuffer, currentBuffer, allCheck } = bl;

	const newData = newFileData(fileListId);
	const newNode = createFileNode(newData);


	// 清除所有选中文件夹
	clearCheckBuffer();
	// 选中新建的DOM并追加到页面上
	fileItemSelAndCancel('mousedown', fileWrap.insertBefore(newNode, fileWrap.firstElementChild));

	newFileInsideFileGap(newNode);

	noFile();
	setFileNodeName({
		checkedBuffer: checkedBuffer,
		current: { fileId: newData.id, fileNode: newNode },
		failFn() {
			fileWrap.removeChild(newNode);	// bl.files没有
			initAllCheck();
			popuptStatus('取消新建操作', 'select_file');
			noFile();
		},
		succFn(name) {
			newData.name = name;
			addOneData(fileData, newData);
			currentBuffer.push(newData);
			fsScrollBar._calcBar();
		}
	});
}

function newFileInsideFileGap(newNode) {
	if (bl.files.length > 1) {
		newNode.style.marginLeft = newNode.style.marginRight = bl.fileWrap.lastElementChild.style.marginLeft;
	} else {
		setFileGap(bl.fileWrap, bl.files);
	}
}

function newFileData(pid) {
	let now = new Date();
	const newData = {
		id: Date.now(),
		name: '',
		pId: pid,
		rise_time: getDateTime(now)
	};
	return newData;
}

// \\_________
// 计算当前年月日。格式：2016-08-21 16:03
function getDateTime(now) {
	return (now.getFullYear()) + '-' + add0(now.getMonth() + 1) + '-' + add0(now.getDate()) + ' ' + add0(now.getHours()) + ':' + add0(now.getMinutes());
}

// --------------------------------------------------------------
// [移动功能]
bl.fileMoveTo.addEventListener('click', function () {
	this.blur();
	const { checkedBuffer, fileWrap } = bl;
	const len = checkedBuffer.length;

	stopStatusHints();
	if (!len) return popuptStatus('尚未选中文件', 'select_file');

	setMoveToDialog(sureMoveto, cancelMoveto);
});


// \_________
// 设置移动弹出层
function setMoveToDialog(sureFn, cancelFn, current) {
	const { fileListId } = bl;
	let treeListNode = createDialog(createTreeList(fileData, fileListId), 'moveto_dialog');
	document.body.appendChild(treeListNode);

	document.addEventListener('keydown', disableDocEnter, true);
	function disableDocEnter(e) {
		e.stopImmediatePropagation();
		let keyCode = e.keyCode;
		if (keyCode === 27) mMoveToHide(cancelFn);
	}

	const dialogEle = treeListNode.querySelector('.mMoveto_content');
	const overlayEle = treeListNode.querySelector('.mMoveto_overlay');
	dialogEle.style.left = (dialogEle.offsetParent.clientWidth - dialogEle.offsetWidth) / 2 + 'px';
	dialogEle.style.top = (dialogEle.offsetParent.clientHeight - dialogEle.offsetHeight) / 2 + 'px';

	mDrag({
		moveEle: dialogEle,
		downEle: treeListNode.querySelector('.mMoveto_header'),
		moveScrop: document
	});

	dialogEle._transform = { translateY: -50 };
	animation({
		el: dialogEle,
		attrs: {
			translateY: 0,
			opacity: 1
		}
	});

	// 展开收缩
	const firstFloor = dialogEle.querySelector('.treeview');
	treeListNode.prevActive = dialogEle.querySelector('.active');


	; (function toggleList(parent) {
		const childrenLi = parent.children;
		if (childrenLi[0].children[0].children[0].onclick) return;

		for (let i = 0, len = childrenLi.length; i < len; i++) {
			const caption = childrenLi[i].children[0];
			mMoveToItemClickEvent(caption, treeListNode, toggleList);
		}
		if (parent === firstFloor) {
			childrenLi[0].children[0].children[0].onclick();
		}
	})(firstFloor);

	treeListNode.btns = treeListNode.querySelectorAll('.mMoveto_footer button');
	const sureBtn = treeListNode.querySelector('.mMoveto_sure');
	const cancelBtn = treeListNode.querySelector('.mMoveto_cancel');
	const closeBtn = treeListNode.querySelector('.mMoveto_close');
	const newFileBtn = treeListNode.querySelector('.mMoveto_newFile');
	sureBtn.addEventListener('click', () => {
		mMoveToHide(sureFn.bind(null, current));
	});
	overlayEle.onclick = cancelBtn.onclick = closeBtn.onclick = function (e) {
		mMoveToHide(cancelFn);
	};
	newFileBtn.onclick = function () {
		const fileId = treeListNode.prevActive.dataset['fileId'] * 1;
		btnsIsAbled(treeListNode.btns, true);
		mMoveToNewFileFun(fileId, treeListNode);
	};


	function mMoveToHide(fn) {
		animation.stop(dialogEle);
		document.removeEventListener('keydown', disableDocEnter, true);
		animation({
			el: dialogEle,
			attrs: {
				translateY: -50,
				opacity: 0
			},
			cb() {
				animation.stop(dialogEle);
				// if (!treeListNode) return;	// 这个问题?? 是不是点击太快了，前面的callback还没执行完
				fn && fn();
				document.body.removeChild(treeListNode);
				// treeListNode = null;
				bl.moveTargetId = 0;
			},
			duration: 300
		});
	}
}


// \\________
// 确认移动函数
function sureMoveto(current) {
	const checkedEles = current ? current : getCheckedFileFromBuffer(bl.checkedBuffer);
	for (let i = 0, len = checkedEles.length; i < len; i++) {
		const { fileId, fileNode } = checkedEles[i];
		const ret = canMoveData(fileData, fileId, bl.moveTargetId);
		if (ret === 2) return popuptStatus('已经在当前目录', 'select_file', function () { bl.moveTargetId = 0; });
		if (ret === 3) return popuptStatus('不能移动到子集', 'select_file', function () { bl.moveTargetId = 0; });
		if (ret === 4) return popuptStatus('存在同名文件', 'select_file', function () { bl.moveTargetId = 0; });
	}

	checkedEles.forEach(function (c, i) {
		const { fileId, fileNode } = c;
		moveDataToTarget(fileData, fileId, bl.moveTargetId);
		bl.currentBuffer = bl.currentBuffer.filter((item) => item.id != fileId);
		fileWrap.removeChild(fileNode);
	});

	initAllCheck();
	noFile();
	fsScrollBar._calcBar();
	popuptStatus('移动成功', 'success', function () { bl.moveTargetId = 0; });
}
function cancelMoveto() {
	popuptStatus('取消文件移动', 'select_file');
}


// \\__________
// 移动到弹窗内每个标题的点击事件
function mMoveToItemClickEvent(caption, treeListNode, toggleList) {
	caption.onclick = function () {
		treeListNode.prevActive.classList.remove('active');
		this.classList.add('active');
		treeListNode.prevActive = this;
		bl.moveTargetId = this.dataset.fileId * 1;
	};
	caption.children[0].onclick = function clickEvent() {	// <span/>
		const title = this.parentNode;
		const nextList = title.nextElementSibling;
		if (!nextList) return;

		nextList.style.display = title.classList.toggle('open') ? 'block' : '';
		toggleList && toggleList(nextList);
	}
}

// \\_________
// 移动到弹窗内的新建文件夹
function mMoveToNewFileFun(fileId, treeListNode) {
	const newData = newFileData(fileId);
	const targetParent = treeListNode.prevActive.parentNode;
	const pId = treeListNode.prevActive.dataset['fileId'] * 1;
	const targetCj = treeListNode.prevActive.parentNode.dataset['cj'] * 1 + 1;
	const fileNode = createDialogFileNode(newData, targetCj);
	const firstChildren = treeListNode.prevActive.children[0];
	let targetList = treeListNode.prevActive.nextElementSibling;

	if (targetList) {
		targetList.insertAdjacentElement('afterbegin', fileNode);
	} else {
		targetList = document.createElement('ul');
		targetList.appendChild(fileNode);
		targetParent.appendChild(targetList);
	}

	if (!treeListNode.prevActive.classList.contains('open')) {
		targetList.style.display = 'block';
		firstChildren.classList.add('add');
		firstChildren.onclick();
		treeListNode.prevActive.classList.add('open');
	}

	var caption = fileNode.children[0];
	mMoveToItemClickEvent(caption, treeListNode);

	mMoveToSetFileNodeName({
		current: { fileId: newData.id, fileNode: fileNode, pId: pId },
		fileFn() {
			popuptStatus('取消新建操作', 'select_file');
			btnsIsAbled(treeListNode.btns, false);
			var childrenLen = targetList.children.length;
			if (childrenLen > 1) {
				targetList.removeChild(fileNode);
			} else {
				treeListNode.prevActive.classList.remove('open');
				firstChildren.classList.remove('add');
				targetParent.removeChild(targetList);
			}
		},
		succFn(name) {
			newData.name = name;
			btnsIsAbled(treeListNode.btns, false);
			addOneData(fileData, newData);
			if (bl.fileListId === pId) {
				bl.currentBuffer.push(newData);
				const newNode = createFileNode(newData);
				fileWrap.insertBefore(newNode, fileWrap.firstElementChild);
				allCheckStatus();

				// 文件间隙
				newFileInsideFileGap(newNode);
			}
		}
	});
}

// \\__________
// 移动到弹窗内设置文件名
function mMoveToSetFileNodeName(opts) {
	const { fileId, fileNode, pId } = opts.current;
	const { fileWrap } = bl;
	const nameInput = fileNode.querySelector('.name_input');
	const sureBtn = fileNode.querySelector('.sureBtn');
	const cancelBtn = fileNode.querySelector('.cancelBtn');
	const caption = nameInput.parentNode.parentNode;

	sureBtn.onclick = function (e) {
		e.stopPropagation();
		blurEvent.call(nameInput);
	};
	cancelBtn.onclick = function (e) {
		e.stopPropagation();
		this.off = true;
		blurEvent.call(nameInput);
	};

	nameInput.select();


	function blurEvent() {
		const newName = this.value.trim();
		if (cancelBtn.off) {
			return opts.fileFn && opts.fileFn();
		}
		if (newName === '') {
			this.select();
			return popuptStatus('名字不能为空', 'select_file');
		}
		if (!nameCanUse(fileData, pId, newName)) {
			this.select();
			return popuptStatus('命名冲突', 'select_file');
		}
		caption.insertAdjacentHTML('beforeend', '<i class="text">' + newName + '</i>');
		caption.removeChild(nameInput.parentNode);
		opts.succFn && opts.succFn(newName);
	};
}



// --------------------------------------------------------------
// [鼠标右键菜单]
const contextmenuData = [	// 主右键菜单
	{ title: '上传', fun: function () { popuptStatus('功能尚未完成', 'select_file'); } },
	{ title: '新建文件夹', fun: function () { newFileFun(); } },
	{ title: '刷新', fun: function () { enterFolder(bl.fileListId, 1, true); } },
	{
		title: '查看', child: [
			{ title: '缩略图', fun: function () { switchDisplayMode.call(this); } },
			{ title: '详细信息', fun: function () { switchDisplayMode.call(this); } }
		]
	},
	{
		title: '排序方式', child: [
			{ title: '按名称排序', fun: function () { enterFolder(bl.fileListId, 2); } },
			{ title: '按时间排序', fun: function () { enterFolder(bl.fileListId, 3); } }
		]
	}
];
const contentmenuItemData = [	// 文件夹上的右键菜单
	{ title: '打开', fun: function (parent) { whatWayEnter(parent, 'contextmenu'); } },
	{ title: '重命名', fun: function (parent) { currentFileOperate(parent, 'rename'); } },
	{
		title: '删除', fun: function () {
			alertMessage('确定要删除这个文件夹吗？', () => {
				sureDelete({ checkedBuffer: bl.checkedBuffer });
			});
		}
	}
];

// ____________________
// 显示右键菜单
bl.fileArea.addEventListener('contextmenu', function (e) {
	e.preventDefault();
	const fileAreaRect = this.getBoundingClientRect();
	const parent = judgeParentByClass(e.target, 'file', 'fileWrap');
	const { contextmenu, checkedBuffer } = bl;
	let x = e.pageX - fileAreaRect.left, y = e.pageY - fileAreaRect.top;
	contextmenu.innerHTML = '';

	contextmenu.appendChild(createContextMenuHtml(checkedBuffer.length > 0 ? contentmenuItemData : contextmenuData, parent));

	// 触发事件时的x y
	contextmenu.triggerX = x; contextmenu.triggerY = y;
	const firstList = contextmenu.firstElementChild;
	firstList.style.display = 'block';

	const contextmenu_width = firstList.offsetWidth;
	const contextmenu_height = firstList.offsetHeight;
	let maxLeft = fileAreaRect.right - fileAreaRect.left - contextmenu_width;
	let maxTop = fileAreaRect.bottom - fileAreaRect.top - contextmenu_height;
	if (x > maxLeft) x = maxLeft;
	if (y > maxTop) y = maxTop;
	contextmenu.style.left = x + 'px';
	contextmenu.style.top = y + 'px';

	document.addEventListener('click', function (e) {
		const target = e.target;
		if (!target.dataset.class) {
			contextmenu.innerHTML = '';
			document.removeEventListener('click', arguments.callee);
		}
	});
});

// ____________________
// 移入右键菜单，有子菜单的标题
bl.contextmenu.addEventListener('mouseover', function (e) {
	const target = e.target;

	if (target.nodeName === 'H5') {
		var childrenList = target.nextElementSibling;
		var { fileArea, contextmenu_width } = bl;
		var fileArea_width = fileArea.offsetWidth;
		var fileArea_height = fileArea.offsetHeight;

		// 在左侧：当前的offsetLeft + (cj+1)*contextmenu_width > fileArea_width
		if (childrenList) {
			var cj = target.dataset['class'] * 1;
			var x = TargetToFileAreaDistance(target) + (cj + 1) * contextmenu_width;
			var y = TargetToFileAreaDistance(target, 'top') + childrenList.offsetHeight;
			if (x > fileArea_width) {
				childrenList.style.left = -150 + 'px';
			} else {
				childrenList.style.left = 150 + 'px';
			}
			if (y > fileArea_height) {
				childrenList.style.top = 'auto';
				childrenList.style.bottom = 0;
			} else {
				childrenList.style.bottom = 'auto';
				childrenList.style.top = 0;
			}
		}
	}
});

// \__________
// 计算当前标题距离[bl.fileArea]的 left、top
function TargetToFileAreaDistance(target, dir) {
	if (target === bl.fileArea) return 0;
	var dis = dir === 'top' ? target.offsetTop : target.offsetLeft;
	return dis + TargetToFileAreaDistance(target.parentNode, dir);
}


// --------------------------------------------------------------
// [刷新功能]
bl.refresh.addEventListener('click', function () {
	enterFolder(bl.fileListId, 1, true);
});



// --------------------------------------------------------------
// [方法区域]
// ___________
// 当前层没有文件的相应显示
function noFile() {
	bl.fileArea.classList.toggle('nofs', !bl.files.length);
}

// ___________
// 将选中的元素缓存转成数组
function getCheckedFileFromBuffer(checkedBuffer) {
	let data = [];
	for (let key in checkedBuffer) {
		if (key !== 'length') {
			const item = checkedBuffer[key];
			data.push({
				fileId: key,
				fileNode: item
			});
		}
	}

	return data;
}

// ___________
// 判断是否有目标class的父级。有就返回该父级 没有返回false
function judgeParentByClass(target, clas, endClass) {
	// 移出document也跳出循环
	if (target.id === endClass || target === document) return false;
	if (target.classList.contains(clas)) return target;
	return judgeParentByClass(target.parentNode, clas, endClass);
}
