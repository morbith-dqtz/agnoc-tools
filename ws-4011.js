const http = require('http');

const host  = '0.0.0.0';
const cloud = 'xxx.xxx.xxx.xxx';
const port  = 4011;

const requestListener = function (req, res) {
    console.info(`${req.connection.remoteAddress} : ${req.method} ${req.url}`);
	res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(`{"code" : 0, "result" : { "targetUrls" : [ "ws://${cloud}:9090" ,  "http://${cloud}:8002", "http://${cloud}:8006" ] }}`);
};


const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

