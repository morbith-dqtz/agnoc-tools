const http = require('http');
const fs = require('fs')

const host = '0.0.0.0';
const port = 8006;

const requestListener = function (req, res) {
	console.info(req.connection.remoteAddress);
	console.info(`${req.connection.remoteAddress} : ${req.method} ${req.url}`);

	let data = '';
	req.on('data', chunk => {
	data += chunk;
	})

	req.on('end', () => {
		fs.writeFile('8006-rcv.txt', data, { flag: 'a+' }, err => {})
		res.writeHead(200);
	    res.end();
  })
 
};


const server = http.createServer(requestListener);



server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

