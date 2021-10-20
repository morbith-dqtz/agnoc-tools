
const debug = require ('debug');
const appDebug = debug('app');
const crypto = require('crypto');

let robot = {
	"socket" : null,
	"map_head_id" : null,
	"areaCleanFlag" : null,
	"workMode" : null,
	"battary" : null,
	"chargeStatus" : null,
	"type" : null,
	"faultCode" : null,
	"cleanPerference" : null,
	"repeatClean" : null,
	"cleanTime" : null,
	"cleanSize" : null,
	"waterlevel" : null,
	"dustBox_type" : null,
	"mop_type" : null,
	"house_name" : null,
	"map_count" : null,
	"current_map_name" : null,
	"cleaning_roomId" : null,
	"did" : 313373,
	"targets" : null,
	"clientType" : null,
	"lock_device": false,
	"going_to_dock": false,
	"versions" : null,
	"mac": null,
	"sn": null,
	"projectType" : null,
	"bindtime" : null,
	"ctrTime" : null,
	"ip" : null
	
}

//Mangage Conga login request
function process_robot_login(register, socket, client) {
	console.log('Preocessing CONGA login from ', socket._socket.remoteAddress);
	robot.ip = socket._socket.remoteAddress;
	robot.socket = socket;
	content = JSON.parse(register['content']);
	robot.versions = JSON.stringify(content["packageVersions"]);
	robot.mac = content['mac'];
	robot.sn = content['sn'];
	robot.projectType = content["projectType"];
	
	auth_alg  = {"typ":"JWT", "alg":"HS256"}
	
	auth_data = {
		"data" : {
			"FACTORY_ID": content['factoryId']
		},
		"clientType":"ROBOT",
		"id" : "313373",
		"resetCode": 0
	}
		
	auth_js   = {
		"value" : {
			"data" : JSON.stringify(auth_data),
			"version":null,
			"scope":null,
			"timestamp":null
		}
			
	}
	
	seed = crypto.randomBytes(32);
	auth = JSON.stringify(auth_alg) + JSON.stringify(auth_js);
	auth_buff = Buffer.from(auth);
	auth_seed = Buffer.concat([auth_buff,seed]);
	b64_auth = Buffer.from(auth_seed, "utf8").toString("base64");
	
	//reply login with ok
	msg = { "code" : 0,
			"result" : {
				"clientType": "ROBOT",
				"data": {
					"AUTH":b64_auth,
					"BIND_LIST": "",
					"CONNECTION_TYPE" : "sweeper",
					"COUNTRY_CITY" : "",
					"FACTORY_ID" : content['factoryId'],
					"MAC" : content['mac'],
					"PROJECT_TYPE" : content["projectType"],
					"ROBOT_TYPE" : "sweeper",
					"SN" : content['sn'],
					"USERNAME" : content['sn']
				},
				"id" : "313373",
				"resetCode" : 0,
			},
			"service" : register['service'],
			"traceId" : register['traceId']
		}		
	socket.send(JSON.stringify(msg));
	
	//ask for subscribe it's events
	msg = { "tag" : "sweeper-transmit/to_bind", 
			"content" : "{ \"control\" : \"lock_device\", \"userid\" : 0 }" 
		}
	socket.send(JSON.stringify(msg));
	
	if (client.client.socket != null) {
		data = {
			"value" : robot.did.toString()
		}
		msg = {
			"content" : JSON.stringify(data),
			"tag": "sweeper-robot-center/on_line"
		}
		appDebug("Online :", msg);
		client.client.socket.send(JSON.stringify(msg));
		
	}
		
}

//Update the robot 
function update_robostats(js,socket) {
	robot.socket = socket;
	robot.map_head_id = js['data']['map_head_id'];
	robot.areaCleanFlag = js['data']['areaCleanFlag'];
	robot.workMode = js['data']['workMode'];
	robot.battary = js['data']['battary'];
	robot.chargeStatus = js['data']['chargeStatus'];
	robot.type = js['data']['type'];
	robot.faultCode = js['data']['faultCode'];
	robot.cleanPerference = js['data']['cleanPerference'];
	robot.repeatClean = js['data']['repeatClean'];
	robot.cleanTime = js['data']['cleanTime'];
	robot.cleanSize = js['data']['cleanSize'];
	robot.waterlevel = js['data']['waterlevel'];
	robot.dustBox_type = js['data']['dustBox_type'];
	robot.mop_type = js['data']['mop_type'];
	robot.house_name = js['data']['house_name'];
	robot.map_count = js['data']['map_count'];
	robot.current_map_name = js['data']['current_map_name'];
	robot.cleaning_roomId = js['data']['cleaning_roomId'];
	robot.did = js['data']['did'];
	robot.targets = js['targets'];
	robot.clientType = js['clientType'];
}

function get_robostats() {
	msg = {
		"data" : {
			"map_head_id" : robot.map_head_id,
			"areaCleanFlag" : robot.areaCleanFlag,
			"workMode" : robot.workMode,
			"battary" : robot.battary,
			"chargeStatus" : robot.chargeStatus,
			"type" : robot.type,
			"faultCode" : robot.faultCode,
			"cleanPerference" : robot.cleanPerference,
			"repeatClean" : robot.repeatClean,
			"cleanTime" : robot.cleanTime,
			"cleanSize" : robot.cleanSize,
			"waterlevel" : robot.waterlevel,
			"dustBox_type" : robot.dustBox_type,
			"mop_type" : robot.mop_type,
			"house_name" : robot.house_name,
			"map_count" : robot.map_count,
			"current_map_name" : robot.current_map_name,
			"cleaning_roomId" : robot.cleaning_roomId,
			"did" : robot.did
			},		
			"clientType" : robot.clientType
	}

	return JSON.stringify(msg);
}

function answer_get_robot_info(js,socket) {
	mac = js['service'].substr(44,17);
	sn  = js['service'].substr(65);
	
	msg = { "code" : 0,
			"result" : {
				"city" : "{ \"continent\" : \"\", \"contry\" : \"\" }",
				"createTime": "1608919681000",
				"disableTime" : "0",
				"ip": robot.ip,
				"localeChanged" : 0,
				"mac" : mac,
				"nickname" : "CONGA6038",
				"offlinetime" : Date.now() - 1000,
				"onlinetime" : Date.now(),
				"projectType": "CECOTECCRL30S-1001",
				"robotId": robot.did,
				"sn" : sn,
				"stats" : get_robostats(),
				"status": 4,
				"versions" : robot.versions,
			},
			"service" : js["service"].split("?")[0],
			"traceId" : js["traceId"]
	}
	appDebug("responding to get_robot_info");
	socket.send(JSON.stringify(msg));	
}
	
module.exports = {
	robot,
	update_robostats,
	get_robostats,
	answer_get_robot_info,
	process_robot_login,
}
