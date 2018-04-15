var Jimp = require("jimp");
var rp = require('request-promise');

var TOP_LEFT_X = 20000;
var TOP_LEFT_Y = 0;

var drawQueue = [];

function addToDrawQueue(x, y, r, g, b){
  drawQueue.push({x,y,r,g,b})
  console.log("Added to draw queue", x, y, r, g, b, " now sized ", drawQueue.length)
}

function sendPixel(x, y, color){
  var a = x + y + 8

  var options = {
    method: 'POST',
    uri: 'https://pixelcanvas.io/api/pixel',
    headers: {
      'Postman-Token': '6dcbec7e-cae4-4bdc-b14b-f41707e22af3',
      'Cache-Control': 'no-cache',
      cookie: '__cfduid=d87945355d3f6cc932a0978b202c06f141523750140; cookieconsent_status=dismiss',
      authority: 'pixelcanvas.io',
      referer: `https://pixelcanvas.io/@$x,$y`,
      accept: '*/*',
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
      'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      origin: 'https://pixelcanvas.io'
    },
    body: {
      x,
      y,
      color,
      "fingerprint":"13a9ca43080f40dc3b498ec605fdea6f",
      "token":null,
      a
    },
    json: true
  };

  return rp(options);
}

function getIndexedColor(r, g, b){
  var colors = [
    {r: 255, g: 255, b: 255},
    {r: 228, g: 228, b: 228},
    {r: 136, g: 136, b: 136},
    {r: 34, g: 34, b: 34},
    {r: 255, g: 167, b: 209},
    {r: 229, g: 0, b: 0},
    {r: 229, g: 149, b: 0},
    {r: 160, g: 106, b: 66},
    {r: 229, g: 217, b: 0},
    {r: 148, g: 224, b: 68},
    {r: 2, g: 190, b: 1},
    {r: 0, g: 211, b: 221},
    {r: 0, g: 131, b: 199},
    {r: 0, g: 0, b: 234},
    {r: 207, g: 110, b: 228},
    {r: 130, g: 0, b: 128}
  ]

  var index = colors.findIndex(e => e.r == r && e.g == g && e.b == b);
  if(index == -1) throw new Error('No color found for ', r, g, b);
  return index;
}

function drawNext(){
  var toDraw = drawQueue[0];
  var color = getIndexedColor(toDraw.r, toDraw.g, toDraw.b)

  var absoluteX = TOP_LEFT_X + toDraw.x
  var absoluteY = TOP_LEFT_Y + toDraw.y

  console.log("Now drawing ", toDraw.x, toDraw.y, 'to absolute', absoluteX, absoluteY, 'with matched color', color);

  sendPixel(absoluteX, absoluteY, color)
    .then(win => {
      drawQueue.shift()
      if(drawQueue.length > 0){
        setTimeout(drawNext, 5000)
      } else {
        console.log("End of draw :)")
      }
    })
    .catch(err => setTimeout(drawNext, 8000))
}

Jimp.read("rsc/img.png").then(function (img) {
  // enqueue pixels to draw
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    var red   = this.bitmap.data[ idx + 0 ];
    var green = this.bitmap.data[ idx + 1 ];
    var blue  = this.bitmap.data[ idx + 2 ];
    var alpha = this.bitmap.data[ idx + 3 ];
    if(alpha === 255){ // draw only non-transparent pixels
      addToDrawQueue(x, y, red, green, blue)
    }
  });

  // draw pixels one by one
  drawNext()
}).catch(function (err) {
    console.error(err);
});
