// 所有变量对象
const bl = {
	fileListId: 0,  // 当前列表id
	moveTargetId: 0,
	checkedBuffer: { length: 0 },						// 选中文件夹的缓存
	currentBuffer: [],											// 当前层级children的缓存
	parentsBuffter: [],											// 当前层级parents的缓存
	body_width: document.body.offsetWidth,	// body的宽度

	container: document.getElementById('container'),
	fileArea: document.getElementById('fileArea'),
	fileWrap: document.getElementById('fileWrap'),				// 文件夹列表的父级
	files: this.fileWrap.children,												// 文件夹
	pathWrap: document.getElementById('pathWrap'),				// 路径的父级
	paths: this.pathWrap.children,												// 路径的每一项
	allCheck: document.getElementById('allCheck'),				// 全选按钮
	orderList: document.getElementById('orderList'),			// 列表与缩略图之间切换
	displayMode: this.orderList.querySelector('.display_mode'),
	menuTree: document.getElementById('menuTree'),
	classView: document.getElementById('classView'),		// 侧边栏显示隐藏按钮

	foldersControl: document.getElementById('foldersControl'),	// 文件夹操作控件的父级
	fsControlChildren: this.foldersControl.querySelectorAll('button'),
	reName: document.getElementById('reName'),				// 重命名按钮
	rmFile: document.getElementById('rmFile'),				// 删除文件按钮
	rmAlert: document.getElementById('rmAlert'),			// 是否确定删除的弹窗
	newFolder: document.getElementById('newFolder'),	// 新建文件夹按钮
	fileMoveTo: document.getElementById('fileMoveTo'),		// 移动到按钮
	refresh: document.getElementById('refresh'),					// 刷新按钮

	statusHints: document.querySelector('.status_hints'),	// 状态提示
	drag_hint: document.getElementById('drag_hint'),			// 拖拽文件的提示（选中几个文件）
	eResize: document.getElementById('e_resize'),					// 右边侧边栏拖拽元素
	contextmenu: document.getElementById('contextmenu'),
	contextmenu_width: 160,

	// 文件区域的滚动条
	fBarWrap: this.fileArea.querySelector('.bar_wrap'),
	fBar: this.fileArea.querySelector('.bar'),
	// 选择储存位置弹窗的自定义滚动条
	treeview: document.getElementById('treeview'),
	mouseFrame: document.getElementById('mouse_frame')
}


// -----------------------------------------------------------------
// [用户交互]
// ___________
// 文件夹区域缩略图间的空隙控制
window.addEventListener('resize', function (e) {
	bl.body_width = document.body.offsetWidth;
	setFileGap(bl.fileWrap, bl.files);
});


// ___________
// 文件区域的自定义滚动条
var fsScrollBar = scrollBarFx({
	displayArea: bl.fileArea,
	contentArea: bl.fileWrap,
	barWrap: bl.fBarWrap,
	bar: bl.fBar,
	maxHeight: bl.fBarWrap.clientHeight,
	speed: 25,
	autoScale: true
});





// ___________
// 拖拽改变右边侧边栏宽度
if (bl.eResize) {
	bl.eResize.addEventListener('mousedown', function (e) {
		var dx = e.pageX, dy = e.pageY;
		var { body_width, menuTree } = bl;
		var menuTree_width = menuTree.clientWidth;

		document.addEventListener('mousemove', startMove);
		document.addEventListener('mouseup', cancelMove);


		function startMove(e) {
			var x = e.pageX - dx;
			var calcX = menuTree_width + x;

			if (calcX > body_width / 2) calcX = body_width / 2;
			if (calcX < 195) {
				clearTimeout(menuTree.t);
				calcX = 195;
				menuTree.t = setTimeout(function (){
					menuTree.classList.remove('open');
				}, 400);
			} else {
				clearTimeout(menuTree.t);
			}

			menuTree.style.width = calcX/body_width*100 + '%';


			setFileGap(bl.fileWrap, bl.files);
		}

		function cancelMove(e) {
			document.removeEventListener('mousemove', startMove);
			document.removeEventListener('mouseup', cancelMove);
		}
	});
}

classView.addEventListener('click', function (e){
	var { menuTree } = bl;
	if (menuTree.classList.toggle('open')) menuTree.style.width = ''; 
});




// -----------------------------------------------------------------
// [方法区域]
// __________
// 设置文件间隙
function setFileGap(parent, children, oneWidth, space) {

	if (parent.classList.contains('tabular_form')) return;

	var space = space || 20;
	var oneWidth = oneWidth || 180;

	var len = children.length, halfSpace;
	var fileWrapWidth = parent.clientWidth;
	// 每行占用
	var occupyRow = Math.ceil(fileWrapWidth / (oneWidth));

	while (occupyRow--) {
		var w = oneWidth * occupyRow + space * (occupyRow + 1);
		if (w <= fileWrapWidth) break;
	}

	var newSpace = (fileWrapWidth - occupyRow * oneWidth) / (occupyRow + 1);
	halfSpace = newSpace / 2;




	for (var i = 0; i < len; i++) {
		var item = children[i];
		item.style.marginLeft = item.style.marginRight = halfSpace + 'px';
	}
	parent.style.paddingLeft = parent.style.paddingRight = halfSpace + 'px';
}


// __________
// 生成文件节点
function createFileNode(data) {
	let item = document.createElement('li');
	item.className = 'file';
	item.dataset['fileId'] = data.id;
	item.innerHTML = `<label class="checkbox"></label>
											<span class="file_img"></span>
											<dfn class="file_title">
												<em class="file_name show" title="${data.name}">${data.name}</em>
												<input type="text" class="name_input" value="JS基础课程">
											</dfn>
											<menu class="file_control">
												<a class="curDownload" href="javascript:;" title="下载"></a>
												<a class="curShare" href="javascript:;" title="分享"></a>
												<a class="curMoveto" href="javascript:;" title="移动到"></a>
												<a class="curRename" href="javascript:;" title="重命名"></a>
												<a class="curRemove" href="javascript:;" title="删除"></a>
											</menu>
											<time class="file_time">${data.rise_time}</time>`;
	return item;
}

// __________
// 生成弹窗文件节点
function createDialogFileNode(data, cj) {
	var item = document.createElement('li');
	item.dataset.cj = cj;
	item.innerHTML = `<h4 data-file-id="${data.id}" style="padding-left:${cj * 10}px">
											<span></span>
											<em></em>
											<dfn class="input_wrap"><input class="name_input" type="text" value="新建文件夹"><i class="sureBtn"></i><i class="cancelBtn"></i></dfn>
										</h4>`;
	return item;
}


// __________
// 进入新界面函数
function enterFolder(fileId, sortId, refresh) {
	bl.allCheck.classList.remove('checked');
	bl.checkedBuffer = { length: 0 };
	bl.fileWrap.style.top = 0;		// 面向对象 弄个初始化


	// 重新生成文件夹
	bl.currentBuffer = createFileWrapHtml(fileData, bl.fileListId = parseInt(fileId), sortId, refresh);
	// 重新生成路径
	bl.parentsBuffter = createPath(fileData, bl.fileListId);

}


// __________
// 生成文件列表
function createFileWrapHtml(db, id, type = 1, refresh) {
	bl.fileWrap.innerHTML = '';
	let children = getChildById(db, id);
	const len = children.length;

	children = createFileSortType(type, children);

	if (refresh) {
		createFileWrapHtml.t = setTimeout(createFileType, 50);
	} else {
		createFileType();
	}

	function createFileType() {
		for (let i = 0; i < len; i++) {
			bl.fileWrap.appendChild(createFileNode(children[i]));
		}

		noFile(len);
		// 文件夹间隙重新计算
		setFileGap(bl.fileWrap, bl.files);
		fsScrollBar._calcBar();
		clearTimeout(createFileWrapHtml.t);
	}

	return children;
}



function createFileSortType(type, children) {
	// id排序
	if (type === 1) return children.sort((a, b) => b.id - a.id);
	// 名称排序
	if (type === 2) {
		bl.fileArea.nface = !bl.fileArea.nface;
		return children.sort((a, b) => {
			const aname = a.name;
			const bname = b.name;
			return bl.fileArea.nface ? aname.localeCompare(bname, 'zh') : bname.localeCompare(aname, 'zh');
		});
	}
	// 时间排序
	if (type === 3) {
		bl.fileArea.tface = !bl.fileArea.tface;
		return children.sort((a, b) => {
			const atime = new Date(a['rise_time']).getTime();
			const btime = new Date(b['rise_time']).getTime();
			return bl.fileArea.tface ? btime - atime : atime - btime;
		});
	}
}

// __________
// 生成面包屑导航
function createPath(db, id) {
	const allParents = getAllParents(db, id), len = allParents.length;
	let str = '';
	for (let i = 0; i < len; i++) {
		str += `<a class="${i === len - 1 ? 'active' : ''}" href="javascript:;" data-file-id="${allParents[i].id}">${allParents[i].name}</a>`;
	}

	bl.pathWrap.innerHTML = str;
	return allParents;
}


// __________
// 生成确认框节点
function createCheckBoxHtml(text) {
	let str = `<div class="dialog_overlay"></div>
							<div class="dialog_content">
								<div class="dialog_close" data-dialog-close>&times;</div>

								<div class="dialog_body">
									<i class="caret"></i>
									<dfn class="dialog_info">
										<strong class="question">${text}</strong>
										<span class="tips">已删除的文件</span>
									</dfn>
								</div>

								<div class="dialog_footer">
									<a class="sure_btn" href="javascript:;" data-dialog-sure>确定</a>
									<a class="cancel_btn" href="javascript:;" data-dialog-cancel>取消</a>
								</div>
							</div>`;

	return str;
}


// __________
// 移动到弹窗内部的树状列表
function createTreeList(db, fileListId, child, id = 0) {
	const data = db[id];
	const floorIndex = getAllParents(db, id).length;
	const children = child || getChildById(db, id);
	const childrenLen = children.length;
	let str = ``;
	if (id === 0) str += `<div class="treeBox"><ul class="treeview"><li data-cj="0"> <h4 data-file-id="${id}" class="active"><span class="${childrenLen ? 'add' : ''}"></span><em></em><i class="text">${data.name}</i></h4><ul style="display: block;">`;
	for (let i = 0; i < childrenLen; i++) {
		const item = children[i], haveChild = getChildById(db, item.id), len = haveChild.length, isSelect = (fileListId === item.id);
		str += `<li data-cj="${floorIndex}"> <h4 data-file-id="${item.id}" style="padding-left: ${floorIndex * 10}px"><span class="${len ? 'add' : ''}"></span><em></em><i class="text">${item.name}</i></h4>`;
		if (len) str += `<ul>${createTreeList(fileData, fileListId, haveChild, item.id)}</ul>`;
		str += `</li>`;
	}

	if (id === 0) str += `</ul></li></ul></div>`;

	return str;
}


// __________
// 移动到弹窗html
function createDialog(treeListHtml, clas) {
	const mMoveto = document.createElement('div');
	mMoveto.className = `mMoveto ${clas}`;
	mMoveto.innerHTML = `<div class="mMoveto_overlay"></div>
												<div class="mMoveto_content">
													<div class="mMoveto_header">移动到
														<span class="mMoveto_close">&times;</span>
													</div>

													<div class="mMoveto_body">
														${treeListHtml}
													</div>
													
													<div class="mMoveto_footer">
														<button class="mMoveto_newFile">新建文件夹</button>
														<button class="mMoveto_cancel">取消</button>
														<button class="mMoveto_sure">确定</button>
													</div>
												</div>`;
	return mMoveto;
}

// 右键菜单html
function createContextMenuHtml(data, parent) {
	const createUl = document.createElement('ul');

	for (let i = 0, len = data.length; i < len; i++) {
		const createLi = document.createElement('li');
		const title = document.createElement('h5');
		title.innerHTML = data[i].title;
		const children = data[i]['child'];
		if (children) {
			title.dataset.class = '1';
		}

		title.addEventListener('click', function (e) {
			data[i].fun && data[i].fun.call(title, parent);
		});
		createLi.appendChild(title);

		if (children) createLi.appendChild(createContextMenuHtml(children, parent));
		createUl.appendChild(createLi);
	}

	return createUl;
}




