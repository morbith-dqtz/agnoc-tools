const zlib = require('zlib');
const debug = require ('debug');
const appDebug = debug('app');
const WebSocket = require('ws');
const fs = require('fs');
const robot = require('./robot.js');
const client = require('./client.js');
const protocol = require('./protocol.js');

const host = '0.0.0.0';
const port = 9090;

function handle_service(js, socket) {
	switch (js['service']) {
		case 'client/login':
			client.client.socket = socket;
			appDebug('web clinet login :', js);
			break;
		case 'sweeper-transmit/to_bind':
			appDebug("sweeper-transmit/to_bind :\n", js);
			content = JSON.parse(js['content']);
			break;
		case 'sweeper-app-user/auth/login':
			client.process_user_login(js, socket, robot);
			break;
		case 'sweeper-app-user/auth/login_token':
			if (robot.robot.socket != null) {
				appDebug('app clinet login :\n', js);
				client.process_user_login_token(js, socket, robot);
			}
			break;
		case 'sweeper-robot-center/auth/login':
			robot.process_robot_login(js, socket, client);
			break;

		case 'sweeper-app-user/app/user':
		case 'sweeper-app-user/auth/change_password':
			protocol.reply_true(js, socket);
			break;

		case 'sweeper-robot-center/app/get_user_bind':
			if (robot.robot.ip != null) {
				appDebug("send_user_bind");
				appDebug(js);
				// after unbind [] <<<----
				client.send_user_bind(js, socket, robot);
				protocol.reply_true(js, socket);
			} else {
				appDebug("Robot not present, not sending bind");
			}
			break;
		case 'sweeper-robot-center/app/bind':
			appDebug("sweeper-robot-center/app/bind : ", js);
			msg = {
				"code" : 0,
				"result" : {
					"isNew" : false
				},
				"service" : "sweeper-robot-center/app/bind",
				"traceId" : js['traceId']
			}
			socket.send(JSON.stringify(msg));
			break;
		case 'sweeper-transmit/transmit/lock':
			appDebug("cli transmit lock");
			if (robot.robot.socket != null) {
				protocol.reply_ctrl_true(js, socket,robot);
			}
			break;
		case 'sweeper-transmit/transmit/to_bind':
			content = JSON.parse(js['content']);
			switch(content['data']['control']) {
				case 'status':
					protocol.reply_true(js, socket);
					robot.update_robostats(content,socket);
					if (client.client.socket != null) {
						client.send_status_tocli(robot);
					}
					break;
				case 'lock_device':
					appDebug("lock_device :\n", js);
					if (content['clientType'] == "ROBOT") {
						if (robot.robot.lock_device == true) {
							appDebug("Is locked");
							protocol.reply_true(js, socket);
							protocol.reply_ctrl_true(js,socket,robot);
						} else {
							appDebug("Is not locked");
							protocol.reply_false(js, socket, robot);
							protocol.reply_ctrl_false(js,socket, robot);
						}
					} else {
						if (content['data']['result'] == 0) {
							appDebug('Robot locked');
							robot.robot.lock_device = true;
							protocol.reply_true(js, socket);
						} else {
							appDebug('Robot locking error');
							protocol.reply_false(js, socket);
						}
					}
					break;
				case 'get_map':
				case 'getMapAll':
				case 'getOrder6090':
				case 'get_time':
				case 'get_voice':
				case 'get_systemConfig':
				case 'get_quiet_time':
				case 'get_quiet':
				case 'get_preference':
				case 'get_consumables':
					if (socket === client.client.socket) {
						appDebug("Client :", content['data']['control']);
						msg = {
							"tag" : "sweeper-transmit/to_bind",
							"content" : JSON.stringify(content['data'])
						}
						appDebug(msg);
						if (robot.robot.socket != null) {
							robot.robot.socket.send(JSON.stringify(msg));
							protocol.reply_true(js,socket);
						} else {
							protocol.reply_false(js,socket);
						}
					} else if (socket === robot.robot.socket) {
						if (client.client.socket != null) {
							appDebug("Robot Reply :", js);
							msg = {
								"tag" : "sweeper-transmit/to_bind",
								"content" : JSON.stringify(content['data'])
							}
							appDebug("Aswering : ", msg);
							client.client.socket.send(JSON.stringify(msg));
						}
					} else {
						appDebug("Unknown socket : ", content['data']['control']);
					}
					break;
				case 'get_status':
					if (socket === client.client.socket) {
						appDebug("Cli", content['data']['control']);
					} else if (socket === robot.robot.socket) {
						appDebug(content['data']['control']);
					} else {
						appDebug("Socket problem");
						break;
					}
					protocol.reply_true(js, socket);
					protocol.reply_status(js,socket, content['data']['control'], robot);
					break;
				case 'unlock_device':
					appDebug("Unlock Device :", js);
					msg = {
						"code": 17,
						"msg": "非法操作-没有任何绑定的设备",
						"service": "sweeper-transmit/transmit/to_bind",
						"traceId": js['traceId']
					}
					socket.send(JSON.stringify(msg));
					msg = {
						"code": 0,
						"result": [],
						"service": "sweeper-robot-center/app/get_user_bind",
						"traceId": js['traceId']
					}
					socket.send(JSON.stringify(msg));
					break;
				case 'setOrder6090':
				case 'deleteOrder6090':
				case 'set_time':
				case 'set_direct':
				case 'set_mode':
				case 'set_voice':
				case 'selectMapPlan':
				case 'set_systemConfig':
				case 'set_preference':
				case 'device_ctrl':
				case 'setMapAngle' :
				case 'setPlanData6090':
				case 'splitRoom':
				case 'mergeRooms':
					if (socket === client.client.socket) {
						appDebug("Client :", content['data']['control']);
						msg = {
							"tag" : "sweeper-transmit/to_bind",
							"content" : JSON.stringify(content['data'])
						}
						appDebug(msg);
						if (robot.robot.socket != null) {
							robot.robot.socket.send(JSON.stringify(msg));
							protocol.reply_true(js,socket);
						} else {
							appDebug("Robot offline");
							protocol.reply_false(js,socket);
							protocol.reply_ctrl_false(js,socket,robot);
						}
					} else if (socket === robot.robot.socket) {
						appDebug("Robot :", content['data']['control']);
						if (content['data']['result'] == 0) {
							protocol.reply_ctrl_true(js,client.client.socket,robot);
						} else {
							protocol.reply_ctrl_false(js,client.client.socket,robot);
						}
					} else {
						appDebug("Unknown socket", content['data']['control']);
					}
					break;
				case 'noticeSaveMap':
					appDebug("Ignored : ", content['data']['control'], "\n", js);
					//protocol.reply_false(js, socket);
					break;
				case 'upgrade_packet_info' :
					appDebug("Rply true to : ",content['data']['control']);
					protocol.reply_true(js, socket);
					break;
				default:
					appDebug('>>>>>>> NOT DEFINED : sweeper-transmit/transmit/to_bind <<<<<<<<\n', js);
			}
			break;
		case 'sweeper-robot-center/device/report_data':
			appDebug("sweeper-robot-center/device/report_data", js);
			if (socket === robot.robot.socket) {
				content = JSON.parse(js['content']);
				switch(content['data']['control']) {
					case 'status':
						robot.update_robostats(content,socket);
						protocol.reply_true(js, socket);
						if ( client.client.socket != null ) {
							protocol.reply_status(js,client.client.socket, content['data']['control'], robot);
						} else {
							appDebug("Client offline");
						}
						break;
					default:
						appDebug('######### sweeper-robot-center/device/report_data', js);
				}
			} else {
				appDebug("Cli ?");
			}
			break;
		case 'sweeper-robot-center/info_report/status/4':
		case 'sweeper-robot-center/info_report/status/3':
		case 'sweeper-robot-center/info_report/status/2':
			protocol.reply_true(js, socket);
			if (client.client.socket != null) {
				protocol.reply_status(js,client.client.socket, 'status', robot);
			}
			break;
		case 'sweeper-app-user/robot/get_notice_config':
			if (socket === robot.robot.socket) {
				protocol.reply_true(js, socket);
				protocol.reply_status(js,client.client.socket, 'status', robot);
			} else if (socket === client.client.socket) {
				appDebug(js['service'], "by CLIENT");
			} else {
				appDebug(js['service'], "by UNKNOWN");
			}

			break;
		case 'heart-beat':
			if (js['traceId'] == '0' ) {
				client.client.socket = socket;
			}
			protocol.reply_treaceId(js, socket);
			break;
		case 'sweeper-app-user/auth/logout':
			protocol.reply_true(js, socket);
			break;
		default:
			service = js['service'].split('?')[0];
			switch(service) {
				case 'sweeper-robot-center/app/get_robot_info':
					appDebug("Reply get_robot_info");
					robot.answer_get_robot_info(js,socket);
					break;
				case 'sweeper-robot-center/app/unbind':
				case 'sweeper-robot-center/app/set_default':
				case 'sweeper-robot-center/app/modify_nickname':
					appDebug("Reply set_default");
					protocol.reply_true(js, socket);
				default:
					appDebug('Service unknown :\n', js);
			}
	}
}


function heartbeat() {
  this.isAlive = true;
}

const server = new WebSocket.Server({
  host: host,
  port: port
});

console.log(`Server is running on ws://${host}:${port}`);

server.binaryType = "arraybuffer";
server.on('connection', function connection(socket, req) {
  socket.isAlive = true;
  socket.on('pong', heartbeat);
  socket.on('message', function(msg) {
    try {
		if (robot.robot.ip != null && socket._socket.remoteAddress != robot.robot.ip) {
			client.client.socket = socket;
		}
    	js = JSON.parse(msg);
	} catch(err) {
		try {
			if (client.client.socket != null) {
				map_traceId = msg.slice(4,8);
				dec = map_traceId.readUIntBE(0,4);
				appDebug("map traceID :" + dec);
				reply_msg = {
					"code" : 0,
					"traceId" : dec.toString(),
					"service" : "sweeper-map/robot/syn_no_cache",
					"result" : true
				}
				header = [
					0x01, 0x00, 0x0f, 0x73, 0x77, 0x65, 0x65, 0x70, 0x65,
					0x72, 0x2d, 0x6d, 0x61, 0x70, 0x2f, 0x73, 0x79, 0x6e
				]
				map = msg.slice(56);
				map_reply = Buffer.concat( [new Buffer.from(header), map] );
				appDebug("Sending map & status to client");
				client.client.socket.send(map_reply);
				socket.send(JSON.stringify(reply_msg));
				protocol.reply_status(js,client.client.socket, 'status', robot);
			} else {
				appDebug("Client offline, can't send the map");
			}

		} catch (err) {
		  console.error(err)
		}
		return;
	}
	handle_service(js,socket);
  });

const interval = setInterval(function ping() {
  server.clients.forEach(function each(socket) {
    if (socket.isAlive === false) return socket.terminate();
    socket.isAlive = false;
    socket.ping();
  });
}, 30000);


  socket.on('close', function close() {
	clearInterval(interval);
	ip = req.socket.remoteAddress;
	if (ip == robot.robot.ip) {
  		console.log("CONGA logout from ",ip);
  		robot.robot.socket = null;
  		robot.robot.ip = null;
  	} else if (ip == client.client.ip) {
  		console.log("Client logout from ",ip);
  		client.client.socket = null;
  		client.client.ip = null;
	}
  });
});

