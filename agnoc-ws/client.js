
const debug = require ('debug');
const appDebug = debug('app');
const crypto = require('crypto');

let client = {	
	"socket" : null,
	"lock_device" : null,
	"lang" : null,
	"password" : null,
	"userId" : 31337,
	"username": null,
	"factoryId": null,
	"packageVersions": null,
	"projectType": null,
	"versionCode" : null,
	"versionName": null
}

function process_user_login_token(register, socket, robot) {
	console.log('Processing USER login token from ', socket._socket.remoteAddress);
	
	content = JSON.parse(register['content']);
	
	client.socket = socket;
	client.lang = register['lang'];
	client.password = register['password'];
	client.userId = register['userId'];
	client.username = register['username'];
	client.factoryId = register['factoryId'];
	client.packageVersions = register['packageVersions'];
	client.projectType = register['projectType'];
	client.versionCode = register['versionCode'];
	client.versionName = register['versionName'];
	
	msg = { "code" : 0,
			"result" : {
				"clientType": "PHONE",
				"data": {
					"BIND_LIST": "",
					"CONNECTION_TYPE" : "sweeper",
					"COUNTRY_CITY" : "%7B%22continent%22%3A%22%E6%AC%A7%E6%B4%B2%22%2C%22country%22%3A%22%E8%A5%BF%E7%8F%AD%E7%89%99%22%7D",
					"FACTORY_ID" : register['factoryId'],
					"LANG" : "es",
					"ROBOT_TYPE" : "sweeper",
					"USERNAME" : register['username']
				},
				"id" : "31337",
			},
			"service" : register['service'],
			"traceId" : register['traceId']
		}
	socket.send(JSON.stringify(msg));
	//Send robostats
	msg = {
		"tag" : "sweeper-transmit/to_bind",
		"content" : robot.get_robostats()
	}
	appDebug("process_user_login_token :\n", msg);
	socket.send(JSON.stringify(msg));

}

function process_user_login(register, socket, robot) {
	console.log('Processing USER login from ', socket._socket.remoteAddress);
	content = JSON.parse(register['content']);
	
	client.socket = socket;
	client.lang = content['lang'];
	client.password = content['password'];
	client.userId = 31337;
	client.username = content['username'];
	client.factoryId = content['factoryId'];
	client.packageVersions = content['packageVersions'];
	client.projectType = content['projectType'];
	client.versionCode = content['versionCode'];
	client.versionName = content['versionName'];

	auth_alg  = {"typ":"JWT", "alg":"HS256"}
		
	auth_data = {
		"data" : {
			"FACTORY_ID": client.factoryId.toString(),
			"USERNAME" : client.username,			
			"CONNECTION_TYPE" : "sweeper",
			"PROJECT_TYPE" : client.projectType,
			"ROBOT_TYPE" : "sweeper",
			"LANG": client.lang,
			"BIND_LIST":"[\"" + robot.robot.did + "\"]",
			"CONTROL_DEVICE": robot.robot.did.toString(),
			"COUNTRY_CITY" :"%7B%22continent%22%3A%22%E6%AC%A7%E6%B4%B2%22%2C%22country%22%3A%22%E8%A5%BF%E7%8F%AD%E7%89%99%22%7D"
		},
		"clientType":"PHONE",		
		"id" : "31337"
	}
		
	auth_js   = {
		"value" : JSON.stringify(auth_data),
		"version":47,
		"scope":null,
		"timestamp":null
		}

	seed = crypto.randomBytes(32);
	auth = JSON.stringify(auth_alg) + JSON.stringify(auth_js);
	auth_buff = Buffer.from(auth);
	auth_seed = Buffer.concat([auth_buff,seed]);
	b64_auth = Buffer.from(auth_seed, "utf8").toString("base64");
	
	msg = { "code" : 0,
			"result" : {
				"clientType": "PHONE",
				"data": {
					"AUTH": b64_auth,
					"BIND_LIST": JSON.stringify([robot.robot.did.toString()]),
					"CONNECTION_TYPE" : "sweeper",
					"CONTROL_DEVICE" : robot.robot.did.toString(),
					"COUNTRY_CITY" : "%7B%22continent%22%3A%22%E6%AC%A7%E6%B4%B2%22%2C%22country%22%3A%22%E8%A5%BF%E7%8F%AD%E7%89%99%22%7D",
					"FACTORY_ID" : client.factoryId.toString(),
					"LANG" : "es",
					"PROJECT_TYPE" : client.projectType,
					"ROBOT_TYPE" : "sweeper",
					"USERNAME" : content['username']
				},
				"id" : "31337"
			},
			"service" : register['service'],
			"traceId" : register['traceId']
		}
	appDebug(msg);
	socket.send(JSON.stringify(msg));

	value = { "value" : robot.robot.did }

	
	msg = {
		"tag" : "sweeper-robot-center/on_line",
		"content" : JSON.stringify(value)
	}	
	socket.send(JSON.stringify(msg));
	
}

function send_user_bind(js,socket,robot) {	
	appDebug('Sending USER bind');
	stats = JSON.parse(robot.get_robostats());
	if (robot.robot.bindtime == null) {
		robot.robot.bindtime = Date.now().toString();
		robot.robot.ctrTime = (Date.now() + 965).toString()
	}
	stats['targets'] = [client.userId];
	
	
	msg = { "code" : 0,
		"result" : [
			{
				"bindtime" : robot.robot.bindtime,
				"ctrTime": robot.robot.ctrTime,
				"isDefault" : true,
				"mac" : robot.robot.mac,
				"modeType" : "CRL30S",
				"nickname": "CONGA6038",
				"owner" : "31337",
				"projectType" : robot.robot.projectType,
				"robotId" : robot.robot.did.toString(),
				"sn" : robot.robot.sn,
				"stats" : JSON.stringify(stats),
				"status" : 0,
				"userId" : "31337",
				"versions" : robot.robot.versions
			}
		],
		"service" : js['service'],
		"traceId" : js['traceId']
	}
	appDebug(msg);
	socket.send(JSON.stringify(msg));
}

function ask_for_maps(js, socket, robot) {
	appDebug("Client asks for maps");
		
	if (robot.robot.socket != null) {
		protocol.reply_true(js, socket);
		appDebug("Asking robot for map");
		content = JSON.parse(js["content"]);
		msg = {
			"content" : JSON.stringify(content['data']),
			"tag" : "sweeper-transmit/to_bind"
		}		
		robot.robot.socket.send(JSON.stringify(msg));													
	} else {
		appDebug("Robot unavailable, refussing to ask");
		protocol.reply_false(js, socket);
	}		
}

function send_status_tocli(robot) {
	if (client.socket != null) {
		stats = JSON.parse(robot.get_robostats());
		content = stats["data"];
		msg = {
			"content" : JSON.stringify(content),
			"tag" : "sweeper-transmit/to_bind"
		}
		client.socket.send(JSON.stringify(msg));
	}
}

module.exports = {
	client,
	process_user_login_token,
	process_user_login,
	send_user_bind,
	send_status_tocli,
	ask_for_maps
}
