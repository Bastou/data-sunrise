
 // audio context 
 window.AudioContext=window.AudioContext||window.webkitAudioContext||window.mozAudioContext;


 var audioFile = 'lorn-acid-rain.mp3';
 /**
  *
  * Constantes
  *
  */  
  var EASING = 0.1
  var LINELENGTH = 20;
  var TRANSLATESTEP = 1 ;

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




   function SoundReact () {
     this.cv;
     this.ctx;
     this.ocv;
     this.octx;
     this.cvS;
     this.linesArray = [];

     /*
     * Sound
     */
     this.audioCtx;
     this.audioBuffer;
     this.audioSource;
     this.analyser;
     this.frequencyData;
     this.frequencyDataFull;
     this.frequences;
   }

   SoundReact.prototype = {
     init: function(){
       this.cv = document.querySelector('canvas');
       this.ctx = this.cv.getContext('2d');
       this.ocv = document.createElement('canvas');
       this.octx = this.ocv.getContext('2d');
       this.onResize();
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
     processAudio: function (response) {
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
         self.audioSource.connect( self.analyser )
         self.analyser.connect( self.audioCtx.destination )

         // play sound
         self.audioSource.start();

         self.render()

       }, function(){

         // error callback

       });
     },
     render: function () {

       this.frame(0);
       window.addEventListener( 'resize', this.onResize.bind(this) );
       rafId = requestAnimationFrame( this.frame.bind(this) );
     },
     frame: function ( ms ) {
       var self = this;
       rafId = requestAnimationFrame( this.frame.bind(this) )
       DELTA_TIME = Date.now() - LAST_TIME;
       LAST_TIME = Date.now();

       frameIndex++;

       this.analyser.getByteFrequencyData(this.frequencyData);
       this.drawFrequency(this.ctx, true, ms)

     },


     drawFrequency: function(ctx, shouldClear, ms) {

       // ctx.translate(0, TRANSLATESTEP);

       var nbLines = W / LINELENGTH;

       var cumul = 0;
       var average = 0;
       var lines = [];
       var equalizerW = W / 2;
       var equalizerH = H / 4;
       var len = this.frequencyData.length;
    
         this.ctx.fillStyle = '#00112204';
         this.ctx.fillRect(0, 0, W, H);

         this.ctx.save();
         this.ctx.translate(W/2, H/2);
         this.ctx.lineWidth = 4;

         var zoomLevel = 1.02;
         this.ctx.drawImage(
          this.cv,
          0, 0, W, H,
          -W/2*zoomLevel, -H/2 * zoomLevel, W * zoomLevel, H * zoomLevel
         );

         this.ctx.globalCompositeOperation = 'lighter';

         this.ctx.strokeStyle = 'hsl(' + ms / 300 + ', 50%, 50%)';
         
      if((frameIndex % 2) === 0) {
        this.ctx.beginPath();
        this.ctx.lineTo(- W/2,  - 40 );
       for ( var i = 0; i < len; i += 2 ) {
          var index = i < len / 2 ? i : len - 1 - i; // on parcours le tableau dans l'autre sens quand on atteint la moitié de len
         // get the frequency according to current i
         var percentIdx = i / nbLines;
         var frequencyIdx = Math.floor(2048 * percentIdx);

          this.frequences[index] += (this.frequencyData[index] - this.frequences[index]) * EASING;

          var v = 1 - this.frequences[index] / 256;
         
         this.ctx.lineTo(( i / len - .5 ) * equalizerW, v * equalizerH * 0.8);


       }
        this.ctx.lineTo(W / 2,  - 40 );
        this.ctx.stroke();
      }

      this.ctx.globalCompositeOperation = 'source-over';

       this.ctx.restore();

     },


     onResize: function ( evt ) {

       this.cvS = [window.innerWidth, window.innerHeight]

       this.cv.width = W;
       this.cv.height = H;
       this.cv.style.width = W + 'px'
       this.cv.style.height = H + 'px';
       this.ocv.width = W;
       this.ocv.height = H;
       this.ocv.style.width = W; + 'px'
       this.ocv.style.height = H; + 'px'

     },
     render: function () {

       this.frame();
       window.addEventListener( 'resize', this.onResize.bind(this) );
       rafId = requestAnimationFrame( this.frame.bind(this) );
     }
   };


   soundReact = new SoundReact();
   soundReact.init();


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