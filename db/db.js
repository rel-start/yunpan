const fileData = {
	'0': {
		id: 0,
		name: '全部文件'
	},
	'1': {
		id: 1,
		pId: 0,
		name: '电影',
		rise_time: '2016-08-22 16:03'
	},
	'2': {
		id: 2,
		pId: 0,
		name: '音乐',
		rise_time: '2016-08-21 16:03'
	},
	'3': {
		id: 3,
		pId: 1,
		name: '我们全家不太熟',
		rise_time: '2016-08-01 16:03'
	},
	'4': {
		id: 4,
		pId: 2,
		name: '隐形的翅膀',
		rise_time: '2016-08-23 16:03'
	},
	'5': {
		id: 5,
		pId: 2,
		name: '会痛的石头',
		rise_time: '2016-08-22 17:03'
	},
	'6': {
		id: 6,
		pId: 1,
		name: '欢乐好声音',
		rise_time: '2016-07-22 16:03'
	},
	'7': {
		id: 7,
		pId: 2,
		name: '好心情',
		rise_time: '2016-03-22 16:03'
	},
	'8': {
		id: 8,
		pId: 2,
		name: 'Hope',
		rise_time: '2015-08-22 16:03'
	},
	'9': {
		id: 9,
		pId: 2,
		name: '光年之外',
		rise_time: '2017-08-22 16:03'
	},
	'10': {
		id: 10,
		pId: 2,
		name: 'We are One',
		rise_time: '2018-08-22 16:03'
	},
	'11': {
		id: 11,
		pId: 1,
		name: '银河护卫队',
		rise_time: '2016-08-22 01:03'
	},
	'12': {
		id: 12,
		pId: 1,
		name: '银河护卫队2',
		rise_time: '2016-08-12 16:03'
	},
	'13': {
		id: 13,
		pId: 1,
		name: '极盗车神',
		rise_time: '3016-08-22 16:03'
	},
	'14': {
		id: 14,
		pId: 1,
		name: '愤怒的小鸟',
		rise_time: '2016-08-22 10:03'
	},
	'15': {
		id: 15,
		pId: 1,
		name: '悟空传',
		rise_time: '2016-11-13 16:03'
	},
	'16': {
		id: 16,
		pId: 1,
		name: '赛车总动员3：极速挑战',
		rise_time: '2017-05-22 16:03'
	},
	'17': {
		id: 17,
		pId: 1,
		name: '赛车总动员',
		rise_time: '2019-01-22 16:03'
	},
	'18': {
		id: 18,
		pId: 1,
		name: '赛车总动员2',
		rise_time: '2016-08-12 16:03'
	},
	'19': {
		id: 19,
		pId: 1,
		name: '蓝精灵：寻找神秘村',
		rise_time: '2016-08-10 06:03'
	},
	'20': {
		id: 20,
		pId: 1,
		name: '速度与激情7',
		rise_time: '2015-08-22 11:03'
	},
	'21': {
		id: 21,
		pId: 1,
		name: '变身男女',
		rise_time: '2016-09-21 16:05'
	},
	'22': {
		id: 22,
		pId: 1,
		name: '神偷奶爸3',
		rise_time: '2015-10-23 16:11'
	},
	'27': {
		id: 27,
		pId: 1,
		name: '死侍',
		rise_time: '2015-10-23 16:11'
	},
	'28': {
		id: 28,
		pId: 27,
		name: '死侍2',
		rise_time: '2015-10-23 16:11'
	},
	'29': {
		id: 29,
		pId: 27,
		name: '死侍1',
		rise_time: '2015-10-23 16:11'
	},
	'23': {
		id: 23,
		pId: 1,
		name: '美食总动员',
		rise_time: '2013-10-23 16:11'
	},
	'24': {
		id: 24,
		pId: 1,
		name: '机器人总动员',
		rise_time: '2012-10-23 16:11'
	},
	'25': {
		id: 25,
		pId: 1,
		name: '羞羞的铁拳',
		rise_time: '2011-10-23 16:11'
	},
	'26': {
		id: 26,
		pId: 25,
		name: '新建文件夹',
		rise_time: '2011-10-02 16:11'
	}
};


// 根据id获取指定数据
function getItemById(db, id) {
	return db[id];
}

// 添加一条数据
function addOneData(db, data){
  return db[data.id] = data;
}

// 根据id设置指定的数据
function setItemById(db, id, data) {  // setItemById(db, 0, {name: '123'})
	const item = db[id];
	return item && Object.assign(item, data);
}

// 根据id获取当前层级的所有数据
function getChildById(db, id) {
	const data = [];

	for (let key in db) {
		const item = db[key];
		if (item.pId === (id*1)) data.push(item);
	}

	return data;
}


// 根据指定的id找到当前这个文件以及它的所有的父级
function getAllParents(db, id) {
	let data = [];
	const current = db[id];

	if (current) {
		data.push(current);
		data = getAllParents(db, current.pId).concat(data);
	}

	return data;
}

// 根据指定id删除对应的数据以及它所有的子级
function deleteItemById(db, id) {
	if (!id) return false;		// 根目录不能被删除
	delete db[id];

	let children = getChildById(db, id);
	let len = children.length;

	// 删除所有子级
	if (children) {
		for (let i = 0; i < len; i++) {
			deleteItemById(db, children[i].id);
		}
	}

	return true;
}

// 判断名字是否可用
function nameCanUse(db, id, text) {
	const curData = getChildById(db, id);
	return curData.every(item => item.name !== text);
}

// 判断可否移动数据
function canMoveData(db, currentId, targetId = 0){
	const currentData = db[currentId],
		targetParents = getAllParents(db, targetId);

	if (currentData.pId === targetId) return 2;	// 移动到子集所在的目录
	if (targetParents.indexOf(currentData) !== -1) return 3;		// 移动到自己的子集
	if (!nameCanUse(db,targetId, currentData.name))  return 4;		// 名字冲突

	return 1;
}

// 将当前数据移动到目标下
function moveDataToTarget(db, currentId, targetId){
	// console.log(targetId);
  db[currentId].pId = targetId;
}
