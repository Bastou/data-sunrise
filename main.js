// audio context 
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;


var audioFile = 'lorn-acid-rain.mp3';

var frequences = new Float32Array(256); // TODO: a mettre dans audio manager
/**
 *
 * Constantes
 *
 */
var EASING = 0.1
var LINELENGTH = 20;
var TRANSLATESTEP = 1;

/*
 * Time stuff
 */
var DELTA_TIME = 0;
var LAST_TIME = Date.now();

/*
 * Canvas stuff
 */

var W = innerWidth;
var H = innerHeight;
var frameIndex = 0;
var lineBeginOffset = -40;

/*
 * Test
 */
 var EASING = 0.3;
 var noise = 0;
 // Sun
var sunEasingValue;
// Light
var lightEasingValue;
var iterationCount = 0;
var totalIterations = 2 * 60; // 25seconds 

function Scene() {
  this.cv;
  this.ctx;
  this.ocv;
  this.octx;
  this.cvS;
  this.audioManager;
  this.audioData;
  this.freqLine;
  this.canyon;
  this.sun;

  /*
   * Sound
   */
  this.audioCtx;
  this.audioBuffer;
  this.audioSource;
  this.analyser;
  this.frequencyData;
  this.frequences;
}

Scene.prototype = {
  init: function() {
    this.cv = document.querySelector('canvas');
    this.ctx = this.cv.getContext('2d');
    this.ocv = document.createElement('canvas');
    this.octx = this.ocv.getContext('2d');
    this.onResize();

    // init frequency line
    this.freqLine = new FreqLine({
      w: W/2,
      h: H/4,
      lineWidth: 4,
      startOffset:-40,
      easeFactor:0.1
    });

    // init canyon
    this.canyon = new Canyon({
      x: 0,
      y: 0,
      octx: this.octx,
      ocv: this.ocv,
      zoom: 1.04,
      canyonLine: this.freqLine
    });

    // init sun
    this.sun = new Sun({
      x: W/2,
      y: H - H/3 - 20,
      r: W/10,
      nbPoints:60
    });
    this.sun.setPoints();

    // init sound
    // this.audioManager = new AudioManager({
    //   onAudioRender: this.render().bind(this)
    // });

    //console.log(this.audioManager);

    //this.audioManager.loadSound(audioFile);

    this.loadSound();
  },
  loadSound: function(url) {
    var self = this;
    var request = new XMLHttpRequest();
    request.open('GET', audioFile, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {

      self.processAudio(request.response);

    }
    request.send();
  },
  processAudio: function(response) {
    var self = this;

    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.frequences = new Float32Array(256);

    this.audioCtx.decodeAudioData(response, function(buffer) {

      // success callback
      self.audioBuffer = buffer;

      // Create sound from buffer
      self.audioSource = self.audioCtx.createBufferSource();
      self.audioSource.buffer = self.audioBuffer;

      // connect the audio source to context's output
      self.audioSource.connect(self.analyser)
      self.analyser.connect(self.audioCtx.destination)

      // play sound
      self.audioSource.start();

      self.render()

    }, function() {

      // error callback

    });
  },
  render: function() {
    window.addEventListener('resize', this.onResize.bind(this));
    rafId = requestAnimationFrame(this.frame.bind(this));
  },
  frame: function(ms) {
    var self = this;
    rafId = requestAnimationFrame(this.frame.bind(this))
    DELTA_TIME = Date.now() - LAST_TIME;
    LAST_TIME = Date.now();

    frameIndex++;
    //console.log(.audioManager)

    //this.audioData = this.audioManager.analyse();
    this.analyser.getByteFrequencyData(this.frequencyData);

    // Draw 
    this.ctx.clearRect(0,0,W,H);
    if(frameIndex > 10) {
      this.sun.draw(this.ctx);
    }
    this.canyon.draw(this.ctx, this.frequencyData, ms);
    this.ctx.restore();
    

  },
  onResize: function(evt) {
    this.cv.width = W;
    this.cv.height = H;
    this.cv.style.width = W + 'px'
    this.cv.style.height = H + 'px';
    this.ocv.width = W;
    this.ocv.height = H;
    this.ocv.style.width = W; + 'px'
    this.ocv.style.height = H; + 'px'

  }
}

/*
* Canvas visual objects
*/

// Frequency Line
function FreqLine(props) {
  this.w = props.w;
  this.h = props.h;
  this.lineWidth = props.lineWidth;
  this.startOffset = props.startOffset;
  this.easeFactor = props.easeFactor;
}

FreqLine.prototype = {
  draw: function(ctx, audioData) {
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.lineTo(-W / 2, this.startOffset);
    for (var i = 0; i < audioData.length; i += 2) {
      var index = i < audioData.length / 2 ? i : audioData.length - 1 - i; // on parcours le tableau dans l'autre sens quand on atteint la moitié de audioData.length
      // get the frequency according to current i
      frequences[index] += (audioData[index] - frequences[index]) * this.easeFactor;
      var v = 1 - frequences[index] / 256;
      ctx.lineTo((i / audioData.length - .5) * this.w, v * this.h * 0.8);
    }
    ctx.lineTo(W / 2, this.startOffset);
    ctx.stroke();
  }
}

// Canyon 
function Canyon(props) {
  this.x = props.x;
  this.y = props.y;
  this.octx = props.octx;
  this.ocv = props.ocv;
  this.zoom = props.zoom;
  this.canyonLine = props.canyonLine;
}

Canyon.prototype = {
  draw: function(ctx, audioData, ms) {

    // Clip canyon
    ctx.save();
    ctx.fillStyle = '#0e0e0e';
    ctx.translate(W / 2, H / 2);
    this.canyonLine.draw(ctx, audioData);
    ctx.lineTo(W / 2,H /2);
    ctx.lineTo(-W/2,H/2);
    ctx.closePath();
    ctx.fill();
    ctx.clip();
    ctx.translate(-W/2, -H/2);

    // reset canvas
    this.octx.fillStyle = 'rgba(28,28,28,0.03)';
    this.octx.fillRect(0, 0, W, H);

    // begin draw lines
    this.octx.save();
    this.octx.translate(W / 2, H / 2);

    // draw image 
    this.octx.drawImage(
      this.ocv,
      0, 0, W, H, -W / 2 * this.zoom, -H / 2 * this.zoom, W * this.zoom, H * this.zoom
    );
    // >>>> draw image opti :
    //this.octx.drawImage(this.cv, -W/2, lineBeginOffset, W, equalizerH, this.zoom, this.zoom, W * this.zoom, equalizerH * this.zoom);

    this.octx.globalCompositeOperation = 'lighter';

    // TODO: add in a function
    // Animate light 
    if (iterationCount < totalIterations) {
      lightEasingValue = Math.easeOutQuad(iterationCount, 10, 50 - 10, totalIterations);
      //iterationCount++;  
    }

    this.octx.strokeStyle = 'hsl(' + ms / 300 + ', ' + lightEasingValue + '%, ' + lightEasingValue + '%)';

    if ((frameIndex % 1) === 0) {
      this.canyonLine.draw(this.octx, audioData);
    }

    this.octx.globalCompositeOperation = 'source-over';

    this.octx.restore();

    ctx.drawImage(this.ocv, 0, 0);
  }
};


// Sun rising at the center
function Sun(props) {
  this.x = props.x;
  this.y = props.y;
  this.r = props.r;
  this.nbPoints = props.nbPoints;
  this.points = [];
}

Sun.prototype = {
  setPoints: function() {
    step = 2 * Math.PI / this.nbPoints;
    for (var i = this.nbPoints - 1; i >= 0; i--) {
      this.points.push(
        [
          this.r * Math.cos(i * step),
          this.r * Math.sin(i * step)
        ]
      );
    }
  },
  draw: function(ctx) {
    ctx.save();


    // On veut changer le this.y :
    if (iterationCount < totalIterations) {
      sunEasingValue = Math.easeOutQuad(iterationCount, this.y + this.r*1.5, this.y - (this.y + this.r*1.5), totalIterations);
      iterationCount++;  
    } 
    if((iterationCount % 30) === 0) {
        console.log(iterationCount/30); 
    }
    //}
    ctx.translate(this.x, sunEasingValue);
    //ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(245, 245, 245, 1)';
    ctx.beginPath();

    for (var i = this.points.length - 1; i >= 0; i--) {
      ctx.lineTo(this.points[i][0], this.points[i][1]);

      //noise = ((this.points[i][0] + Math.cos(Math.random())) * 5 - noise) * 0.3;
      //console.log(noise)
      //ctx.lineTo(this.points[i][0], this.points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
} 

/**
 *
 * Audio
 *
 */
 function AudioManager(props) {
  this.audioCtx;
  this.audioBuffer;
  this.audioSource;
  this.analyser;
  this.frequencyData;
  this.frequences;
  this.onAudioRender;
 }

 AudioManager.prototype = {
   load: function(url) {
     var self = this;
     var request = new XMLHttpRequest();
     request.open('GET', audioFile, true);
     request.responseType = 'arraybuffer';

     // Decode asynchronously
     request.onload = function() {

          console.log('load sound');
       self.processAudio(request.response);

     }
     request.send();
   },
   process: function(response) {
     var self = this;

     this.audioCtx = new AudioContext();
     this.analyser = this.audioCtx.createAnalyser();
     this.analyser.fftSize = 256;
     this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
     this.frequences = new Float32Array(256);

     this.audioCtx.decodeAudioData(response, function(buffer) {

       // success callback
       self.audioBuffer = buffer;

       // Create sound from buffer
       self.audioSource = self.audioCtx.createBufferSource();
       self.audioSource.buffer = self.audioBuffer;

       // connect the audio source to context's output
       self.audioSource.connect(self.analyser)
       self.analyser.connect(self.audioCtx.destination)

       // play sound
       self.audioSource.start();

       self.onAudioRender()

     }, function() {

       // error callback

     });
   },
   analyse: function() {
    return this.analyser.getByteFrequencyData(this.frequencyData);
   }
 };

/**
 *
 * Init
 *
 */
scene = new Scene();
scene.init();


/**
 *
 * Tools
 *
 */

// map a range of numbers to another range of numbers
Number.prototype.map = function(in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function addLimited(arr, x, limit) {
  arr.unshift(x);
  if (arr.length > limit) {
    arr.length = limit;
  }
}

// t: current iteration
// b: begin value
// c: change value
// d: total iterations
Math.easeOutQuad = function (t, b, c, d) {
  t /= d;
  return -c * t*(t-2) + b;
};



