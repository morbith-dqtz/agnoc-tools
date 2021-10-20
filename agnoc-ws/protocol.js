
const debug = require ('debug');
const appDebug = debug('app');

function reply_status (js, socket, control, robot) {
	if (socket != null) {
		stats = JSON.parse(robot.get_robostats());
		stats['data']['control'] = control;
		data = JSON.stringify(stats['data']);
		
		msg = {
			"content" : data,
			"tag" : "sweeper-transmit/to_bind"
		}
		
		appDebug("Rply status:\n", msg)
		socket.send(JSON.stringify(msg));
	} else {
		appDebug("Socket error");
	}
}

function reply_treaceId (js, socket) {
	msg = { "code" : 0,
			"traceId" : js['traceId'],
			"service" : js['service'],
			"result" : Date.now()
		}
	socket.send(JSON.stringify(msg));
}

function reply_true (js, socket) {
	msg = { "code" : 0,
		    "result" : true,			
			"service" : js['service'],
			"traceId" : js['traceId']
		}
	socket.send(JSON.stringify(msg));
}

function reply_false (js, socket) {
	msg = { "code" : 0,
		    "result" : false,			
			"service" : js['service'],
			"traceId" : js['traceId']
		}
	socket.send(JSON.stringify(msg));
}

function reply_ctrl_false (js, socket, robot) {
	if (robot.robot.did != null) {
		content = JSON.parse(js['content']);
		appDebug("ctrl false");	
		content = {
			"result" : 1,
			"control" : content['data']['control'],
			"did" : robot.robot.did
		}
		msg = {
			"content" : JSON.stringify(content),
			"tag" : "sweeper-transmit/to_bind"
		}
		if (socket != null ){
			socket.send(JSON.stringify(msg));	
		} else {
			appDebug("Socket problem");
		}	
	}
}

function reply_ctrl_true (js, socket, robot) {
	if (robot.robot.did != null) {
		content = JSON.parse(js['content']);
		content = {
			"result" : 0,
			"control" : content['data']['control'],
			"did" : robot.robot.did
		}
		msg = {
			"content" : JSON.stringify(content),
			"tag" : "sweeper-transmit/to_bind"
		}
		if (socket != null ){
			socket.send(JSON.stringify(msg));	
		} else {
			appDebug("Socket problem");
		}
	}
}


function reply_out (js, socket) {
	appDebug("Reply out : ",js['service']);
	data = new Buffer.from([0xe8,0xaf,0xb7,0xe5,0x85,0x88,0xe7,0x99,0xbb,0xe5,0xbd,0x95,0x2d,0xe8,0xaf,0xb7,0xe5,0x85,0x88,0xe7,0x99,0xbb,0xe5,0xbd,0x95]);
	//"msg" : "请先登录-请先登录",
	msg = { "code" : 3,
			"msg" : data.toString(),
			"service" : js['service'],
			"traceId" : js['traceId']
		}
	socket.send(JSON.stringify(msg));
}

module.exports = {
	reply_treaceId,
	reply_true,
	reply_false,
	reply_status,
	reply_ctrl_true,
	reply_ctrl_false,
	reply_out

}
