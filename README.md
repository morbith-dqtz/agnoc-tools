#
# FreeConga ! 
# https://gitlab.com/freeconga
#


This is a work in progress research tools to avoid using hosted services for CONGA 6090 by CECOTEC
Aims to provide a path to extend agnoc driver and integrate 6090 robot to valetudo project.

Please, first read :
	https://gitlab.com/freeconga 
	https://valetudo.cloud/

agnoc-ws		:	WebSocket server that emulates the protocol that provides the cloud service.
					At this point it implement enough parts of the protocol to permit program/edit clean jobs, 
					send maps to the APP, manual moves, edit maps and rooms and some more, ... it's very 
					far of completness and is not it's goal. It's just a development tool.
ws-4011.js		:	Webserver that provides the first step JSON configuration to the robot in plain text.
					/etc/sysconf/sysConfig.ini y /mnt/UDISK/config/sysConfig.ini
					server_ssl_enable=1 -> server_ssl_enable=0
ws-8001.js		:	Webserver that provides the first step JSON configuration to the robot and CECOTEC APP
					(TLS is a must for interact with the original APP)
ws-8006.js		:	Webserver that permits that the robot flushes all the information that tryies to upload
					to the cloud services, that data is stored locally meanwhile it could'nt be pushed.
wifi-config.py	:	Configure WIFI ESSID / PASSWD / CONFIG SERVER over IP
					HOME +  POWER puts the robot in AP mode, once connected you can provide it's new wifi config 
					and its configuration server with this script.
