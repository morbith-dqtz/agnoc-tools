const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('3irobotixSSL/3irobotix.key'),
  cert: fs.readFileSync('3irobotixSSL/3irobotix_cert.pem')
};

const host = '0.0.0.0';
const port = 8001;
const cloud = 'xxx.xxx.xxx.xxx';

const requestListener = function (req, res) {
	console.info(`${req.connection.remoteAddress} : ${req.method} ${req.url}`);
	res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    msg = {
    	"code" : 0,
    	"result" : {
	    	"targetUrls" : [
			 "ws://" + cloud + ":9090",
			 "http://" + cloud + ":8002",
			 "http://" + cloud + ":8006",
	    	]
    	}
    }
    console.log(msg);
    res.end(JSON.stringify(msg));
};

const server = https.createServer(options, requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on https://${host}:${port}`);
});


